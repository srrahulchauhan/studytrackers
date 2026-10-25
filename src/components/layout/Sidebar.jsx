import React from 'react';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  ListTodo,
  RotateCcw,
  Video,
  Timer,
  CalendarDays,
  Calendar,
  UserCheck,
  Target,
  Trophy,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  PlayCircle,
  BarChart3,
  Zap,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useTimer } from '../../context/TimerContext';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'targets', label: 'To-Do & Targets', icon: ListTodo, isTodo: true },
  { id: 'preparations', label: 'My Courses', icon: Layers },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'topics', label: 'Topics', icon: Target },
  { id: 'timetable', label: 'Study Timetable', icon: CalendarDays },
  { id: 'timer', label: 'Study Sessions', icon: PlayCircle, hasLiveBadge: true },
  { id: 'videos', label: 'Video Courses', icon: Video },
  { id: 'revision', label: 'Revision', icon: RotateCcw },
  { id: 'attendance', label: 'Attendance', icon: UserCheck },
  { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activePage, setActivePage, isCollapsed, setIsCollapsed, onBackToHub }) {
  const { isRunning, isBreak, formattedNetStudyTime } = useTimer();
  const { todos, targets } = useStudy();

  const rawTodos = todos || targets?.tomorrow || [];
  const pendingTodosCount = rawTodos.filter((t) => !t.completed && t.status !== 'Completed').length;

  const handleNavClick = (itemId) => {
    setActivePage(itemId);
  };

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#0b132b] text-white border-r border-slate-800/80 transition-all duration-300 ease-in-out z-30 select-none shrink-0 ${
        isCollapsed ? 'w-20' : 'w-20 lg:w-60 xl:w-64'
      }`}
    >
      {/* Brand Logo with Glowing Open Book Icon */}
      <div className="h-16 flex items-center justify-between px-3.5 lg:px-5 border-b border-white/5 shrink-0">
        <div
          className="flex items-center gap-3 cursor-pointer min-w-0"
          onClick={() => setActivePage('dashboard')}
          title="StudyFlow Home"
        >
          {/* Glowing Open Book Icon matching screenshot */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0 p-1.5">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="#ffffff" fillOpacity="0.9"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="#38bdf8" fillOpacity="0.85"/>
            </svg>
          </div>
          {!isCollapsed && (
            <div className="hidden lg:block truncate">
              <span className="font-black text-[18px] tracking-tight text-white block leading-tight truncate">
                StudyFlow
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wider mt-0.5 truncate">
                Plan • Study • Grow
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0 ml-1"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List - Exact list matching screenshot */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 custom-dark-scroll">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id || (item.id === 'preparations' && activePage === 'courses');
          const isTimerActive = item.hasLiveBadge && (isRunning || isBreak);

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-center lg:justify-start lg:gap-3 px-2 lg:px-3.5 py-2.5'
              } rounded-xl text-xs sm:text-[13px] transition-all group relative font-medium ${
                isActive
                  ? 'bg-[#1d68f6] text-white font-bold shadow-md shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.07]'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <Icon
                  size={18}
                  className={`${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-white transition-colors'
                  }`}
                />
                {/* Live timer pulsing dot */}
                {isTimerActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#0b132b] animate-ping" />
                )}
                {/* To-Do pending count dot on collapsed */}
                {item.isTodo && pendingTodosCount > 0 && !isTimerActive && (
                  <span className="lg:hidden absolute -top-1 -right-1.5 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0b132b]">
                    {pendingTodosCount}
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <span className="hidden lg:inline truncate flex-1 text-left">{item.label}</span>
              )}

              {/* Active timer badge */}
              {!isCollapsed && isTimerActive && (
                <span className="hidden lg:inline text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {formattedNetStudyTime}
                </span>
              )}

              {/* To-Do pending count badge on expanded */}
              {!isCollapsed && item.isTodo && pendingTodosCount > 0 && (
                <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 mono-number">
                  {pendingTodosCount}
                </span>
              )}

              {/* Tooltip on collapsed / tablet hover */}
              <div className="fixed left-20 ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap lg:hidden">
                {item.label}
                {isTimerActive && ` (${formattedNetStudyTime})`}
                {item.isTodo && pendingTodosCount > 0 && ` (${pendingTodosCount} pending)`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Motivation Card matching screenshot: Boy in hoodie reading book */}
      {!isCollapsed ? (
        <div className="p-2 lg:p-3 shrink-0 space-y-2">
          {/* Expanded on lg+ */}
          <div className="hidden lg:block relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#122247] via-[#0f1d3b] to-[#0a1428] p-3.5 border border-blue-900/40 shadow-inner">
            <div className="relative z-10 max-w-[130px]">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mb-1">
                <span>🌱</span>
                <span>Small steps</span>
              </div>
              <h4 className="font-extrabold text-xs text-white leading-tight">
                every day create big results!
              </h4>
            </div>

            {/* Boy in Hoodie reading book illustration matching screenshot */}
            <div className="absolute -bottom-1 -right-1 w-20 h-20 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <path d="M 10 100 L 40 60 L 70 100 Z" fill="#1e3a8a" opacity="0.4"/>
                <path d="M 40 100 L 75 50 L 100 100 Z" fill="#2563eb" opacity="0.3"/>
                <circle cx="80" cy="35" r="10" fill="#60a5fa" opacity="0.2"/>

                <path d="M 45 100 L 45 75 Q 65 70 85 75 L 85 100 Z" fill="#f59e0b" />
                <circle cx="65" cy="65" r="14" fill="#d97706" />
                <circle cx="65" cy="65" r="11" fill="#fed7aa" />
                <path d="M 54 62 C 54 53, 76 53, 76 62 C 73 57, 57 57, 54 62 Z" fill="#0f172a" />
                <circle cx="61" cy="65" r="1" fill="#0f172a" />
                <circle cx="69" cy="65" r="1" fill="#0f172a" />
                <path d="M 63 68 Q 65 70 67 68" stroke="#ea580c" strokeWidth="0.8" fill="none" />
                <polygon points="50,95 65,85 80,95 65,98" fill="#38bdf8"/>
                <polygon points="50,95 65,85 65,98" fill="#ffffff" opacity="0.9"/>
                <polygon points="80,95 65,85 65,98" fill="#e0f2fe" opacity="0.9"/>
              </svg>
            </div>
          </div>

          {/* Compact on tablet (< lg) */}
          <div className="lg:hidden flex justify-center">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#141d3d] to-[#0c1329] flex items-center justify-center border border-indigo-900/40 text-sm"
              title="Small steps every day create big results!"
            >
              🌱
            </div>
          </div>

          {/* Micro Footer Badge in Sidebar */}
          <div className="hidden lg:flex items-center justify-between px-2 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">⚡ Fast</span>
            <span className="flex items-center gap-1">🎯 Focus</span>
            <span className="flex items-center gap-1">📈 Track</span>
          </div>
        </div>
      ) : (
        <div className="p-2 shrink-0 flex justify-center">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#141d3d] to-[#0c1329] flex items-center justify-center border border-indigo-900/40 cursor-pointer text-sm"
            onClick={() => setIsCollapsed(false)}
            title="Small steps every day create big results!"
          >
            🌱
          </div>
        </div>
      )}

      {/* Return to Hub button if provided */}
      {onBackToHub && (
        <div className="p-2 border-t border-white/5 shrink-0">
          <button
            onClick={onBackToHub}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-sm"
            title="Return to Hub"
          >
            <Layers size={13} />
            {!isCollapsed && <span>Return to Hub</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
export default Sidebar;
