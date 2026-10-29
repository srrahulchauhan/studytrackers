/**
 * =========================================================================
 * Universal Google Sheets Configuration
 * =========================================================================
 * 
 * Google Sheet Direct Links:
 * - Create / Open New Sheet: https://sheets.new
 * - Google Sheets Workspace: https://docs.google.com/spreadsheets
 * 
 * Google Apps Script Backend:
 * - Apps Script Dashboard: https://script.google.com
 * - Active Web App URL: https://script.google.com/macros/s/AKfycbzjemNaSsfS4AhMoTcwpGSHqitVqZsMXqRULhWMio2AjUBjKquaS-RBiAebyYX9pGk/exec
 * - Apps Script Source Code: See d:/Project/studyflow/Code.gs or google-apps-script.js
 * 
 * Deployment Settings:
 * - Execute as: "Me" (your Google account)
 * - Who has access: "Anyone" (crucial for web app live sync)
 */

const STORAGE_KEY = 'studyflow_universal_sheets_config';

const DEFAULT_CONFIG = {
  // Master Deployed Google Apps Script Web App URL
  API_URL: 'https://script.google.com/macros/s/AKfycbzjemNaSsfS4AhMoTcwpGSHqitVqZsMXqRULhWMio2AjUBjKquaS-RBiAebyYX9pGk/exec',
  
  // Specific Google Spreadsheet ID (leave empty to let Code.gs auto-resolve or create one in Drive)
  SPREADSHEET_ID: '',
  
  // Unique Project Identifier to isolate data in multi-project master sheets
  PROJECT_ID: 'studyflow',
  
  // Auto-sync polling / flush interval in milliseconds
  SYNC_INTERVAL: 5000,
  
  // Master switch for automatic background synchronization
  ENABLE_AUTO_SYNC: true,
};

/**
 * Retrieve active configuration, merging defaults with any user-overridden settings from localStorage
 */
export function getGoogleSheetsConfig() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      API_URL: parsed.API_URL || DEFAULT_CONFIG.API_URL,
    };
  } catch (e) {
    console.warn('Error reading googleSheetsConfig from localStorage:', e);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Persist updated configuration
 */
export function setGoogleSheetsConfig(updated) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const current = getGoogleSheetsConfig();
    const merged = { ...current, ...updated };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Error saving googleSheetsConfig to localStorage:', e);
  }
}

export { DEFAULT_CONFIG };
