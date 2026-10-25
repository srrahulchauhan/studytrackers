import React, { useState, useEffect } from 'react';
import { Clock, Calendar, BookOpen, Target, FileText, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useStudy } from '../../context/StudyContext';
import { getTodayDateString } from '../../utils/dateUtils';

export function LogSessionModal({ isOpen, onClose }) {
  const {
    preparations,
    subjects,
    topics,
    activePrepId,
    logManualSession,
    addToast,
  } = useStudy();

  const [date, setDate] = useState(getTodayDateString());
  const [prepId, setPrepId] = useState(activePrepId || preparations[0]?.id || '');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [durationHours, setDurationHours] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:30 AM');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [notes, setNotes] = useState('');

  // Filter subjects by chosen preparation
  const availableSubjects = subjects.filter(
    (s) => !prepId || s.preparationId === prepId
  );

  // Filter topics by chosen subject
  const availableTopics = topics.filter(
    (t) => !subjectId || t.subjectId === subjectId
  );

  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.some((s) => s.id === subjectId)) {
      setSubjectId(availableSubjects[0].id);
    }
  }, [prepId, availableSubjects]);

  useEffect(() => {
    if (availableTopics.length > 0 && !availableTopics.some((t) => t.id === topicId)) {
      setTopicId(availableTopics[0].id);
    } else if (availableTopics.length === 0) {
      setTopicId('');
    }
  }, [subjectId, availableTopics]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const hours = parseFloat(durationHours) || 0;
    const mins = parseInt(durationMinutes, 10) || 0;
    const totalSecs = Math.max(300, Math.round((hours * 60 + mins) * 60)); // at least 5 minutes

    const breakSecs = (parseInt(breakMinutes, 10) || 0) * 60;

    logManualSession({
      date,
      preparationId: prepId || availableSubjects[0]?.preparationId || '',
      subjectId,
      topicId,
      startTime,
      endTime,
      totalDuration: totalSecs + breakSecs,
      actualStudyDuration: totalSecs,
      breakDuration: breakSecs,
      breaks: breakSecs > 0 ? [{ duration: breakSecs, reason: 'Rest' }] : [],
      status: 'Completed',
      notes: notes.trim(),
    });

    // Reset notes
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Study Session to History"
      subtitle="Record offline or completed study hours. Automatically updates date-wise records & syncs to Google Sheets."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-500" />
            <span>Study Date</span>
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        {/* Preparation & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Course / Preparation
            </label>
            <select
              value={prepId}
              onChange={(e) => setPrepId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            >
              {preparations.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <select
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            >
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Topic (Optional)
          </label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
          >
            <option value="">General Study / Whole Subject</option>
            {availableTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Duration Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Clock size={13} className="text-emerald-500" />
              <span>Study Hours</span>
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="1"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Minutes
            </label>
            <input
              type="number"
              min="0"
              max="59"
              step="5"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Start & End Times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Time
            </label>
            <input
              type="text"
              placeholder="e.g. 09:00 AM"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Time
            </label>
            <input
              type="text"
              placeholder="e.g. 10:30 AM"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Study Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Session Notes / What You Completed
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Completed 20 Practice Questions and revised Chapter Summary..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition active:scale-95"
          >
            <CheckCircle2 size={15} />
            <span>Save to History</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
