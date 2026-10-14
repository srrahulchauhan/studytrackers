import React, { useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  CheckCircle,
  TrendingUp,
  Edit2,
  FileText,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { ProgressBar } from '../components/common/ProgressBar';
import { PriorityBadge } from '../components/common/Badge';
import { TomorrowTargetModal } from '../components/targets/TargetModal';
import { CompletionNoteModal } from '../components/common/CompletionNoteModal';
import {
  getTodayDateString,
  getTomorrowDateString,
  formatFriendlyDate,
  getCurrentWeekDates,
  DAYS_OF_WEEK,
} from '../utils/dateUtils';
import { formatSecondsToShort, formatHoursToShort } from '../utils/timerUtils';

export function TargetsPage() {
  const {
    targets,
    updateDailyTarget,
    updateWeeklyTarget,
    updateMonthlyTarget,
    completeTomorrowTarget,
    reopenTomorrowTarget,
    updateTomorrowTargetNote,
    removeTomorrowTarget,
    subjects,
    preparations,
    topics,
    sessions,
    settings,
  } = useStudy();

  const [isTomorrowModalOpen, setIsTomorrowModalOpen] = useState(false);
  const [editingDaily, setEditingDaily] = useState(false);
  const [dailyTargetHours, setDailyTargetHours] = useState(targets.daily?.targetHours || 4);

  // Final Status Note Modal for Task Completion
  const [completeTargetTask, setCompleteTargetTask] = useState(null);
  const [isNoteEditOnly, setIsNoteEditOnly] = useState(false);

  const handleConfirmTaskCompletion = (note) => {
    if (!completeTargetTask) return;
    if (isNoteEditOnly) {
      updateTomorrowTargetNote(completeTargetTask.id, note);
    } else {
      completeTomorrowTarget(completeTargetTask.id, note);
    }
    setCompleteTargetTask(null);
  };

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  // 1. Today's actual study time
  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const todayStudySeconds = todaySessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);
  const todayStudyHours = todayStudySeconds / 3600;
  const targetDailyHours = targets.daily?.targetHours || 4;
  const dailyProgress = Math.min(100, Math.round((todayStudyHours / targetDailyHours) * 100));

  // Subject-wise study today
  const todaySubjectTotals = {};
  todaySessions.forEach((s) => {
    if (s.subjectId) {
      todaySubjectTotals[s.subjectId] = (todaySubjectTotals[s.subjectId] || 0) + (s.actualStudyDuration || 0);
    }
  });

  // 2. Weekly actual study time
  const currentWeek = getCurrentWeekDates(settings?.weekStartDay === 'Sunday');
  const weekDates = currentWeek.map((w) => w.dateStr);
  const weekDateSet = new Set(weekDates);
  const weekSessions = sessions.filter((s) => weekDateSet.has(s.date));
  const weeklyStudySeconds = weekSessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);
  const weeklyStudyHours = weeklyStudySeconds / 3600;
  const weeklyTargetHours = targets.weekly?.targetHours || 25;
  const weeklyProgress = Math.min(100, Math.round((weeklyStudyHours / weeklyTargetHours) * 100));

  // 3. Monthly actual study time
  const monthPrefix = todayStr.slice(0, 7);
  const monthlySessions = sessions.filter((s) => s.date && s.date.startsWith(monthPrefix));
  const monthlyStudySeconds = monthlySessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);
  const monthlyStudyHours = monthlyStudySeconds / 3600;
  const monthlyTargetHours = targets.monthly?.targetHours || 100;
  const monthlyRemainingHours = Math.max(0, monthlyTargetHours - monthlyStudyHours);
  const monthlyProgress = Math.min(100, Math.round((monthlyStudyHours / monthlyTargetHours) * 100));

  const handleSaveDaily = () => {
    updateDailyTarget({
      ...targets.daily,
      targetHours: parseFloat(dailyTargetHours) || 4,
    });
    setEditingDaily(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6">
        <div>
          <div className="flex items-center gap-2">
            <Target className="text-brand-500" size={20} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Target Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure daily, tomorrow's, weekly, and monthly productivity benchmarks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 13: DAILY TARGET */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Daily Target
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target for today: {formatFriendlyDate(todayStr)}
                </p>
              </div>

              {!editingDaily ? (
                <button
                  onClick={() => setEditingDaily(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Edit Target"
                >
                  <Edit2 size={15} />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    value={dailyTargetHours}
                    onChange={(e) => setDailyTargetHours(e.target.value)}
                    className="w-16 px-2 py-1 text-xs rounded-lg border border-brand-500 bg-slate-50 dark:bg-dark-950 font-bold"
                  />
                  <button
                    onClick={handleSaveDaily}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-600 text-white"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white mono-number">
                    {formatSecondsToShort(todayStudySeconds)}
                  </span>
                  <span className="text-slate-400 text-sm font-medium ml-2">
                    / {targetDailyHours} Hours
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {dailyProgress}%
                </span>
              </div>

              <ProgressBar
                value={todayStudyHours}
                max={targetDailyHours}
                showLabel={false}
                height="h-3"
                color="bg-emerald-500"
              />

              {/* Subject Breakdown Target Allocation */}
              <div className="pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Today's Subject Investments
                </span>
                <div className="space-y-2">
                  {subjects.map((sub) => {
                    const studiedSec = todaySubjectTotals[sub.id] || 0;
                    if (studiedSec === 0) return null;
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-dark-950/60 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: sub.color || '#6366f1' }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {sub.name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatSecondsToShort(studiedSec)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 12: PLANNED TASKS & TARGETS */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Planned Tasks & Targets
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target sprint for: {formatFriendlyDate(tomorrowStr)}
                </p>
              </div>

              <button
                onClick={() => setIsTomorrowModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition"
              >
                <Plus size={14} />
                <span>Add Task / Target</span>
              </button>
            </div>

            {(!targets.tomorrow || targets.tomorrow.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No planned tasks or targets yet. Click "+ Add Task / Target" to schedule your sprint.
              </div>
            ) : (
              <div className="space-y-3">
                {targets.tomorrow.map((tar) => {
                  const sub = subjects.find((s) => s.id === tar.subjectId);
                  const prep = preparations.find((p) => p.id === tar.preparationId);
                  const top = topics.find((t) => t.id === tar.topicId);
                  const isTaskDone = tar.completed || tar.status === 'Completed';

                  return (
                    <div
                      key={tar.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isTaskDone
                          ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-50 dark:bg-dark-950/60 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${isTaskDone ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                              {tar.title || sub?.name || prep?.name || 'General Task'}
                            </span>
                            <PriorityBadge priority={tar.priority} />
                            {isTaskDone && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {tar.title && (sub?.name || top?.name) ? `${sub?.name || ''}${top?.name ? ' • ' + top.name : ''} • ` : ''}
                            {tar.targetDurationMinutes} mins
                            {tar.startTime && ` • Starts ${tar.startTime}`}
                          </p>
                        </div>

                        {/* Task Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!isTaskDone ? (
                            <button
                              onClick={() => {
                                setCompleteTargetTask(tar);
                                setIsNoteEditOnly(false);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 transition border border-emerald-200/50 dark:border-emerald-800/40"
                              title="Mark Task as Completed & Add Final Status Note"
                            >
                              <CheckCircle size={13} />
                              <span>Complete</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setCompleteTargetTask(tar);
                                  setIsNoteEditOnly(true);
                                }}
                                className="px-2 py-1 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition flex items-center gap-1"
                                title="Edit Final Status Note"
                              >
                                <FileText size={12} />
                                <span>Note</span>
                              </button>
                              <button
                                onClick={() => reopenTomorrowTarget(tar.id)}
                                className="px-2 py-1 text-xs font-medium rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Reopen Task"
                              >
                                Reopen
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => removeTomorrowTarget(tar.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Remove task"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Final Status Note Display for Completed Task */}
                      {isTaskDone && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                                <FileText size={11} /> Final Status Note
                                {tar.completedAt && (
                                  <span className="font-normal text-slate-400 lowercase">• {formatFriendlyDate(tar.completedAt.slice(0, 10))}</span>
                                )}
                              </span>
                              <p className="text-slate-700 dark:text-slate-300 italic mt-0.5 leading-relaxed">
                                "{tar.completionNote || 'Task completed successfully.'}"
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setCompleteTargetTask(tar);
                                setIsNoteEditOnly(true);
                              }}
                              className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded transition shrink-0"
                              title="Edit Final Status Note"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section 14: WEEKLY TARGET */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Weekly Target
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Weekly goal: {weeklyTargetHours} Hours
              </p>
            </div>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 mono-number">
              {weeklyStudyHours.toFixed(1)}h / {weeklyTargetHours}h ({weeklyProgress}%)
            </span>
          </div>

          <ProgressBar
            value={weeklyStudyHours}
            max={weeklyTargetHours}
            showLabel={false}
            height="h-2.5"
            color="bg-sky-500"
          />

          {/* Daily breakdown of weekly target */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-5 text-center text-xs">
            {DAYS_OF_WEEK.map((day) => {
              const dayTarget = targets.weekly?.dailyPlan?.[day] || 3;
              const matchingWeekDay = currentWeek.find((w) => w.dayName === day);
              const daySessions = matchingWeekDay
                ? sessions.filter((s) => s.date === matchingWeekDay.dateStr)
                : [];
              const studiedHours =
                daySessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0) / 3600;

              return (
                <div key={day} className="p-2 rounded-xl bg-slate-50 dark:bg-dark-950/60">
                  <span className="text-slate-400 text-[10px] block font-medium">
                    {day.slice(0, 3)}
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mono-number mt-0.5 block">
                    {studiedHours.toFixed(1)}h
                  </span>
                  <span className="text-[10px] text-slate-400">Target: {dayTarget}h</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 15: MONTHLY TARGET */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Target
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                September Target: {monthlyTargetHours} Hours
              </p>
            </div>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 mono-number">
              {monthlyProgress}%
            </span>
          </div>

          <ProgressBar
            value={monthlyStudyHours}
            max={monthlyTargetHours}
            showLabel={false}
            height="h-2.5"
            color="bg-violet-500"
          />

          <div className="grid grid-cols-2 gap-4 mt-5 text-center">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-950/60">
              <span className="text-xs text-slate-400 font-medium block">Completed</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mono-number mt-1 block">
                {monthlyStudyHours.toFixed(1)} Hours
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-950/60">
              <span className="text-xs text-slate-400 font-medium block">Remaining</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-200 mono-number mt-1 block">
                {monthlyRemainingHours.toFixed(1)} Hours
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Tomorrow Target */}
      <TomorrowTargetModal
        isOpen={isTomorrowModalOpen}
        onClose={() => setIsTomorrowModalOpen(false)}
      />

      {/* Final Status Note Modal for Task Completion */}
      <CompletionNoteModal
        isOpen={!!completeTargetTask}
        onClose={() => setCompleteTargetTask(null)}
        onConfirm={handleConfirmTaskCompletion}
        itemType="task"
        itemName={completeTargetTask?.title || 'Study Task'}
        initialNote={completeTargetTask?.completionNote || ''}
        isEditOnly={isNoteEditOnly}
      />
    </div>
  );
}
