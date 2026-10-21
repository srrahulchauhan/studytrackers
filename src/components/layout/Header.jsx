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
  ListTodo,
  Check,
  Plus,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  X,
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
    todos,
    targets,
    addTomorrowTarget,
    toggleTomorrowTarget,
    removeTomorrowTarget,
    exportTodosAsExcel,
    syncNow,
    syncStatus,
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

  const [isTodoMenuOpen, setIsTodoMenuOpen] = useState(false);
  const [quickTodoTitle, setQuickTodoTitle] = useState('');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const todoMenuRef = useRef(null);

  const rawTodos = todos || targets?.tomorrow || [];
  const pendingTodos = rawTodos.filter((t) => !t.completed && t.status !== 'Completed');
  const pendingCount = pendingTodos.length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (todoMenuRef.current && !todoMenuRef.current.contains(e.target)) {
        setIsTodoMenuOpen(false);
      }
    };
    if (isTodoMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTodoMenuOpen]);

  const handleQuickAddTodo = (e) => {
    e.preventDefault();
    if (!quickTodoTitle.trim()) return;
    addTomorrowTarget({
      title: quickTodoTitle.trim(),
      priority: 'High',
      targetDurationMinutes: 45,
      category: 'Study',
    });
    setQuickTodoTitle('');
  };

  const handleSyncToSheets = async () => {
    setIsSyncingSheets(true);
    try {
      await syncNow();
    } catch (err) {
      // toast shown in syncNow
    } finally {
      setIsSyncingSheets(false);
    }
  };

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
        {/* To-Do Quick Controller Menu Button */}
        <div className="relative" ref={todoMenuRef}>
          <button
            onClick={() => setIsTodoMenuOpen(!isTodoMenuOpen)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs cursor-pointer ${
              isTodoMenuOpen
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/30'
                : 'bg-[#f0f4fa] dark:bg-dark-950 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            title="To-Do Task Controller (Add, Excel, Sheets)"
          >
            <ListTodo size={15} className={isTodoMenuOpen ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
            <span className="hidden md:inline">To-Do</span>
            {pendingCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold mono-number ${
                  isTodoMenuOpen
                    ? 'bg-white text-blue-700'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>

          {/* To-Do Quick Popover Dropdown Panel */}
          {isTodoMenuOpen && (
            <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                    <ListTodo size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm leading-tight">My Study To-Dos</h3>
                    <p className="text-[10px] text-blue-100">
                      {pendingCount} pending • {rawTodos.length} total tasks
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTodoMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Quick Add Input Bar */}
              <form onSubmit={handleQuickAddTodo} className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-dark-950/50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickTodoTitle}
                    onChange={(e) => setQuickTodoTitle(e.target.value)}
                    placeholder="+ Add new task & press Enter..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!quickTodoTitle.trim()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* Tasks List */}
              <div className="max-h-64 overflow-y-auto p-2 space-y-1.5 custom-dark-scroll">
                {rawTodos.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <p>No tasks yet. Type above to add your first To-Do!</p>
                  </div>
                ) : (
                  rawTodos.map((task) => {
                    const isDone = task.completed || task.status === 'Completed';
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-2 rounded-xl transition ${
                          isDone
                            ? 'bg-slate-50/50 dark:bg-dark-950/30 opacity-70'
                            : 'bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-950 border border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleTomorrowTarget(task.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-dark-900'
                            }`}
                          >
                            {isDone && <Check size={11} strokeWidth={3} />}
                          </button>
                          <span
                            className={`text-xs block truncate ${
                              isDone
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-slate-200 font-medium'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {task.time && (
                            <span className="text-[10px] text-slate-400 mono-number hidden sm:inline">
                              {task.time}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeTomorrowTarget(task.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="Delete task"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Action Footer: Excel Export + Google Sheets Sync + Full View */}
              <div className="p-2.5 bg-slate-50 dark:bg-dark-950 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={exportTodosAsExcel}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold transition"
                    title="Export To-Dos to Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncToSheets}
                    disabled={isSyncingSheets}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold transition disabled:opacity-50"
                    title="Sync To-Dos to Google Sheets"
                  >
                    <RefreshCw size={12} className={isSyncingSheets ? 'animate-spin' : ''} />
                    <span>{isSyncingSheets ? 'Syncing...' : 'Sheets'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsTodoMenuOpen(false);
                    setActivePage('targets');
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <span>All Targets</span>
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>
          )}
        </div>

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
