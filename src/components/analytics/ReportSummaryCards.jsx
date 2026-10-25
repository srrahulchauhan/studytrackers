import React from 'react';
import {
  Clock,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ListTodo,
  UserCheck,
  RotateCcw,
  Target,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Flame,
  Award,
} from 'lucide-react';

export function ReportSummaryCards({ stats = {}, previousStats = {} }) {
  const cards = [
    {
      id: 'total_hours',
      title: 'Total Study Hours',
      value: stats.totalHoursFormatted || '0h 0m',
      numericValue: stats.totalHours || 0,
      prevValue: previousStats.totalHours || 0,
      changePct: stats.totalHoursChangePct,
      unit: 'hrs logged',
      description: 'Sum of all productive study duration (excluding breaks)',
      icon: Clock,
      gradient: 'from-blue-600 to-indigo-600',
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      progressBarColor: 'bg-blue-500',
      progressPct: Math.min(100, Math.round(((stats.totalHours || 0) / (stats.targetHours || 50)) * 100)),
    },
    {
      id: 'today_hours',
      title: "Today's Study Hours",
      value: stats.todayHoursFormatted || '0h 0m',
      numericValue: stats.todayHours || 0,
      prevValue: previousStats.todayHours || 0,
      changePct: stats.todayHoursChangePct,
      unit: 'today',
      description: 'Active study logged so far today',
      icon: Flame,
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      progressBarColor: 'bg-amber-500',
      progressPct: Math.min(100, Math.round(((stats.todayHours || 0) / (stats.dailyTargetHours || 4)) * 100)),
    },
    {
      id: 'weekly_hours',
      title: 'Weekly Study Hours',
      value: stats.weeklyHoursFormatted || '0h 0m',
      numericValue: stats.weeklyHours || 0,
      prevValue: previousStats.weeklyHours || 0,
      changePct: stats.weeklyHoursChangePct,
      unit: 'last 7 days',
      description: 'Total focus time over the rolling 7-day period',
      icon: CalendarDays,
      gradient: 'from-teal-500 to-emerald-600',
      iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
      progressBarColor: 'bg-teal-500',
      progressPct: Math.min(100, Math.round(((stats.weeklyHours || 0) / (stats.weeklyTargetHours || 25)) * 100)),
    },
    {
      id: 'monthly_hours',
      title: 'Monthly Study Hours',
      value: stats.monthlyHoursFormatted || '0h 0m',
      numericValue: stats.monthlyHours || 0,
      prevValue: previousStats.monthlyHours || 0,
      changePct: stats.monthlyHoursChangePct,
      unit: 'this month',
      description: 'Accumulated study time in current calendar month',
      icon: Calendar,
      gradient: 'from-purple-600 to-violet-600',
      iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
      progressBarColor: 'bg-purple-500',
      progressPct: Math.min(100, Math.round(((stats.monthlyHours || 0) / (stats.monthlyTargetHours || 100)) * 100)),
    },
    {
      id: 'completed_topics',
      title: 'Total Completed Topics',
      value: `${stats.completedTopicsCount || 0}`,
      numericValue: stats.completedTopicsCount || 0,
      prevValue: previousStats.completedTopicsCount || 0,
      changePct: stats.completedTopicsChangePct,
      unit: `of ${stats.totalTopicsCount || 0} topics`,
      description: 'Topics marked complete with lectures & notes verified',
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-green-600',
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      progressBarColor: 'bg-emerald-500',
      progressPct: stats.topicCompletionRate || 0,
    },
    {
      id: 'pending_topics',
      title: 'Total Pending Topics',
      value: `${stats.pendingTopicsCount || 0}`,
      numericValue: stats.pendingTopicsCount || 0,
      prevValue: previousStats.pendingTopicsCount || 0,
      changePct: stats.pendingTopicsChangePct,
      unit: 'remaining',
      description: 'Topics scheduled or in-progress needing study sessions',
      icon: ListTodo,
      gradient: 'from-rose-500 to-pink-600',
      iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      progressBarColor: 'bg-rose-500',
      progressPct: Math.max(0, 100 - (stats.topicCompletionRate || 0)),
    },
    {
      id: 'attendance_pct',
      title: 'Attendance Percentage',
      value: `${stats.attendancePct ?? 100}%`,
      numericValue: stats.attendancePct ?? 100,
      prevValue: previousStats.attendancePct ?? 100,
      changePct: stats.attendancePctChangePct,
      unit: `${stats.presentDaysCount || 0} / ${stats.totalAttendanceDays || 0} days`,
      description: 'Days meeting minimum study duration threshold',
      icon: UserCheck,
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      progressBarColor: 'bg-blue-500',
      progressPct: stats.attendancePct ?? 100,
    },
    {
      id: 'revision_pct',
      title: 'Revision Completion',
      value: `${stats.revisionPct || 0}%`,
      numericValue: stats.revisionPct || 0,
      prevValue: previousStats.revisionPct || 0,
      changePct: stats.revisionPctChangePct,
      unit: `${stats.completedRevisionsCount || 0} completed`,
      description: 'Completed revisions vs applicable revision targets',
      icon: RotateCcw,
      gradient: 'from-violet-500 to-fuchsia-600',
      iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
      progressBarColor: 'bg-violet-500',
      progressPct: stats.revisionPct || 0,
    },
    {
      id: 'goal_pct',
      title: 'Goal Completion',
      value: `${stats.goalPct || 0}%`,
      numericValue: stats.goalPct || 0,
      prevValue: previousStats.goalPct || 0,
      changePct: stats.goalPctChangePct,
      unit: `${stats.completedGoalsCount || 0} / ${stats.totalGoalsCount || 0} goals`,
      description: 'Completed academic milestones and deadlines',
      icon: Target,
      gradient: 'from-amber-600 to-yellow-500',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      progressBarColor: 'bg-amber-500',
      progressPct: stats.goalPct || 0,
    },
    {
      id: 'avg_daily',
      title: 'Average Daily Study Time',
      value: stats.avgDailyFormatted || '0h 0m',
      numericValue: stats.avgDailyHours || 0,
      prevValue: previousStats.avgDailyHours || 0,
      changePct: stats.avgDailyChangePct,
      unit: 'per active day',
      description: 'Mean productive focus time across active study days',
      icon: Sparkles,
      gradient: 'from-indigo-600 to-purple-600',
      iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
      progressBarColor: 'bg-indigo-500',
      progressPct: Math.min(100, Math.round(((stats.avgDailyHours || 0) / (stats.dailyTargetHours || 4)) * 100)),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        const change = typeof card.changePct === 'number' ? card.changePct : null;
        const isPositive = change !== null && change > 0;
        const isZero = change === 0;

        return (
          <div
            key={card.id}
            className="group relative bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden"
          >
            {/* Top light beam accent on hover */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-80 group-hover:opacity-100 transition`} />

            <div>
              {/* Header: Icon + Category Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-tight truncate">
                  {card.title}
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <Icon size={14} strokeWidth={2.4} />
                </div>
              </div>

              {/* Main Metric Value */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mono-number">
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                    {card.unit}
                  </span>
                )}
              </div>

              {/* Previous period comparison pill */}
              <div className="flex items-center gap-1.5 text-[10px] mb-2.5">
                {change !== null ? (
                  <span
                    className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : isZero
                        ? 'bg-slate-100 text-slate-600 dark:bg-dark-800 dark:text-slate-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp size={10} />
                    ) : isZero ? null : (
                      <TrendingDown size={10} />
                    )}
                    <span>
                      {isPositive ? `+${change}%` : `${change}%`}
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px]">vs previous</span>
                )}
                <span className="text-slate-400 dark:text-slate-500 text-[10px] truncate">
                  prev: {typeof card.prevValue === 'number' ? card.prevValue.toFixed(1) : card.prevValue}
                </span>
              </div>
            </div>

            {/* Bottom Progress Bar & Description */}
            <div className="mt-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${card.progressBarColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, card.progressPct))}%` }}
                />
              </div>
              <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-1.5 leading-tight line-clamp-1 group-hover:line-clamp-none transition-all">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
