import React, { useState } from 'react';
import {
  Play,
  Pause,
  Coffee,
  Square,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { useTimer } from '../../context/TimerContext';
import { useStudy } from '../../context/StudyContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CompletionNoteModal } from '../common/CompletionNoteModal';

export function TimerControls({ onStartNewSession = null }) {
  const { topics } = useStudy();
  const {
    session,
    isRunning,
    isPaused,
    isBreak,
    isIdle,
    pauseStudy,
    resumeStudy,
    takeBreak,
    resumeFromBreak,
    stopSession,
    completeTopicAndStop,
    resetTimer,
  } = useTimer();

  const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const activeTopic = topics.find((t) => t.id === session.topicId);

  if (isIdle) {
    return (
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onStartNewSession}
          className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-brand-500/25 transition transform active:scale-98"
        >
          <Play size={20} className="fill-white" />
          <span>START STUDY</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6">
        {/* RUNNING STATE */}
        {isRunning && (
          <>
            <button
              onClick={pauseStudy}
              className="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition transform active:scale-98"
            >
              <Pause size={17} />
              <span>PAUSE</span>
            </button>

            <button
              onClick={() => takeBreak('Rest')}
              className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition transform active:scale-98"
            >
              <Coffee size={17} />
              <span>TAKE BREAK</span>
            </button>
          </>
        )}

        {/* PAUSED STATE */}
        {isPaused && (
          <>
            <button
              onClick={resumeStudy}
              className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition transform active:scale-98"
            >
              <Play size={17} className="fill-white" />
              <span>RESUME</span>
            </button>

            <button
              onClick={() => takeBreak('Rest')}
              className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition transform active:scale-98"
            >
              <Coffee size={17} />
              <span>TAKE BREAK</span>
            </button>
          </>
        )}

        {/* BREAK STATE */}
        {isBreak && (
          <button
            onClick={resumeFromBreak}
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition transform active:scale-98"
          >
            <Play size={17} className="fill-white" />
            <span>RESUME STUDY</span>
          </button>
        )}

        {/* STOP BUTTON */}
        <button
          onClick={() => setIsStopConfirmOpen(true)}
          className="py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition transform active:scale-98"
        >
          <Square size={16} />
          <span>STOP & SAVE</span>
        </button>

        {/* COMPLETE TOPIC BUTTON */}
        {session.topicId && (
          <button
            onClick={() => setIsCompleteModalOpen(true)}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition transform active:scale-98"
          >
            <CheckCircle size={17} />
            <span>COMPLETE TOPIC</span>
          </button>
        )}

        {/* RESET DISCARD BUTTON */}
        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="p-3 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Reset and discard current session"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isStopConfirmOpen}
        onClose={() => setIsStopConfirmOpen(false)}
        onConfirm={() => stopSession()}
        title="Stop Study Session?"
        message="Your actual study hours and break details will be logged into your Study History and Attendance."
        confirmText="Yes, Stop & Save"
        isDestructive={false}
      />

      {/* Final Status Note Modal for Topic Completion */}
      <CompletionNoteModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onConfirm={(completionNote) => completeTopicAndStop(completionNote)}
        itemType="topic"
        itemName={activeTopic?.name || 'Current Topic'}
      />

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetTimer}
        title="Discard Current Session?"
        message="Are you sure you want to reset the timer without saving? Any study time in this session will not be recorded."
        confirmText="Discard Session"
        isDestructive={true}
      />
    </>
  );
}
