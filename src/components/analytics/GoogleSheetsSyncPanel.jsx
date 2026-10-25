import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  PowerOff,
  Cloud,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../../utils/googleSheetsSync';

export function GoogleSheetsSyncPanel({ onOpenSheetsModal, onManualExportExcel }) {
  const { settings, updateSettings, syncNow, syncStatus, addToast } = useStudy();
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const isConnected = Boolean(settings?.googleSheetsSyncEnabled && settings?.googleSheetsSyncUrl);

  const handleSyncClick = async () => {
    if (!settings?.googleSheetsSyncUrl) {
      if (onOpenSheetsModal) onOpenSheetsModal();
      return;
    }
    setIsSyncing(true);
    try {
      await syncNow();
    } catch {
      // toast shown in syncNow
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    updateSettings({
      googleSheetsSyncEnabled: false,
      googleSheetsSyncUrl: '',
      googleSheetsSyncKey: '',
    });
    addToast('Google Sheets disconnected successfully.', 'info');
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    addToast('Google Apps Script code copied to clipboard!', 'success');
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Main Connection Status Card */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
              isConnected
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20'
                : 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/20'
            }`}>
              <Cloud size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  ☁️ Google Sheets Backup & Sync
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {isConnected ? 'Connected & Active' : 'Not Connected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically backup and sync all study sessions, attendance, subjects, topics, and goals to Google Sheets.
              </p>
            </div>
          </div>

          {/* Action Buttons: Sync Now, Enable Toggle, Disconnect */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <PowerOff size={13} />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                onClick={onOpenSheetsModal}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-dark-800 dark:hover:bg-dark-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Database size={14} />
                <span>Connect Google Sheets</span>
              </button>
            )}

            {onManualExportExcel && (
              <button
                onClick={onManualExportExcel}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Download Excel backup file directly"
              >
                <Download size={13} className="text-emerald-500" />
                <span>Manual Backup (.xlsx)</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Settings and Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 text-xs">
          {/* Automatic Sync Toggle */}
          <div className="p-4 rounded-2xl bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                Enable Automatic Sync
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Sync on timer stop & attendance update
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3">
              <input
                type="checkbox"
                checked={Boolean(settings?.googleSheetsSyncEnabled)}
                onChange={(e) => updateSettings({ googleSheetsSyncEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          {/* Last Synced Timestamp */}
          <div className="p-4 rounded-2xl bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Last Synchronization
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block mt-1 mono-number">
              {syncStatus.lastSyncedAt
                ? new Date(syncStatus.lastSyncedAt).toLocaleString()
                : 'Never Synced'}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {syncStatus.rowCount ? `${syncStatus.rowCount} records synced` : 'Status: Ready'}
            </span>
          </div>

          {/* Web App Endpoint / Target */}
          <div className="p-4 rounded-2xl bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Target Spreadsheet Web App
              </span>
              <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate mt-1">
                {settings?.googleSheetsSyncUrl || 'No Web App URL configured'}
              </p>
            </div>
            <button
              onClick={onOpenSheetsModal}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-2 text-left"
            >
              <span>Configure URL & Setup</span>
              <ExternalLink size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Synchronized Worksheets Architecture Info */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet size={16} className="text-emerald-500" />
          <span>Automated Worksheets Created in Google Sheets</span>
        </h4>
        <p className="text-xs text-slate-500">
          Each synchronization safely appends or updates these 6 dedicated worksheets without duplicate records:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
          {[
            { name: '1. Dashboard Summary', desc: 'Overall study hours, attendance rate, completed topics, goals.' },
            { name: '2. Daily Study History', desc: 'Every date, session, subject, duration, lecture, notes, revision.' },
            { name: '3. Subject Analysis', desc: 'Total study hours, target vs actual, topic completion rates.' },
            { name: '4. Attendance', desc: 'Daily attendance log, minimum study threshold verification.' },
            { name: '5. Goals', desc: 'Deadlines, target study hours, completion percentage.' },
            { name: '6. Revision History', desc: 'Subject, topic, scheduled revision dates, review status.' },
          ].map((sheet, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/70 dark:border-slate-800"
            >
              <span className="font-bold text-slate-800 dark:text-slate-100 block mb-0.5">
                {sheet.name}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight block">
                {sheet.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Copy Apps Script helper */}
        <div className="pt-3 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={handleCopyScript}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-950 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedScript ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copiedScript ? 'Copied Script!' : 'Copy Google Apps Script Code'}</span>
          </button>

          <a
            href="https://script.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Open Google Apps Script Dashboard</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
