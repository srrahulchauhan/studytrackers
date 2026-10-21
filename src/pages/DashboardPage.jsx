import React, { useState } from 'react';
import {
  Play,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  ListTodo,
  Trophy,
  TrendingUp,
  UserCheck,
  ChevronRight,
  LineChart,
  Layers,
  Bell,
  Coffee,
  Hourglass,
  Smartphone,
  Star,
  MapPin,
  Target,
  Zap,
  Check,
  Bookmark,
  BookOpen,
  Sparkles,
  Flame,
  ArrowUpRight,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { useTimer } from '../context/TimerContext';
import { formatSecondsToShort, formatHoursToShort } from '../utils/timerUtils';
import {
  getTodayDateString,
  getTomorrowDateString,
  formatFriendlyDate,
  formatFullDate,
  getCurrentWeekDates,
} from '../utils/dateUtils';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export function DashboardPage({
  setActivePage,
  onOpenQuickAction,
  onOpenNewSubject,
  onOpenNewTopic,
  onOpenSchedule,
  onOpenTomorrowTarget,
  onOpenNewGoal,
}) {
  const {
    subjects,
    topics,
    sessions,
    attendance,
    targets,
    goals,
    settings,
    notifications,
    toggleTomorrowTarget,
    removeTomorrowTarget,
    deleteSession,
    clearAllNotifications,
    clearAllData,
  } = useStudy();

  const {
    isRunning,
    liveTimings,
    formattedNetStudyTime,
    startStudy,
  } = useTimer();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const todayStr = getTodayDateString();
  const weekDates = getCurrentWeekDates();
  const currentMonth = todayStr.slice(0, 7);
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase();

  const activeLiveStudySeconds = isRunning ? Math.round((liveTimings?.netStudyMs || 0) / 1000) : 0;

  // Real Today's Study Sessions
  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const todayStudySeconds = todaySessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0) + activeLiveStudySeconds;
  const todayBreakSeconds = todaySessions.reduce((acc, s) => acc + (s.breakDuration || 0), 0);

  // Real Total Study Seconds
  const displayTotalSeconds = sessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0) + activeLiveStudySeconds;

  // Real Weekly Study Seconds
  const displayWeeklySeconds = sessions
    .filter((s) => weekDates.some((day) => day.dateStr === s.date))
    .reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0) + activeLiveStudySeconds;

  // Real Monthly Study Seconds
  const displayMonthlySeconds = sessions
    .filter((s) => s.date && s.date.startsWith(currentMonth))
    .reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0) + activeLiveStudySeconds;

  // Planned & Target Hours
  const todayPlannedHours = targets.daily?.targetHours || settings?.dailyTargetHours || 4;
  const weeklyTargetHours = targets.weekly?.targetHours || 25;
  const monthlyTargetHours = targets.monthly?.targetHours || 100;

  const todayProgressPercent = todayPlannedHours > 0
    ? Math.min(100, Math.round((todayStudySeconds / 3600 / todayPlannedHours) * 100))
    : 0;
  const weeklyProgressPercent = weeklyTargetHours > 0
    ? Math.min(100, Math.round((displayWeeklySeconds / 3600 / weeklyTargetHours) * 100))
    : 0;
  const monthlyProgressPercent = monthlyTargetHours > 0
    ? Math.min(100, Math.round((displayMonthlySeconds / 3600 / monthlyTargetHours) * 100))
    : 0;

  const todayRemainingHours = Math.max(0, todayPlannedHours - todayStudySeconds / 3600);

  // Topics
  const completedTopics = topics.filter((t) => t.status === 'Completed' || t.completed).length;
  const pendingTopics = Math.max(0, topics.length - completedTopics);
  const topicProgressPercent = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0;

  // Attendance
  const minAttendanceMinutes = settings?.minAttendanceMinutes || 30;
  const attendanceLoggedMinutes = Math.floor(todayStudySeconds / 60);
  const isPresent = attendanceLoggedMinutes >= minAttendanceMinutes;
  const attendanceProgressPercent = minAttendanceMinutes > 0
    ? Math.min(100, Math.round((todayStudySeconds / (minAttendanceMinutes * 60)) * 100))
    : 0;

  // Total Target Hours from subjects
  const totalTargetHours = subjects.reduce((sum, s) => sum + (Number(s.totalTargetHours) || 0), 0);
  const totalProgressPercent = totalTargetHours > 0
    ? Math.min(100, Math.round((displayTotalSeconds / 3600 / totalTargetHours) * 100))
    : 0;

  // Goals
  const activeGoal = goals.find((g) => g.status === 'In Progress' || g.status === 'Active') || goals[0];
  const goalProgressPercent = activeGoal ? (activeGoal.progress || 0) : 0;

  // Dynamic Todo Items from targets.tomorrow || []
  const todoItems = targets.tomorrow || [];

  // Weekly Activity Chart Data
  const weekChartData = weekDates.map((day) => {
    const daySessions = sessions.filter((s) => s.date === day.dateStr);
    let daySec = daySessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);
    if (day.dateStr === todayStr) {
      daySec += activeLiveStudySeconds;
    }
    const h = Number((daySec / 3600).toFixed(1));
    return {
      day: day.dayName.slice(0, 3),
      date: day.dateStr,
      h,
      seconds: daySec,
      isToday: day.dateStr === todayStr,
    };
  });
  const maxChartHours = Math.max(4, ...weekChartData.map((d) => d.h));

  // Dynamic Greeting
  const currentHour = new Date().getHours();
  const greetingTime = currentHour < 12 ? 'Morning' : currentHour < 17 ? 'Afternoon' : 'Evening';

  return (
    <div className="space-y-4 pb-12 font-sans animate-fade-in">
      {/* =========================================================================
          1. TOP ROW: Hero Banner + 4 Quick Action Cards
          Matches the reference image exactly:
          - Desktop & Laptop (lg: and above): Side-by-side row
            - Hero Card: w-[57%] with exact hero banner image + interactive hotspot
            - 4 Action Buttons: w-[43%] in a 4-col grid with exact gradients, icons, and labels
          - Mobile / Small screens: Responsive stacked layout with full touch targets
      ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-3.5 items-stretch">
        {/* Left Hero Banner with 4K Background and Pure React + CSS Typography */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex-1 lg:max-w-[57%] group min-h-[145px] sm:min-h-[155px] lg:min-h-[142px] xl:min-h-[156px] flex flex-col justify-between p-4 sm:p-5 select-none card-hover-lift">
          {/* 4K Ultra-Quality Panoramic Background Image */}
          <img
            src="/hero_banner_4k.jpg"
            alt="Hero Mountain Sunrise Background"
            className="absolute inset-0 w-full h-full object-cover object-[center_right] pointer-events-none select-none transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
          {/* Soft daylight gradient overlay on the left to ensure 100% crisp text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/40 to-transparent pointer-events-none max-w-[68%]" />

          {/* Real React & CSS Typography Layer */}
          <div className="relative z-10 flex items-start justify-between h-full">
            {/* Left Content Column */}
            <div className="flex flex-col justify-between h-full max-w-[65%] sm:max-w-[62%]">
              <div>
                {/* Greeting Badge */}
                <div className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-slate-800 mb-1">
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[10px] shadow-xs">
                    ☀️
                  </span>
                  <span>Good {greetingTime}, {settings?.userName || 'Rahul'}!</span>
                  <span className="inline-block animate-bounce text-sm">👋</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-[23px] xl:text-[25px] font-black text-[#0f172a] tracking-tight leading-[1.18]">
                  Discipline today,<br />
                  Success tomorrow!
                </h1>

                {/* Motivational Subtitle */}
                <p className="text-[11px] sm:text-xs text-slate-600 font-semibold mt-1">
                  Keep going, you're doing great!
                </p>
              </div>

              {/* Goal Pill Button & Fresh Data Button in React + CSS */}
              <div className="mt-2 sm:mt-2.5 flex items-center gap-2 flex-wrap">
                <button
                  onClick={onOpenNewGoal || (() => setActivePage('goals'))}
                  className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/95 hover:bg-white text-xs font-black text-slate-800 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 group/pill cursor-pointer"
                  title={activeGoal ? `Target: ${activeGoal.name || activeGoal.title}` : "Set Your Goal"}
                >
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-rose-500 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  </span>
                  <span className="text-[#2563eb] font-extrabold tracking-tight truncate max-w-[130px] sm:max-w-[160px]">
                    {activeGoal ? (activeGoal.name || activeGoal.title) : "+ Add Goal"}
                  </span>
                  <ChevronRight size={13} className="text-slate-400 group-hover/pill:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => setIsClearModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-full bg-white/90 hover:bg-white text-rose-600 hover:text-rose-700 text-xs font-bold border border-rose-200/80 shadow-xs hover:shadow transition cursor-pointer"
                  title="Clear all data from the dashboard to start fresh"
                >
                  <Trash2 size={12} />
                  <span>Fresh (0 Data)</span>
                </button>
              </div>
            </div>

            {/* Right Quote Column: Elegant Script Typography */}
            <div className="hidden sm:flex flex-col items-end text-right pr-1 pt-0.5 pointer-events-none select-none">
              <span className="font-script text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-slate-800 leading-none">
                " Better
              </span>
              <span className="font-script text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-slate-800 leading-tight">
                Version of
              </span>
              <span className="font-script text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-slate-800 leading-none">
                Yourself "
              </span>
            </div>
          </div>
        </div>

        {/* 4 Quick Action Buttons with Live Animations & Unique Transitions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:w-[43%] gap-2.5 sm:gap-3 items-stretch">
          {/* 1. Start Study (Live interactive & animated) */}
          <button
            onClick={() => setActivePage('timer')}
            className="relative overflow-hidden rounded-2xl sm:rounded-[22px] p-3 sm:p-3.5 xl:p-4 bg-gradient-to-b from-[#3465fd] via-[#2a5bf8] to-[#1f4fed] text-white flex flex-col justify-between items-start text-left shadow-sm hover:shadow-[0_14px_30px_-6px_rgba(37,99,235,0.45)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 group min-h-[125px] sm:min-h-[135px] border border-blue-400/20"
          >
            {/* Ambient background glow & light beam sweep */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-cyan-400/20 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Icon Header with Live Pulse */}
            <div className="relative z-10 w-full flex items-center justify-between">
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#2554ee] shadow-sm ring-4 ring-white/25 group-hover:ring-white/40 group-hover:scale-110 transition-all duration-300">
                  <Play size={16} className={`fill-[#2554ee] translate-x-0.5 ${isRunning ? 'animate-pulse' : ''}`} />
                </div>
                {isRunning && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white" />
                  </span>
                )}
              </div>

              {isRunning && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-emerald-400/30 text-white border border-emerald-300/40 animate-pulse">
                  {formattedNetStudyTime || 'ACTIVE'}
                </span>
              )}
            </div>

            {/* Title & Subtitle */}
            <div className="relative z-10 w-full">
              <span className="flex items-center justify-between font-black text-xs sm:text-sm xl:text-[15px] text-white leading-tight">
                <span>{isRunning ? 'Study Active' : 'Start Study'}</span>
                <span className="text-[11px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300">→</span>
              </span>
              <span className="block text-[10px] sm:text-[11px] text-white/85 mt-0.5 font-normal truncate">
                {isRunning ? 'Session in progress' : "Let's learn today!"}
              </span>
            </div>
          </button>

          {/* 2. Add Subject */}
          <button
            onClick={onOpenNewSubject}
            className="relative overflow-hidden rounded-2xl sm:rounded-[22px] p-3 sm:p-3.5 xl:p-4 bg-gradient-to-b from-[#00b970] via-[#00ab67] to-[#009457] text-white flex flex-col justify-between items-start text-left shadow-sm hover:shadow-[0_14px_30px_-6px_rgba(0,185,112,0.45)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 group min-h-[125px] sm:min-h-[135px] border border-emerald-300/20"
          >
            {/* Ambient background glow & light beam sweep */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-emerald-300/25 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#00a866] shadow-sm ring-4 ring-white/25 group-hover:ring-white/40 group-hover:scale-110 transition-all duration-300">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#00a866] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path d="M9 15L15 9" />
                <path d="M10 9h5v5" />
              </svg>
            </div>

            <div className="relative z-10 w-full">
              <span className="flex items-center justify-between font-black text-xs sm:text-sm xl:text-[15px] text-white leading-tight">
                <span>Add Subject</span>
                <span className="text-[11px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300">→</span>
              </span>
              <span className="block text-[10px] sm:text-[11px] text-white/85 mt-0.5 font-normal truncate">
                Manage your subjects
              </span>
            </div>
          </button>

          {/* 3. Add Topic */}
          <button
            onClick={onOpenNewTopic}
            className="relative overflow-hidden rounded-2xl sm:rounded-[22px] p-3 sm:p-3.5 xl:p-4 bg-gradient-to-b from-[#ff3c69] via-[#f42e5d] to-[#e41e4c] text-white flex flex-col justify-between items-start text-left shadow-sm hover:shadow-[0_14px_30px_-6px_rgba(244,63,94,0.45)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 group min-h-[125px] sm:min-h-[135px] border border-rose-300/20"
          >
            {/* Ambient background glow & light beam sweep */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-rose-300/25 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#f42e5d] shadow-sm ring-4 ring-white/25 group-hover:ring-white/40 group-hover:scale-110 transition-all duration-300">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#f42e5d] group-hover:rotate-90 transition-transform duration-500" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>

            <div className="relative z-10 w-full">
              <span className="flex items-center justify-between font-black text-xs sm:text-sm xl:text-[15px] text-white leading-tight">
                <span>Add Topic</span>
                <span className="text-[11px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300">→</span>
              </span>
              <span className="block text-[10px] sm:text-[11px] text-white/85 mt-0.5 font-normal truncate">
                Organize topics
              </span>
            </div>
          </button>

          {/* 4. Set Schedule */}
          <button
            onClick={onOpenSchedule}
            className="relative overflow-hidden rounded-2xl sm:rounded-[22px] p-3 sm:p-3.5 xl:p-4 bg-gradient-to-b from-[#ff9900] via-[#f48900] to-[#e47900] text-white flex flex-col justify-between items-start text-left shadow-sm hover:shadow-[0_14px_30px_-6px_rgba(245,158,11,0.45)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 group min-h-[125px] sm:min-h-[135px] border border-amber-300/20"
          >
            {/* Ambient background glow & light beam sweep */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-amber-300/25 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#ff9900] shadow-sm ring-4 ring-white/25 group-hover:ring-white/40 group-hover:scale-110 transition-all duration-300">
              <Calendar size={18} strokeWidth={2.4} className="group-hover:-rotate-12 transition-transform duration-300" />
            </div>

            <div className="relative z-10 w-full">
              <span className="flex items-center justify-between font-black text-xs sm:text-sm xl:text-[15px] text-white leading-tight">
                <span>Set Schedule</span>
                <span className="text-[11px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300">→</span>
              </span>
              <span className="block text-[10px] sm:text-[11px] text-white/85 mt-0.5 font-normal truncate">
                Plan your time
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN BODY: Left Section (8 cols on xl) + Right Column (4 cols on xl)
          Responsive System:
          - Screens < xl (Mobile, Tablet, Laptop < 1280px):
            Left Section takes 100% full width, letting all 4 Metric and 4 Status cards sit in one row without clipping!
            Right Section items (To-Do List, Reminders, Activity) arrange neatly below in a 3-column row.
          - Screens >= xl (Desktop >= 1280px):
            2-Column side-by-side layout: Left Section (8 cols) + Right Column (4 cols).
      ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        {/* ================= LEFT SECTION (Cols 1 to 8 on xl, full width on <xl) ================= */}
        <div className="xl:col-span-8 2xl:col-span-8 space-y-3.5 sm:space-y-4">
          {/* Row 2: 4 Metric Cards with Unique Icons, Specular Light Sweeps & Live Transitions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* 1. Total Study Time (12h 45m) */}
            <div
              onClick={() => setActivePage('history')}
              className="relative overflow-hidden glass-card p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between min-h-[148px] sm:min-h-[155px] group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-6px_rgba(37,99,235,0.25)] border border-slate-200/80 dark:border-slate-800"
            >
              {/* Specular Light Sweep & Ambient Orb */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              <div>
                {/* Header: Unique Icon + Top-Right Trend Pill */}
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 ring-2 ring-blue-400/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Clock size={18} className="group-hover:rotate-180 transition-transform duration-700 ease-out" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 border border-white dark:border-dark-900 animate-pulse" />
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs group-hover:border-blue-400 transition-colors">
                    <span>{subjects.length} subjects</span>
                    <ArrowUpRight size={11} className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Study Time
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 mono-number tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {formatSecondsToShort(displayTotalSeconds)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                  <span>{displayTotalSeconds > 0 ? `${formatHoursToShort(displayTotalSeconds / 3600)} recorded overall` : 'Start studying to log hours'}</span>
                </p>
              </div>

              {/* Progress Bar with Live Shimmer & Hover Expansion */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                    style={{ width: `${totalProgressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Target: {formatHoursToShort(totalTargetHours)}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 mono-number">{totalProgressPercent}%</span>
                </div>
              </div>
            </div>

            {/* 2. Today's Study Time */}
            <div
              onClick={() => setActivePage('timer')}
              className="relative overflow-hidden glass-card p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between min-h-[148px] sm:min-h-[155px] group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-6px_rgba(16,185,129,0.25)] border border-slate-200/80 dark:border-slate-800"
            >
              {/* Specular Light Sweep & Ambient Orb */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              <div>
                {/* Header: Unique Icon with Live Pulse + Top-Right Status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-green-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                      <Zap size={18} className="fill-white group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-dark-900" />
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs group-hover:border-emerald-400 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>TODAY</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Today's Study Time
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 mono-number tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {formatSecondsToShort(todayStudySeconds)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Target: {formatHoursToShort(todayPlannedHours)} ({todayProgressPercent}%)
                </p>
              </div>

              {/* Progress Bar with Live Shimmer & Hover Expansion */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                    style={{ width: `${todayProgressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Goal: {formatHoursToShort(todayPlannedHours)}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-number">{todayProgressPercent}%</span>
                </div>
              </div>
            </div>

            {/* 3. Weekly Study Time */}
            <div
              onClick={() => setActivePage('targets')}
              className="relative overflow-hidden glass-card p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between min-h-[148px] sm:min-h-[155px] group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-6px_rgba(139,92,246,0.25)] border border-slate-200/80 dark:border-slate-800"
            >
              {/* Specular Light Sweep & Ambient Orb */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-purple-500/10 dark:bg-purple-500/15 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              <div>
                {/* Header: Unique Calendar Icon + Top-Right Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25 ring-2 ring-purple-400/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Calendar size={18} className="group-hover:-rotate-12 transition-transform duration-300" />
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shadow-2xs group-hover:border-purple-400 transition-colors">
                    <span>7 DAYS</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Weekly Study Time
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 mono-number tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {formatSecondsToShort(displayWeeklySeconds)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Target: {formatHoursToShort(weeklyTargetHours)} ({weeklyProgressPercent}%)
                </p>
              </div>

              {/* Progress Bar with Live Shimmer & Hover Expansion */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                    style={{ width: `${weeklyProgressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Goal: {formatHoursToShort(weeklyTargetHours)}</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 mono-number">{weeklyProgressPercent}%</span>
                </div>
              </div>
            </div>

            {/* 4. Monthly Study Time */}
            <div
              onClick={() => setActivePage('analytics')}
              className="relative overflow-hidden glass-card p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between min-h-[148px] sm:min-h-[155px] group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-6px_rgba(244,63,94,0.25)] border border-slate-200/80 dark:border-slate-800"
            >
              {/* Specular Light Sweep & Ambient Orb */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              <div>
                {/* Header: Trending Rocket Icon + Top-Right Month Tag */}
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 ring-2 ring-rose-400/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                      <TrendingUp size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-white dark:border-dark-900" />
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 shadow-2xs group-hover:border-rose-400 transition-colors">
                    <span>{currentMonthName}</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Monthly Study Time
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 mono-number tracking-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {formatSecondsToShort(displayMonthlySeconds)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Target: {formatHoursToShort(monthlyTargetHours)} ({monthlyProgressPercent}%)
                </p>
              </div>

              {/* Progress Bar with Live Shimmer & Hover Expansion */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                    style={{ width: `${monthlyProgressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Monthly Target: {formatHoursToShort(monthlyTargetHours)}</span>
                  <span className="font-bold text-rose-500 mono-number">{monthlyProgressPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: 4 Status Cards with Live Animations & Unique Themed Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* 1. Today's Attendance */}
            <div
              onClick={() => setActivePage('attendance')}
              className={`relative overflow-hidden glass-card border-l-4 ${isPresent ? 'border-l-emerald-500 hover:border-l-emerald-400' : 'border-l-rose-500 hover:border-l-rose-400'} p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between min-h-[148px] sm:min-h-[155px] group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-6px_rgba(244,63,94,0.22)]`}
            >
              {/* Specular Light Sweep & Ambient Orb */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
              <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full ${isPresent ? 'bg-emerald-500/10 dark:bg-emerald-500/15' : 'bg-rose-500/10 dark:bg-rose-500/15'} blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr ${isPresent ? 'from-emerald-500 via-teal-600 to-green-600' : 'from-rose-500 via-red-600 to-pink-600'} text-white flex items-center justify-center shadow-md shadow-rose-500/25 ring-2 ring-rose-400/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <UserCheck size={16} />
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isPresent ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60'} border shadow-2xs transition-colors`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
                    <span>{isPresent ? '✓ PRESENT' : '✕ ABSENT'}</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Today's Attendance
                </span>
                <div className={`text-xl sm:text-2xl font-black mt-0.5 tracking-tight ${isPresent ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isPresent ? 'PRESENT' : 'ABSENT'}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Required: {minAttendanceMinutes}m ({attendanceLoggedMinutes}m logged)
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className={`bg-gradient-to-r ${isPresent ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-red-600'} h-full rounded-full transition-all duration-500 relative overflow-hidden`}
                    style={{ width: `${attendanceProgressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Threshold: {minAttendanceMinutes}m</span>
                  <span className={`font-bold mono-number ${isPresent ? 'text-emerald-600' : 'text-rose-500'}`}>{attendanceProgressPercent}%</span>
                </div>
              </div>
            </div>

            {/* 2. Completed Topics */}
            <div
              onClick={() => setActivePage('topics')}
              className="relative overflow-hidden glass-card border-l-4 border-l-emerald-500 hover:border-l-emerald-400 p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between min-h-[148px] sm:min-h-[155px] group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-6px_rgba(16,185,129,0.22)]"
            >
              {/* Specular Light Sweep & Ambient Orb */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-600 to-green-600 text-white flex items-center justify-center shadow-md shadow-teal-500/25 ring-2 ring-teal-400/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                      <CheckCircle2 size={16} />
                    </div>
                    {completedTopics > 0 && (
                      <Sparkles size={11} className="absolute -top-1 -right-1 text-amber-400 animate-bounce" />
                    )}
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs group-hover:border-emerald-400 transition-colors">
                    <span>{topicProgressPercent}% DONE</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Completed Topics
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 mono-number tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {completedTopics} / {topics.length}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {topicProgressPercent}% completed
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                    style={{ width: `${topicProgressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Completed</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-number">{topicProgressPercent}%</span>
                </div>
              </div>
            </div>

            {/* 3. Pending Topics */}
            <div
              onClick={() => setActivePage('topics')}
              className="relative overflow-hidden glass-card border-l-4 border-l-rose-400 hover:border-l-rose-500 p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between min-h-[148px] sm:min-h-[155px] group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-6px_rgba(244,63,94,0.22)]"
            >
              {/* Specular Light Sweep & Ambient Orb */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 ring-2 ring-amber-400/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <ListTodo size={16} />
                    </div>
                    {pendingTopics > 0 && (
                      <Flame size={11} className="absolute -top-1 -right-1 text-rose-500 animate-pulse" />
                    )}
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 shadow-2xs group-hover:border-rose-400 transition-colors">
                    <span>{pendingTopics} LEFT</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pending Topics
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 mono-number tracking-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {pendingTopics}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {pendingTopics > 0 ? 'Remaining syllabus' : topics.length > 0 ? 'All topics completed! 🎉' : 'No topics added yet'}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-rose-400 to-rose-500 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                    style={{ width: `${topics.length > 0 ? Math.round((pendingTopics / topics.length) * 100) : 0}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Pending</span>
                  <span className="font-bold text-rose-500 mono-number">{topics.length > 0 ? Math.round((pendingTopics / topics.length) * 100) : 0}%</span>
                </div>
              </div>
            </div>

            {/* 4. Current Goal */}
            <div
              onClick={onOpenNewGoal || (() => setActivePage('goals'))}
              className="relative overflow-hidden glass-card border-l-4 border-l-purple-500 hover:border-l-purple-400 p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between min-h-[148px] sm:min-h-[155px] group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-6px_rgba(139,92,246,0.25)]"
            >
              {/* Specular Light Sweep & Ambient Orb */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-purple-500/10 dark:bg-purple-500/15 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-purple-500/25 ring-2 ring-purple-400/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                      <Trophy size={16} />
                    </div>
                    <span className="absolute -top-1 -right-1 text-amber-300 text-[10px] font-black">★</span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 shadow-2xs group-hover:border-purple-400 transition-colors">
                    <span>{activeGoal ? `GOAL ${goalProgressPercent}%` : 'GOAL 0%'}</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Goal
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate tracking-tight flex items-center justify-between">
                  <span className="truncate">{activeGoal ? (activeGoal.name || activeGoal.title) : 'No Goal Set'}</span>
                  <span className="text-xs text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">→</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {activeGoal ? `${activeGoal.targetHours || 0}h target` : 'Click to add a goal'}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                    style={{ width: `${goalProgressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>{activeGoal ? (activeGoal.category || 'Target') : 'No Goal'}</span>
                  <span className="font-bold text-purple-600 mono-number">{goalProgressPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Today's Study Progress & Schedule matching 60% gauge */}
          <div className="glass-card p-4 sm:p-5">
            <div className="flex items-start sm:items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                  <LineChart size={17} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    Today's Study Progress & Schedule
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Planned vs actual study performance for {formatFriendlyDate(todayStr)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  todayProgressPercent >= 100
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : todayStudySeconds > 0
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {todayProgressPercent >= 100 ? 'COMPLETED' : todayStudySeconds > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
                </span>
                <button
                  onClick={() => setActivePage('timetable')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <span>View Details</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Circular Gauge + 4 Dynamic Stat Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mt-4">
              {/* Left Circular Ring - Clickable to start timer */}
              <div
                onClick={() => setActivePage('timer')}
                className="sm:col-span-3 flex flex-col items-center justify-center py-1 cursor-pointer group/gauge hover:scale-105 transition-transform"
                title="Click to start study session"
              >
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f1f5f9"
                      strokeWidth="9"
                      fill="transparent"
                      className="dark:stroke-slate-800"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#3b82f6"
                      strokeWidth="9"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * todayProgressPercent) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none mono-number group-hover/gauge:text-blue-600 transition-colors">
                      {todayProgressPercent}%
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 4 Stat Chips - Fully Clickable */}
              <div className="sm:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Planned Hours */}
                <div
                  onClick={onOpenTomorrowTarget || (() => setActivePage('targets'))}
                  className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center text-center cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs transition group"
                  title="Click to set target hours"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <Clock size={13} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Planned Hours</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 mono-number group-hover:text-indigo-600 transition-colors">
                    {formatHoursToShort(todayPlannedHours)}
                  </span>
                </div>

                {/* 2. Completed */}
                <div
                  onClick={() => setActivePage('timer')}
                  className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center text-center cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xs transition group"
                  title="Click to view timer"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <CheckCircle2 size={13} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Completed</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 mono-number group-hover:text-emerald-600 transition-colors">
                    {formatSecondsToShort(todayStudySeconds)}
                  </span>
                </div>

                {/* 3. Remaining */}
                <div
                  onClick={() => setActivePage('timer')}
                  className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center text-center cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-xs transition group"
                  title="Click to continue studying"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <Hourglass size={13} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Remaining</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 mono-number group-hover:text-amber-600 transition-colors">
                    {formatHoursToShort(todayRemainingHours)}
                  </span>
                </div>

                {/* 4. Break Time */}
                <div
                  onClick={() => setActivePage('focus')}
                  className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center text-center cursor-pointer hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-xs transition group"
                  title="Click for Focus & Break mode"
                >
                  <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <Coffee size={13} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Break Time</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 mono-number group-hover:text-rose-500 transition-colors">
                    {formatSecondsToShort(todayBreakSeconds)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Subject's Wise Progress (~65%) + Weekly Study Activity (~35%) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
            {/* Subject's Wise Progress (8 cols on md) */}
            <div className="md:col-span-7 lg:col-span-8 glass-card p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                      <Layers size={14} />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      Subject's Wise Progress
                    </h4>
                  </div>
                  <button
                    onClick={() => setActivePage('subjects')}
                    className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>View All</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* Dynamic Subject Chips or Clean Empty State */}
                {subjects.length === 0 ? (
                  <div className="py-7 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-2">
                      <Layers size={18} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">No subjects added yet</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 mb-2.5">Add subjects to track their syllabus progress</span>
                    <button
                      onClick={onOpenNewSubject}
                      className="px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                    >
                      + Add Subject
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {subjects.slice(0, 4).map((sub) => {
                      const subTopics = topics.filter((t) => t.subjectId === sub.id);
                      const completedSubTopics = subTopics.filter((t) => t.status === 'Completed' || t.completed).length;
                      const subProgress = subTopics.length > 0 ? Math.round((completedSubTopics / subTopics.length) * 100) : 0;
                      const initials = (sub.code || sub.name || 'S').slice(0, 3).toUpperCase();
                      const color = sub.color || '#8b5cf6';

                      return (
                        <div
                          key={sub.id}
                          onClick={() => setActivePage('subjects')}
                          className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition group"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span
                              className="w-6 h-6 rounded-md text-white font-black text-[10px] flex items-center justify-center shadow-2xs"
                              style={{ backgroundColor: color }}
                            >
                              {initials}
                            </span>
                            <span className="font-bold text-[11px] text-purple-600 dark:text-purple-400 mono-number">
                              {subProgress}%
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate block mb-2" title={sub.name}>
                            {sub.name}
                          </span>
                          <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${subProgress}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Micro feature pills row inside Subject Wise Progress */}
                <div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span onClick={() => setActivePage('timer')} className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                    <Zap size={13} className="text-blue-500" /> Fast Learning
                  </span>
                  <span onClick={() => setActivePage('focus')} className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                    <Target size={13} className="text-purple-500" /> Better Focus
                  </span>
                  <span onClick={() => setActivePage('analytics')} className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                    <LineChart size={13} className="text-emerald-500" /> Track Progress
                  </span>
                  <span onClick={() => setActivePage('goals')} className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                    <Trophy size={13} className="text-amber-500" /> Achieve Goals
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Study Activity Bar Chart */}
            <div className="md:col-span-5 lg:col-span-4 glass-card p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div
                  onClick={() => setActivePage('analytics')}
                  className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-2 cursor-pointer group"
                  title="View detailed Analytics"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <LineChart size={14} />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                      Weekly Study Activity
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 mono-number group-hover:text-slate-600 transition-colors">
                    {formatSecondsToShort(displayWeeklySeconds)} total
                  </span>
                </div>

                {/* Minimalist Bar Chart */}
                <div className="flex items-end h-24 pt-1 pb-1 relative">
                  {/* Y-axis labels */}
                  <div className="flex flex-col justify-between h-full text-[9px] text-slate-400 pr-1.5 shrink-0 select-none pb-4 mono-number">
                    <span>{maxChartHours}h</span>
                    <span>{Math.round(maxChartHours * 0.75)}h</span>
                    <span>{Math.round(maxChartHours * 0.5)}h</span>
                    <span>{Math.round(maxChartHours * 0.25)}h</span>
                    <span>0</span>
                  </div>

                  {/* Bars container */}
                  <div className="flex-1 flex items-end justify-between h-full border-b border-slate-100 dark:border-slate-800 pb-4 pl-1 gap-1.5">
                    {weekChartData.map((item, idx) => {
                      const barPercent = item.h > 0 ? Math.min(100, Math.max(12, (item.h / maxChartHours) * 100)) : 4;
                      return (
                        <div
                          key={idx}
                          onClick={() => setActivePage('history')}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                          title={`${item.day}: ${item.h}h (${formatSecondsToShort(item.seconds)}) - Click to view history`}
                        >
                          <div
                            className={`w-full max-w-[18px] rounded-t-md transition-all group-hover:scale-y-105 origin-bottom ${
                              item.isToday
                                ? 'bg-[#5b64e8] shadow-sm shadow-indigo-500/30'
                                : item.h > 0
                                ? 'bg-blue-400 dark:bg-blue-600 hover:bg-blue-500'
                                : 'bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300'
                            }`}
                            style={{ height: `${barPercent}%` }}
                          />
                          <span className={`absolute -bottom-4 text-[9px] ${item.isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Potted plant motivation banner */}
                <div
                  onClick={() => setActivePage('focus')}
                  className="mt-5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition group"
                  title="Click to enter Focus Mode"
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                    <span className="text-rose-500">❤️</span>
                    <span>"Progress, not perfection."</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                    🪴
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (Cols 9 to 12 on xl, 3-cols row on < xl) ================= */}
        <div className="xl:col-span-4 2xl:col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-3.5 sm:gap-4 items-start">
            {/* 1. Today's To-Do List */}
            <div className="glass-card p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      Today's To-Do List
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {formatFriendlyDate(todayStr)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onOpenTomorrowTarget}
                  className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Add</span>
                </button>
              </div>

              {/* Todo Items */}
              <div className="space-y-2">
                {todoItems.length === 0 ? (
                  <div className="py-6 text-center flex flex-col items-center">
                    <p className="text-xs text-slate-400 font-medium">No targets planned yet.</p>
                    <button
                      onClick={onOpenTomorrowTarget}
                      className="mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      + Add a target
                    </button>
                  </div>
                ) : (
                  todoItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => toggleTomorrowTarget(item.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer shrink-0 ${
                            item.completed || item.status === 'Completed'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-dark-900 hover:border-blue-400'
                          }`}
                        >
                          {(item.completed || item.status === 'Completed') && <Check size={11} strokeWidth={3} />}
                        </button>
                        <div
                          className="min-w-0 cursor-pointer flex-1"
                          onClick={() => toggleTomorrowTarget(item.id)}
                          title="Click to toggle completion"
                        >
                          <span
                            className={`text-xs font-semibold block truncate ${
                              item.completed || item.status === 'Completed'
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-slate-200 hover:text-blue-600'
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-400 font-medium mono-number">
                          {item.time || item.startTime || ''}
                        </span>
                        <button
                          onClick={() => {
                            startStudy({
                              preparationId: item.preparationId,
                              subjectId: item.subjectId,
                              topicId: item.topicId,
                            });
                            setActivePage('timer');
                          }}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 hover:opacity-80 transition cursor-pointer"
                          title="Study this target in timer"
                        >
                          {item.category || item.tag || 'Study'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTomorrowTarget(item.id);
                          }}
                          className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Delete target"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Quick Reminders */}
            <div className="glass-card p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                    <Bell size={15} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    Quick Reminders
                  </h4>
                </div>

                {notifications && notifications.length > 0 ? (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                ) : (
                  <button
                    onClick={() => setActivePage('notifications')}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                )}
              </div>

              {/* Reminders List */}
              <div className="space-y-2.5">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setActivePage('notifications')}
                      className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center shrink-0">
                          <Bell size={13} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-rose-600 transition-colors">
                            {n.title || n.message}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium truncate">
                            {n.message || 'Reminder'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
                    </div>
                  ))
                ) : (
                  <>
                    <div
                      onClick={() => setActivePage('timer')}
                      className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
                          <Clock size={14} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block group-hover:text-blue-600 transition-colors">
                            Pomodoro Focus
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            25 min study → 5 min break
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
                    </div>

                    <div
                      onClick={() => setActivePage('targets')}
                      className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center shrink-0">
                          <Target size={14} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block group-hover:text-blue-600 transition-colors">
                            Daily Study Target
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            Target: {formatHoursToShort(todayPlannedHours)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. Recent Activity */}
            <div className="glass-card p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                    <Clock size={15} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    Recent Activity
                  </h4>
                </div>

                <button
                  onClick={() => setActivePage('history')}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {/* Recent Activity Items */}
              <div className="space-y-2.5">
                {sessions.length === 0 ? (
                  <div className="py-6 text-center flex flex-col items-center">
                    <p className="text-xs text-slate-400 font-medium">No recent activity yet.</p>
                    <span className="text-[11px] text-slate-400 mt-0.5">Start a study session to record your progress</span>
                  </div>
                ) : (
                  sessions.slice(0, 4).map((sess) => {
                    const sub = subjects.find((s) => s.id === sess.subjectId);
                    const top = topics.find((t) => t.id === sess.topicId);
                    return (
                      <div
                        key={sess.id}
                        onClick={() => {
                          if (sess.subjectId) {
                            startStudy({ subjectId: sess.subjectId, topicId: sess.topicId });
                            setActivePage('timer');
                          } else {
                            setActivePage('history');
                          }
                        }}
                        className="flex items-start justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition group cursor-pointer"
                        title="Click to resume study or view history"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 size={13} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight truncate group-hover:text-blue-600 transition-colors">
                              {sub?.name || 'Study session'} {top ? `– ${top.name}` : ''}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                              Duration: {formatSecondsToShort(sess.actualStudyDuration || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-medium mono-number">
                            {sess.date === todayStr ? 'Today' : sess.date}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(sess.id);
                            }}
                            className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete session"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog to Clear All Data (Fresh 0 Slate) */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={clearAllData}
        title="Clear All Dashboard Data?"
        message="This will reset all study sessions, subjects, topics, and targets back to 0. You can start completely fresh with your own real data."
        confirmText="Yes, Clear Everything"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
}
export default DashboardPage;
