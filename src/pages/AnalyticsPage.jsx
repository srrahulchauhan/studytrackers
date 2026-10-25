import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Flame,
  Clock,
  BookOpen,
  Layers,
  CheckCircle2,
  Coffee,
  Calendar,
  Award,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  ExternalLink,
  ChevronRight,
  Database,
  History as HistoryIcon,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { StatCard } from '../components/common/StatCard';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  DailyBarChart,
  SubjectBreakdownChart,
  AttendanceDistributionChart,
} from '../components/analytics/Charts';
import { LogSessionModal } from '../components/analytics/LogSessionModal';
import { GoogleSheetsModal } from '../components/common/GoogleSheetsModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  getTodayDateString,
  getCurrentWeekDates,
  calculateStudyStreaks,
  formatFriendlyDate,
} from '../utils/dateUtils';
import { formatSecondsToShort, formatSecondsToHMS } from '../utils/timerUtils';
import { computeAttendanceStats } from '../utils/attendanceLogic';

export function AnalyticsPage() {
  const {
    sessions,
    subjects,
    topics,
    preparations,
    attendance,
    settings,
    syncStatus,
    syncNow,
    deleteSession,
    downloadDateWiseExcel,
    downloadAllDataAsExcel,
    addToast,
  } = useStudy();

  // Active Main Tab: 'history' (Date-Wise Study History) | 'analytics' (Analytics & Visual Charts)
  const [activeTab, setActiveTab] = useState('history');

  // Date Filter Mode: 'all' | 'today' | 'yesterday' | 'weekly' | 'monthly' | 'custom'
  const [dateRangeMode, setDateRangeMode] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isLogSessionOpen, setIsLogSessionOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const todayStr = getTodayDateString();

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  // Filter sessions by selected range & search query
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    if (dateRangeMode === 'today') {
      result = result.filter((s) => s.date === todayStr);
    } else if (dateRangeMode === 'yesterday') {
      const yStr = getYesterdayStr();
      result = result.filter((s) => s.date === yStr);
    } else if (dateRangeMode === 'weekly') {
      const currentWeek = getCurrentWeekDates(settings?.weekStartDay === 'Sunday');
      const weekDates = new Set(currentWeek.map((w) => w.dateStr));
      result = result.filter((s) => weekDates.has(s.date));
    } else if (dateRangeMode === 'monthly') {
      const monthPrefix = todayStr.slice(0, 7);
      result = result.filter((s) => s.date && s.date.startsWith(monthPrefix));
    } else if (dateRangeMode === 'custom' && customStart && customEnd) {
      result = result.filter((s) => s.date >= customStart && s.date <= customEnd);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const sub = subjects.find((subItem) => subItem.id === s.subjectId);
        const top = topics.find((topItem) => topItem.id === s.topicId);
        const prep = preparations.find((prepItem) => prepItem.id === s.preparationId);
        return (
          (sub?.name && sub.name.toLowerCase().includes(q)) ||
          (top?.name && top.name.toLowerCase().includes(q)) ||
          (prep?.name && prep.name.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q)) ||
          (s.date && s.date.includes(q))
        );
      });
    }

    // Sort newest date and start time first
    result.sort((a, b) => {
      const cmp = (b.date || '').localeCompare(a.date || '');
      if (cmp !== 0) return cmp;
      return (b.startTime || '').localeCompare(a.startTime || '');
    });

    return result;
  }, [sessions, dateRangeMode, customStart, customEnd, todayStr, settings, searchQuery, subjects, topics, preparations]);

  // Aggregate Metrics for Filtered Period
  const totalStudySeconds = filteredSessions.reduce(
    (acc, s) => acc + (s.actualStudyDuration || 0),
    0
  );
  const totalBreakSeconds = filteredSessions.reduce(
    (acc, s) => acc + (s.breakDuration || 0),
    0
  );

  const distinctDaysStudied = new Set(filteredSessions.map((s) => s.date)).size;
  const avgDailyStudySeconds =
    distinctDaysStudied > 0 ? Math.round(totalStudySeconds / distinctDaysStudied) : 0;

  // Group sessions by date for Date-Wise visual display
  const groupedSessionsByDate = useMemo(() => {
    const groups = {};
    filteredSessions.forEach((s) => {
      const d = s.date || 'Unspecified';
      if (!groups[d]) {
        groups[d] = {
          date: d,
          totalDuration: 0,
          sessions: [],
        };
      }
      groups[d].totalDuration += (s.actualStudyDuration || 0);
      groups[d].sessions.push(s);
    });
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSessions]);

  // Streaks & Attendance stats
  const streaks = calculateStudyStreaks(sessions, settings?.minAttendanceMinutes || 30);
  const attStats = computeAttendanceStats(attendance);

  // Longest session
  let longestSessionSeconds = 0;
  filteredSessions.forEach((s) => {
    if ((s.actualStudyDuration || 0) > longestSessionSeconds) {
      longestSessionSeconds = s.actualStudyDuration;
    }
  });

  // Chart data for daily trend
  const weekDates = getCurrentWeekDates(settings?.weekStartDay === 'Sunday');
  const barChartData = weekDates.map((w) => {
    const daySessions = sessions.filter((s) => s.date === w.dateStr);
    const sec = daySessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);
    return {
      label: w.dayName.slice(0, 3),
      valueHours: sec / 3600,
      isToday: w.isToday,
    };
  });

  const completedTopicsCount = topics.filter((t) => t.status === 'Completed').length;
  const pendingTopicsCount = topics.filter((t) => t.status !== 'Completed').length;
  const totalTopicsCount = topics.length;

  // Lookup helper maps
  const prepMap = Object.fromEntries(preparations.map((p) => [p.id, p.name]));
  const subMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  // Trigger Date-Wise Excel Download
  const handleDownloadDateWiseExcel = () => {
    downloadDateWiseExcel({
      filterMode: dateRangeMode,
      startDate: customStart,
      endDate: customEnd,
    });
  };

  const handleManualSyncSheets = async () => {
    if (!settings.googleSheetsSyncUrl) {
      setIsSheetsModalOpen(true);
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

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 font-sans animate-fade-in max-w-7xl mx-auto">
      {/* 1. TOP HEADER BANNER */}
      <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Reports & Study History
                </h1>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  Excel & Google Sheets Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit date-wise study records, save offline sessions, and export multi-sheet Excel workbooks.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Download Excel + Google Sheets Auto-Sync + Log Session */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* 1. Download Date-Wise Excel Button */}
          <button
            onClick={handleDownloadDateWiseExcel}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
            title="Download Date-Wise Study History & Summary Excel Workbook (.xlsx)"
          >
            <FileSpreadsheet size={15} />
            <span>Download Excel</span>
          </button>

          {/* 2. Google Sheets Auto-Sync Button */}
          <button
            onClick={handleManualSyncSheets}
            disabled={isSyncing}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              settings.googleSheetsSyncEnabled && settings.googleSheetsSyncUrl
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                : 'bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
            }`}
            title="Auto-Save & Sync data to Google Sheets"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-indigo-600' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sheets Auto-Save'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                settings?.googleSheetsSyncEnabled && settings?.googleSheetsSyncUrl
                  ? 'bg-emerald-500'
                  : 'bg-amber-400'
              }`}
            />
          </button>

          {/* 3. Log / Save Study Session */}
          <button
            onClick={() => setIsLogSessionOpen(true)}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition active:scale-95 cursor-pointer"
            title="Manually save completed study hours to history"
          >
            <Plus size={15} />
            <span>+ Log Session</span>
          </button>
        </div>
      </div>

      {/* 2. TABS & FILTER CONTROLS BAR */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dark-950 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'history'
                ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HistoryIcon size={14} />
            <span>Date-Wise Study History ({filteredSessions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-dark-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>Analytics & Trends</span>
          </button>
        </div>

        {/* Date Filter Presets */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs py-0.5">
          {[
            { id: 'all', label: 'All Dates' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'weekly', label: 'This Week' },
            { id: 'monthly', label: 'This Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setDateRangeMode(m.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                dateRangeMode === m.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-dark-950 border border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker (shown when 'custom' is selected) */}
      {dateRangeMode === 'custom' && (
        <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs animate-scale-in">
          <span className="font-bold text-slate-700 dark:text-slate-300">From Date:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
          <span className="font-bold text-slate-700 dark:text-slate-300">To Date:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
          <button
            onClick={handleDownloadDateWiseExcel}
            className="ml-auto px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition"
          >
            <Download size={13} />
            <span>Export Filtered Range to Excel</span>
          </button>
        </div>
      )}

      {/* 3. KEY METRICS OVERVIEW CARDS (Calculated for current date filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="glass-card p-3.5 text-center rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Study Time</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mono-number mt-1 block">
            {formatSecondsToShort(totalStudySeconds)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
            {filteredSessions.length} sessions logged
          </span>
        </div>

        <div className="glass-card p-3.5 text-center rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Daily Average</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mono-number mt-1 block">
            {formatSecondsToShort(avgDailyStudySeconds)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Across {distinctDaysStudied} active days
          </span>
        </div>

        <div className="glass-card p-3.5 text-center rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Streak</span>
          <span className="text-xl font-black text-amber-500 mono-number mt-1 flex items-center justify-center gap-1">
            <Flame size={18} className="fill-amber-500" />
            <span>{streaks.currentStreak}d</span>
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Best: {streaks.longestStreak} days
          </span>
        </div>

        <div className="glass-card p-3.5 text-center rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attendance Rate</span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mono-number mt-1 block">
            {attStats.attendancePercentage}%
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {attStats.presentDays} Present / {attStats.totalLoggedDays} Days
          </span>
        </div>

        <div className="glass-card p-3.5 text-center rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Breaks</span>
          <span className="text-xl font-black text-rose-500 mono-number mt-1 block">
            {formatSecondsToShort(totalBreakSeconds)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Rest & replenishment
          </span>
        </div>

        <div className="glass-card p-3.5 text-center rounded-2xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Longest Session</span>
          <span className="text-xl font-black text-teal-600 dark:text-teal-400 mono-number mt-1 block">
            {formatSecondsToShort(longestSessionSeconds)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Peak focus interval
          </span>
        </div>
      </div>

      {/* 4. MAIN BODY SWITCHER: TAB 1 (HISTORY) vs TAB 2 (ANALYTICS) */}
      {activeTab === 'history' ? (
        /* ======================== TAB 1: DATE-WISE STUDY HISTORY & LOGS ======================== */
        <div className="space-y-4">
          {/* Quick Search & Excel Download Banner */}
          <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history by subject, topic, date, or notes..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadDateWiseExcel}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                title="Download this exact date range to Excel"
              >
                <Download size={14} />
                <span>Export ({filteredSessions.length}) to Excel</span>
              </button>

              <button
                onClick={() => setIsSheetsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Database size={14} className="text-emerald-500" />
                <span>Google Sheets Config</span>
              </button>
            </div>
          </div>

          {/* Date-Wise Grouped Session Audit Trail */}
          {groupedSessionsByDate.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <CalendarDays size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No Study Sessions Found for this Range
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No past sessions recorded for the selected filter. You can log completed study hours manually or start a live timer session.
              </p>
              <button
                onClick={() => setIsLogSessionOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
              >
                <Plus size={14} />
                <span>Log Study Session Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedSessionsByDate.map((group) => (
                <div
                  key={group.date}
                  className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs"
                >
                  {/* Date Group Header */}
                  <div className="p-3.5 bg-slate-50/80 dark:bg-dark-950/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        <Calendar size={14} />
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {formatFriendlyDate(group.date)}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-2 font-mono">
                          ({group.date})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500 font-medium">
                        {group.sessions.length} {group.sessions.length === 1 ? 'session' : 'sessions'}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 mono-number">
                        {formatSecondsToShort(group.totalDuration)}
                      </span>
                    </div>
                  </div>

                  {/* Sessions under this date */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {group.sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3.5 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-dark-950/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        {/* Left: Time & Subject / Topic info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Time badge */}
                          <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-dark-900 border border-slate-200/70 dark:border-slate-800 shrink-0 text-center min-w-[75px]">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mono-number">
                              {sess.startTime || '09:00 AM'}
                            </span>
                            <span className="text-[9px] text-slate-400 block">
                              to {sess.endTime || '10:00 AM'}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {subMap[sess.subjectId] || 'General Subject'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                {prepMap[sess.preparationId] || 'Course'}
                              </span>
                              {sess.status && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                  {sess.status}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5 truncate">
                              Topic: {topicMap[sess.topicId] || 'General Study & Practice'}
                            </p>

                            {sess.notes && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-2">
                                "{sess.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Net Duration & Delete Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
                          <div className="text-left sm:text-right">
                            <span className="text-sm font-black text-slate-800 dark:text-slate-100 mono-number block">
                              {formatSecondsToHMS(sess.actualStudyDuration || 0)}
                            </span>
                            {(sess.breakDuration || 0) > 0 && (
                              <span className="text-[10px] text-amber-500 block">
                                Break: {formatSecondsToShort(sess.breakDuration)}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setSessionToDelete(sess.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete this study session"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ======================== TAB 2: ANALYTICS & VISUAL CHARTS ======================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Study Trend */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Daily Study Hours (This Week)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Day-by-day study investment trend
                  </p>
                </div>
                <TrendingUp size={16} className="text-brand-500" />
              </div>
              <DailyBarChart data={barChartData} />
            </div>

            {/* Subject-wise Distribution */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Subject-Wise Study Investment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ratio of study time allocated across subjects
                  </p>
                </div>
                <BookOpen size={16} className="text-brand-500" />
              </div>
              <SubjectBreakdownChart subjects={subjects} sessions={filteredSessions} />
            </div>

            {/* Syllabus Progress */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Topics Mastery & Syllabus Coverage
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Completed vs pending syllabus topics
                  </p>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>

              <div className="space-y-4">
                <ProgressBar
                  value={completedTopicsCount}
                  max={totalTopicsCount}
                  label="Overall Topics Completion"
                  subLabel={`${completedTopicsCount} / ${totalTopicsCount} (${
                    totalTopicsCount > 0
                      ? Math.round((completedTopicsCount / totalTopicsCount) * 100)
                      : 0
                  }%)`}
                  height="h-3"
                  color="bg-emerald-500"
                />

                <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                    <span className="text-emerald-600 dark:text-emerald-400 block font-medium">
                      Completed Topics
                    </span>
                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mono-number mt-0.5 block">
                      {completedTopicsCount}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-slate-400 block font-medium">Pending Topics</span>
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-300 mono-number mt-0.5 block">
                      {pendingTopicsCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Attendance Consistency
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Attendance breakdown & overall percentage
                  </p>
                </div>
                <Award size={16} className="text-amber-500" />
              </div>

              <AttendanceDistributionChart stats={attStats} />

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">All-time Attendance Rate:</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mono-number">
                  {attStats.attendancePercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Study Session Log Modal */}
      <LogSessionModal
        isOpen={isLogSessionOpen}
        onClose={() => setIsLogSessionOpen(false)}
      />

      {/* Google Sheets Auto-Save & Sync Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />

      {/* Delete Session Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(sessionToDelete)}
        onClose={() => setSessionToDelete(null)}
        onConfirm={() => {
          if (sessionToDelete) {
            deleteSession(sessionToDelete);
            setSessionToDelete(null);
          }
        }}
        title="Delete Study Record?"
        message="Are you sure you want to delete this study session from history? This will adjust your total study time and daily statistics."
        confirmText="Yes, Delete Session"
        isDestructive={true}
      />
    </div>
  );
}
