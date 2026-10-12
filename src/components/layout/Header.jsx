import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Moon,
  Sun,
  Bell,
  Plus,
  Play,
  Pause,
  Coffee,
  Square,
  Clock,
  ChevronDown,
  Layers,
  Home,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useTimer } from '../../context/TimerContext';
import { useTheme } from '../../context/ThemeContext';
import { formatTimeFromTimestamp, getTodayDateString, formatFriendlyDate } from '../../utils/dateUtils';

export function Header({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenQuickAction,
  setActivePage,
  onBackToHub,
}) {
  const navigate = useNavigate();
  const {
    preparations,
    activePrepId,
    setActivePrepId,
    activePreparation,
    notifications,
    settings,
    subjects,
    topics,
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

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  // Running session details lookup
  const runningSubject = subjects.find((s) => s.id === session.subjectId);
  const runningTopic = topics.find((t) => t.id === session.topicId);

  return (
    <header className="h-16 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left side: Hamburger + Prep Switcher + Live Clock */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Preparation Switcher Dropdown */}
        {preparations.length > 0 && (
          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition">
              <Layers size={14} className="text-brand-500 shrink-0" />
              <select
                value={activePrepId || ''}
                onChange={(e) => setActivePrepId(e.target.value)}
                className="bg-transparent border-none outline-none cursor-pointer pr-2 truncate max-w-[130px] sm:max-w-[200px]"
              >
                {preparations.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-dark-900 text-slate-900 dark:text-slate-100">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Date and Live Clock */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
          <Clock size={14} className="text-slate-400" />
          <span>{formatFriendlyDate(getTodayDateString())}</span>
          <span>•</span>
          <span className="mono-number text-slate-700 dark:text-slate-300 font-semibold">
            {formatTimeFromTimestamp(currentTime, settings?.timeFormat !== '24h')}
          </span>
        </div>
      </div>

      {/* Center: Running Session Pill (if active) */}
      {!isIdle && (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white shadow-md text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium text-slate-300 max-w-[120px] truncate">
            {runningSubject?.name || 'Study'}
          </span>
          <span className="font-mono font-bold text-emerald-400">
            {formattedNetStudyTime}
          </span>

          <div className="flex items-center gap-1 ml-2 border-l border-slate-700 pl-2">
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

      {/* Right side: Search, Quick Action, Theme, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Return to Hub Button if provided */}
        {onBackToHub && (
          <button
            onClick={onBackToHub}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-sm transition active:scale-95"
            title="Return to Hub"
          >
            <Home size={14} />
            <span className="hidden sm:inline">Hub</span>
          </button>
        )}

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-950 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition"
          title="Search anything (Cmd+K)"
        >
          <Search size={14} />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Quick Action</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setActivePage('notifications')}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition relative"
          title="Notifications"
        >
          <Bell size={17} />
          {unreadNotifs > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-dark-900" />
          )}
        </button>


      </div>
    </header>
  );
}
