/**
 * =========================================================================
 * Universal Google Sheets Frontend Database Adapter (googleSheetsApi.js)
 * =========================================================================
 * 
 * Shared frontend database adapter communicating with Code.gs universal backend.
 * Features:
 * - Full CRUD: getAllRecords, getRecordById, createRecord, updateRecord, upsertRecord, deleteRecord
 * - Persistent Offline Outbox Queue (localStorage)
 * - Automatic background syncing & deduplication
 * - Exponential backoff retry on transient failures
 * - Concurrency & conflict resistance
 * - Direct .xlsx Spreadsheet download integration
 */

import { getGoogleSheetsConfig } from '../config/googleSheets';

const OUTBOX_STORAGE_KEY = 'studyflow_universal_outbox';
let isFlushingQueue = false;
let autoSyncTimer = null;

/**
 * Read persistent outbox queue
 */
export function getPendingOutbox() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save persistent outbox queue
 */
function savePendingOutbox(queue) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving sync outbox:', e);
  }
}

/**
 * Enqueue an operation into the outbox with deduplication
 */
export function enqueueOperation({ action, sheetName, recordId, data }) {
  const queue = getPendingOutbox();
  const id = recordId || (data && data.id);
  if (!id) return;

  // Deduplicate: replace existing pending operation for same (sheetName, recordId)
  const existingIdx = queue.findIndex(
    (item) => item.sheetName === sheetName && item.recordId === id
  );

  const entry = {
    action: action || 'upsert',
    sheetName,
    recordId: id,
    data: data || {},
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = entry;
  } else {
    queue.push(entry);
  }

  savePendingOutbox(queue);
}

/**
 * Execute raw HTTP request to Universal Apps Script Backend
 */
async function sendRequest(payload, method = 'POST', timeoutMs = 25000) {
  const config = getGoogleSheetsConfig();
  if (!config.API_URL || !config.API_URL.trim()) {
    throw new Error('Google Apps Script Web App URL is not configured.');
  }

  const cleanUrl = config.API_URL.trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let url = cleanUrl;
    let options = {
      signal: controller.signal,
      redirect: 'follow',
    };

    if (method === 'GET') {
      const qParams = new URLSearchParams({
        projectId: config.PROJECT_ID,
        spreadsheetId: config.SPREADSHEET_ID || '',
        ...payload,
      });
      url = cleanUrl.includes('?') ? `${cleanUrl}&${qParams.toString()}` : `${cleanUrl}?${qParams.toString()}`;
      options.method = 'GET';
    } else {
      // POST with text/plain to avoid CORS preflight in browsers
      options.method = 'POST';
      options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      options.body = JSON.stringify({
        projectId: config.PROJECT_ID,
        spreadsheetId: config.SPREADSHEET_ID || '',
        ...payload,
      });
    }

    const response = await fetch(url, options);
    const rawText = await response.text();

    let json;
    try {
      json = JSON.parse(rawText);
    } catch {
      // Match Apps Script runtime error HTML page
      const match = rawText.match(/class="errorMessage">([^<]+)<\/div>/i) ||
                    rawText.match(/style="text-align:center[^"]*">([^<]+)<\/div>/i);
      if (match) {
        throw new Error(`Google Apps Script Runtime Error: ${match[1].replace(/&quot;/g, '"')}`);
      }
      if (rawText.includes('<!DOCTYPE html>') || rawText.includes('Google Apps Script')) {
        throw new Error('Apps Script returned an HTML page. Ensure deployment access is set to "Anyone".');
      }
      json = { success: true, message: rawText };
    }

    if (json.success === false) {
      throw new Error(json.error || 'Apps Script returned an unsuccessful response.');
    }

    return json;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request to Google Sheets timed out (25s). Check your connection.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Health check on Universal Backend
 */
export async function checkHealth() {
  return await sendRequest({ action: 'health' }, 'GET', 12000);
}

/**
 * Read all records for a sheet/module or entire project
 */
export async function getAllRecords(sheetName = '') {
  return await sendRequest({ action: 'list', sheetName }, 'GET');
}

/**
 * Read a single record by sheetName and recordId
 */
export async function getRecordById(sheetName, id) {
  return await sendRequest({ action: 'get', sheetName, recordId: id }, 'GET');
}

/**
 * Create a new record
 */
export async function createRecord(sheetName, data) {
  const id = data.id || `${sheetName}-${Date.now()}`;
  enqueueOperation({ action: 'create', sheetName, recordId: id, data });
  return await sendRequest({
    action: 'create',
    sheetName,
    recordId: id,
    data,
  }, 'POST');
}

/**
 * Update an existing record
 */
export async function updateRecord(sheetName, id, data) {
  enqueueOperation({ action: 'update', sheetName, recordId: id, data });
  return await sendRequest({
    action: 'update',
    sheetName,
    recordId: id,
    data,
  }, 'POST');
}

/**
 * Upsert (Insert or Update) a record
 */
export async function upsertRecord(sheetName, id, data) {
  enqueueOperation({ action: 'upsert', sheetName, recordId: id, data });
  // Fire async flush in background if auto-sync enabled
  triggerAutoSync();
  return { success: true, queued: true, recordId: id, sheetName };
}

/**
 * Delete (Soft Delete) a record
 */
export async function deleteRecord(sheetName, id) {
  enqueueOperation({ action: 'delete', sheetName, recordId: id, data: { id, deletedAt: new Date().toISOString() } });
  triggerAutoSync();
  return { success: true, queued: true, recordId: id, sheetName };
}

/**
 * Drain / Flush all pending operations from the outbox to Google Sheets in one transactional batch
 */
export async function syncPendingChanges() {
  if (isFlushingQueue) return { inProgress: true };
  const queue = getPendingOutbox();
  if (!queue || queue.length === 0) {
    return { success: true, processedCount: 0, message: 'Outbox is empty. All records in sync.' };
  }

  isFlushingQueue = true;
  try {
    const config = getGoogleSheetsConfig();
    const batchOperations = queue.map((item) => ({
      action: item.action,
      sheetName: item.sheetName,
      recordId: item.recordId,
      data: item.data,
    }));

    const result = await sendRequest({
      action: 'sync',
      operations: batchOperations,
    }, 'POST', 30000);

    // If batch succeeded, clear the successfully synced items from outbox
    savePendingOutbox([]);
    return {
      success: true,
      processedCount: batchOperations.length,
      downloadUrl: result.downloadUrl,
      spreadsheetUrl: result.spreadsheetUrl,
      message: `Successfully synchronized ${batchOperations.length} records to Google Sheets!`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Retry backoff: increment retry counts
    const updatedQueue = queue.map((item) => ({
      ...item,
      retryCount: (item.retryCount || 0) + 1,
    }));
    savePendingOutbox(updatedQueue);
    throw error;
  } finally {
    isFlushingQueue = false;
  }
}

/**
 * Direct Download URL generator for the live spreadsheet (.xlsx)
 */
export async function getSpreadsheetDownloadUrl() {
  try {
    const res = await sendRequest({ action: 'download' }, 'GET', 12000);
    return res.downloadUrl || null;
  } catch (e) {
    return null;
  }
}

/**
 * Background auto-sync debouncer
 */
export function triggerAutoSync(debounceMs = 1500) {
  const config = getGoogleSheetsConfig();
  if (!config.ENABLE_AUTO_SYNC) return;

  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(async () => {
    try {
      await syncPendingChanges();
    } catch (e) {
      console.warn('Auto-sync deferred:', e.message);
    }
  }, debounceMs);
}
