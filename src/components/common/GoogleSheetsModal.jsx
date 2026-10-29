import React, { useState, useEffect } from 'react';
import {
  Database,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCode,
  Download,
  Eye,
  SlidersHorizontal,
  Code,
} from 'lucide-react';
import { Modal } from './Modal';
import { useStudy } from '../../context/StudyContext';
import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  DEFAULT_SYNC_URL,
  testGoogleSheetsConnection,
  extractSpreadsheetId,
  getSpreadsheetEditUrl,
} from '../../utils/googleSheetsSync';
import { setGoogleSheetsConfig } from '../../config/googleSheets';
import { LiveGoogleSheetModal } from './LiveGoogleSheetModal';

export function GoogleSheetsModal({ isOpen, onClose }) {
  const { settings, updateSettings, syncNow, syncStatus, addToast, downloadAllDataAsExcel, restoreFromGoogleSheets } = useStudy();

  const [url, setUrl] = useState(settings?.googleSheetsSyncUrl || DEFAULT_SYNC_URL);
  const [enabled, setEnabled] = useState(settings?.googleSheetsSyncEnabled ?? true);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDownloadingSheet, setIsDownloadingSheet] = useState(false);
  const [isOpeningSheet, setIsOpeningSheet] = useState(false);
  const [isLiveViewerOpen, setIsLiveViewerOpen] = useState(false);
  const [customSheetInput, setCustomSheetInput] = useState(
    settings?.googleSheetsCustomUrl || settings?.googleSheetsSpreadsheetId || ''
  );
  const [testResult, setTestResult] = useState(null);
  const [showScriptCode, setShowScriptCode] = useState(false);

  useEffect(() => {
    if (settings?.googleSheetsSyncUrl) {
      setUrl(settings.googleSheetsSyncUrl);
    }
    if (settings?.googleSheetsCustomUrl || settings?.googleSheetsSpreadsheetId) {
      setCustomSheetInput(settings.googleSheetsCustomUrl || settings.googleSheetsSpreadsheetId);
    }
  }, [settings?.googleSheetsSyncUrl, settings?.googleSheetsCustomUrl, settings?.googleSheetsSpreadsheetId]);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    addToast('Google Apps Script code copied to clipboard! 📋', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    if (!url.trim()) {
      addToast('Please enter your Google Apps Script Web App URL.', 'warning');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGoogleSheetsConnection(url.trim());
      setTestResult(res);
      if (res.success) {
        addToast('Connected to Google Sheet successfully! 🎉', 'success');
      } else {
        addToast(res.error || 'Connection failed', 'error');
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
      addToast(err.message, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDownloadLiveSheet = async () => {
    setIsDownloadingSheet(true);
    addToast('Connecting to live Google Sheet to download file...', 'info');
    try {
      if (url && url.trim()) {
        const cleanUrl = url.trim();
        const testUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=download` : `${cleanUrl}?action=download`;
        const res = await fetch(testUrl);
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          if (json && json.downloadUrl) {
            const a = document.createElement('a');
            a.href = json.downloadUrl;
            a.target = '_blank';
            a.download = `${json.spreadsheetName || 'StudyFlow_Live_Sheet'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            addToast(`Downloaded live Google Sheet: ${json.spreadsheetName || 'StudyFlow'}! 📊`, 'success');
            return;
          }
        } catch (e) {}
      }
      downloadAllDataAsExcel({ filterMode: 'all' });
    } catch (err) {
      console.warn(err);
      downloadAllDataAsExcel({ filterMode: 'all' });
    } finally {
      setIsDownloadingSheet(false);
    }
  };

  const handleOpenLiveSheet = async () => {
    const customId = extractSpreadsheetId(
      customSheetInput || settings?.googleSheetsSpreadsheetId || settings?.googleSheetsCustomUrl
    );
    if (customId) {
      window.open(getSpreadsheetEditUrl(customId), '_blank');
      return;
    }

    if (testResult?.spreadsheetUrl) {
      window.open(testResult.spreadsheetUrl, '_blank');
      return;
    }

    if (syncStatus?.spreadsheetUrl) {
      window.open(syncStatus.spreadsheetUrl, '_blank');
      return;
    }

    setIsOpeningSheet(true);
    addToast('Connecting to live Google Apps Script to fetch sheet URL...', 'info');
    try {
      const activeUrl = url.trim() || settings?.googleSheetsSyncUrl || DEFAULT_SYNC_URL;
      const res = await testGoogleSheetsConnection(activeUrl);
      if (res && res.spreadsheetUrl) {
        setTestResult(res);
        window.open(res.spreadsheetUrl, '_blank');
        addToast(`Opened live Google Sheet: ${res.spreadsheetName || 'StudyFlow'}! 📊`, 'success');
      } else {
        window.open('https://sheets.new', '_blank');
      }
    } catch (err) {
      window.open('https://docs.google.com/spreadsheets', '_blank');
    } finally {
      setIsOpeningSheet(false);
    }
  };

  const handleSaveAndSync = async () => {
    if (!url.trim()) {
      addToast('Please enter your Google Apps Script Web App URL.', 'warning');
      return;
    }

    updateSettings({
      googleSheetsSyncUrl: url.trim(),
      googleSheetsSyncEnabled: true,
    });
    setEnabled(true);

    setIsSyncing(true);
    try {
      await syncNow();
      addToast('All data saved to Google Sheet successfully! 🎉', 'success');
      setTestResult({ success: true, message: 'Data synced successfully!' });
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromSheets = async () => {
    setIsRestoring(true);
    try {
      await restoreFromGoogleSheets(true);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const isConnected = Boolean(settings?.googleSheetsSyncEnabled && settings?.googleSheetsSyncUrl);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      title="Google Sheets Live Sync & Control"
      subtitle="Control and live sync all date-wise study sessions, attendance, to-dos, and subjects to your own Google Sheet."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Status Banner */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isConnected
            ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20'
            : 'border-amber-200/80 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20'
        } flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
              isConnected ? 'bg-emerald-600' : 'bg-amber-500'
            }`}>
              <Database size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {isConnected ? 'Google Sheets Live Connected' : 'Google Sheets Not Linked'}
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {syncStatus.lastSyncedAt
                  ? `Last synced: ${new Date(syncStatus.lastSyncedAt).toLocaleTimeString()} (${syncStatus.rowCount || 0} records)`
                  : 'Ready to auto-sync study sessions, to-dos, and attendance.'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                updateSettings({ googleSheetsSyncEnabled: e.target.checked });
              }}
              className="sr-only peer"
            />
            <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        {/* URL Input Box */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
            Google Apps Script Web App URL:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 font-mono text-[11px]"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || isSyncing || isRestoring || !url.trim()}
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shrink-0 text-xs cursor-pointer"
                title="Ping endpoint to test health"
              >
                <Radio size={13} className={isTesting ? 'animate-pulse text-blue-500' : 'text-slate-500'} />
                <span>{isTesting ? 'Testing...' : 'Test'}</span>
              </button>
              <button
                type="button"
                onClick={handleRestoreFromSheets}
                disabled={isRestoring || isSyncing || isTesting || !url.trim()}
                className="px-3 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 hover:bg-indigo-100/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shrink-0 text-xs cursor-pointer"
                title="Pull and restore all records from Google Sheets into your workspace"
              >
                <RefreshCw size={13} className={isRestoring ? 'animate-spin text-indigo-500' : 'text-indigo-400'} />
                <span>{isRestoring ? 'Restoring...' : 'Restore'}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAndSync}
                disabled={isSyncing || isTesting || isRestoring || !url.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0 text-xs cursor-pointer"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Save & Sync'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Sheet Actions: Open Live, Live View & Control, Direct Download */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 border border-emerald-200/80 dark:border-emerald-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs">
                Live Google Sheet Controls
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Open directly in Google Sheets, view live inside app, or export .xlsx
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleOpenLiveSheet}
              disabled={isOpeningSheet}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold flex items-center gap-1.5 transition text-xs cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
              title="Open Google Sheet directly in a new tab"
            >
              {isOpeningSheet ? <RefreshCw size={12} className="animate-spin" /> : <ExternalLink size={12} />}
              <span>Open Sheet ↗</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLiveViewerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1.5 transition text-xs cursor-pointer shadow-xs active:scale-95"
              title="Open live embedded viewer and multi-sheet control center"
            >
              <Eye size={12} />
              <span>Live Control ⚡</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadLiveSheet}
              disabled={isDownloadingSheet}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-dark-900 dark:hover:bg-dark-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 transition text-xs cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
              title="Directly download Google Sheet as .xlsx"
            >
              {isDownloadingSheet ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
              <span>.xlsx</span>
            </button>
          </div>
        </div>

        {/* Live Test Results Alert */}
        {testResult && (
          <div
            className={`p-3.5 rounded-2xl border text-xs ${
              testResult.success
                ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50/80 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-bold block">
                  {testResult.success ? 'Connection Successful!' : 'Connection Warning / Error'}
                </span>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {testResult.message || testResult.error}
                </p>
                {testResult.sheets && testResult.sheets.length > 0 && (
                  <p className="text-[10px] opacity-75">
                    Found Sheets: {testResult.sheets.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deployment Code & Direct Links Section */}
        <div className="p-4 rounded-2xl border border-blue-200/90 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-bold text-blue-950 dark:text-blue-100 text-xs flex items-center gap-1.5">
              <FileCode size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Google Apps Script Backend Code &amp; Sheet Links</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowScriptCode((prev) => !prev)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-dark-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1 transition text-[11px] cursor-pointer"
              >
                <Code size={12} />
                <span>{showScriptCode ? 'Hide Code' : 'View Code'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyScript}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 transition shadow-xs text-[11px] cursor-pointer"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied Code!' : 'Copy Script Code'}</span>
              </button>
            </div>
          </div>

          {/* Quick Links: Live Google Sheet & Apps Script Endpoint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Connected Google Sheet
                </span>
                <a
                  href={
                    testResult?.spreadsheetUrl ||
                    syncStatus?.spreadsheetUrl ||
                    (customSheetInput ? getSpreadsheetEditUrl(customSheetInput) : 'https://sheets.new')
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-slate-700 dark:text-slate-200 hover:text-emerald-600 truncate block underline underline-offset-2"
                >
                  {testResult?.spreadsheetUrl || syncStatus?.spreadsheetUrl || (customSheetInput ? getSpreadsheetEditUrl(customSheetInput) : 'https://sheets.new')}
                </a>
              </div>
              <a
                href={
                  testResult?.spreadsheetUrl ||
                  syncStatus?.spreadsheetUrl ||
                  (customSheetInput ? getSpreadsheetEditUrl(customSheetInput) : 'https://sheets.new')
                }
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500"
              >
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Apps Script Web App
                </span>
                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-200 truncate block">
                  {url || DEFAULT_SYNC_URL}
                </span>
              </div>
              <a
                href="https://script.google.com"
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:text-blue-500"
                title="Open Google Apps Script"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <p className="text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
            Apne Google Sheet me <strong>Extensions &gt; Apps Script</strong> kholiye, <code>Code.gs</code> ka sara code replace karke <strong>Save (Ctrl+S)</strong> karein aur <strong>Deploy &gt; Manage deployments &gt; New version</strong> (Who has access: <strong>Anyone</strong>) karke Deploy karein.
          </p>

          {/* Expandable Code Preview */}
          {showScriptCode && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400">
                <span>Code.gs Script Template:</span>
                <span className="text-emerald-600 font-mono">v4.0.0</span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[10px] leading-relaxed max-h-56 overflow-y-auto overflow-x-auto border border-slate-800">
                <code>{GOOGLE_APPS_SCRIPT_TEMPLATE}</code>
              </pre>
            </div>
          )}
        </div>

        {/* What gets synced checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-1">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>To-Do List</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Study Sessions</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Daily Attendance</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>Subjects &amp; Topics</span>
          </div>
        </div>
      </div>
    </Modal>

    {/* Live Interactive Google Sheet Viewer & Controller */}
    <LiveGoogleSheetModal
      isOpen={isLiveViewerOpen}
      onClose={() => setIsLiveViewerOpen(false)}
    />
    </>
  );
}
