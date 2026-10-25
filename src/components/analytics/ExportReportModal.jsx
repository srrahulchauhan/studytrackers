import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatSecondsToHMS } from '../../utils/timerUtils';

export function ExportReportModal({
  isOpen,
  onClose,
  sessions = [],
  onExport,
}) {
  const [scope, setScope] = useState('all'); // all | today | last7 | last30 | this_month | this_year | custom
  const [format, setFormat] = useState('xlsx'); // xlsx | pdf | json
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Live filter preview of records
  const filteredPreview = useMemo(() => {
    let result = [...sessions];

    if (scope === 'today') {
      result = result.filter((s) => s.date === todayStr);
    } else if (scope === 'last7') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const start = d.toISOString().slice(0, 10);
      result = result.filter((s) => s.date >= start && s.date <= todayStr);
    } else if (scope === 'last30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const start = d.toISOString().slice(0, 10);
      result = result.filter((s) => s.date >= start && s.date <= todayStr);
    } else if (scope === 'this_month') {
      const prefix = todayStr.slice(0, 7);
      result = result.filter((s) => s.date && s.date.startsWith(prefix));
    } else if (scope === 'this_year') {
      const prefix = `${now.getFullYear()}-`;
      result = result.filter((s) => s.date && s.date.startsWith(prefix));
    } else if (scope === 'custom' && customStart && customEnd) {
      result = result.filter((s) => s.date >= customStart && s.date <= customEnd);
    }

    const totalSeconds = result.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);
    const uniqueDays = new Set(result.map((s) => s.date)).size;

    return {
      count: result.length,
      totalSeconds,
      uniqueDays,
      records: result,
    };
  }, [sessions, scope, customStart, customEnd, todayStr]);

  if (!isOpen) return null;

  const handleDownloadClick = () => {
    onExport({
      scope,
      format,
      customStart,
      customEnd,
      filteredRecords: filteredPreview.records,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <Download size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Export Reports & Analytics
              </h3>
              <p className="text-[11px] text-emerald-100">
                Choose export scope and desired output format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* 1. Export Scope Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Select Export Scope:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'all', label: 'Complete History' },
                { id: 'today', label: 'Today' },
                { id: 'last7', label: 'Last 7 Days' },
                { id: 'last30', label: 'Last 30 Days' },
                { id: 'this_month', label: 'This Month' },
                { id: 'this_year', label: 'This Year' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setScope(opt.id)}
                  className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                    scope === opt.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-[#f0f4fa] dark:bg-dark-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom Range Option */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setScope('custom')}
                className={`w-full p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  scope === 'custom'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-[#f0f4fa] dark:bg-dark-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                Custom Date Range
              </button>

              {scope === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Start Date</span>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">End Date</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 text-xs font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Format Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Select Output Format:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  format === 'xlsx'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/30'
                    : 'bg-[#f0f4fa] dark:bg-dark-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                }`}
              >
                <FileSpreadsheet size={22} className="text-emerald-500" />
                <span className="font-bold text-xs">Excel (.xlsx)</span>
                <span className="text-[10px] text-slate-400 text-center leading-tight">
                  6 Formatted Sheets
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  format === 'pdf'
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-400/30'
                    : 'bg-[#f0f4fa] dark:bg-dark-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-rose-400'
                }`}
              >
                <FileText size={22} className="text-rose-500" />
                <span className="font-bold text-xs">PDF (.pdf)</span>
                <span className="text-[10px] text-slate-400 text-center leading-tight">
                  Multi-Page Report
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  format === 'json'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400/30'
                    : 'bg-[#f0f4fa] dark:bg-dark-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <Database size={22} className="text-blue-500" />
                <span className="font-bold text-xs">JSON (.json)</span>
                <span className="text-[10px] text-slate-400 text-center leading-tight">
                  Raw Backup Schema
                </span>
              </button>
            </div>
          </div>

          {/* 3. Live Preview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-2">
              Preview of Records to Export
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-slate-500 block text-[10px]">Total Records</span>
                <span className="font-black text-slate-800 dark:text-slate-100 text-sm mono-number">
                  {filteredPreview.count}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Study Duration</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm mono-number">
                  {formatSecondsToHMS(filteredPreview.totalSeconds)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Active Days</span>
                <span className="font-black text-blue-600 dark:text-blue-400 text-sm mono-number">
                  {filteredPreview.uniqueDays}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-dark-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-dark-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownloadClick}
            disabled={filteredPreview.count === 0 && scope !== 'all'}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/25 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download size={14} />
            <span>Download {format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
