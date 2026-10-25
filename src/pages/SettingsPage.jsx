import {
  Database,
  Moon,
  RefreshCw,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Trash2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { useStudy } from "../context/StudyContext";
import { useTheme } from "../context/ThemeContext";
import { useTimer } from "../context/TimerContext";
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from "../utils/googleSheetsSync";

export function SettingsPage() {
  const {
    settings,
    updateSettings,
    clearAllData,
    resetToSampleData,
    addToast,
    syncStatus,
    syncNow,
  } = useStudy();
  const { theme, toggleTheme } = useTheme();
  const { resetTimer } = useTimer();

  const [isClearDataConfirmOpen, setIsClearDataConfirmOpen] = useState(false);
  const [isResetSampleConfirmOpen, setIsResetSampleConfirmOpen] =
    useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    addToast("Apps Script template copied to clipboard! 📋", "success");
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const [form, setForm] = useState({
    dailyTargetHours: settings?.dailyTargetHours || 4,
    minAttendanceMinutes: settings?.minAttendanceMinutes || 30,
    defaultSessionMinutes: settings?.defaultSessionMinutes || 45,
    pomodoroStudyMinutes: settings?.pomodoro?.studyMinutes || 25,
    pomodoroShortBreak: settings?.pomodoro?.shortBreakMinutes || 5,
    pomodoroLongBreak: settings?.pomodoro?.longBreakMinutes || 15,
    pomodoroCycles: settings?.pomodoro?.cyclesBeforeLongBreak || 4,
    soundEnabled: settings?.soundEnabled ?? true,
    timeFormat: settings?.timeFormat || "12h",
    weekStartDay: settings?.weekStartDay || "Monday",
    browserNotifications: settings?.browserNotifications || false,
    googleSheetsSyncEnabled: settings?.googleSheetsSyncEnabled || false,
    googleSheetsSyncUrl: settings?.googleSheetsSyncUrl || "",
    googleSheetsSyncKey: settings?.googleSheetsSyncKey || "",
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings({
      dailyTargetHours: parseFloat(form.dailyTargetHours) || 4,
      minAttendanceMinutes: parseInt(form.minAttendanceMinutes, 10) || 30,
      defaultSessionMinutes: parseInt(form.defaultSessionMinutes, 10) || 45,
      pomodoro: {
        studyMinutes: parseInt(form.pomodoroStudyMinutes, 10) || 25,
        shortBreakMinutes: parseInt(form.pomodoroShortBreak, 10) || 5,
        longBreakMinutes: parseInt(form.pomodoroLongBreak, 10) || 15,
        cyclesBeforeLongBreak: parseInt(form.pomodoroCycles, 10) || 4,
      },
      soundEnabled: form.soundEnabled,
      timeFormat: form.timeFormat,
      weekStartDay: form.weekStartDay,
      browserNotifications: form.browserNotifications,
      googleSheetsSyncEnabled: form.googleSheetsSyncEnabled,
      googleSheetsSyncUrl: form.googleSheetsSyncUrl.trim(),
      googleSheetsSyncKey: form.googleSheetsSyncKey.trim(),
    });
    addToast("Preferences and settings saved!", "success");
  };

  const handleSyncNow = async () => {
    try {
      await syncNow();
    } catch (error) {
      // Error is already displayed to the user.
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-brand-500" size={20} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Application Settings & Preferences
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Customize timer parameters, attendance rules, themes, audio chimes,
            Google Sheets sync, and week formats.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Save size={15} />
          <span>Save Preferences</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Targets & Attendance Parameters */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Study Targets & Attendance Calibration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Daily Study Target (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={form.dailyTargetHours}
                onChange={(e) =>
                  setForm({ ...form, dailyTargetHours: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Primary baseline for daily progress calculation
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Minimum Attendance Duration (Minutes)
              </label>
              <input
                type="number"
                min="10"
                max="180"
                step="5"
                value={form.minAttendanceMinutes}
                onChange={(e) =>
                  setForm({ ...form, minAttendanceMinutes: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Study minutes required to be marked PRESENT
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Session Duration (Minutes)
              </label>
              <input
                type="number"
                min="15"
                max="240"
                step="15"
                value={form.defaultSessionMinutes}
                onChange={(e) =>
                  setForm({ ...form, defaultSessionMinutes: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Preset time for new timer sessions
              </span>
            </div>
          </div>
        </div>

        {/* Google Sheets Sync */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="text-emerald-500" size={18} />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Google Sheets Sync
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Save the complete study workspace to your linked sheet.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.googleSheetsSyncEnabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    googleSheetsSyncEnabled: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Apps Script Web App URL
              </label>
              <input
                type="url"
                value={form.googleSheetsSyncUrl}
                onChange={(e) =>
                  setForm({ ...form, googleSheetsSyncUrl: e.target.value })
                }
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Create this endpoint from the Apps Script included with the
                project.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Optional Sync Key
              </label>
              <input
                type="password"
                value={form.googleSheetsSyncKey}
                onChange={(e) =>
                  setForm({ ...form, googleSheetsSyncKey: e.target.value })
                }
                placeholder="Only needed if enabled in Apps Script"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950/60 p-3">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Sync status
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {syncStatus.isSyncing
                    ? "Syncing…"
                    : syncStatus.lastSyncedAt
                      ? `Last synced: ${new Date(syncStatus.lastSyncedAt).toLocaleString()}`
                      : syncStatus.error
                        ? `Last error: ${syncStatus.error}`
                        : "Not synced yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncStatus.isSyncing}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw
                  size={14}
                  className={syncStatus.isSyncing ? "animate-spin" : ""}
                />
                <span>{syncStatus.isSyncing ? "Syncing" : "Sync now"}</span>
              </button>
            </div>

            {/* Apps Script Code Copy & Guide */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Google Apps Script Deployment Code
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  {copiedScript ? (
                    <Check size={13} className="text-emerald-500" />
                  ) : (
                    <Copy size={13} />
                  )}
                  <span>{copiedScript ? "Copied!" : "Copy Script Code"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                1. Open <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-500 font-bold hover:underline inline-flex items-center gap-0.5">sheets.new <ExternalLink size={10} /></a> &gt; Extensions &gt; Apps Script.
                <br />
                2. Paste the copied code, click <strong>Deploy &gt; New deployment &gt; Web app</strong>.
                <br />
                3. Choose <strong>Execute as: "Me"</strong>, <strong>Who has access: "Anyone"</strong>, then paste your Web App URL above!
              </p>
            </div>
          </div>
        </div>

        {/* Pomodoro Technique Settings */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Pomodoro Interval Presets
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Study Interval (Mins)
              </label>
              <input
                type="number"
                min="5"
                max="90"
                value={form.pomodoroStudyMinutes}
                onChange={(e) =>
                  setForm({ ...form, pomodoroStudyMinutes: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Short Break (Mins)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={form.pomodoroShortBreak}
                onChange={(e) =>
                  setForm({ ...form, pomodoroShortBreak: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Long Break (Mins)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={form.pomodoroLongBreak}
                onChange={(e) =>
                  setForm({ ...form, pomodoroLongBreak: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Cycles for Long Break
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={form.pomodoroCycles}
                onChange={(e) =>
                  setForm({ ...form, pomodoroCycles: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Display & Formatting Preferences */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Display & UI Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Appearance Theme
              </label>
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm font-semibold flex items-center justify-between transition"
              >
                <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
                {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Time Format
              </label>
              <select
                value={form.timeFormat}
                onChange={(e) =>
                  setForm({ ...form, timeFormat: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              >
                <option value="12h">12-Hour (07:30 PM)</option>
                <option value="24h">24-Hour (19:30)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                First Day of Week
              </label>
              <select
                value={form.weekStartDay}
                onChange={(e) =>
                  setForm({ ...form, weekStartDay: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 text-sm text-slate-900 dark:text-white outline-none"
              >
                <option value="Monday">Monday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                Timer Audio Synthesizer
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Play pleasant chimes on timer start, pause, break, and
                completion
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.soundEnabled}
                onChange={(e) =>
                  setForm({ ...form, soundEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
            </label>
          </div>
        </div>

        {/* Data Management & Reset Clean Slate Section */}
        <div className="glass-card p-6 border-rose-200/80 dark:border-rose-900/50 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center gap-2">
              <Trash2 className="text-rose-600 dark:text-rose-400" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Data Management & Reset Options
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              Danger Zone
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your stored study records. You can start completely fresh
            with clean zeroed data or restore sample demo plans.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Option 1: Clear All Data (Fresh Start) */}
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  <Sparkles size={15} />
                  <h4>Clear All Data (Fresh Start)</h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Clears all sample preparations, subjects, topics, past
                  sessions, and attendance. Gives you a 100% clean, fresh
                  workspace with 0 hours, ready for your own custom syllabus.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClearDataConfirmOpen(true)}
                className="w-full px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
              >
                <Trash2 size={14} />
                <span>Clear All Data & Start Fresh</span>
              </button>
            </div>

            {/* Option 2: Restore Demo Sample Data */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950/50 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
                  <RotateCcw size={15} />
                  <h4>Restore Demo Sample Data</h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Re-populates the workspace with rich pre-configured demo plans
                  (MERN Stack, Govt Exam, syllabus topics, and sample study
                  logs).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetSampleConfirmOpen(true)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
              >
                <RotateCcw size={14} />
                <span>Restore Demo Sample Data</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-500/20 transition transform active:scale-98"
          >
            Save All Settings
          </button>
        </div>
      </form>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isClearDataConfirmOpen}
        onClose={() => setIsClearDataConfirmOpen(false)}
        onConfirm={() => {
          resetTimer();
          clearAllData();
          setIsClearDataConfirmOpen(false);
        }}
        title="Clear All Data & Start Fresh?"
        message="Are you sure you want to clear all data? This will permanently remove all study sessions, subjects, topics, timetable, and attendance records, giving you a 100% clean, fresh workspace starting from 0."
        confirmText="Yes, Clear All Data"
        isDestructive={true}
      />

      <ConfirmDialog
        isOpen={isResetSampleConfirmOpen}
        onClose={() => setIsResetSampleConfirmOpen(false)}
        onConfirm={() => {
          resetTimer();
          resetToSampleData();
          setIsResetSampleConfirmOpen(false);
        }}
        title="Restore Demo Sample Data?"
        message="This will reload the pre-configured sample preparations, subjects, timetable, and demo study logs."
        confirmText="Yes, Load Demo Data"
        isDestructive={false}
      />
    </div>
  );
}
