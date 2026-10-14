import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useStudy } from '../../context/StudyContext';

export function TopicModal({ isOpen, onClose, initialData = null, defaultSubjectId = null, defaultStatus = 'Pending' }) {
  const { preparations, subjects, addSubject, addTopic, updateTopic } = useStudy();

  const [formData, setFormData] = useState({
    subjectId: defaultSubjectId || (subjects[0]?.id || ''),
    name: '',
    description: '',
    priority: 'High',
    targetDate: '',
    estimatedStudyTimeHours: '1.5',
    status: defaultStatus,
    completionNote: '',
    videoLinks: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        completionNote: initialData.completionNote || '',
        estimatedStudyTimeHours: initialData.estimatedStudyTime ? String(initialData.estimatedStudyTime / 60) : '',
        videoLinks: Array.isArray(initialData.videoLinks) ? initialData.videoLinks.join('\n') : (initialData.videoLinks || ''),
      });
    } else {
      setFormData({
        subjectId: defaultSubjectId || (subjects[0]?.id || ''),
        name: '',
        description: '',
        priority: 'High',
        targetDate: '',
        estimatedStudyTimeHours: '1.5',
        status: defaultStatus,
        completionNote: '',
        videoLinks: '',
      });
    }
    setErrors({});
  }, [initialData, defaultSubjectId, defaultStatus, subjects, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Topic Name is required';
    if (Number(formData.estimatedStudyTimeHours) <= 0) errs.estimatedStudyTimeHours = 'Estimated study time must be > 0';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    let subId = formData.subjectId;
    if (!subId) {
      if (subjects.length > 0) {
        subId = subjects[0].id;
      } else {
        const targetPrepId = (preparations && preparations[0]?.id) || '';
        const newSub = addSubject({
          preparationId: targetPrepId,
          name: 'General',
          color: '#6366f1',
          icon: 'BookOpen',
          totalTargetHours: 40,
          dailyTargetHours: 1.5,
        });
        subId = newSub.id;
      }
    }

    const { estimatedStudyTimeHours, ...restData } = formData;
    const payload = {
      ...restData,
      estimatedStudyTime: Math.round(Number(estimatedStudyTimeHours) * 60) || 0,
      subjectId: subId,
      videoLinks: formData.videoLinks
        ? formData.videoLinks.split('\n').map(l => l.trim()).filter(l => l)
        : [],
    };

    if (initialData?.id) {
      updateTopic(initialData.id, payload);
    } else {
      addTopic(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Topic' : 'Add New Topic'}
      subtitle="Define a specific learning concept or problem set"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Subject (Optional)
          </label>
          <select
            value={formData.subjectId}
            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
          >
            <option value="">General Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.subjectId && <p className="text-xs text-rose-500 mt-1">{errors.subjectId}</p>}
        </div>

        {/* Topic Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Topic Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder=""
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Description & Notes
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder=""
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
          />
        </div>

        {/* Video Links */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Video Links (One URL per line)
          </label>
          <textarea
            rows={2}
            value={formData.videoLinks}
            onChange={(e) => setFormData({ ...formData, videoLinks: e.target.value })}
            placeholder="https://youtube.com/..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none font-mono text-xs"
          />
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Skipped">Skipped</option>
              <option value="Revision">Revision</option>
            </select>
          </div>
        </div>

        {/* Final Status Note when Completed */}
        {formData.status === 'Completed' && (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5 animate-fade-in">
            <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              📝 Final Status Note / Remarks
            </label>
            <textarea
              rows={2}
              value={formData.completionNote || ''}
              onChange={(e) => setFormData({ ...formData, completionNote: e.target.value })}
              placeholder="e.g., Theory thoroughly understood, practiced numericals, formula cheat-sheet prepared..."
              className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 outline-none leading-relaxed"
            />
          </div>
        )}

        {/* Target Date & Estimated Study Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Date
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Estimated Study Time (Hours) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={formData.estimatedStudyTimeHours}
              onChange={(e) => setFormData({ ...formData, estimatedStudyTimeHours: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
            />
            {errors.estimatedStudyTimeHours && <p className="text-xs text-rose-500 mt-1">{errors.estimatedStudyTimeHours}</p>}
          </div>
        </div>

        {/* Actions */}
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
            {initialData ? 'Update Topic' : 'Add Topic'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
