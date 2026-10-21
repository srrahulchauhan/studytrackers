// LocalStorage management helper with defaults, auto-initialization, and backup/restore

import {
  initialPreparations,
  initialSubjects,
  initialTopics,
  initialTimetable,
  initialStudySessions,
  initialAttendance,
  initialGoals,
  initialTargets,
  initialSettings,
  initialNotifications,
  initialVideoCourses,
} from './sampleData';

const STORAGE_KEYS = {
  PREPARATIONS: 'studyflow_preparations',
  SUBJECTS: 'studyflow_subjects',
  TOPICS: 'studyflow_topics',
  TIMETABLE: 'studyflow_timetable',
  SESSIONS: 'studyflow_sessions',
  ATTENDANCE: 'studyflow_attendance',
  GOALS: 'studyflow_goals',
  TARGETS: 'studyflow_targets',
  SETTINGS: 'studyflow_settings',
  NOTIFICATIONS: 'studyflow_notifications',
  VIDEO_COURSES: 'studyflow_video_courses',
  ACTIVE_PREP_ID: 'studyflow_active_prep_id',
  ACTIVE_SESSION: 'studyflow_active_session',
};

/**
 * Safely read a key from LocalStorage
 */
export function getStoredItem(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) {
      if (defaultValue !== undefined) {
        setStoredItem(key, defaultValue);
      }
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Safely write a key to LocalStorage
 */
export function setStoredItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving localStorage key "${key}":`, err);
  }
}

/**
 * Remove an item from LocalStorage
 */
export function removeStoredItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error removing localStorage key "${key}":`, err);
  }
}

/**
 * Initialize storage with clean data if first time
 */
export function initializeStorage(force = false) {
  // Ensure the app initializes with the reference dashboard data
  const isCleaned = localStorage.getItem('studyflow_mockup_v1');
  if (!isCleaned) {
    localStorage.removeItem(STORAGE_KEYS.PREPARATIONS);
    localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
    localStorage.removeItem(STORAGE_KEYS.TOPICS);
    localStorage.removeItem(STORAGE_KEYS.TIMETABLE);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.TARGETS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PREP_ID);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem('studyflow_initialized');
    localStorage.setItem('studyflow_mockup_v1', 'true');
    force = true;
  }

  const isInitialized = localStorage.getItem('studyflow_initialized');

  if (force || !isInitialized) {
    setStoredItem(STORAGE_KEYS.PREPARATIONS, initialPreparations);
    setStoredItem(STORAGE_KEYS.SUBJECTS, initialSubjects);
    setStoredItem(STORAGE_KEYS.TOPICS, initialTopics);
    setStoredItem(STORAGE_KEYS.TIMETABLE, initialTimetable);
    setStoredItem(STORAGE_KEYS.SESSIONS, initialStudySessions);
    setStoredItem(STORAGE_KEYS.ATTENDANCE, initialAttendance);
    setStoredItem(STORAGE_KEYS.GOALS, initialGoals);
    setStoredItem(STORAGE_KEYS.TARGETS, initialTargets);
    setStoredItem(STORAGE_KEYS.SETTINGS, initialSettings);
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    setStoredItem(STORAGE_KEYS.VIDEO_COURSES, initialVideoCourses);
    setStoredItem(STORAGE_KEYS.ACTIVE_PREP_ID, 'prep-1');
    localStorage.setItem('studyflow_initialized', 'true');
  } else {
    // If initialized previously but VIDEO_COURSES is missing, backfill it
    if (!localStorage.getItem(STORAGE_KEYS.VIDEO_COURSES)) {
      setStoredItem(STORAGE_KEYS.VIDEO_COURSES, initialVideoCourses);
    }
  }
}

/**
 * Reset all storage to a 100% clean, fresh slate with 0 data
 */
export function clearAllDataToFresh() {
  localStorage.setItem('studyflow_initialized', 'true');
  localStorage.setItem('studyflow_clean_v3', 'true');

  setStoredItem(STORAGE_KEYS.PREPARATIONS, []);
  setStoredItem(STORAGE_KEYS.ACTIVE_PREP_ID, '');
  setStoredItem(STORAGE_KEYS.SUBJECTS, []);
  setStoredItem(STORAGE_KEYS.TOPICS, []);
  setStoredItem(STORAGE_KEYS.TIMETABLE, []);
  setStoredItem(STORAGE_KEYS.SESSIONS, []);
  setStoredItem(STORAGE_KEYS.ATTENDANCE, []);
  setStoredItem(STORAGE_KEYS.GOALS, []);
  setStoredItem(STORAGE_KEYS.TARGETS, {
    daily: { targetHours: 4, subjectDistribution: [] },
    weekly: { targetHours: 25, dailyPlan: {} },
    monthly: { targetHours: 100 },
    tomorrow: [],
  });
  setStoredItem(STORAGE_KEYS.NOTIFICATIONS, []);
  setStoredItem(STORAGE_KEYS.VIDEO_COURSES, []);
  removeStoredItem(STORAGE_KEYS.ACTIVE_SESSION);
}

/**
 * Export all app data as a JSON string
 */
export function exportAllDataAsJSON() {
  const data = {
    version: '1.0.0',
    exportTimestamp: new Date().toISOString(),
    preparations: getStoredItem(STORAGE_KEYS.PREPARATIONS, []),
    subjects: getStoredItem(STORAGE_KEYS.SUBJECTS, []),
    topics: getStoredItem(STORAGE_KEYS.TOPICS, []),
    timetable: getStoredItem(STORAGE_KEYS.TIMETABLE, []),
    sessions: getStoredItem(STORAGE_KEYS.SESSIONS, []),
    attendance: getStoredItem(STORAGE_KEYS.ATTENDANCE, []),
    goals: getStoredItem(STORAGE_KEYS.GOALS, []),
    targets: getStoredItem(STORAGE_KEYS.TARGETS, {}),
    settings: getStoredItem(STORAGE_KEYS.SETTINGS, {}),
    notifications: getStoredItem(STORAGE_KEYS.NOTIFICATIONS, []),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import and validate full JSON backup
 */
export function importAllDataFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON format');
    }

    if (Array.isArray(data.preparations)) {
      setStoredItem(STORAGE_KEYS.PREPARATIONS, data.preparations);
    }
    if (Array.isArray(data.subjects)) {
      setStoredItem(STORAGE_KEYS.SUBJECTS, data.subjects);
    }
    if (Array.isArray(data.topics)) {
      setStoredItem(STORAGE_KEYS.TOPICS, data.topics);
    }
    if (Array.isArray(data.timetable)) {
      setStoredItem(STORAGE_KEYS.TIMETABLE, data.timetable);
    }
    if (Array.isArray(data.sessions)) {
      setStoredItem(STORAGE_KEYS.SESSIONS, data.sessions);
    }
    if (Array.isArray(data.attendance)) {
      setStoredItem(STORAGE_KEYS.ATTENDANCE, data.attendance);
    }
    if (Array.isArray(data.goals)) {
      setStoredItem(STORAGE_KEYS.GOALS, data.goals);
    }
    if (data.targets && typeof data.targets === 'object') {
      setStoredItem(STORAGE_KEYS.TARGETS, data.targets);
    }
    if (data.settings && typeof data.settings === 'object') {
      setStoredItem(STORAGE_KEYS.SETTINGS, data.settings);
    }
    if (Array.isArray(data.notifications)) {
      setStoredItem(STORAGE_KEYS.NOTIFICATIONS, data.notifications);
    }

    return { success: true, message: 'Data imported successfully' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Reset all storage to factory sample data
 */
export function resetToSampleData() {
  localStorage.clear();
  initializeStorage();
}

export { STORAGE_KEYS };
