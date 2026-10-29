import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Download,
  Copy,
  Check,
  Radio,
  Eye,
  SlidersHorizontal,
  Table,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
  Lock,
  Globe,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Modal } from './Modal';
import { useStudy } from '../../context/StudyContext';
import {
  DEFAULT_SYNC_URL,
  extractSpreadsheetId,
  getSpreadsheetEditUrl,
  getSpreadsheetEmbedUrl,
  getSpreadsheetDirectDownloadUrl,
  testGoogleSheetsConnection,
} from '../../utils/googleSheetsSync';
import { getAllRecords } from '../../services/googleSheetsApi';
import { setGoogleSheetsConfig } from '../../config/googleSheets';

export function LiveGoogleSheetModal({ isOpen, onClose }) {
  const {
    settings,
    updateSettings,
    syncNow,
    syncStatus,
    addToast,
    downloadAllDataAsExcel,
    restoreFromGoogleSheets,
  } = useStudy();

  const [activeTab, setActiveTab] = useState('viewer'); // 'viewer' | 'connect' | 'records'
  const [customInput, setCustomInput] = useState('');
  const [activeSheetId, setActiveSheetId] = useState('');
  const [activeSheetUrl, setActiveSheetUrl] = useState('');
  const [activeSheetName, setActiveSheetName] = useState('StudyFlow Master Database');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const [isOpening, setIsOpening] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Live Records Tab State
  const [liveRecords, setLiveRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [selectedModule, setSelectedModule] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolve current active sheet on open or settings update
  useEffect(() => {
    const rawCustom = settings?.googleSheetsCustomUrl || settings?.googleSheetsSpreadsheetId || '';
    setCustomInput(rawCustom);

    const parsedId = extractSpreadsheetId(rawCustom);
    if (parsedId) {
      setActiveSheetId(parsedId);
      setActiveSheetUrl(getSpreadsheetEditUrl(parsedId));
    } else if (syncStatus?.spreadsheetUrl) {
      setActiveSheetUrl(syncStatus.spreadsheetUrl);
      const idFromUrl = extractSpreadsheetId(syncStatus.spreadsheetUrl);
      if (idFromUrl) setActiveSheetId(idFromUrl);
    }
  }, [settings, syncStatus]);

  // Direct open in Google Sheets tab
  const handleOpenInGoogleSheets = async () => {
    if (activeSheetUrl) {
      window.open(activeSheetUrl, '_blank');
      return;
    }

    if (activeSheetId) {
      window.open(getSpreadsheetEditUrl(activeSheetId), '_blank');
      return;
    }

    // Ping Web App to fetch active sheet URL
    setIsOpening(true);
    addToast('Connecting to Apps Script to find Google Sheet URL...', 'info');
    try {
      const activeUrl = settings?.googleSheetsSyncUrl || DEFAULT_SYNC_URL;
      const res = await testGoogleSheetsConnection(activeUrl);
      if (res && res.spreadsheetUrl) {
        setActiveSheetUrl(res.spreadsheetUrl);
        if (res.spreadsheetId) setActiveSheetId(res.spreadsheetId);
        if (res.spreadsheetName) setActiveSheetName(res.spreadsheetName);
        window.open(res.spreadsheetUrl, '_blank');
        addToast(`Opened live Google Sheet: ${res.spreadsheetName || 'StudyFlow'}! 📊`, 'success');
      } else {
        window.open('https://sheets.new', '_blank');
        addToast('No sheet connected yet. Opening Google Sheets to create one.', 'info');
      }
    } catch (err) {
      window.open('https://docs.google.com/spreadsheets', '_blank');
      addToast('Opened Google Sheets in new tab.', 'info');
    } finally {
      setIsOpening(false);
    }
  };

  // Connect to custom Google Sheet
  const handleConnectCustomSheet = async () => {
    if (!customInput.trim()) {
      addToast('Please enter a Google Sheet URL or Spreadsheet ID.', 'warning');
      return;
    }

    const detectedId = extractSpreadsheetId(customInput);
    if (!detectedId) {
      addToast('Could not extract a valid Google Spreadsheet ID. Please verify the link.', 'error');
      return;
    }

    setIsTesting(true);
    try {
      const activeUrl = settings?.googleSheetsSyncUrl || DEFAULT_SYNC_URL;
      const res = await testGoogleSheetsConnection(activeUrl, detectedId);

      setActiveSheetId(detectedId);
      const sheetUrl = getSpreadsheetEditUrl(detectedId);
      setActiveSheetUrl(sheetUrl);
      if (res.spreadsheetName) setActiveSheetName(res.spreadsheetName);

      // Persist in settings and config
      updateSettings({
        googleSheetsSpreadsheetId: detectedId,
        googleSheetsCustomUrl: customInput.trim(),
        googleSheetsSyncEnabled: true,
      });
      setGoogleSheetsConfig({ SPREADSHEET_ID: detectedId });

      addToast(`Connected to custom Google Sheet: ${res.spreadsheetName || detectedId}! 🎉`, 'success');
      setIframeKey((prev) => prev + 1);
    } catch (err) {
      // Still set sheet ID for direct view even if Apps Script test threw warning
      setActiveSheetId(detectedId);
      setActiveSheetUrl(getSpreadsheetEditUrl(detectedId));
      updateSettings({
        googleSheetsSpreadsheetId: detectedId,
        googleSheetsCustomUrl: customInput.trim(),
      });
      addToast(`Target sheet set to ID: ${detectedId}. Click 'Open in Google Sheets' to verify permissions.`, 'info');
      setIframeKey((prev) => prev + 1);
    } finally {
      setIsTesting(false);
    }
  };

  // Reset to default auto database
  const handleResetToDefault = () => {
    setCustomInput('');
    setActiveSheetId('');
    setActiveSheetUrl(syncStatus?.spreadsheetUrl || '');
    updateSettings({
      googleSheetsSpreadsheetId: '',
      googleSheetsCustomUrl: '',
    });
    setGoogleSheetsConfig({ SPREADSHEET_ID: '' });
    addToast('Reset to default StudyFlow master cloud database. ☁️', 'info');
    setIframeKey((prev) => prev + 1);
  };

  // Sync now
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow(activeSheetId);
      addToast('Data synced to live Google Sheet successfully! ⚡', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Restore from sheet
  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreFromGoogleSheets(true, activeSheetId);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  // Direct download .xlsx
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (activeSheetId) {
        const directUrl = getSpreadsheetDirectDownloadUrl(activeSheetId);
        const a = document.createElement('a');
        a.href = directUrl;
        a.target = '_blank';
        a.download = `${activeSheetName || 'StudyFlow_Live_Sheet'}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast('Downloading live Google Sheet (.xlsx)... 📊', 'success');
        return;
      }
      downloadAllDataAsExcel({ filterMode: 'all' });
    } catch (err) {
      downloadAllDataAsExcel({ filterMode: 'all' });
    } finally {
      setIsDownloading(false);
    }
  };

  // Load live records for records explorer tab
  const fetchLiveRecords = async () => {
    setIsLoadingRecords(true);
    try {
      if (activeSheetId) {
        setGoogleSheetsConfig({ SPREADSHEET_ID: activeSheetId });
      }
      const res = await getAllRecords();
      if (res && res.records) {
        setLiveRecords(res.records);
      } else {
        setLiveRecords([]);
      }
    } catch (err) {
      addToast(`Could not load records: ${err.message}`, 'warning');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'records') {
      fetchLiveRecords();
    }
  }, [activeTab, activeSheetId]);

  const copyId = () => {
    if (!activeSheetId) return;
    navigator.clipboard.writeText(activeSheetId);
    setCopiedId(true);
    addToast('Spreadsheet ID copied! 📋', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const embedUrl = activeSheetId ? getSpreadsheetEmbedUrl(activeSheetId) : '';

  // Filter records by module and search query
  const filteredRecords = liveRecords.filter((r) => {
    if (selectedModule && r.sheetName !== selectedModule) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const dataStr = JSON.stringify(r.data || {}).toLowerCase();
    return dataStr.includes(q) || (r.recordId && r.recordId.toLowerCase().includes(q));
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Sheet Live Access & Multi-Sheet Controller"
      subtitle="Directly open, view embedded live sheet, and connect or control any Google Sheet from StudyFlow."
      maxWidth={isFullscreen ? 'max-w-[98vw]' : 'max-w-4xl'}
    >
      <div className="space-y-4 text-xs">
        {/* Top Header Card */}
        <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
              <FileSpreadsheet size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {activeSheetName || 'Google Sheets Live Database'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Linked</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-slate-500 dark:text-slate-400 text-[11px]">
                {activeSheetId ? (
                  <button
                    type="button"
                    onClick={copyId}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-mono text-[10px] bg-white/70 dark:bg-dark-900/70 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800"
                    title="Click to copy Sheet ID"
                  >
                    <span>ID: {activeSheetId.slice(0, 16)}…</span>
                    {copiedId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  </button>
                ) : (
                  <span>Using Default Master Database in Google Drive</span>
                )}
                {syncStatus?.lastSyncedAt && (
                  <span className="hidden sm:inline opacity-75">
                    • Last sync: {new Date(syncStatus.lastSyncedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleOpenInGoogleSheets}
              disabled={isOpening}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              title="Open the live sheet directly in Google Sheets in a new tab"
            >
              {isOpening ? <RefreshCw size={13} className="animate-spin" /> : <ExternalLink size={13} />}
              <span>Open in Google Sheets</span>
            </button>

            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Push all current data to this Google Sheet"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin text-emerald-500' : 'text-slate-400'} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Download live .xlsx workbook from this Google Sheet"
            >
              <Download size={13} className="text-emerald-500" />
              <span>.xlsx</span>
            </button>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-dark-950 rounded-xl border border-slate-200/70 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('viewer')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
              activeTab === 'viewer'
                ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Eye size={14} className={activeTab === 'viewer' ? 'text-emerald-500' : ''} />
            <span>Live Interactive Viewer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
              activeTab === 'connect'
                ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal size={14} className={activeTab === 'connect' ? 'text-blue-500' : ''} />
            <span>Connect &amp; Control Any Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${
              activeTab === 'records'
                ? 'bg-white dark:bg-dark-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Table size={14} className={activeTab === 'records' ? 'text-indigo-500' : ''} />
            <span>Live Data Tables ({liveRecords.length})</span>
          </button>
        </div>

        {/* TAB 1: Live Interactive Viewer */}
        {activeTab === 'viewer' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-slate-600 dark:text-slate-400 text-xs">
                {activeSheetId ? (
                  <span>
                    Embedded live preview of Google Sheet. Scroll, view tabs, and inspect live rows:
                  </span>
                ) : (
                  <span>
                    Connect a specific Google Sheet in the <strong>&quot;Connect &amp; Control Any Sheet&quot;</strong> tab or click <strong>&quot;Open in Google Sheets&quot;</strong>.
                  </span>
                )}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300 transition"
                  title="Reload embedded sheet frame"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300 transition"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
              </div>
            </div>

            {/* Embedded Iframe Container */}
            <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 overflow-hidden shadow-inner">
              {activeSheetId ? (
                <iframe
                  key={iframeKey}
                  src={embedUrl}
                  title="Live Google Sheet"
                  className={`w-full ${isFullscreen ? 'h-[75vh]' : 'h-[500px]'} border-0`}
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <FileSpreadsheet size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Open Live Google Sheet
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-md">
                      Aap direct button dabakar Google Sheet open kar sakte hain ya kisi bhi Google Sheet ka link connect kar sakte hain.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleOpenInGoogleSheets}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      <span>Open Live Sheet in New Tab</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('connect')}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <SlidersHorizontal size={13} />
                      <span>Connect Any Google Sheet</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Embed info note */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Direct Live Access:
                </span>
                <p>
                  Agar Google Sheet iframe me &quot;Refused to connect&quot; dikhata hai, to upar &quot;<strong>Open in Google Sheets</strong>&quot; dabayein (Google account security private sheets ko iframe me restrict karta hai, par direct tab me 100% full edit access deta hai).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Connect & Control Any Sheet */}
        {activeTab === 'connect' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 dark:text-blue-200 text-xs flex items-center gap-1.5">
                  <Database size={15} className="text-blue-600" />
                  <span>Connect ANY Google Sheet (Kisi bhi Google Sheet ko jodein)</span>
                </span>
                {activeSheetId && (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-[11px] font-bold text-slate-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    Reset to Default Sheet
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                  Google Sheet URL or Spreadsheet ID:
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleConnectCustomSheet}
                      disabled={isTesting || !customInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Radio size={13} className={isTesting ? 'animate-pulse text-white' : ''} />
                      <span>{isTesting ? 'Connecting...' : 'Connect Sheet'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Detected Sheet Details */}
              {customInput.trim() && (
                <div className="p-3 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Detected Spreadsheet ID:
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs truncate block">
                      {extractSpreadsheetId(customInput) || 'Invalid Sheet Link format'}
                    </span>
                  </div>

                  {extractSpreadsheetId(customInput) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={getSpreadsheetEditUrl(extractSpreadsheetId(customInput))}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100"
                      >
                        <ExternalLink size={12} />
                        <span>Open Sheet</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions Grid for Target Sheet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 text-left transition space-y-1.5 active:scale-98 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                  </div>
                  <ArrowRight size={14} className="text-emerald-600" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs">
                  Sync StudyFlow to Sheet
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Push all To-Dos, Sessions, Attendance to this sheet.
                </span>
              </button>

              <button
                type="button"
                onClick={handleRestore}
                disabled={isRestoring}
                className="p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 text-left transition space-y-1.5 active:scale-98 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Database size={15} className={isRestoring ? 'animate-spin' : ''} />
                  </div>
                  <ArrowRight size={14} className="text-indigo-600" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs">
                  Restore from Sheet
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Pull all records from this sheet into your workspace.
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-900/50 bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50 text-left transition space-y-1.5 active:scale-98 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                    <Download size={15} />
                  </div>
                  <ArrowRight size={14} className="text-teal-600" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs">
                  Download .xlsx
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Direct live Excel download of all tabs and dates.
                </span>
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 space-y-2">
              <span className="font-bold text-amber-950 dark:text-amber-200 text-xs flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                <span>Important Deployment Settings in Google Sheets:</span>
              </span>
              <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
                Google Apps Script se live sync karne ke liye do cheezein zaroori hain:
                <br />
                1. <strong>Deploy &gt; Manage deployments</strong> me jakar <strong>Who has access: &quot;Anyone&quot;</strong> select karein (taki sign-in redirect na aaye).
                <br />
                2. Agar aap kisi specific Google Sheet ko connect kar rahe hain, to us Google Sheet me top-right <strong>Share</strong> button dabakar <strong>&quot;Anyone with the link (Editor)&quot;</strong> karein ya apne Apps Script account ko permission dein.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: Live Records Explorer */}
        {activeTab === 'records' && (
          <div className="space-y-3">
            {/* Filter pills & search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['todos', 'sessions', 'attendance', 'subjects', 'goals'].map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModule(mod)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                      selectedModule === mod
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search live records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-xs outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={fetchLiveRecords}
                  disabled={isLoadingRecords}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300 transition"
                  title="Refresh records from Google Sheets"
                >
                  <RefreshCw size={13} className={isLoadingRecords ? 'animate-spin text-emerald-500' : ''} />
                </button>
              </div>
            </div>

            {/* Records List Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 overflow-hidden max-h-[380px] overflow-y-auto">
              {isLoadingRecords ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw size={20} className="animate-spin mx-auto text-emerald-500 mb-2" />
                  <span>Loading records from Google Sheets...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Table size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <span className="block font-medium">No records found for &quot;{selectedModule}&quot;</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Click &quot;Sync Now&quot; to push your current study data to the Google Sheet.
                  </span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-dark-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      <th className="p-2.5">Record ID</th>
                      <th className="p-2.5">Title / Subject</th>
                      <th className="p-2.5">Details</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredRecords.map((r, i) => {
                      const d = r.data || {};
                      return (
                        <tr key={r.recordId || i} className="hover:bg-slate-50/70 dark:hover:bg-dark-900/50">
                          <td className="p-2.5 font-mono text-[10px] text-slate-500">{r.recordId}</td>
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            {d.title || d.name || d.subject || d.date || 'Record'}
                          </td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">
                            {d.time || d.studyHours ? `${d.studyHours}h` : d.targetHours ? `${d.targetHours}h` : d.category || '-'}
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300">
                              {d.status || (d.completed ? 'Completed' : 'Active')}
                            </span>
                          </td>
                          <td className="p-2.5 text-[10px] text-slate-400">
                            {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
