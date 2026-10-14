import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useStudy } from '../../context/StudyContext';
import { getTodayDateString } from '../../utils/dateUtils';

const COLOR_PRESETS = [
  '#0284c7', // Sky
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#6366f1', // Indigo
  '#ef4444', // Rose
  '#14b8a6', // Teal
];

const ICON_PRESETS = ['Code', 'Zap', 'Atom', 'Server', 'Database', 'Calculator', 'Brain', 'BookOpen', 'MessageSquare'];

export function SubjectModal({ isOpen, onClose, initialData = null }) {
  const { preparations, activePrepId, addPreparation, addSubject, updateSubject } = useStudy();

  const [formData, setFormData] = useState({
    preparationId: activePrepId || '',
    name: '',
    description: '',
    whyImportant: '',
    targetDate: '',
    priority: 'High',
    totalTargetHours: 40,
    dailyTargetHours: 1.5,
    status: 'In Progress',
    completionNote: '',
    color: '#0284c7',
    icon: 'BookOpen',
    videoLinks: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        completionNote: initialData.completionNote || '',
        videoLinks: Array.isArray(initialData.videoLinks) ? initialData.videoLinks.join('\n') : (initialData.videoLinks || ''),
      });
    } else {
      setFormData({
        preparationId: activePrepId || (preparations[0]?.id || ''),
        name: '',
        description: '',
        whyImportant: '',
        targetDate: '',
        priority: 'High',
        totalTargetHours: 40,
        dailyTargetHours: 1.5,
        status: 'In Progress',
        completionNote: '',
        color: '#0284c7',
        icon: 'BookOpen',
        videoLinks: '',
      });
    }
    setErrors({});
  }, [initialData, activePrepId, preparations, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Subject Name is required';
    if (preparations.length > 0 && !formData.preparationId) {
      errs.preparationId = 'Please select a preparation';
    }
    if (Number(formData.totalTargetHours) <= 0) errs.totalTargetHours = 'Total target hours must be > 0';
    if (Number(formData.dailyTargetHours) <= 0) errs.dailyTargetHours = 'Daily target hours must be > 0';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    let targetPrepId = formData.preparationId;
    if (!targetPrepId && preparations.length === 0) {
      const newPrep = addPreparation({
        name: 'My Study Plan',
        description: 'Personal study journey',
        purpose: 'Master curriculum and reach target hours',
        priority: 'High',
        dailyTarget: 4,
        weeklyTarget: 25,
      });
      targetPrepId = newPrep.id;
    }

    const payload = {
      ...formData,
      preparationId: targetPrepId,
      videoLinks: formData.videoLinks
        ? formData.videoLinks.split('\n').map(l => l.trim()).filter(l => l)
        : [],
    };

    if (initialData?.id) {
      updateSubject(initialData.id, payload);
    } else {
      addSubject(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Subject' : 'Add New Subject'}
      subtitle="Group topics, study hours, and targets under this subject"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preparation Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Associated Preparation *
          </label>
          {preparations.length === 0 ? (
            <div className="p-3 rounded-xl border border-brand-200 dark:border-brand-900 bg-brand-50/50 dark:bg-brand-950/30 text-xs text-brand-700 dark:text-brand-300">
              No study plan exists yet. A default plan ("My Study Plan") will be created automatically for this subject.
            </div>
          ) : (
            <select
              value={formData.preparationId}
              onChange={(e) => setFormData({ ...formData, preparationId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
            >
              {preparations.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {errors.preparationId && <p className="text-xs text-rose-500 mt-1">{errors.preparationId}</p>}
        </div>

        {/* Subject Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Subject Name *
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

        {/* Why this subject is important */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Why this subject is important
          </label>
          <input
            type="text"
            value={formData.whyImportant}
            onChange={(e) => setFormData({ ...formData, whyImportant: e.target.value })}
            placeholder=""
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Description
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
            Video Links / Resources (One URL per line)
          </label>
          <textarea
            rows={2}
            value={formData.videoLinks}
            onChange={(e) => setFormData({ ...formData, videoLinks: e.target.value })}
            placeholder="https://youtube.com/..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none font-mono text-xs"
          />
        </div>

        {/* Target Date & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Completion Date
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
        </div>

        {/* Target Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Total Target Hours *
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={formData.totalTargetHours}
              onChange={(e) => setFormData({ ...formData, totalTargetHours: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
            />
            {errors.totalTargetHours && <p className="text-xs text-rose-500 mt-1">{errors.totalTargetHours}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Daily Target Hours *
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={formData.dailyTargetHours}
              onChange={(e) => setFormData({ ...formData, dailyTargetHours: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none"
            />
            {errors.dailyTargetHours && <p className="text-xs text-rose-500 mt-1">{errors.dailyTargetHours}</p>}
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
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Final Status Note when Subject is Completed */}
        {formData.status === 'Completed' && (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5 animate-fade-in">
            <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              🏆 Final Status Note / Subject Completion Summary
            </label>
            <textarea
              rows={2}
              value={formData.completionNote || ''}
              onChange={(e) => setFormData({ ...formData, completionNote: e.target.value })}
              placeholder="e.g., Completed all syllabus modules, covered PYQs, scored 90%+ in mock test..."
              className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-dark-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 outline-none leading-relaxed"
            />
          </div>
        )}

        {/* Color Accent Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Color Accent
          </label>
          <div className="flex items-center gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-7 h-7 rounded-full transition transform ${
                  formData.color === color ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
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
            {initialData ? 'Update Subject' : 'Add Subject'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
