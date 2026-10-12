import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Timer,
  BookOpen,
  CalendarDays,
  Menu,
  X,
  Layers,
  Flame,
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
  const { activePreparation, notifications, sessions, settings } = useStudy();
  const { isRunning, isBreak } = useTimer();
  const navigate = useNavigate();

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const streaks = calculateStudyStreaks(sessions, settings?.minAttendanceMinutes || 30);

  const bottomItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timer', label: 'Timer', icon: Timer, hasBadge: isRunning || isBreak },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'timetable', label: 'Schedule', icon: CalendarDays },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
              <Timer size={18} />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">StudyFlow</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Streak info in mobile drawer */}
        <div className="p-4 mx-3 my-2 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/70 dark:border-slate-800/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Study Streak</span>
            <div className="flex items-center gap-1 font-bold text-amber-500">
              <Flame size={14} className="fill-amber-500" />
              <span>{streaks.currentStreak} Days</span>
            </div>
          </div>
          {activePreparation && (
            <div className="mt-2 text-xs truncate">
              <span className="text-slate-400 block text-[10px]">Active Prep:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                {activePreparation.name}
              </span>
            </div>
          )}
        </div>

        {/* Drawer Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
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
      </div>

      {/* Bottom Navigation Bar for Small Screens */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-30">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-full relative text-[11px] font-medium transition ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-dark-900" />
                )}
              </div>
              <span className="mt-1">{item.label}</span>
            </button>
          );
        })}
        {/* More button to toggle drawer */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-14 h-full text-[11px] font-medium text-slate-500 dark:text-slate-400"
        >
          <Menu size={20} />
          <span className="mt-1">More</span>
        </button>
      </nav>
    </>
  );
}
