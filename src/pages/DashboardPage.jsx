import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  ListTodo,
  Play,
  Plus,
  Sparkles,
  Timer,
  TrendingUp,
  Trophy,
  UserCheck,
} from "lucide-react";
import {
  DailyBarChart,
  SubjectBreakdownChart,
} from "../components/analytics/Charts";
import { PriorityBadge, StatusBadge } from "../components/common/Badge";
import { ProgressBar } from "../components/common/ProgressBar";
import { StatCard } from "../components/common/StatCard";
import { useStudy } from "../context/StudyContext";
import { useTimer } from "../context/TimerContext";
import { computeAttendanceStats } from "../utils/attendanceLogic";
import {
  calculateStudyStreaks,
  formatFriendlyDate,
  getCurrentWeekDates,
  getDayNameFromDate,
  getTodayDateString,
} from "../utils/dateUtils";
import {
  buildSmartDailyPlan,
  getSmartPlannerSummary,
} from "../utils/smartPlanner";
import { formatHoursToShort, formatSecondsToShort } from "../utils/timerUtils";

export function DashboardPage({
  setActivePage,
  onOpenQuickAction,
  onOpenNewPrep,
  onOpenNewSubject,
  onOpenNewTopic,
  onOpenSchedule,
  onOpenTomorrowTarget,
  onOpenNewGoal,
}) {
  const {
    preparations,
    subjects,
    topics,
    timetable,
    sessions,
    attendance,
    targets,
    goals,
    settings,
    activePrepId,
  } = useStudy();

  const {
    session: activeSession,
    isRunning,
    isBreak,
    isIdle,
    liveTimings,
    formattedNetStudyTime,
    startStudy,
    takeBreak,
    resumeFromBreak,
    stopSession,
  } = useTimer();

  const todayStr = getTodayDateString();
  const todayDayName = getDayNameFromDate(todayStr);

  const activeLiveStudySeconds = isRunning
    ? Math.round((liveTimings?.netStudyMs || 0) / 1000)
    : 0;

  // 1. Calculate Today's metrics
  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const todayStudySeconds = todaySessions.reduce(
    (acc, s) => acc + (s.actualStudyDuration || 0),
    0,
  );
  const todayBreakSeconds = todaySessions.reduce(
    (acc, s) => acc + (s.breakDuration || 0),
    0,
  );
  const todayStudyHours = todayStudySeconds / 3600;

  // Today's Planned Target Hours
  const todayPlannedHours =
    targets.daily?.targetHours || settings?.dailyTargetHours || 4;
  const todayRemainingHours = Math.max(0, todayPlannedHours - todayStudyHours);
  const todayTargetProgress = Math.min(
    100,
    Math.round((todayStudyHours / todayPlannedHours) * 100),
  );

  // 2. Weekly Study Hours
  const currentWeek = getCurrentWeekDates(settings?.weekStartDay === "Sunday");
  const weekDateSet = new Set(currentWeek.map((w) => w.dateStr));
  const weekSessions = sessions.filter((s) => weekDateSet.has(s.date));
  const weeklyStudySeconds = weekSessions.reduce(
    (acc, s) => acc + (s.actualStudyDuration || 0),
    0,
  );
  const weeklyTargetHours = targets.weekly?.targetHours || 25;
  const weeklyStudyHours = weeklyStudySeconds / 3600;
  const weeklyProgress = Math.min(
    100,
    Math.round((weeklyStudyHours / weeklyTargetHours) * 100),
  );

  // 3. Monthly Study Hours
  const currentMonthPrefix = todayStr.slice(0, 7); // '2026-09'
  const monthlySessions = sessions.filter(
    (s) => s.date && s.date.startsWith(currentMonthPrefix),
  );
  const monthlyStudySeconds = monthlySessions.reduce(
    (acc, s) => acc + (s.actualStudyDuration || 0),
    0,
  );
  const monthlyTargetHours = targets.monthly?.targetHours || 100;
  const monthlyStudyHours = monthlyStudySeconds / 3600;
  const monthlyProgress = Math.min(
    100,
    Math.round((monthlyStudyHours / monthlyTargetHours) * 100),
  );

  // 4. Total All-time Study Hours
  const totalStudySeconds = sessions.reduce(
    (acc, s) => acc + (s.actualStudyDuration || 0),
    0,
  );

  // 5. Topics Completed & Pending
  const completedTopics = topics.filter((t) => t.status === "Completed").length;
  const pendingTopics = topics.filter((t) => t.status !== "Completed").length;
  const totalTopicsCount = topics.length;
  const overallProgressPercentage =
    totalTopicsCount > 0
      ? Math.round((completedTopics / totalTopicsCount) * 100)
      : 0;

  // 6. Attendance Status
  const todayAttendance = attendance.find((a) => a.date === todayStr);
  const attStats = computeAttendanceStats(attendance);

  // 7. Streaks
  const streaks = calculateStudyStreaks(
    sessions,
    settings?.minAttendanceMinutes || 30,
  );

  // 8. Today's Timetable Slots
  const todayTimetable = timetable
    .filter((t) => t.day === todayDayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const smartPlan = buildSmartDailyPlan({
    today: todayStr,
    todayDayName,
    topics,
    subjects,
    timetable,
    targets: targets.tomorrow || [],
    sessions,
    settings,
  });
  const smartPlannerSummary = getSmartPlannerSummary(smartPlan, settings);

  // 9. Current Primary Goal
  const primaryGoal =
    goals.find((g) => g.status !== "Completed") || goals[0] || null;

  // 10. Daily trend data for bar chart
  const last7DaysData = currentWeek.map((w) => {
    const daySessions = sessions.filter((s) => s.date === w.dateStr);
    const sec = daySessions.reduce(
      (acc, s) => acc + (s.actualStudyDuration || 0),
      0,
    );
    return {
      label: w.dayName.slice(0, 3),
      valueHours: sec / 3600,
      isToday: w.isToday,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Banner & Quick Action Buttons */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-3xl p-6 lg:p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-black/50">
        {/* Subtle Background Gradients */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20 backdrop-blur-md">
              {todayDayName}, {formatFriendlyDate(todayStr)}
            </span>
            <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 backdrop-blur-md">
              <Flame size={14} className="fill-amber-500" />
              <span>{streaks.currentStreak} Day Streak</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 dark:from-white dark:via-brand-100 dark:to-white mt-3 tracking-tight">
            Study Management Dashboard
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
            <Sparkles size={14} className="text-brand-500" />
            "Plan → Study → Track → Take Break → Record → Analyze → Improve"
          </p>
        </div>

        {/* Quick Actions Row */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setActivePage("timer");
            }}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-500/30 transition-all transform hover:scale-105 active:scale-95"
          >
            <Play size={16} className="fill-white" />
            <span>Start Study</span>
          </button>
          
          <button
            onClick={onOpenNewSubject}
            className="px-4 py-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-bold flex items-center gap-2 backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <Plus size={16} />
            <span>Subject</span>
          </button>
          
          <button
            onClick={onOpenNewTopic}
            className="px-4 py-3 rounded-2xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 hover:from-rose-500/20 hover:to-pink-500/20 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm font-bold flex items-center gap-2 backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <Plus size={16} />
            <span>Topic</span>
          </button>
          
          <button
            onClick={onOpenSchedule}
            className="px-4 py-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm font-bold flex items-center gap-2 backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <Plus size={16} />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {/* Active Running Session Widget (If Active) */}
      {!isIdle && (
        <div className="glass-card p-5 border-l-4 border-l-brand-500 bg-gradient-to-r from-brand-500/5 via-white to-transparent dark:from-brand-950/40 dark:via-dark-900 dark:to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <Timer size={24} className="animate-spin-slow" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block">
                  Current Running Study Session ({activeSession.status})
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {topics.find((t) => t.id === activeSession.topicId)?.name ||
                    subjects.find((s) => s.id === activeSession.subjectId)
                      ?.name ||
                    preparations.find(
                      (p) => p.id === activeSession.preparationId,
                    )?.name ||
                    "Study Session"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {subjects.find((s) => s.id === activeSession.subjectId)
                    ?.name ||
                    preparations.find(
                      (p) => p.id === activeSession.preparationId,
                    )?.name ||
                    "General Study"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mono-number block">
                  {formattedNetStudyTime}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Net Study Time
                </span>
              </div>
              <button
                onClick={() => setActivePage("timer")}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition flex items-center gap-1"
              >
                <span>Controls</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8 Required Dashboard Cards with Live Progress Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Study Time */}
        <StatCard
          title="Total Study Time"
          value={formatSecondsToShort(
            totalStudySeconds + activeLiveStudySeconds,
          )}
          subtitle={
            isRunning
              ? "● Study session actively recording"
              : "All recorded study sessions"
          }
          icon={Timer}
          accentColor="brand"
          isLive={isRunning}
          liveBadgeText="LIVE"
          onClick={() => setActivePage("history")}
        >
          <div className="space-y-1.5">
            <ProgressBar
              value={Math.min(
                100,
                Math.round(
                  ((totalStudySeconds + activeLiveStudySeconds) /
                    (targets.monthly?.targetHours * 3600 || 360000)) *
                    100,
                ),
              )}
              max={100}
              showLabel={false}
              height="h-2.5"
              color="bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-500"
              isLive={isRunning}
              isAnimated={true}
            />
            {isRunning && (
              <div className="flex items-center justify-between pt-0.5 text-[10px] text-brand-600 dark:text-brand-400 font-bold">
                <div className="flex items-center gap-1">
                  <span className="w-1 bg-brand-500 rounded-full wave-bar-1" />
                  <span className="w-1 bg-brand-500 rounded-full wave-bar-2" />
                  <span className="w-1 bg-brand-500 rounded-full wave-bar-3" />
                  <span className="w-1 bg-brand-500 rounded-full wave-bar-4" />
                  <span className="ml-1 tracking-wider">LIVE TICKER</span>
                </div>
                <span className="mono-number font-extrabold">
                  {formattedNetStudyTime}
                </span>
              </div>
            )}
          </div>
        </StatCard>

        {/* 2. Today's Study Time */}
        <StatCard
          title="Today's Study Time"
          value={formatSecondsToShort(
            todayStudySeconds + activeLiveStudySeconds,
          )}
          subtitle={
            isRunning
              ? "● Real-time study accumulating"
              : `Target: ${todayPlannedHours}h (${todayTargetProgress}%)`
          }
          icon={Clock}
          accentColor="emerald"
          isLive={isRunning}
          liveBadgeText="TRACKING"
          onClick={() => setActivePage("timer")}
        >
          <div className="space-y-1.5">
            <ProgressBar
              value={(todayStudySeconds + activeLiveStudySeconds) / 3600}
              max={todayPlannedHours}
              showLabel={false}
              height="h-2.5"
              color="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400"
              isLive={isRunning}
              isAnimated={true}
            />
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Goal: {todayPlannedHours}h</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-number">
                {Math.min(
                  100,
                  Math.round(
                    ((todayStudySeconds + activeLiveStudySeconds) /
                      3600 /
                      todayPlannedHours) *
                      100,
                  ),
                )}
                %
              </span>
            </div>
          </div>
        </StatCard>

        {/* 3. Weekly Study Time */}
        <StatCard
          title="Weekly Study Time"
          value={formatSecondsToShort(
            weeklyStudySeconds + activeLiveStudySeconds,
          )}
          subtitle={`Target: ${weeklyTargetHours}h (${weeklyProgress}%)`}
          icon={Calendar}
          accentColor="sky"
          isLive={isRunning}
          liveBadgeText="LIVE"
          onClick={() => setActivePage("targets")}
        >
          <div className="space-y-1.5">
            <ProgressBar
              value={(weeklyStudySeconds + activeLiveStudySeconds) / 3600}
              max={weeklyTargetHours}
              showLabel={false}
              height="h-2.5"
              color="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500"
              isLive={isRunning}
              isAnimated={true}
            />
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Weekly Goal: {weeklyTargetHours}h</span>
              <span className="font-bold text-sky-600 dark:text-sky-400 mono-number">
                {Math.min(
                  100,
                  Math.round(
                    ((weeklyStudySeconds + activeLiveStudySeconds) /
                      3600 /
                      weeklyTargetHours) *
                      100,
                  ),
                )}
                %
              </span>
            </div>
          </div>
        </StatCard>

        {/* 4. Monthly Study Time */}
        <StatCard
          title="Monthly Study Time"
          value={`${((monthlyStudySeconds + activeLiveStudySeconds) / 3600).toFixed(1)}h`}
          subtitle={`Target: ${monthlyTargetHours}h (${monthlyProgress}%)`}
          icon={TrendingUp}
          accentColor="violet"
          isLive={isRunning}
          liveBadgeText="LIVE"
          onClick={() => setActivePage("analytics")}
        >
          <div className="space-y-1.5">
            <ProgressBar
              value={(monthlyStudySeconds + activeLiveStudySeconds) / 3600}
              max={monthlyTargetHours}
              showLabel={false}
              height="h-2.5"
              color="bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500"
              isLive={isRunning}
              isAnimated={true}
            />
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Monthly Target: {monthlyTargetHours}h</span>
              <span className="font-bold text-violet-600 dark:text-violet-400 mono-number">
                {Math.min(
                  100,
                  Math.round(
                    ((monthlyStudySeconds + activeLiveStudySeconds) /
                      3600 /
                      monthlyTargetHours) *
                      100,
                  ),
                )}
                %
              </span>
            </div>
          </div>
        </StatCard>

        {/* 5. Attendance */}
        <StatCard
          title="Today's Attendance"
          value={
            todayStudySeconds + activeLiveStudySeconds >=
            (settings?.minAttendanceMinutes || 30) * 60
              ? "PRESENT"
              : todayAttendance?.status ||
                (todayStudySeconds + activeLiveStudySeconds > 0
                  ? "PARTIAL"
                  : "ABSENT")
          }
          subtitle={`Required: ${settings?.minAttendanceMinutes || 30}m (${Math.round((todayStudySeconds + activeLiveStudySeconds) / 60)}m logged)`}
          icon={UserCheck}
          accentColor="amber"
          isLive={isRunning}
          liveBadgeText={
            todayStudySeconds + activeLiveStudySeconds >=
            (settings?.minAttendanceMinutes || 30) * 60
              ? "PRESENT"
              : "LOGGING"
          }
          onClick={() => setActivePage("attendance")}
        >
          <div className="space-y-1.5">
            <ProgressBar
              value={Math.min(
                todayStudySeconds + activeLiveStudySeconds,
                (settings?.minAttendanceMinutes || 30) * 60,
              )}
              max={(settings?.minAttendanceMinutes || 30) * 60}
              showLabel={false}
              height="h-2.5"
              color="bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400"
              isLive={isRunning}
              isAnimated={true}
            />
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Threshold: {settings?.minAttendanceMinutes || 30}m</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 mono-number">
                {Math.min(
                  100,
                  Math.round(
                    ((todayStudySeconds + activeLiveStudySeconds) /
                      ((settings?.minAttendanceMinutes || 30) * 60)) *
                      100,
                  ),
                )}
                %
              </span>
            </div>
          </div>
        </StatCard>

        {/* 6. Completed Topics */}
        <StatCard
          title="Completed Topics"
          value={`${completedTopics} / ${totalTopicsCount}`}
          subtitle={`${overallProgressPercentage}% completed`}
          icon={CheckCircle2}
          accentColor="emerald"
          onClick={() => setActivePage("topics")}
        >
          <div className="space-y-1.5">
            <ProgressBar
              value={completedTopics}
              max={totalTopicsCount || 1}
              showLabel={false}
              height="h-2.5"
              color="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
              isAnimated={true}
            />
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Completed</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 mono-number">
                {overallProgressPercentage}%
              </span>
            </div>
          </div>
        </StatCard>

        {/* 7. Pending Topics */}
        <StatCard
          title="Pending Topics"
          value={pendingTopics}
          subtitle="Remaining syllabus"
          icon={ListTodo}
          accentColor="rose"
          onClick={() => setActivePage("topics")}
        >
          <div className="space-y-1.5">
            <ProgressBar
              value={pendingTopics}
              max={totalTopicsCount || 1}
              showLabel={false}
              height="h-2.5"
              color="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500"
              isAnimated={true}
            />
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Pending</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 mono-number">
                {totalTopicsCount > 0
                  ? Math.round((pendingTopics / totalTopicsCount) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </StatCard>

        {/* 8. Current Goal */}
        <StatCard
          title="Current Goal"
          value={primaryGoal ? `${primaryGoal.progress}%` : "Set Goal"}
          subtitle={primaryGoal ? primaryGoal.name : "Click to add target"}
          icon={Trophy}
          accentColor="brand"
          onClick={() => setActivePage("goals")}
        >
          <div className="space-y-1.5">
            <ProgressBar
              value={primaryGoal ? primaryGoal.progress : 0}
              max={100}
              showLabel={false}
              height="h-2.5"
              color="bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500"
              isAnimated={true}
            />
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
              <span className="truncate">
                {primaryGoal
                  ? primaryGoal.targetDate || "In Progress"
                  : "No Goal"}
              </span>
              <span className="font-bold text-brand-600 dark:text-brand-400 mono-number">
                {primaryGoal ? `${primaryGoal.progress}%` : "0%"}
              </span>
            </div>
          </div>
        </StatCard>
      </div>


      {/* Main Grid: Today's Overview & Weekly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Deep Dive Panel (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Today's Study Progress & Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Planned vs actual study performance for{" "}
                {formatFriendlyDate(todayStr)}
              </p>
            </div>
            <StatusBadge status={todayAttendance?.status || "PENDING"} />
          </div>

          {/* Planned vs Completed Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950/60">
              <span className="text-[11px] text-slate-400 block font-medium">
                Planned Hours
              </span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200 mono-number mt-0.5 block">
                {todayPlannedHours}h
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">
                Completed
              </span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 mono-number mt-0.5 block">
                {formatSecondsToShort(todayStudySeconds)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950/60">
              <span className="text-[11px] text-slate-400 block font-medium">
                Remaining
              </span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200 mono-number mt-0.5 block">
                {formatHoursToShort(todayRemainingHours)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
              <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-medium">
                Break Time
              </span>
              <span className="text-base font-bold text-amber-700 dark:text-amber-300 mono-number mt-0.5 block">
                {formatSecondsToShort(todayBreakSeconds)}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <ProgressBar
              value={todayStudyHours}
              max={todayPlannedHours}
              label="Today's Target Completion"
              subLabel={`${formatSecondsToShort(todayStudySeconds)} / ${todayPlannedHours}h (${todayTargetProgress}%)`}
              height="h-3"
              color="bg-emerald-500"
            />
          </div>

          {/* Today's Timetable Slots */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Today's Timetable ({todayDayName})
              </span>
              <button
                onClick={() => setActivePage("timetable")}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
              >
                View Full Timetable →
              </button>
            </div>

            {todayTimetable.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-dark-950/50 rounded-xl">
                No slots scheduled for today. Click "+ Schedule" above to add
                time blocks.
              </div>
            ) : (
              <div className="space-y-2">
                {todayTimetable.map((slot) => {
                  const sub = subjects.find((s) => s.id === slot.subjectId);
                  const top = topics.find((t) => t.id === slot.topicId);
                  const prep = preparations.find(
                    (p) => p.id === slot.preparationId,
                  );

                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/40 bg-slate-50/50 dark:bg-dark-950/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {sub?.name || prep?.name || "General Study"}
                            </span>
                            <PriorityBadge priority={slot.priority} />
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {top?.name ||
                              (sub?.name
                                ? "General Subject Study"
                                : "General Study Session")}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          startStudy({
                            subjectId: slot.subjectId,
                            topicId: slot.topicId,
                            targetDurationMinutes: slot.targetDuration,
                          });
                          setActivePage("timer");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                      >
                        <Play size={12} className="fill-white" />
                        <span>Start</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Weekly Bar Chart & Tomorrow Preview */}
        <div className="space-y-6">
          {/* Weekly Hours Trend */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Weekly Study Activity
              </h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {formatSecondsToShort(weeklyStudySeconds)} total
              </span>
            </div>
            <DailyBarChart data={last7DaysData} />
          </div>

          {/* Tomorrow's Target Preview */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tomorrow's Target
                </h3>
                <p className="text-[11px] text-slate-400">
                  Planned next-day sprint
                </p>
              </div>
              <button
                onClick={onOpenTomorrowTarget}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
              >
                + Plan
              </button>
            </div>

            {!targets.tomorrow || targets.tomorrow.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No targets set for tomorrow yet.{" "}
                <button
                  onClick={onOpenTomorrowTarget}
                  className="text-brand-600 dark:text-brand-400 underline font-medium"
                >
                  Plan now
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {targets.tomorrow.map((tar) => {
                  const sub = subjects.find((s) => s.id === tar.subjectId);
                  const top = topics.find((t) => t.id === tar.topicId);
                  const prep = preparations.find(
                    (p) => p.id === tar.preparationId,
                  );
                  const isTaskDone = tar.completed || tar.status === 'Completed';

                  return (
                    <div
                      key={tar.id}
                      className={`p-2.5 rounded-xl border flex flex-col gap-1 text-xs transition ${
                        isTaskDone
                          ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-50 dark:bg-dark-950/60 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className={`font-bold block truncate ${isTaskDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {tar.title || sub?.name || prep?.name || "General Target"}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {top?.name ||
                              (sub?.name
                                ? "General Subject Study"
                                : "General Study Session")}{" "}
                            • {tar.targetDurationMinutes} mins
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isTaskDone ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Done
                            </span>
                          ) : (
                            <PriorityBadge priority={tar.priority} />
                          )}
                        </div>
                      </div>
                      {isTaskDone && tar.completionNote && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 italic truncate border-t border-emerald-500/10 pt-1">
                          📝 "{tar.completionNote}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Subject Breakdown Distribution */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Subject-Wise Study Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown of total study hours invested across subjects
            </p>
          </div>
          <button
            onClick={() => setActivePage("subjects")}
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
          >
            Manage Subjects →
          </button>
        </div>
        <SubjectBreakdownChart subjects={subjects} sessions={sessions} />
      </div>
    </div>
  );
}
