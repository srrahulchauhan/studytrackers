import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Trophy,
  Target,
  BookOpen,
  Sparkles,
  FileText,
  X,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from './Modal';

const QUICK_TAGS = {
  topic: [
    '✨ Fully Mastered',
    '📝 Solved All Exercise Questions',
    '🔁 Needs Quick Revision Later',
    '💡 Key Formulas Noted',
    '🎯 High Accuracy / Confidence',
    '⏱️ Completed on Schedule',
  ],
  subject: [
    '🏆 Full Syllabus Covered',
    '📚 Solved Previous Year Papers (PYQs)',
    '⭐ Ready for Final Exam / Tests',
    '✅ All Modules & Concepts Cleared',
    '🎯 Target Study Hours Achieved',
  ],
  task: [
    '⚡ Target Finished on Time',
    '🎯 100% Objectives Achieved',
    '💯 All Problems Solved Accurately',
    '🔥 Super Productive Focus Sprint',
    '📌 Concepts Clarified',
  ],
};

const ICONS = {
  topic: BookOpen,
  subject: Trophy,
  task: Target,
};

export function CompletionNoteModal({
  isOpen,
  onClose,
  onConfirm,
  title = '',
  itemType = 'topic', // 'topic' | 'subject' | 'task'
  itemName = '',
  initialNote = '',
  isEditOnly = false,
}) {
  const [note, setNote] = useState(initialNote || '');

  useEffect(() => {
    if (isOpen) {
      setNote(initialNote || '');
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  const ItemIcon = ICONS[itemType] || CheckCircle2;
  const quickTags = QUICK_TAGS[itemType] || QUICK_TAGS.topic;

  const handleAddTag = (tag) => {
    if (!note.trim()) {
      setNote(tag);
    } else if (!note.includes(tag)) {
      setNote(`${note.trim()}, ${tag}`);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isEditOnly) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {}
    }
    onConfirm(note.trim());
    onClose();
  };

  const handleSkip = () => {
    if (!isEditOnly) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {}
    }
    onConfirm('');
    onClose();
  };

  const placeholderText =
    itemType === 'subject'
      ? 'e.g., Completed all syllabus modules, covered PYQs, strong grasp on key chapters...'
      : itemType === 'task'
      ? 'e.g., Completed on time, solved 25 questions with 90% accuracy, reviewed mistakes...'
      : 'e.g., Theory thoroughly understood, practiced numericals, formula cheat-sheet prepared...';

  const typeLabel =
    itemType === 'subject' ? 'Subject' : itemType === 'task' ? 'Task' : 'Topic';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditOnly
          ? `Edit Final Status Note`
          : `Complete ${typeLabel}`
      }
      subtitle={
        isEditOnly
          ? `Update your final status note for "${itemName || title}"`
          : `Add final status remarks & reflection for "${itemName || title}"`
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Header Badge */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-950/80 border border-slate-200/80 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ItemIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {typeLabel}
              </span>
              <span className="text-xs text-slate-400">
                {isEditOnly ? 'Updating Final Note' : 'Marking as Completed'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {itemName || title || 'Study Item'}
            </h4>
          </div>
        </div>

        {/* Note Input */}
        <div>
          <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <FileText size={13} className="text-brand-500" />
              <span>Final Status Note / Reflection</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400 lowercase">
              optional
            </span>
          </label>
          <textarea
            rows={4}
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={placeholderText}
            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none leading-relaxed transition"
          />
        </div>

        {/* Quick Tag Suggestions */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
            Click to add quick remarks:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-dark-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-800 transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            {!isEditOnly && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
              >
                Skip note
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition transform active:scale-95"
            >
              <CheckCircle2 size={15} />
              <span>{isEditOnly ? 'Update Status Note' : 'Save & Complete'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
