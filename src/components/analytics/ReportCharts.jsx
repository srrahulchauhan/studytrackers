import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Clock,
  PieChart as PieIcon,
  CheckCircle2,
  CalendarDays,
  UserCheck,
  RotateCcw,
  Flame,
  Award,
} from 'lucide-react';

const PALETTE = [
  '#1d68f6', // Indigo / Brand Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#6366f1', // Indigo
];

// Custom Tooltip component for Recharts
function CustomChartTooltip({ active, payload, label, unit = 'hrs' }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl shadow-xl border border-slate-700/60 text-xs z-50">
        <p className="font-bold text-slate-200 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`tooltip-${index}`} className="flex items-center gap-2 text-[11px]">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-300 font-medium">{entry.name}:</span>
            <span className="font-bold text-white mono-number">
              {entry.value} {entry.unit || unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function ReportCharts({
  dailyData = [],
  subjectData = [],
  topicData = [],
  progressData = [],
  attendanceData = {},
  revisionData = {},
  consistencyData = {},
}) {
  return (
    <div className="space-y-4">
      {/* Top Row: Daily Study Trend (2 cols on lg) + Subject Breakdown Donut (1 col on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* A. Daily Study Hours Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Daily Study Hours Trend
                </h3>
                <p className="text-[11px] text-slate-400">
                  Interactive daily productive study progression
                </p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            {dailyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No study hours recorded for this date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d68f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1d68f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="h" />
                  <Tooltip content={<CustomChartTooltip unit="hrs" />} />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    name="Study Hours"
                    stroke="#1d68f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#studyGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Daily Target"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* B. Subject-Wise Study Time Donut Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <PieIcon size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Subject Time Share
                </h3>
                <p className="text-[11px] text-slate-400">Distribution across study subjects</p>
              </div>
            </div>

            <div className="h-52 w-full">
              {subjectData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No subject study logged yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectData}
                      dataKey="hours"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={3}
                    >
                      {subjectData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || PALETTE[index % PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip unit="hrs" />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Custom responsive legend */}
          <div className="mt-2 space-y-1 max-h-24 overflow-y-auto custom-dark-scroll pr-1">
            {subjectData.slice(0, 5).map((s, idx) => (
              <div key={s.name || idx} className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color || PALETTE[idx % PALETTE.length] }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                    {s.name}
                  </span>
                </div>
                <span className="text-slate-900 dark:text-white font-bold mono-number ml-2">
                  {s.hours}h ({s.percentage || 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Topic Completion Analysis (Bar Chart) + Weekly/Monthly Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* C. Topic Completion Analysis */}
        <div className="lg:col-span-7 bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Topic Completion by Subject
                </h3>
                <p className="text-[11px] text-slate-400">
                  Comparing completed vs pending syllabus topics
                </p>
              </div>
            </div>
          </div>

          <div className="h-60 w-full">
            {topicData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No topic data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip unit="topics" />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="completed" name="Completed Topics" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending Topics" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* D. Weekly and Monthly Progress Comparison */}
        <div className="lg:col-span-5 bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CalendarDays size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Progress Comparison
              </h3>
              <p className="text-[11px] text-slate-400">Study hours across recent weeks / periods</p>
            </div>
          </div>

          <div className="h-60 w-full">
            {progressData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No comparison periods logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="h" />
                  <Tooltip content={<CustomChartTooltip unit="hrs" />} />
                  <Bar dataKey="hours" name="Study Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Attendance Analysis, Revision Progress & Study Consistency (3 equal cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* E. Attendance Analysis */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <UserCheck size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Attendance Analysis
              </h3>
              <p className="text-[11px] text-slate-400">Present vs absent ratio</p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Attendance Rate</span>
              <span className="font-black text-slate-800 dark:text-slate-100 text-sm mono-number">
                {attendanceData.rate || 100}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${attendanceData.rate || 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-center">
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block">
                  Present Days
                </span>
                <span className="text-base font-black text-teal-700 dark:text-teal-300 mono-number">
                  {attendanceData.present || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 text-center">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">
                  Absent Days
                </span>
                <span className="text-base font-black text-rose-700 dark:text-rose-300 mono-number">
                  {attendanceData.absent || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* F. Revision Progress */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <RotateCcw size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Revision Progress
              </h3>
              <p className="text-[11px] text-slate-400">Mastery and spaced repetition</p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Revision Completion</span>
              <span className="font-black text-slate-800 dark:text-slate-100 text-sm mono-number">
                {revisionData.rate || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${revisionData.rate || 0}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-2 text-center">
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-800/60">
                <span className="text-[9.5px] text-violet-600 dark:text-violet-400 font-bold block">
                  Done
                </span>
                <span className="text-sm font-black text-violet-700 dark:text-violet-300 mono-number">
                  {revisionData.completed || 0}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
                <span className="text-[9.5px] text-amber-600 dark:text-amber-400 font-bold block">
                  Pending
                </span>
                <span className="text-sm font-black text-amber-700 dark:text-amber-300 mono-number">
                  {revisionData.pending || 0}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[9.5px] text-slate-500 font-bold block">Skipped</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 mono-number">
                  {revisionData.skipped || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* G. Study Consistency & Streaks */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Study Consistency
              </h3>
              <p className="text-[11px] text-slate-400">Daily study habit tracker</p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/60 dark:border-amber-800/60">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-amber-500 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Current Streak
                  </span>
                  <span className="text-[10px] text-slate-500">Consecutive active days</span>
                </div>
              </div>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 mono-number">
                {consistencyData.currentStreak || 0} Days
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">Best Streak</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 mono-number">
                  {consistencyData.longestStreak || 0} Days
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">Total Days Studied</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 mono-number">
                  {consistencyData.activeDaysCount || 0} Days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
