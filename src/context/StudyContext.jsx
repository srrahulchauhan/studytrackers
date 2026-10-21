import { createContext, useContext, useEffect, useRef, useState } from "react";
import { evaluateAutoAttendance } from "../utils/attendanceLogic";
import { getTodayDateString } from "../utils/dateUtils";
import { syncToGoogleSheets } from "../utils/googleSheetsSync";
import {
  initialAttendance,
  initialGoals,
  initialNotifications,
  initialPreparations,
  initialSettings,
  initialStudySessions,
  initialSubjects,
  initialTargets,
  initialTimetable,
  initialTopics,
  initialVideoCourses,
} from "../utils/sampleData";
import {
  clearAllDataToFresh,
  getStoredItem,
  initializeStorage,
  resetToSampleData as resetStorageToSample,
  setStoredItem,
  STORAGE_KEYS,
} from "../utils/storage";

const StudyContext = createContext();

export function StudyProvider({ children }) {
  const userId = "local-user";

  // Ensure storage is initialized
  useEffect(() => {
    initializeStorage();
  }, []);

  // Preparations
  const [preparations, setPreparations] = useState(() =>
    getStoredItem(STORAGE_KEYS.PREPARATIONS, initialPreparations),
  );
  const [activePrepId, setActivePrepId] = useState(() =>
    getStoredItem(STORAGE_KEYS.ACTIVE_PREP_ID, ""),
  );

  // Subjects & Topics
  const [subjects, setSubjects] = useState(() =>
    getStoredItem(STORAGE_KEYS.SUBJECTS, initialSubjects),
  );
  const [topics, setTopics] = useState(() =>
    getStoredItem(STORAGE_KEYS.TOPICS, initialTopics),
  );

  // Timetable
  const [timetable, setTimetable] = useState(() =>
    getStoredItem(STORAGE_KEYS.TIMETABLE, initialTimetable),
  );

  // Study Sessions
  const [sessions, setSessions] = useState(() =>
    getStoredItem(STORAGE_KEYS.SESSIONS, initialStudySessions),
  );

  // Attendance
  const [attendance, setAttendance] = useState(() =>
    getStoredItem(STORAGE_KEYS.ATTENDANCE, initialAttendance),
  );

  // Goals
  const [goals, setGoals] = useState(() =>
    getStoredItem(STORAGE_KEYS.GOALS, initialGoals),
  );

  // Targets
  const [targets, setTargets] = useState(() =>
    getStoredItem(STORAGE_KEYS.TARGETS, initialTargets),
  );

  // Settings
  const [settings, setSettings] = useState(() =>
    getStoredItem(STORAGE_KEYS.SETTINGS, initialSettings),
  );

  // Notifications
  const [notifications, setNotifications] = useState(() =>
    getStoredItem(STORAGE_KEYS.NOTIFICATIONS, initialNotifications),
  );

  // Video Courses
  const [videoCourses, setVideoCourses] = useState(() =>
    getStoredItem(STORAGE_KEYS.VIDEO_COURSES, initialVideoCourses),
  );

  // In-app Toasts
  const [toasts, setToasts] = useState([]);
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    lastSyncedAt: "",
    error: "",
    rowCount: 0,
  });
  const syncRequestId = useRef(0);

  // Toast helper
  const addToast = (message, type = "info", duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync state to LocalStorage
  useEffect(() => {
    setStoredItem(STORAGE_KEYS.PREPARATIONS, preparations);
  }, [preparations]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.ACTIVE_PREP_ID, activePrepId);
  }, [activePrepId]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.SUBJECTS, subjects);
  }, [subjects]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.TOPICS, topics);
  }, [topics]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.TIMETABLE, timetable);
  }, [timetable]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.SESSIONS, sessions);
  }, [sessions]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.ATTENDANCE, attendance);
  }, [attendance]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.GOALS, goals);
  }, [goals]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.TARGETS, targets);
  }, [targets]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.VIDEO_COURSES, videoCourses);
  }, [videoCourses]);

  useEffect(() => {
    if (!settings.googleSheetsSyncEnabled || !settings.googleSheetsSyncUrl)
      return;

    const requestId = ++syncRequestId.current;
    const syncTimer = setTimeout(async () => {
      setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: "" }));

      try {
        const result = await syncToGoogleSheets({
          data: {
            preparations,
            subjects,
            topics,
            timetable,
            sessions,
            attendance,
            goals,
            targets,
            settings,
            notifications,
          },
          clientId: userId,
          syncUrl: settings.googleSheetsSyncUrl,
          syncKey: settings.googleSheetsSyncKey,
        });

        if (requestId === syncRequestId.current) {
          setSyncStatus({
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
            error: "",
            rowCount: result.rowCount,
          });
        }
      } catch (error) {
        if (requestId === syncRequestId.current) {
          setSyncStatus({
            isSyncing: false,
            lastSyncedAt: "",
            error: error.message,
            rowCount: 0,
          });
        }
      }
    }, 1500);

    return () => clearTimeout(syncTimer);
  }, [
    settings.googleSheetsSyncEnabled,
    settings.googleSheetsSyncUrl,
    settings.googleSheetsSyncKey,
    preparations,
    subjects,
    topics,
    timetable,
    sessions,
    attendance,
    goals,
    targets,
    settings,
    notifications,
    userId,
  ]);

  // Active preparation object
  const activePreparation =
    preparations.find((p) => p.id === activePrepId) || preparations[0] || null;

  // Notification helper
  const addNotification = (title, message, type = "info") => {
    const notif = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    if (
      settings.browserNotifications &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(title, { body: message });
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // ----------------------------------------------------
  // PREPARATIONS CRUD
  // ----------------------------------------------------
  const addPreparation = (prepData) => {
    const newPrep = {
      ...prepData,
      id: prepData.id || `prep-${Date.now()}`,
      userId,
      createdAt: prepData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPreparations((prev) => [...prev, newPrep]);
    setActivePrepId(newPrep.id);
    addToast(`Preparation "${newPrep.name}" created!`, "success");
    return newPrep;
  };

  const updatePreparation = (id, updatedFields) => {
    setPreparations((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updatedFields, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
    addToast("Preparation updated successfully", "success");
  };

  const deletePreparation = (id) => {
    setPreparations((prev) => prev.filter((p) => p.id !== id));
    // Cascade delete subjects & topics under this prep
    const removedSubjects = subjects.filter((s) => s.preparationId === id);
    const removedSubjectIds = new Set(removedSubjects.map((s) => s.id));
    setSubjects((prev) => prev.filter((s) => s.preparationId !== id));
    setTopics((prev) =>
      prev.filter((t) => !removedSubjectIds.has(t.subjectId)),
    );
    setTimetable((prev) => prev.filter((t) => t.preparationId !== id));

    if (activePrepId === id) {
      const remaining = preparations.filter((p) => p.id !== id);
      setActivePrepId(remaining[0]?.id || null);
    }
    addToast("Preparation deleted", "info");
  };

  // ----------------------------------------------------
  // SUBJECTS CRUD
  // ----------------------------------------------------
  const addSubject = (subjectData) => {
    const newSubject = {
      ...subjectData,
      id: subjectData.id || `sub-${Date.now()}`,
      userId,
      preparationId: subjectData.preparationId || activePrepId,
      status: subjectData.status || "In Progress",
      createdAt: subjectData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSubjects((prev) => [...prev, newSubject]);
    addToast(`Subject "${newSubject.name}" created!`, "success");
    return newSubject;
  };

  const updateSubject = (id, updatedFields) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, ...updatedFields, updatedAt: new Date().toISOString() }
          : s,
      ),
    );
    addToast("Subject updated", "success");
  };

  const deleteSubject = (id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setTopics((prev) => prev.filter((t) => t.subjectId !== id));
    setTimetable((prev) => prev.filter((t) => t.subjectId !== id));
    addToast("Subject deleted", "info");
  };

  const completeSubject = (id, completionNote = "") => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "Completed",
              completionNote,
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : s,
      ),
    );
    addToast("Subject completed! 🏆", "success");
  };

  const reopenSubject = (id) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "In Progress",
              updatedAt: new Date().toISOString(),
            }
          : s,
      ),
    );
    addToast("Subject reopened to In Progress", "info");
  };

  const updateSubjectNote = (id, completionNote) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, completionNote, updatedAt: new Date().toISOString() }
          : s,
      ),
    );
    addToast("Subject final status note updated!", "success");
  };

  // ----------------------------------------------------
  // TOPICS CRUD
  // ----------------------------------------------------
  const addTopic = (topicData) => {
    const newTopic = {
      ...topicData,
      id: topicData.id || `top-${Date.now()}`,
      userId,
      status: topicData.status || "Pending",
      createdAt: topicData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTopics((prev) => [...prev, newTopic]);
    addToast(`Topic "${newTopic.name}" added!`, "success");
    return newTopic;
  };

  const updateTopic = (id, updatedFields) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, ...updatedFields, updatedAt: new Date().toISOString() }
          : t,
      ),
    );
    addToast("Topic updated", "success");
  };

  const setTopicStatus = (id, status, completionNote = null) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = {
          ...t,
          status,
          updatedAt: new Date().toISOString(),
        };
        if (completionNote !== null && completionNote !== undefined) {
          updated.completionNote = completionNote;
        }
        if (status === "Completed") {
          if (!updated.completedAt) updated.completedAt = new Date().toISOString();
        }
        return updated;
      }),
    );
    addToast(`Topic marked as ${status}`, "info");
  };

  const completeTopic = (id, completionNote = "") => {
    setTopicStatus(id, "Completed", completionNote);
  };

  const updateTopicNote = (id, completionNote) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completionNote, updatedAt: new Date().toISOString() }
          : t,
      ),
    );
    addToast("Topic final status note updated!", "success");
  };

  const deleteTopic = (id) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    setTimetable((prev) => prev.filter((t) => t.topicId !== id));
    addToast("Topic removed", "info");
  };

  // ----------------------------------------------------
  // VIDEO COURSES CRUD
  // ----------------------------------------------------
  const addVideoCourse = (courseData) => {
    const newCourse = {
      ...courseData,
      id: courseData.id || `vid-${Date.now()}`,
      subtitle: courseData.subtitle || "Video lesson",
      createdAt: courseData.createdAt || new Date().toISOString(),
    };
    setVideoCourses((prev) => [newCourse, ...prev]);
    addToast(`Video "${newCourse.title}" added!`, "success");
    return newCourse;
  };

  const updateVideoCourse = (id, updatedFields) => {
    setVideoCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c)),
    );
    addToast("Video course updated", "success");
  };

  const deleteVideoCourse = (id) => {
    setVideoCourses((prev) => prev.filter((c) => c.id !== id));
    addToast("Video course removed", "info");
  };

  // ----------------------------------------------------
  // TIMETABLE CRUD
  // ----------------------------------------------------
  const addTimetableSlot = (slotData) => {
    const newSlot = {
      ...slotData,
      id: slotData.id || `tt-${Date.now()}`,
      userId,
      preparationId: slotData.preparationId || activePrepId,
      createdAt: slotData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTimetable((prev) => [...prev, newSlot]);
    addToast("Timetable slot added", "success");
    return newSlot;
  };

  const updateTimetableSlot = (id, updatedFields) => {
    setTimetable((prev) =>
      prev.map((slot) =>
        slot.id === id
          ? { ...slot, ...updatedFields, updatedAt: new Date().toISOString() }
          : slot,
      ),
    );
    addToast("Timetable updated", "success");
  };

  const deleteTimetableSlot = (id) => {
    setTimetable((prev) => prev.filter((slot) => slot.id !== id));
    addToast("Timetable slot removed", "info");
  };

  const duplicateTimetableSlot = (id, targetDay) => {
    const source = timetable.find((t) => t.id === id);
    if (!source) return;
    const duplicated = {
      ...source,
      id: `tt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      day: targetDay || source.day,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTimetable((prev) => [...prev, duplicated]);
    addToast(`Timetable duplicated to ${duplicated.day}`, "success");
  };

  const addRecurringPlan = ({
    preparationId,
    subjectId,
    topicId,
    daysList = [],
    startTime,
    endTime,
    targetDuration,
    priority,
  }) => {
    const newSlots = daysList.map((day) => ({
      id: `tt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      day,
      startTime,
      endTime,
      preparationId,
      subjectId,
      topicId,
      targetDuration,
      repeat: true,
      priority: priority || "Medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setTimetable((prev) => [...prev, ...newSlots]);
    addToast(`Added recurring plan for ${daysList.length} days!`, "success");
  };

  // ----------------------------------------------------
  // SESSIONS & AUTO-ATTENDANCE
  // ----------------------------------------------------
  const addSession = (sessionData) => {
    const newSession = {
      ...sessionData,
      id: sessionData.id || `sess-${Date.now()}`,
      userId,
      createdAt: sessionData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);

    // Auto-evaluate attendance for this session's date
    const autoAtt = evaluateAutoAttendance({
      dateStr: newSession.date || getTodayDateString(),
      sessions: updatedSessions,
      timetable,
      currentAttendanceList: attendance,
      minAttendanceMinutes: settings.minAttendanceMinutes || 30,
    });

    const attRecordWithUser = {
      ...autoAtt,
      userId,
      updatedAt: new Date().toISOString(),
    };

    setAttendance((prev) => {
      const idx = prev.findIndex((a) => a.date === autoAtt.date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = attRecordWithUser;
        return copy;
      }
      return [...prev, attRecordWithUser];
    });

    addToast("Study session saved successfully!", "success");
    return newSession;
  };

  const deleteSession = (id) => {
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    addToast("Session deleted", "info");
  };

  const updateSession = (id, updatedFields) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...updatedFields, updatedAt: new Date().toISOString() } : s
      )
    );
    addToast("Session updated successfully", "success");
  };

  // ----------------------------------------------------
  // MANUAL ATTENDANCE
  // ----------------------------------------------------
  const markAttendanceManual = ({ date, status, notes = "" }) => {
    setAttendance((prev) => {
      const existingIdx = prev.findIndex((a) => a.date === date);
      const record = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `att-${date}`,
        userId,
        date,
        status,
        studyMinutes: existingIdx >= 0 ? prev[existingIdx].studyMinutes : 0,
        notes,
        manual: true,
        updatedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = record;
        return copy;
      }
      return [...prev, record];
    });
    addToast(`Attendance for ${date} marked as ${status}`, "success");
  };

  // ----------------------------------------------------
  // TARGETS
  // ----------------------------------------------------
  const updateDailyTarget = (dailyTarget) => {
    setTargets((prev) => ({ ...prev, daily: dailyTarget }));
    addToast("Daily target updated", "success");
  };

  const updateWeeklyTarget = (weeklyTarget) => {
    setTargets((prev) => ({ ...prev, weekly: weeklyTarget }));
    addToast("Weekly target updated", "success");
  };

  const updateMonthlyTarget = (monthlyTarget) => {
    setTargets((prev) => ({ ...prev, monthly: monthlyTarget }));
    addToast("Monthly target updated", "success");
  };

  const addTomorrowTarget = (targetItem) => {
    const item = {
      ...targetItem,
      id: targetItem.id || `ttar-${Date.now()}`,
      userId,
      completed: false,
      status: targetItem.status || "Pending",
      completionNote: targetItem.completionNote || "",
      createdAt: new Date().toISOString(),
    };
    setTargets((prev) => ({
      ...prev,
      tomorrow: [...(prev.tomorrow || []), item],
    }));
    addToast("Target added", "success");
  };

  const updateTomorrowTarget = (id, updatedFields) => {
    setTargets((prev) => ({
      ...prev,
      tomorrow: (prev.tomorrow || []).map((t) =>
        t.id === id
          ? { ...t, ...updatedFields, updatedAt: new Date().toISOString() }
          : t,
      ),
    }));
    addToast("Target updated", "success");
  };

  const completeTomorrowTarget = (id, completionNote = "") => {
    setTargets((prev) => ({
      ...prev,
      tomorrow: (prev.tomorrow || []).map((t) =>
        t.id === id
          ? {
              ...t,
              completed: true,
              status: "Completed",
              completionNote,
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    }));
    addToast("Task completed! 🎉", "success");
  };

  const reopenTomorrowTarget = (id) => {
    setTargets((prev) => ({
      ...prev,
      tomorrow: (prev.tomorrow || []).map((t) =>
        t.id === id
          ? {
              ...t,
              completed: false,
              status: "Pending",
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    }));
    addToast("Task reopened", "info");
  };

  const updateTomorrowTargetNote = (id, completionNote) => {
    setTargets((prev) => ({
      ...prev,
      tomorrow: (prev.tomorrow || []).map((t) =>
        t.id === id
          ? { ...t, completionNote, updatedAt: new Date().toISOString() }
          : t,
      ),
    }));
    addToast("Task status note updated!", "success");
  };

  const removeTomorrowTarget = (id) => {
    setTargets((prev) => ({
      ...prev,
      tomorrow: (prev.tomorrow || []).filter((t) => t.id !== id),
    }));
    addToast("Target removed", "info");
  };

  // ----------------------------------------------------
  // GOALS CRUD
  // ----------------------------------------------------
  const addGoal = (goalData) => {
    const newGoal = {
      ...goalData,
      id: goalData.id || `goal-${Date.now()}`,
      userId,
      progress: goalData.progress || 0,
      status: goalData.status || "In Progress",
      milestones: goalData.milestones || [],
      createdAt: goalData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setGoals((prev) => [...prev, newGoal]);
    addToast(`Goal "${newGoal.name}" created!`, "success");
    return newGoal;
  };

  const updateGoal = (id, updatedFields) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, ...updatedFields, updatedAt: new Date().toISOString() }
          : g,
      ),
    );
    addToast("Goal updated", "success");
  };

  const deleteGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    addToast("Goal removed", "info");
  };

  const toggleMilestone = (goalId, milestoneId) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = (g.milestones || []).map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m,
        );
        const total = updatedMilestones.length;
        const completedCount = updatedMilestones.filter(
          (m) => m.completed,
        ).length;
        const progress =
          total > 0 ? Math.round((completedCount / total) * 100) : g.progress;
        const status = progress === 100 ? "Completed" : "In Progress";
        return {
          ...g,
          milestones: updatedMilestones,
          progress,
          status,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  // ----------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------
  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addToast("Settings saved", "success");
  };

  const syncNow = async () => {
    if (!settings.googleSheetsSyncEnabled || !settings.googleSheetsSyncUrl) {
      throw new Error(
        "Enable Google Sheets sync and add the Apps Script URL first.",
      );
    }

    setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: "" }));
    try {
      const result = await syncToGoogleSheets({
        data: {
          preparations,
          subjects,
          topics,
          timetable,
          sessions,
          attendance,
          goals,
          targets,
          settings,
          notifications,
        },
        clientId: userId,
        syncUrl: settings.googleSheetsSyncUrl,
        syncKey: settings.googleSheetsSyncKey,
      });
      setSyncStatus({
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
        error: "",
        rowCount: result.rowCount,
      });
      addToast(result.message, "success");
      return result;
    } catch (error) {
      setSyncStatus({
        isSyncing: false,
        lastSyncedAt: "",
        error: error.message,
        rowCount: 0,
      });
      addToast(error.message, "error");
      throw error;
    }
  };

  // ----------------------------------------------------
  // RESET / CLEAR ALL DATA (FRESH START) & DEMO DATA
  // ----------------------------------------------------
  const clearAllData = () => {
    clearAllDataToFresh();
    setPreparations([]);
    setActivePrepId("");
    setSubjects([]);
    setTopics([]);
    setTimetable([]);
    setSessions([]);
    setAttendance([]);
    setGoals([]);
    setTargets({
      daily: {
        targetHours: settings?.dailyTargetHours || 4,
        subjectDistribution: [],
      },
      weekly: { targetHours: 25 },
      monthly: { targetHours: 100 },
      tomorrow: [],
    });
    setNotifications([]);
    addToast(
      "All data cleared! Workspace reset to a clean slate.",
      "success",
      3500,
    );
  };

  const resetToSampleData = () => {
    resetStorageToSample();
    setPreparations(initialPreparations);
    setActivePrepId("");
    setSubjects(initialSubjects);
    setTopics(initialTopics);
    setTimetable(initialTimetable);
    setSessions(initialStudySessions);
    setAttendance(initialAttendance);
    setGoals(initialGoals);
    setTargets(initialTargets);
    setSettings(initialSettings);
    setNotifications(initialNotifications);
    addToast("Workspace reset to factory clean defaults!", "info");
  };

  const value = {
    preparations,
    activePrepId,
    setActivePrepId,
    activePreparation,
    addPreparation,
    updatePreparation,
    deletePreparation,

    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    completeSubject,
    reopenSubject,
    updateSubjectNote,

    topics,
    addTopic,
    updateTopic,
    setTopicStatus,
    completeTopic,
    updateTopicNote,
    deleteTopic,

    videoCourses,
    addVideoCourse,
    updateVideoCourse,
    deleteVideoCourse,

    timetable,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
    duplicateTimetableSlot,
    addRecurringPlan,

    sessions,
    addSession,
    updateSession,
    deleteSession,

    attendance,
    markAttendanceManual,

    targets,
    updateDailyTarget,
    updateWeeklyTarget,
    updateMonthlyTarget,
    addTomorrowTarget,
    updateTomorrowTarget,
    completeTomorrowTarget,
    reopenTomorrowTarget,
    updateTomorrowTargetNote,
    removeTomorrowTarget,

    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,

    settings,
    updateSettings,
    syncStatus,
    syncNow,

    notifications,
    addNotification,
    markNotificationAsRead,
    clearAllNotifications,

    toasts,
    addToast,
    removeToast,

    clearAllData,
    resetToSampleData,
  };

  return (
    <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudy must be used within a StudyProvider");
  }
  return context;
}
