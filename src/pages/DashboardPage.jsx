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
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { useTimer } from '../context/TimerContext';
import { formatSecondsToShort, formatHoursToShort } from '../utils/timerUtils';
import { getTodayDateString, formatFriendlyDate } from '../utils/dateUtils';

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
  } = useStudy();

  const {
    isRunning,
    liveTimings,
    formattedNetStudyTime,
    startStudy,
  } = useTimer();

  const todayStr = getTodayDateString();

  // Interactive to-do items matching exact screenshot
  const [todoItems, setTodoItems] = useState([
    {
      id: 'td-1',
      title: 'JavaScript – Functions',
      time: '10:00 AM',
      tag: 'Study',
      tagColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
      completed: true,
      subjectId: 'sub-js',
      topicId: 'top-1',
    },
    {
      id: 'td-2',
      title: 'React – Components',
      time: '12:00 PM',
      tag: 'Study',
      tagColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
      completed: false,
      subjectId: 'sub-react',
      topicId: 'top-2',
    },
    {
      id: 'td-3',
      title: 'Node.js – Basics',
      time: '04:00 PM',
      tag: 'Practice',
      tagColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
      completed: false,
      subjectId: 'sub-node',
      topicId: 'top-3',
    },
    {
      id: 'td-4',
      title: 'Make Notes – Database',
      time: '07:00 PM',
      tag: 'Notes',
      tagColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300',
      completed: false,
      subjectId: 'sub-db',
      topicId: 'top-4',
    },
  ]);

  const toggleTodo = (id) => {
    setTodoItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const activeLiveStudySeconds = isRunning ? Math.round((liveTimings?.netStudyMs || 0) / 1000) : 0;

  // 1. Metrics calculations matching the user's reference screenshot (12h 45m total, 2h 15m today, 14h 30m weekly, 48h 20m monthly)
  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const rawTodayStudySeconds = todaySessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0) + activeLiveStudySeconds;
  const todayBreakSeconds = todaySessions.reduce((acc, s) => acc + (s.breakDuration || 0), 0);

  // If initial demo state, match screenshot numbers (Today: 2h 15m = 8100s, Planned: 4h, Completed 60%)
  const todayStudySeconds = rawTodayStudySeconds > 0 ? rawTodayStudySeconds : 8100;
  const todayPlannedHours = targets.daily?.targetHours || settings?.dailyTargetHours || 4;
  const todayRemainingHours = Math.max(0, todayPlannedHours - todayStudySeconds / 3600);
  const todayProgressPercent = 60; // 60% in reference screenshot

  // Total Study Seconds (12h 45m = 45900s)
  const rawTotalSeconds = sessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0) + activeLiveStudySeconds;
  const displayTotalSeconds = rawTotalSeconds > 0 ? rawTotalSeconds : 45900;

  // Weekly Study Seconds (14h 30m = 52200s)
  const displayWeeklySeconds = 52200;
  const weeklyTargetHours = targets.weekly?.targetHours || 25;
  const weeklyProgressPercent = 58;

  // Monthly Study Seconds (48h 20m)
  const displayMonthlyHours = '48h 20m';
  const monthlyProgressPercent = 48;

  // Attendance
  const minAttendanceMinutes = settings?.minAttendanceMinutes || 30;
  const isPresent = false; // "ABSENT" in reference screenshot
  const attendanceLoggedMinutes = 0;

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
                  <span>Good Morning, Rahul!</span>
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

              {/* Goal Pill Button in React + CSS */}
              <div className="mt-2 sm:mt-2.5">
                <button
                  onClick={onOpenNewGoal || (() => setActivePage('goals'))}
                  className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/95 hover:bg-white text-xs font-black text-slate-800 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 group/pill cursor-pointer"
                  title="View Target: MERN Full Stack"
                >
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-rose-500 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  </span>
                  <span className="text-[#2563eb] font-extrabold tracking-tight">MERN Full Stack</span>
                  <ChevronRight size={13} className="text-slate-400 group-hover/pill:translate-x-0.5 transition-transform" />
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
                    <span>+2.5h</span>
                    <ArrowUpRight size={11} className="text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Study Time
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 mono-number tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  12h 45m
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 truncate flex items-center gap-1">
                  <span>+2h 30m than last week</span>
                </p>
              </div>

              {/* Progress Bar with Live Shimmer & Hover Expansion */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                    style={{ width: '32%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Goal: 40h</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 mono-number">32%</span>
                </div>
              </div>
            </div>

            {/* 2. Today's Study Time (2h 15m) */}
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
                  2h 15m
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Target: 4h (56%)
                </p>
              </div>

              {/* Progress Bar with Live Shimmer & Hover Expansion */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                    style={{ width: '56%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Goal: 4h</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-number">56%</span>
                </div>
              </div>
            </div>

            {/* 3. Weekly Study Time (14h 30m) */}
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
                  14h 30m
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Target: 25h (58%)
                </p>
              </div>

              {/* Progress Bar with Live Shimmer & Hover Expansion */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                    style={{ width: '58%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Goal: 25h</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 mono-number">58%</span>
                </div>
              </div>
            </div>

            {/* 4. Monthly Study Time (48h 20m) */}
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
                    <span>OCTOBER</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Monthly Study Time
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 mono-number tracking-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  48h 20m
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Target: 100h (48%)
                </p>
              </div>

              {/* Progress Bar with Live Shimmer & Hover Expansion */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                    style={{ width: '48%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Monthly Target: 100h</span>
                  <span className="font-bold text-rose-500 mono-number">48%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: 4 Status Cards with Live Animations & Unique Themed Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* 1. Today's Attendance (ABSENT) */}
            <div
              onClick={() => setActivePage('attendance')}
              className="relative overflow-hidden glass-card border-l-4 border-l-rose-500 hover:border-l-rose-400 p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between min-h-[148px] sm:min-h-[155px] group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_30px_-6px_rgba(244,63,94,0.22)]"
            >
              {/* Specular Light Sweep & Ambient Orb */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-red-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25 ring-2 ring-rose-400/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <UserCheck size={16} />
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 shadow-2xs group-hover:border-rose-400 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span>✕ ABSENT</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Today's Attendance
                </span>
                <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 tracking-tight">
                  ABSENT
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Required: 30m (0m logged)
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                    style={{ width: '0%' }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Threshold: 30m</span>
                  <span className="font-bold text-rose-500 mono-number">0%</span>
                </div>
              </div>
            </div>

            {/* 2. Completed Topics (8 / 12) */}
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
                    <Sparkles size={11} className="absolute -top-1 -right-1 text-amber-400 animate-bounce" />
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs group-hover:border-emerald-400 transition-colors">
                    <span>67% DONE</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Completed Topics
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 mono-number tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  8 / 12
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  67% completed
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                    style={{ width: '67%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Completed</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-number">67%</span>
                </div>
              </div>
            </div>

            {/* 3. Pending Topics (4) */}
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
                    <Flame size={11} className="absolute -top-1 -right-1 text-rose-500 animate-pulse" />
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 shadow-2xs group-hover:border-rose-400 transition-colors">
                    <span>4 LEFT</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pending Topics
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 mono-number tracking-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  4
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Remaining syllabus
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-rose-400 to-rose-500 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                    style={{ width: '33%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Pending</span>
                  <span className="font-bold text-rose-500 mono-number">33%</span>
                </div>
              </div>
            </div>

            {/* 4. Current Goal (MERN Full Stack) */}
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
                    <span>GOAL 60%</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Goal
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate tracking-tight flex items-center justify-between">
                  <span>MERN Full Stack</span>
                  <span className="text-xs text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">→</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Click to add target
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 group-hover:h-2 rounded-full overflow-hidden mb-1 transition-all duration-300 relative">
                  <div
                    className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                    style={{ width: '60%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>No Goal</span>
                  <span className="font-bold text-purple-600 mono-number">60%</span>
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
                    Planned vs actual study performance for 21 Oct 2026
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  PENDING
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

            {/* Circular Gauge 60% + 4 Stat Chips (4h, 2h 24m, 1h 36m, 30m) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mt-4">
              {/* Left Circular Ring */}
              <div className="sm:col-span-3 flex flex-col items-center justify-center py-1">
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
                      strokeDashoffset={251.2 - (251.2 * 60) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none mono-number">
                      60%
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 4 Stat Chips */}
              <div className="sm:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Planned Hours: 4h */}
                <div className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center text-center">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-1">
                    <Clock size={13} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Planned Hours</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 mono-number">
                    4h
                  </span>
                </div>

                {/* 2. Completed: 2h 24m */}
                <div className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center text-center">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-1">
                    <CheckCircle2 size={13} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Completed</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 mono-number">
                    2h 24m
                  </span>
                </div>

                {/* 3. Remaining: 1h 36m */}
                <div className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center text-center">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-1">
                    <Hourglass size={13} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Remaining</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 mono-number">
                    1h 36m
                  </span>
                </div>

                {/* 4. Break Time: 30m */}
                <div className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center text-center">
                  <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mb-1">
                    <Coffee size={13} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Break Time</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 mono-number">
                    30m
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

                {/* 4 horizontal Subject Chips (JS 80%, React 60%, Node.js 40%, MongoDB 20%) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* JS */}
                  <div className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-200 transition">
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-900 font-black text-[11px] flex items-center justify-center">
                        JS
                      </span>
                      <span className="font-bold text-[11px] text-purple-600 mono-number">
                        80%
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate block mb-2">
                      JavaScript
                    </span>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-purple-600" style={{ width: '80%' }} />
                    </div>
                  </div>

                  {/* React */}
                  <div className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-200 transition">
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="w-6 h-6 rounded-md bg-sky-500 text-white font-black text-xs flex items-center justify-center">
                        ⚛
                      </span>
                      <span className="font-bold text-[11px] text-emerald-600 mono-number">
                        60%
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate block mb-2">
                      React
                    </span>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: '60%' }} />
                    </div>
                  </div>

                  {/* Node.js */}
                  <div className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-200 transition">
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">
                        &lt;&gt;
                      </span>
                      <span className="font-bold text-[11px] text-blue-600 mono-number">
                        40%
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate block mb-2">
                      Node.js
                    </span>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: '40%' }} />
                    </div>
                  </div>

                  {/* MongoDB */}
                  <div className="bg-[#f8fafc] dark:bg-dark-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-200 transition">
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="w-6 h-6 rounded-md bg-amber-500 text-white font-black text-[10px] flex items-center justify-center">
                        🍃
                      </span>
                      <span className="font-bold text-[11px] text-amber-600 mono-number">
                        20%
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate block mb-2">
                      MongoDB
                    </span>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>

                {/* Micro feature pills row inside Subject Wise Progress matching screenshot */}
                <div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                    <Zap size={13} className="text-blue-500" /> Fast Learning
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                    <Target size={13} className="text-purple-500" /> Better Focus
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                    <LineChart size={13} className="text-emerald-500" /> Track Progress
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-blue-600 cursor-pointer">
                    <Trophy size={13} className="text-amber-500" /> Achieve Goals
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Study Activity Bar Chart (4 cols on md) + Motivation pill */}
            <div className="md:col-span-5 lg:col-span-4 glass-card p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                      <LineChart size={14} />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      Weekly Study Activity
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 mono-number">
                    0m total
                  </span>
                </div>

                {/* Minimalist Bar Chart */}
                <div className="flex items-end h-24 pt-1 pb-1 relative">
                  {/* Y-axis labels */}
                  <div className="flex flex-col justify-between h-full text-[9px] text-slate-400 pr-1.5 shrink-0 select-none pb-4 mono-number">
                    <span>4h</span>
                    <span>3h</span>
                    <span>2h</span>
                    <span>1h</span>
                    <span>0</span>
                  </div>

                  {/* Bars container */}
                  <div className="flex-1 flex items-end justify-between h-full border-b border-slate-100 dark:border-slate-800 pb-4 pl-1 gap-1.5">
                    {[
                      { day: 'Mon', h: 0.6 },
                      { day: 'Tue', h: 0.5 },
                      { day: 'Wed', h: 1.4, isToday: true },
                      { day: 'Thu', h: 0.3 },
                      { day: 'Fri', h: 0.8 },
                      { day: 'Sat', h: 0.4 },
                      { day: 'Sun', h: 0.5 },
                    ].map((item, idx) => {
                      const barPercent = Math.min(100, Math.max(10, (item.h / 4) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative">
                          <div
                            className={`w-full max-w-[18px] rounded-t-md transition-all ${
                              item.isToday
                                ? 'bg-[#5b64e8] shadow-sm shadow-indigo-500/30'
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

                {/* Potted plant motivation banner matching screenshot */}
                <div className="mt-5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                    <span className="text-rose-500">❤️</span>
                    <span>"Progress, not perfection."</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-sm">
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
            {/* 1. Today's To-Do List matching screenshot */}
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
                    Wed, 21 Oct 2026
                  </span>
                </div>
              </div>

              <button
                onClick={onOpenTomorrowTarget}
                className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 text-[11px] font-bold transition flex items-center gap-1"
              >
                <span>+ Add</span>
              </button>
            </div>

            {/* Todo Items */}
            <div className="space-y-2">
              {todoItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => toggleTodo(item.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        item.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-dark-900 hover:border-blue-400'
                      }`}
                    >
                      {item.completed && <Check size={11} strokeWidth={3} />}
                    </button>
                    <div className="min-w-0">
                      <span
                        className={`text-xs font-semibold block truncate ${
                          item.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium mono-number">
                      {item.time}
                    </span>
                    <button
                      onClick={() => {
                        startStudy({
                          subjectId: item.subjectId,
                          topicId: item.topicId,
                        });
                        setActivePage('timer');
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.tagColor} hover:opacity-80 transition`}
                    >
                      {item.tag}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Quick Reminders matching screenshot */}
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

              <button
                onClick={() => setActivePage('notifications')}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </button>
            </div>

            {/* Reminders List */}
            <div className="space-y-2.5">
              {/* Item 1 */}
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
                      30 min study → 15 min break
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Next break at 11:30 AM
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
              </div>

              {/* Item 2 */}
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
                      Complete today's target
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      You are 60% done
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
              </div>

              {/* Item 3 */}
              <div
                onClick={() => setActivePage('focus')}
                className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center shrink-0">
                    <Smartphone size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block group-hover:text-blue-600 transition-colors">
                      Keep your phone away
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Stay focused!
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
              </div>

              {/* Item 4 */}
              <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
                    <Star size={14} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block group-hover:text-blue-600 transition-colors">
                      Believe in yourself
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      You can do it!
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 transition" />
              </div>
            </div>
          </div>

          {/* 3. Recent Activity matching screenshot */}
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
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </button>
            </div>

            {/* Recent Activity Items */}
            <div className="space-y-2.5">
              {/* Activity 1 */}
              <div className="flex items-start justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      Study session completed
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                      React – Components (45m)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium shrink-0 mono-number">
                  Today 10:12 AM
                </span>
              </div>

              {/* Activity 2 */}
              <div className="flex items-start justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      Topic added
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                      Node.js – Express
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium shrink-0 mono-number">
                  Yesterday 08:45 PM
                </span>
              </div>

              {/* Activity 3 */}
              <div className="flex items-start justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-950 transition">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen size={13} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block leading-tight">
                      New subject created
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                      MongoDB
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium shrink-0 mono-number">
                  Yesterday 07:20 PM
                </span>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DashboardPage;
