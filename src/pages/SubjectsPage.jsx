import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  ChevronRight,
  Play,
  Layers,
  CheckCircle,
  FileText,
  Trophy,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { useTimer } from '../context/TimerContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { SubjectModal } from '../components/subjects/SubjectModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { CompletionNoteModal } from '../components/common/CompletionNoteModal';
import { formatSecondsToShort, formatHoursToShort } from '../utils/timerUtils';
import { formatFriendlyDate, getTodayDateString } from '../utils/dateUtils';

export function SubjectsPage({ setActivePage, setSelectedSubjectId = null }) {
  const {
    subjects,
    preparations,
    topics,
    sessions,
    timetable,
    activePrepId,
    deleteSubject,
    completeSubject,
    reopenSubject,
    updateSubjectNote,
  } = useStudy();

  const { startStudy } = useTimer();

  const [searchQuery, setSearchQuery] = useState('');
  const [prepFilter, setPrepFilter] = useState(activePrepId || 'all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Completion Note Modal state
  const [completeTargetSubject, setCompleteTargetSubject] = useState(null);
  const [isNoteEditOnly, setIsNoteEditOnly] = useState(false);

  const handleConfirmSubjectCompletion = (note) => {
    if (!completeTargetSubject) return;
    if (isNoteEditOnly) {
      updateSubjectNote(completeTargetSubject.id, note);
    } else {
      completeSubject(completeTargetSubject.id, note);
    }
    setCompleteTargetSubject(null);
  };

  const todayStr = getTodayDateString();

  // Filter subjects
  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.whyImportant && s.whyImportant.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPrep = prepFilter === 'all' || s.preparationId === prepFilter;
    return matchesSearch && matchesPrep;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-brand-500" size={20} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Subject Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize modules, track topic completion percentages, and monitor dedicated study hours.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSubject(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Plus size={16} />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-900 dark:text-white outline-none focus:border-brand-500"
          />
        </div>

        {/* Preparation Dropdown Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 shrink-0 font-medium">Filter by Prep:</span>
          <select
            value={prepFilter}
            onChange={(e) => setPrepFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-300 font-semibold outline-none"
          >
            <option value="all">All Preparations</option>
            {preparations.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((sub) => {
          const prep = preparations.find((p) => p.id === sub.preparationId);
          const subTopics = topics.filter((t) => t.subjectId === sub.id);
          const completedTopics = subTopics.filter((t) => t.status === 'Completed').length;
          const pendingTopics = subTopics.filter((t) => t.status !== 'Completed').length;
          const totalTopics = subTopics.length;
          const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

          // Sessions stats
          const subSessions = sessions.filter((s) => s.subjectId === sub.id);
          const totalStudySeconds = subSessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);
          const todayStudySeconds = subSessions
            .filter((s) => s.date === todayStr)
            .reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);

          // Last studied date
          const sortedSubSessions = [...subSessions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          const lastStudiedDate = sortedSubSessions[0]?.date
            ? sortedSubSessions[0].date === todayStr
              ? 'Today'
              : formatFriendlyDate(sortedSubSessions[0].date)
            : 'Never';

          // Next scheduled timetable slot
          const nextSlot = timetable.find((t) => t.subjectId === sub.id);

          return (
            <div
              key={sub.id}
              className="glass-card p-6 flex flex-col justify-between relative transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 group"
            >
              <div>
                {/* Top header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: sub.color || '#6366f1' }}
                    />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                      {prep?.name || 'General'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={sub.status} size="xs" />
                    <PriorityBadge priority={sub.priority} />
                  </div>
                </div>

                {/* Subject Title */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {sub.name}
                </h3>
                {sub.whyImportant && (
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-1">
                    💡 {sub.whyImportant}
                  </p>
                )}
                {sub.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>
                )}

                {sub.videoLinks && sub.videoLinks.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <span>🎥 Video Links</span>
                    </div>
                    {sub.videoLinks.slice(0, 2).map((link, idx) => (
                      <a key={idx} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline">
                        <span className="text-[10px] opacity-70">▶</span>
                        <span className="truncate">{link}</span>
                      </a>
                    ))}
                    {sub.videoLinks.length > 2 && (
                      <span className="text-[10px] text-slate-400 pl-4">
                        +{sub.videoLinks.length - 2} more...
                      </span>
                    )}
                  </div>
                )}

                {/* Topic Progress Bar */}
                <div className="mt-5">
                  <ProgressBar
                    value={progressPercent}
                    max={100}
                    label="Topic Progress"
                    subLabel={`${completedTopics} / ${totalTopics} (${progressPercent}%)`}
                    height="h-2"
                    color="bg-emerald-500"
                  />
                </div>

                {/* Subject Dashboard Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-xl bg-slate-50 dark:bg-dark-950/60 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Studied</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mono-number">
                      {formatSecondsToShort(totalStudySeconds)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Target Hours</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 mono-number">
                      {sub.targetHours}h
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Today Studied</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-number">
                      {formatSecondsToShort(todayStudySeconds)}
                    </span>
                  </div>
                </div>

                {/* Last Studied & Next Scheduled */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Last: <strong>{lastStudiedDate}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>
                      Next:{' '}
                      <strong>
                        {nextSlot ? `${nextSlot.day} ${nextSlot.startTime}` : 'None'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Final Status Note Display for Completed Subject */}
                {sub.status === 'Completed' && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[10px]">
                          <Trophy size={12} />
                          <span>Final Status Note</span>
                          {sub.completedAt && (
                            <span className="font-normal text-slate-400 lowercase">• {formatFriendlyDate(sub.completedAt.slice(0, 10))}</span>
                          )}
                        </div>
                        <p className="mt-1 text-slate-700 dark:text-slate-200 font-medium italic leading-relaxed">
                          "{sub.completionNote || 'Subject completed successfully.'}"
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCompleteTargetSubject(sub);
                          setIsNoteEditOnly(true);
                        }}
                        className="p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition shrink-0"
                        title="Edit Final Status Note"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Action Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (setSelectedSubjectId) setSelectedSubjectId(sub.id);
                      setActivePage('topics');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-300 flex items-center gap-1 transition"
                  >
                    <span>{subTopics.length} Topics</span>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => {
                      const firstPending = subTopics.find((t) => t.status !== 'Completed');
                      startStudy({
                        preparationId: sub.preparationId,
                        subjectId: sub.id,
                        topicId: firstPending?.id || null,
                      });
                      setActivePage('timer');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition"
                    title="Start Study for this Subject"
                  >
                    <Play size={12} className="fill-white" />
                    <span>Study</span>
                  </button>

                  {/* Complete / Reopen / Edit Note buttons */}
                  {sub.status !== 'Completed' ? (
                    <button
                      onClick={() => {
                        setCompleteTargetSubject(sub);
                        setIsNoteEditOnly(false);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 transition border border-emerald-200/50 dark:border-emerald-800/30"
                      title="Mark Subject as Completed & Add Final Status Note"
                    >
                      <CheckCircle size={13} />
                      <span>Complete</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setCompleteTargetSubject(sub);
                          setIsNoteEditOnly(true);
                        }}
                        className="px-2 py-1 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition flex items-center gap-1"
                        title="Edit Final Status Note"
                      >
                        <FileText size={12} />
                        <span>Note</span>
                      </button>
                      <button
                        onClick={() => reopenSubject(sub.id)}
                        className="px-2 py-1 text-xs font-medium rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Reopen Subject"
                      >
                        Reopen
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingSubject(sub);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit Subject"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(sub.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    title="Delete Subject"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Add/Edit */}
      <SubjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSubject(null);
        }}
        initialData={editingSubject}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteSubject(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Subject?"
        message="Deleting this subject will remove all associated topics and timetable slots."
        confirmText="Yes, Delete"
        isDestructive={true}
      />

      {/* Final Status Note Modal for Subject */}
      <CompletionNoteModal
        isOpen={!!completeTargetSubject}
        onClose={() => setCompleteTargetSubject(null)}
        onConfirm={handleConfirmSubjectCompletion}
        itemType="subject"
        itemName={completeTargetSubject?.name || ''}
        initialNote={completeTargetSubject?.completionNote || ''}
        isEditOnly={isNoteEditOnly}
      />
    </div>
  );
}
