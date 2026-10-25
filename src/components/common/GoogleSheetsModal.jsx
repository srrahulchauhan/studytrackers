import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Modal } from './Modal';
import { useStudy } from '../../context/StudyContext';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../../utils/googleSheetsSync';

export function GoogleSheetsModal({ isOpen, onClose }) {
  const { settings, updateSettings, syncNow, syncStatus, addToast } = useStudy();

  const [url, setUrl] = useState(settings?.googleSheetsSyncUrl || '');
  const [enabled, setEnabled] = useState(settings?.googleSheetsSyncEnabled ?? false);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    addToast('Google Apps Script code copied to clipboard! 📋', 'success');
    setTimeout(() => setCopied(false), 2500);
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

    setIsTesting(true);
    try {
      await syncNow();
      addToast('Connected & synced with Google Sheets successfully! 🎉', 'success');
    } catch (err) {
      // Error toast is already triggered by syncNow
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Sheets Auto-Save & Cloud Sync"
      subtitle="Automatically save all date-wise study sessions, attendance, to-dos, and subjects to your own Google Sheet."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Status Banner */}
        <div className="p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Database size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {settings?.googleSheetsSyncEnabled && settings?.googleSheetsSyncUrl
                    ? 'Google Sheets Auto-Save Active'
                    : 'Google Sheets Not Linked'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings?.googleSheetsSyncEnabled && settings?.googleSheetsSyncUrl
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {syncStatus.lastSyncedAt
                  ? `Last synced: ${new Date(syncStatus.lastSyncedAt).toLocaleTimeString()}`
                  : 'Link your Web App URL below to begin real-time auto-saving.'}
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
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        {/* Input for Apps Script URL */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 dark:text-slate-300">
            Google Apps Script Web App URL:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSaveAndSync}
              disabled={isTesting || !url.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
            >
              <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
              <span>{isTesting ? 'Syncing...' : 'Save & Sync'}</span>
            </button>
          </div>
        </div>

        {/* Setup Guide Accordion */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-dark-950/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Quick 2-Minute Setup Instructions</span>
            </span>
            <button
              onClick={handleCopyScript}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 transition shadow-2xs"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copied ? 'Copied!' : 'Copy Script Code'}</span>
            </button>
          </div>

          <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <li>
              Open a new Google Spreadsheet by clicking{' '}
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
              >
                sheets.new <ExternalLink size={10} />
              </a>
            </li>
            <li>In Google Sheets, open top menu: <strong>Extensions &gt; Apps Script</strong></li>
            <li>Delete all text inside the editor, then paste the copied code from above</li>
            <li>
              Click <strong>Deploy &gt; New deployment</strong>, select type <strong>Web app</strong>, set{' '}
              <strong>Execute as: "Me"</strong> and <strong>Who has access: "Anyone"</strong>
            </li>
            <li>Click <strong>Deploy</strong> and paste the generated <code>/exec</code> URL above!</li>
          </ol>
        </div>

        {/* What gets synced checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-1">
            <span className="text-emerald-500">✓</span>
            <span>Study Sessions</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-500">✓</span>
            <span>Daily Attendance</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-500">✓</span>
            <span>Subjects & Topics</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-500">✓</span>
            <span>To-Do & Timetable</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
