import {
  LayoutDashboard,
  Timer,
  BookOpen,
  CalendarDays,
  Menu,
  X,
  Layers,
  Flame,
  Rocket,
  ListTodo,
} from 'lucide-react';
import { NAV_ITEMS } from './Sidebar';
import { useStudy } from '../../context/StudyContext';
import { useTimer } from '../../context/TimerContext';
import { calculateStudyStreaks } from '../../utils/dateUtils';

export function MobileNav({
  activePage,
  setActivePage,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onBackToHub,
}) {
  const { activePreparation, notifications, sessions, settings, todos, targets } = useStudy();
  const { isRunning, isBreak } = useTimer();

  const rawTodos = todos || targets?.tomorrow || [];
  const pendingTodosCount = rawTodos.filter((t) => !t.completed && t.status !== 'Completed').length;

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const streaks = calculateStudyStreaks(sessions, settings?.minAttendanceMinutes || 30);

  const bottomItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'targets', label: 'To-Do', icon: ListTodo, badgeCount: pendingTodosCount },
    { id: 'timer', label: 'Timer', icon: Timer, hasBadge: isRunning || isBreak },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'timetable', label: 'Schedule', icon: CalendarDays },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 sm:w-80 bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
              <Rocket size={17} className="fill-white/20 transform -rotate-12" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white leading-tight block">
                StudyFlow
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Plan • Study • Grow
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Streak info in mobile drawer */}
        <div className="p-3.5 mx-3.5 my-3 rounded-2xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/70 dark:border-slate-800/60 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Study Streak</span>
            <div className="flex items-center gap-1 font-bold text-amber-500">
              <Flame size={14} className="fill-amber-500" />
              <span>{streaks.currentStreak} Days</span>
            </div>
          </div>
          {activePreparation && (
            <div className="mt-2 text-xs truncate pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Active Prep:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                {activePreparation.name}
              </span>
            </div>
          )}
        </div>

        {/* Drawer Links */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 custom-dark-scroll">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'notifications' && unreadNotifs > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {unreadNotifs}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Back to Hub if available */}
        {onBackToHub && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              onClick={() => {
                onBackToHub();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold transition shadow-sm"
            >
              <Layers size={14} />
              <span>Return to Hub</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar for Mobile (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-dark-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40 shadow-lg">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-full relative text-[11px] font-medium transition ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <div className="relative">
                <Icon size={19} />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-dark-900 animate-ping" />
                )}
                {item.badgeCount > 0 && !item.hasBadge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-1 rounded-full bg-amber-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-1 ring-white dark:ring-dark-900">
                    {item.badgeCount}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[10px]">{item.label}</span>
            </button>
          );
        })}
        {/* More button to toggle drawer */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-14 h-full text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600"
        >
          <Menu size={19} />
          <span className="mt-1 text-[10px]">More</span>
        </button>
      </nav>
    </>
  );
}
export default MobileNav;
