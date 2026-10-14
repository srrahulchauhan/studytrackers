import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useStudy } from '../../context/StudyContext';

export function TomorrowTargetModal({ isOpen, onClose }) {
  const { preparations, subjects, topics, activePrepId, addTomorrowTarget } = useStudy();

  const [formData, setFormData] = useState({
    title: '',
    preparationId: activePrepId || '',
    subjectId: '',
    topicId: '',
    targetDurationMinutes: 60,
    startTime: '19:00',
    priority: 'High',
  });

  const availableSubjects = subjects.filter((s) => s.preparationId === formData.preparationId);
  const availableTopics = topics.filter((t) => t.subjectId === formData.subjectId);

  const handleSubmit = (e) => {
    e.preventDefault();

    addTomorrowTarget(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Study Task & Target"
      subtitle="Schedule tomorrow's study tasks & sprint targets"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Task / Target Title (Optional)
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Solve 25 Calculus Questions, Review Chapter 3"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Preparation
          </label>
          <select
            value={formData.preparationId}
            onChange={(e) => {
              const prepId = e.target.value;
              const subs = subjects.filter((s) => s.preparationId === prepId);
              setFormData({
                ...formData,
                preparationId: prepId,
                subjectId: subs[0]?.id || '',
                topicId: '',
              });
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
          >
            {preparations.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Subject (Optional)
          </label>
          <select
            value={formData.subjectId}
            onChange={(e) => {
              const subId = e.target.value;
              const tops = topics.filter((t) => t.subjectId === subId);
              setFormData({
                ...formData,
                subjectId: subId,
                topicId: tops[0]?.id || '',
              });
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
          >
            <option value="">General Study (No Subject)</option>
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Topic (Optional)
          </label>
          <select
            value={formData.topicId}
            onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
          >
            <option value="">General Subject Study</option>
            {availableTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Duration (Hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.25"
              value={formData.targetDurationMinutes ? formData.targetDurationMinutes / 60 : ''}
              onChange={(e) => setFormData({ ...formData, targetDurationMinutes: parseFloat(e.target.value) * 60 || 0 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition"
          >
            Add Tomorrow's Target
          </button>
        </div>
      </form>
    </Modal>
  );
}
