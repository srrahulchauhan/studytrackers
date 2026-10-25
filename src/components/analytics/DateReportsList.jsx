import React from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  CheckCircle2,
  Coffee,
  UserCheck,
  ChevronRight,
  Flame,
  FileText,
  Award,
} from 'lucide-react';
import { formatSecondsToHMS } from '../../utils/timerUtils';

export function DateReportsList({
  dateAggregates = [],
  onSelectDate,
}) {
  if (dateAggregates.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl">
        <Calendar size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
          No Date-Wise Records Found
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No study sessions or attendance have been logged in the selected date range. Choose another range or log a session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dateAggregates.map((d) => {
        const productiveHours = ((d.studySeconds || 0) / 3600).toFixed(2);
        const breakMins = Math.round((d.breakSeconds || 0) / 60);

        return (
          <div
            key={d.date}
            onClick={() => onSelectDate && onSelectDate(d)}
            className="group relative bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 hover:shadow-md rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Top row: Date + Day Name + Quick Status Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex flex-col items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  <span className="text-[10px] uppercase opacity-80 leading-none">
                    {(d.dayName || 'Day').slice(0, 3)}
                  </span>
                  <span className="text-sm font-black leading-tight mt-0.5">
                    {d.date.slice(8, 10)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {d.date}
                    </span>
                    <span className="text-xs text-slate-400">({d.dayName})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {d.sessionsCount || 0} Sessions Logged • {d.subjectsList?.join(', ') || 'General Studies'}
                  </p>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                    d.attendanceStatus === 'Present'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <UserCheck size={12} />
                  <span>{d.attendanceStatus || 'Present'}</span>
                </span>

                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1 mono-number">
                  <Clock size={12} />
                  <span>{formatSecondsToHMS(d.studySeconds || 0)}</span>
                </span>

                <div className="w-6 h-6 rounded-lg text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition flex items-center justify-center shrink-0">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>

            {/* Bottom 14-Metric Structured Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3 text-xs">
              {/* 1. Productive Study Duration */}
              <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-dark-950/40">
                <span className="text-[10px] text-slate-400 block font-medium">Productive Study</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 mono-number mt-0.5 block">
                  {formatSecondsToHMS(d.studySeconds || 0)}
                </span>
              </div>

              {/* 2. Break Duration */}
              <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-dark-950/40">
                <span className="text-[10px] text-slate-400 block font-medium">Breaks</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 mono-number mt-0.5 block">
                  {breakMins} mins
                </span>
              </div>

              {/* 3. Subjects Studied */}
              <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-dark-950/40">
                <span className="text-[10px] text-slate-400 block font-medium">Subjects Studied</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block truncate">
                  {d.subjectsCount || 0} Subject{d.subjectsCount === 1 ? '' : 's'}
                </span>
              </div>

              {/* 4. Topics Studied */}
              <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-dark-950/40">
                <span className="text-[10px] text-slate-400 block font-medium">Topics Studied</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {d.topicsCount || 0} Topics
                </span>
              </div>

              {/* 5. Completed vs Pending */}
              <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-dark-950/40">
                <span className="text-[10px] text-slate-400 block font-medium">Topics Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {d.completedTopicsCount || 0} Done / {d.pendingTopicsCount || 0} Pend
                </span>
              </div>

              {/* 6. Lecture & Notes Status */}
              <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-dark-950/40">
                <span className="text-[10px] text-slate-400 block font-medium">Lecture & Notes</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
                  {d.lectureStatus || 'Done'} • {d.notesStatus || 'Done'}
                </span>
              </div>

              {/* 7. Revision & Goals */}
              <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-dark-950/40">
                <span className="text-[10px] text-slate-400 block font-medium">Revision & Goals</span>
                <span className="font-bold text-violet-600 dark:text-violet-400 mt-0.5 block">
                  {d.revisionStatus || 'Done'} • {d.goalsCompletedCount || 0} Goal{d.goalsCompletedCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
