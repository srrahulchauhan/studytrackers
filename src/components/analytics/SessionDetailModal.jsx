import React from 'react';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  Target,
  Layers,
  CheckCircle2,
  Coffee,
  FileText,
  UserCheck,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { formatSecondsToHMS } from '../../utils/timerUtils';

export function SessionDetailModal({ isOpen, onClose, session, subject, topic, preparation }) {
  if (!isOpen || !session) return null;

  const productiveMins = Math.round((session.actualStudyDuration || 0) / 60);
  const breakMins = Math.round((session.breakDuration || 0) / 60);
  const totalMins = Math.round((session.totalDuration || 0) / 60);

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Study Session Details
              </h3>
              <p className="text-[11px] text-blue-100 flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} />
                <span>{session.date}</span>
                {session.startTime && (
                  <>
                    <span>•</span>
                    <span>{session.startTime} - {session.endTime || 'Active'}</span>
                  </>
                )}
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

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-dark-scroll">
          {/* Main Duration Metric Row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">
                Productive Time
              </span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 mono-number mt-0.5 block">
                {formatSecondsToHMS(session.actualStudyDuration || 0)}
              </span>
              <span className="text-[10px] text-emerald-600/80">({productiveMins}m net)</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider">
                Breaks
              </span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-300 mono-number mt-0.5 block">
                {formatSecondsToHMS(session.breakDuration || 0)}
              </span>
              <span className="text-[10px] text-amber-600/80">({breakMins}m paused)</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                Elapsed
              </span>
              <span className="text-lg font-black text-slate-800 dark:text-slate-100 mono-number mt-0.5 block">
                {formatSecondsToHMS(session.totalDuration || session.actualStudyDuration || 0)}
              </span>
              <span className="text-[10px] text-slate-400">({totalMins}m total)</span>
            </div>
          </div>

          {/* Academic Context: Course, Subject, Topic */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/70 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Layers size={13} />
                <span>Course / Preparation</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {preparation?.name || 'General Studies'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <BookOpen size={13} />
                <span>Subject</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {subject?.name || 'General Subject'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Target size={13} />
                <span>Topic</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {topic?.name || 'General Study Session'}
              </span>
            </div>
          </div>

          {/* 3-Pill Status Grid: Lecture, Notes, Revision */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
              Syllabus & Milestone Verification
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
                  session.lectureCompleted ?? (topic?.lectureCompleted ?? (session.status === 'Completed'))
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-dark-950/40 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <CheckCircle2 size={16} />
                <span className="font-bold text-[11px]">Lecture</span>
                <span className="text-[10px]">
                  {session.lectureCompleted ?? (topic?.lectureCompleted ?? (session.status === 'Completed')) ? 'Completed' : 'Pending'}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
                  session.notesCompleted ?? (topic?.notesCompleted ?? (session.status === 'Completed'))
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-dark-950/40 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <FileText size={16} />
                <span className="font-bold text-[11px]">Notes</span>
                <span className="text-[10px]">
                  {session.notesCompleted ?? (topic?.notesCompleted ?? (session.status === 'Completed')) ? 'Completed' : 'Pending'}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
                  session.revisionCompleted ?? (topic?.revisionCompleted ?? (session.status === 'Completed'))
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-dark-950/40 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <CheckCircle2 size={16} />
                <span className="font-bold text-[11px]">Revision</span>
                <span className="text-[10px]">
                  {session.revisionCompleted ?? (topic?.revisionCompleted ?? (session.status === 'Completed')) ? 'Completed' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Session Notes / Key Takeaways */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
              Study Notes & Key Takeaways
            </span>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[60px]">
              {session.notes ? (
                <p className="whitespace-pre-wrap">{session.notes}</p>
              ) : (
                <p className="text-slate-400 italic">No notes written for this session.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-dark-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
