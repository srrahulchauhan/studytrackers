import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  TIMER_STATUS,
  calculateLiveTimings,
  formatMsToHMS,
  formatSecondsToShort,
} from '../utils/timerUtils';
import { getStoredItem, setStoredItem, removeStoredItem, STORAGE_KEYS } from '../utils/storage';
import { formatTimeString, getTodayDateString } from '../utils/dateUtils';
import { playSound } from '../utils/audio';
import { useStudy } from './StudyContext';

const TimerContext = createContext();

const initialTimerState = {
  status: TIMER_STATUS.IDLE,
  preparationId: null,
  subjectId: null,
  topicId: null,
  sessionStartTime: null,
  accumulatedStudyMs: 0,
  lastResumeTime: null,
  accumulatedBreakMs: 0,
  currentBreakStartTime: null,
  currentBreakReason: 'Rest',
  breaks: [], // { startTime, endTime, duration, reason }
  pomodoroMode: false,
  pomodoroPhase: 'study', // 'study' | 'shortBreak' | 'longBreak'
  pomodoroCycleCount: 0,
  targetDurationMinutes: 45,
  notes: '',
};

export function TimerProvider({ children }) {
  const { addSession, setTopicStatus, settings, addNotification, addToast } = useStudy();

  const [session, setSession] = useState(() => {
    return getStoredItem(STORAGE_KEYS.ACTIVE_SESSION, initialTimerState);
  });

  const [liveTimings, setLiveTimings] = useState({
    totalSessionMs: 0,
    breakMs: 0,
    netStudyMs: 0,
    currentBreakDurationMs: 0,
  });

  // Track ticker interval
  const timerRef = useRef(null);

  // Sync session state to LocalStorage
  useEffect(() => {
    if (session.status !== TIMER_STATUS.IDLE) {
      setStoredItem(STORAGE_KEYS.ACTIVE_SESSION, session);
    } else {
      removeStoredItem(STORAGE_KEYS.ACTIVE_SESSION);
    }
  }, [session]);

  // Accurate live ticker loop
  useEffect(() => {
    const updateTimings = () => {
      if (session.status === TIMER_STATUS.IDLE) {
        setLiveTimings({
          totalSessionMs: 0,
          breakMs: 0,
          netStudyMs: 0,
          currentBreakDurationMs: 0,
        });
        return;
      }
      const timings = calculateLiveTimings(session, Date.now());
      setLiveTimings(timings);
    };

    updateTimings();

    if (session.status === TIMER_STATUS.RUNNING || session.status === TIMER_STATUS.BREAK) {
      timerRef.current = setInterval(updateTimings, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session]);

  // Start study
  const startStudy = ({
    preparationId = null,
    subjectId = null,
    topicId = null,
    pomodoroMode = false,
    targetDurationMinutes = 45,
  }) => {
    const now = Date.now();
    const newSession = {
      status: TIMER_STATUS.RUNNING,
      preparationId,
      subjectId,
      topicId,
      sessionStartTime: now,
      accumulatedStudyMs: 0,
      lastResumeTime: now,
      accumulatedBreakMs: 0,
      currentBreakStartTime: null,
      currentBreakReason: 'Rest',
      breaks: [],
      pomodoroMode,
      pomodoroPhase: 'study',
      pomodoroCycleCount: 0,
      targetDurationMinutes,
      notes: '',
    };
    setSession(newSession);

    if (topicId) {
      setTopicStatus(topicId, 'In Progress');
    }

    if (settings?.soundEnabled) {
      playSound('start');
    }
    addToast('Study session started! Stay focused.', 'success');
  };

  // Pause study
  const pauseStudy = () => {
    if (session.status !== TIMER_STATUS.RUNNING) return;
    const now = Date.now();
    const elapsedSinceResume = session.lastResumeTime ? now - session.lastResumeTime : 0;
    const newAccumulated = (session.accumulatedStudyMs || 0) + elapsedSinceResume;

    setSession((prev) => ({
      ...prev,
      status: TIMER_STATUS.PAUSED,
      accumulatedStudyMs: newAccumulated,
      lastResumeTime: null,
    }));

    if (settings?.soundEnabled) {
      playSound('pause');
    }
    addToast('Study paused', 'info');
  };

  // Resume study
  const resumeStudy = () => {
    if (session.status !== TIMER_STATUS.PAUSED) return;
    const now = Date.now();

    setSession((prev) => ({
      ...prev,
      status: TIMER_STATUS.RUNNING,
      lastResumeTime: now,
    }));

    if (settings?.soundEnabled) {
      playSound('start');
    }
    addToast('Study resumed!', 'success');
  };

  // Take break
  const takeBreak = (reason = 'Rest') => {
    if (session.status === TIMER_STATUS.BREAK) return;
    const now = Date.now();

    // Accumulate study time if currently running
    let newAccumulatedStudy = session.accumulatedStudyMs || 0;
    if (session.status === TIMER_STATUS.RUNNING && session.lastResumeTime) {
      newAccumulatedStudy += now - session.lastResumeTime;
    }

    setSession((prev) => ({
      ...prev,
      status: TIMER_STATUS.BREAK,
      accumulatedStudyMs: newAccumulatedStudy,
      lastResumeTime: null,
      currentBreakStartTime: now,
      currentBreakReason: reason,
    }));

    if (settings?.soundEnabled) {
      playSound('break');
    }
    addToast(`Break started: ${reason}. Relax and refresh!`, 'info');
  };

  // Resume from break
  const resumeFromBreak = () => {
    if (session.status !== TIMER_STATUS.BREAK) return;
    const now = Date.now();

    const breakDurationMs = session.currentBreakStartTime
      ? now - session.currentBreakStartTime
      : 0;

    const breakRecord = {
      startTime: formatTimeString(
        new Date(session.currentBreakStartTime).toTimeString().slice(0, 5),
        settings?.timeFormat !== '24h'
      ),
      endTime: formatTimeString(
        new Date(now).toTimeString().slice(0, 5),
        settings?.timeFormat !== '24h'
      ),
      duration: Math.round(breakDurationMs / 1000), // in seconds
      reason: session.currentBreakReason || 'Rest',
    };

    setSession((prev) => ({
      ...prev,
      status: TIMER_STATUS.RUNNING,
      lastResumeTime: now,
      accumulatedBreakMs: (prev.accumulatedBreakMs || 0) + breakDurationMs,
      currentBreakStartTime: null,
      breaks: [...(prev.breaks || []), breakRecord],
    }));

    if (settings?.soundEnabled) {
      playSound('start');
    }
    addToast('Break ended. Back to studying!', 'success');
  };

  // Stop session
  const stopSession = (extraNotes = '') => {
    if (session.status === TIMER_STATUS.IDLE) return;
    const now = Date.now();
    const finalTimings = calculateLiveTimings(session, now);

    // If active break was happening, record it
    let finalBreaks = [...(session.breaks || [])];
    if (session.status === TIMER_STATUS.BREAK && session.currentBreakStartTime) {
      const lastBreakMs = now - session.currentBreakStartTime;
      finalBreaks.push({
        startTime: formatTimeString(
          new Date(session.currentBreakStartTime).toTimeString().slice(0, 5),
          settings?.timeFormat !== '24h'
        ),
        endTime: formatTimeString(
          new Date(now).toTimeString().slice(0, 5),
          settings?.timeFormat !== '24h'
        ),
        duration: Math.round(lastBreakMs / 1000),
        reason: session.currentBreakReason || 'Rest',
      });
    }

    const totalSeconds = Math.round(finalTimings.totalSessionMs / 1000);
    const breakSeconds = Math.round(finalTimings.breakMs / 1000);
    const studySeconds = Math.max(0, totalSeconds - breakSeconds);

    const startTimeStr = formatTimeString(
      new Date(session.sessionStartTime).toTimeString().slice(0, 5),
      settings?.timeFormat !== '24h'
    );
    const endTimeStr = formatTimeString(
      new Date(now).toTimeString().slice(0, 5),
      settings?.timeFormat !== '24h'
    );

    const savedSession = {
      date: getTodayDateString(),
      preparationId: session.preparationId,
      subjectId: session.subjectId,
      topicId: session.topicId,
      startTime: startTimeStr,
      endTime: endTimeStr,
      totalDuration: totalSeconds,
      breakDuration: breakSeconds,
      actualStudyDuration: studySeconds,
      breaks: finalBreaks,
      status: 'Completed',
      notes: extraNotes || session.notes || 'Recorded session',
    };

    addSession(savedSession);

    if (settings?.soundEnabled) {
      playSound('complete');
    }

    addToast(
      `Session ended: Studied ${formatSecondsToShort(studySeconds)} (Break: ${formatSecondsToShort(breakSeconds)})`,
      'success'
    );

    setSession(initialTimerState);
    removeStoredItem(STORAGE_KEYS.ACTIVE_SESSION);
  };

  // Complete topic and stop session
  const completeTopicAndStop = (extraNotes = '') => {
    if (session.topicId) {
      setTopicStatus(session.topicId, 'Completed', extraNotes);
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    stopSession(extraNotes || 'Completed topic during this study session!');
    addNotification('Topic Completed! 🎉', 'Great job finishing your scheduled topic.');
  };

  // Reset timer without saving
  const resetTimer = () => {
    setSession(initialTimerState);
    removeStoredItem(STORAGE_KEYS.ACTIVE_SESSION);
    addToast('Timer reset', 'info');
  };

  return (
    <TimerContext.Provider
      value={{
        session,
        liveTimings,
        isRunning: session.status === TIMER_STATUS.RUNNING,
        isPaused: session.status === TIMER_STATUS.PAUSED,
        isBreak: session.status === TIMER_STATUS.BREAK,
        isIdle: session.status === TIMER_STATUS.IDLE,
        status: session.status,
        startStudy,
        pauseStudy,
        resumeStudy,
        takeBreak,
        resumeFromBreak,
        stopSession,
        completeTopicAndStop,
        resetTimer,
        formattedNetStudyTime: formatMsToHMS(liveTimings.netStudyMs),
        formattedTotalTime: formatMsToHMS(liveTimings.totalSessionMs),
        formattedBreakTime: formatMsToHMS(liveTimings.breakMs),
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
