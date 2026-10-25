import React from 'react';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  Target,
  CheckCircle2,
  Coffee,
  UserCheck,
  Award,
  ChevronRight,
} from 'lucide-react';
import { formatSecondsToHMS } from '../../utils/timerUtils';

export function DateDetailModal({
  isOpen,
  onClose,
  dateData,
  onSelectSession,
  subjects = [],
  topics = [],
}) {
  if (!isOpen || !dateData) return null;

  const subMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Daily Study Report: {dateData.date}
              </h3>
              <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                <span>{dateData.dayName || 'Study Day'}</span>
                <span>•</span>
                <span>{dateData.sessionsCount || 0} Study Sessions</span>
                <span>•</span>
                <span className="font-bold">{dateData.attendanceStatus || 'Present'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-dark-scroll">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-center">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block uppercase">
                Productive Study
              </span>
              <span className="text-lg font-black text-blue-700 dark:text-blue-300 mono-number mt-0.5 block">
                {formatSecondsToHMS(dateData.studySeconds || 0)}
              </span>
              <span className="text-[10px] text-blue-600/80">
                {((dateData.studySeconds || 0) / 3600).toFixed(1)} hrs
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-center">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase">
                Break Duration
              </span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-300 mono-number mt-0.5 block">
                {formatSecondsToHMS(dateData.breakSeconds || 0)}
              </span>
              <span className="text-[10px] text-amber-600/80">
                {Math.round((dateData.breakSeconds || 0) / 60)} mins
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                Topics Studied
              </span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 mono-number mt-0.5 block">
                {dateData.topicsCount || 0}
              </span>
              <span className="text-[10px] text-emerald-600/80">
                {dateData.completedTopicsCount || 0} completed
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 text-center">
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 block uppercase">
                Attendance
              </span>
              <span className="text-lg font-black text-teal-700 dark:text-teal-300 mt-0.5 block">
                {dateData.attendanceStatus || 'Present'}
              </span>
              <span className="text-[10px] text-teal-600/80">
                {dateData.attendanceNote || 'Met criteria'}
              </span>
            </div>
          </div>

          {/* Subjects Studied in this day */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
              Subjects Studied on this Day
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(dateData.subjectsList || []).length === 0 ? (
                <span className="text-xs text-slate-400 italic">General study logged</span>
              ) : (
                dateData.subjectsList.map((sub, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs"
                  >
                    {sub}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Individual Study Sessions List on this Date */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Study Sessions Logged on {dateData.date} ({dateData.sessions?.length || 0})
              </span>
              <span className="text-[10px] text-slate-400">Click a session to view details</span>
            </div>

            <div className="space-y-2">
              {(dateData.sessions || []).map((s, idx) => {
                const subName = subMap[s.subjectId] || 'General Subject';
                const topName = topicMap[s.topicId] || 'General Topic';
                return (
                  <div
                    key={s.id || idx}
                    onClick={() => {
                      if (onSelectSession) onSelectSession(s);
                    }}
                    className="p-3 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {subName}
                          </span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                            {topName}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {s.startTime ? `${s.startTime} - ${s.endTime || 'Active'}` : 'Logged Session'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mono-number">
                        {formatSecondsToHMS(s.actualStudyDuration || 0)}
                      </span>
                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-dark-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
