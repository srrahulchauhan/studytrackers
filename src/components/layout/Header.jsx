import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Bell,
  Play,
  Pause,
  Coffee,
  Square,
  Clock,
  Calendar,
  Home,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useTimer } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import { formatTimeFromTimestamp } from '../../utils/dateUtils';

export function Header({
  onOpenMobileMenu,
  onOpenSearch,
  setActivePage,
  onBackToHub,
}) {
  const {
    notifications,
    settings,
    subjects,
  } = useStudy();



  const {
    session,
    isRunning,
    isPaused,
    isBreak,
    isIdle,
    formattedNetStudyTime,
    pauseStudy,
    resumeStudy,
    takeBreak,
    resumeFromBreak,
    stopSession,
  } = useTimer();

  const { theme, toggleTheme } = useTheme();

  // Live time ticker
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);



  const unreadNotifs = (notifications || []).filter((n) => !n.read).length;

  // Running session details lookup
  const runningSubject = subjects.find((s) => s.id === session.subjectId);

  // Format today date like "Wed, 21 Oct 2026"
  const formattedHeaderDate = () => {
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  };

  return (
    <header className="h-16 bg-white dark:bg-dark-900 border-b border-slate-100 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-20">
      {/* Left side: Hamburger (mobile only) + Search Input */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Search Bar matching screenshot */}
        <div
          onClick={onOpenSearch}
          className="flex-1 max-w-xs sm:max-w-md relative flex items-center bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/70 dark:border-slate-800 rounded-2xl px-3 sm:px-4 py-2 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition group"
        >
          <Search size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0 mr-2.5" />
          <input
            type="text"
            readOnly
            placeholder="Search anything... (topics, subjects, goals)"
            className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none cursor-pointer truncate"
          />
        </div>
      </div>

      {/* Center: Running Session Pill (if active) */}
      {!isIdle && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white shadow-md text-xs shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium text-slate-300 max-w-[90px] xl:max-w-[120px] truncate hidden md:inline">
            {runningSubject?.name || 'Study'}
          </span>
          <span className="font-mono font-bold text-emerald-400 mono-number">
            {formattedNetStudyTime}
          </span>

          <div className="hidden xl:flex items-center gap-1 ml-1.5 border-l border-slate-700 pl-1.5">
            {isRunning && (
              <button
                onClick={pauseStudy}
                title="Pause"
                className="p-1 hover:bg-slate-700 rounded-md transition"
              >
                <Pause size={13} />
              </button>
            )}
            {isPaused && (
              <button
                onClick={resumeStudy}
                title="Resume"
                className="p-1 hover:bg-slate-700 rounded-md text-emerald-400 transition"
              >
                <Play size={13} />
              </button>
            )}
            {!isBreak ? (
              <button
                onClick={() => takeBreak('Rest')}
                title="Take Break"
                className="p-1 hover:bg-slate-700 rounded-md text-amber-400 transition"
              >
                <Coffee size={13} />
              </button>
            ) : (
              <button
                onClick={resumeFromBreak}
                title="End Break"
                className="p-1 hover:bg-slate-700 rounded-md text-sky-400 transition"
              >
                <Play size={13} />
              </button>
            )}
            <button
              onClick={() => stopSession()}
              title="Stop & Save"
              className="p-1 hover:bg-slate-700 rounded-md text-rose-400 transition"
            >
              <Square size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Right side: To-Do Menu Controller, Date Pill, Clock Pill, Bell, Theme Slider, Avatar */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

        {/* Date pill */}
        <div
          onClick={() => setActivePage('calendar')}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/70 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 transition"
          title="Open Calendar"
        >
          <Calendar size={14} className="text-blue-500" />
          <span>{formattedHeaderDate()}</span>
        </div>

        {/* Time pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/70 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Clock size={14} className="text-slate-400" />
          <span className="mono-number font-bold">
            {formatTimeFromTimestamp(currentTime, settings?.timeFormat !== '24h')}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => setActivePage('notifications')}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell size={18} />
          {unreadNotifs > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-dark-900 shadow-xs">
              {unreadNotifs}
            </span>
          )}
        </button>

        {/* Theme Pill Slider Toggle matching screenshot */}
        <div
          onClick={toggleTheme}
          className="hidden sm:flex items-center bg-[#f0f4fa] dark:bg-dark-950 border border-slate-200/70 dark:border-slate-800 rounded-full p-1 cursor-pointer hover:border-slate-300 transition select-none"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          <div className="flex items-center gap-1.5 text-xs px-1">
            <span className={`p-1 rounded-full text-xs transition-colors ${theme !== 'dark' ? 'bg-amber-100 text-amber-600 shadow-xs' : 'text-slate-400'}`}>
              ☀️
            </span>
            <span className={`p-1 rounded-full text-xs transition-colors ${theme === 'dark' ? 'bg-indigo-900/60 text-sky-400 shadow-xs' : 'text-slate-400'}`}>
              🌙
            </span>
          </div>
        </div>

        {/* Return to Hub if available */}
        {onBackToHub && (
          <button
            onClick={onBackToHub}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold transition shadow-sm"
          >
            <Home size={13} />
            <span>Hub</span>
          </button>
        )}

        {/* User Profile */}
        <div
          onClick={() => setActivePage('settings')}
          className="flex items-center gap-2.5 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800 cursor-pointer group"
          title="Settings / Profile"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-dark-900 shadow-xs shrink-0 overflow-hidden">
            <svg viewBox="0 0 40 40" className="w-full h-full">
              <circle cx="20" cy="20" r="20" fill="#38bdf8"/>
              <path d="M 12 18 C 12 12, 28 12, 28 18 C 28 23, 20 25, 20 25 C 20 25, 12 23, 12 18 Z" fill="#fed7aa"/>
              <path d="M 10 14 C 10 9, 30 9, 30 14 C 30 14, 28 10, 20 10 C 12 10, 10 14, 10 14 Z" fill="#1e293b"/>
              <circle cx="16" cy="18" r="1.5" fill="#0f172a"/>
              <circle cx="24" cy="18" r="1.5" fill="#0f172a"/>
              <path d="M 18 21 Q 20 23 22 21" stroke="#ea580c" strokeWidth="1" fill="none" strokeLinecap="round"/>
              <path d="M 8 38 C 8 30, 32 30, 32 38 Z" fill="#f59e0b"/>
            </svg>
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
              {settings?.userName || 'Rahul Chauhan'}
            </span>
            <div className="flex items-center gap-1">
              <span className="block text-[11px] text-slate-400 font-normal leading-tight">
                {settings?.userRole || 'Learner'}
              </span>
              <ChevronDown size={11} className="text-slate-400 group-hover:text-slate-600 transition" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
export default Header;
