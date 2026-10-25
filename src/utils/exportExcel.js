// Excel multi-sheet export generator using SheetJS (xlsx)

import * as XLSX from 'xlsx';
import { formatSecondsToHMS, formatMinutesToShort } from './timerUtils';

export function exportStudyDataToExcel({
  preparations = [],
  subjects = [],
  topics = [],
  timetable = [],
  sessions = [],
  attendance = [],
  targets = {},
  goals = [],
  filterMode = 'all', // 'all' | 'current_month' | 'custom'
  startDate = null,
  endDate = null,
}) {
  // 1. Filter sessions & attendance if date range selected
  let filteredSessions = [...sessions];
  let filteredAttendance = [...attendance];

  if (filterMode === 'current_month') {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const prefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    filteredSessions = filteredSessions.filter((s) => s.date && s.date.startsWith(prefix));
    filteredAttendance = filteredAttendance.filter((a) => a.date && a.date.startsWith(prefix));
  } else if (filterMode === 'custom' && startDate && endDate) {
    filteredSessions = filteredSessions.filter((s) => s.date >= startDate && s.date <= endDate);
    filteredAttendance = filteredAttendance.filter((a) => a.date >= startDate && a.date <= endDate);
  }

  // Lookup helpers
  const prepMap = Object.fromEntries(preparations.map((p) => [p.id, p.name]));
  const subMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  // Sheet 1: Study Sessions
  const sessionsData = filteredSessions.map((s) => ({
    Date: s.date,
    Preparation: prepMap[s.preparationId] || 'General',
    Subject: subMap[s.subjectId] || 'General',
    Topic: topicMap[s.topicId] || 'General Study',
    'Start Time': s.startTime || '',
    'End Time': s.endTime || '',
    'Total Duration': formatSecondsToHMS(s.totalDuration || 0),
    'Break Duration': formatSecondsToHMS(s.breakDuration || 0),
    'Actual Study Time': formatSecondsToHMS(s.actualStudyDuration || 0),
    'Study Minutes': Math.round((s.actualStudyDuration || 0) / 60),
    Status: s.status || 'Completed',
    Notes: s.notes || '',
  }));

  // Sheet 2: Attendance
  const attendanceData = filteredAttendance.map((a) => ({
    Date: a.date,
    Status: a.status,
    'Study Minutes': a.studyMinutes || 0,
    'Study Hours': ((a.studyMinutes || 0) / 60).toFixed(2),
    Notes: a.notes || '',
  }));

  // Sheet 3: Subjects
  const subjectsData = subjects.map((sub) => ({
    Preparation: prepMap[sub.preparationId] || 'Unassigned',
    'Subject Name': sub.name,
    Description: sub.description || '',
    'Why Important': sub.whyImportant || '',
    'Target Hours': sub.targetHours || 0,
    'Daily Target Hours': sub.dailyTargetHours || 0,
    Priority: sub.priority || 'Medium',
    Status: sub.status || 'In Progress',
    'Final Status Note': sub.completionNote || '',
    'Completed At': sub.completedAt || '',
  }));

  // Sheet 4: Topics
  const topicsData = topics.map((top) => ({
    Subject: subMap[top.subjectId] || 'Unassigned',
    'Topic Name': top.name,
    Description: top.description || '',
    Priority: top.priority || 'Medium',
    'Target Date': top.targetDate || '',
    'Estimated Minutes': top.estimatedStudyTime || 0,
    Status: top.status || 'Pending',
    'Final Status Note': top.completionNote || '',
    'Completed At': top.completedAt || '',
  }));

  // Sheet 5: Planned Tasks & To-Do List
  const tasksData = (targets.tomorrow || []).map((tar) => ({
    'Task Title': tar.title || 'Study Task',
    Time: tar.time || '',
    Category: tar.category || 'Study',
    Preparation: prepMap[tar.preparationId] || 'General',
    Subject: subMap[tar.subjectId] || 'General',
    Topic: topicMap[tar.topicId] || 'General',
    'Duration (Mins)': tar.targetDurationMinutes || 60,
    Priority: tar.priority || 'Medium',
    Status: tar.completed || tar.status === 'Completed' ? 'Completed' : 'Pending',
    'Final Status Note': tar.completionNote || '',
    'Completed At': tar.completedAt || '',
    'Created At': tar.createdAt || '',
  }));

  // Sheet 6: Timetable
  const timetableData = timetable.map((tt) => ({
    Day: tt.day,
    'Start Time': tt.startTime,
    'End Time': tt.endTime,
    Preparation: prepMap[tt.preparationId] || 'General',
    Subject: subMap[tt.subjectId] || 'General',
    Topic: topicMap[tt.topicId] || 'General',
    'Target Duration (Mins)': tt.targetDuration || 60,
    Repeat: tt.repeat ? 'Yes' : 'No',
    Priority: tt.priority || 'Medium',
  }));

  // Sheet 6: Daily Targets
  const dailyTargetRows = [
    {
      'Daily Target Hours': targets.daily?.targetHours || 4,
      'Allocated Subjects': (targets.daily?.subjectDistribution || [])
        .map((sd) => `${subMap[sd.subjectId] || 'Subject'}: ${sd.targetHours}h`)
        .join(', '),
    }
  ];

  // Sheet 7: Weekly Targets
  const weeklyTargetRows = [
    {
      'Weekly Target Hours': targets.weekly?.targetHours || 25,
      Monday: `${targets.weekly?.dailyPlan?.Monday || 0}h`,
      Tuesday: `${targets.weekly?.dailyPlan?.Tuesday || 0}h`,
      Wednesday: `${targets.weekly?.dailyPlan?.Wednesday || 0}h`,
      Thursday: `${targets.weekly?.dailyPlan?.Thursday || 0}h`,
      Friday: `${targets.weekly?.dailyPlan?.Friday || 0}h`,
      Saturday: `${targets.weekly?.dailyPlan?.Saturday || 0}h`,
      Sunday: `${targets.weekly?.dailyPlan?.Sunday || 0}h`,
    }
  ];

  // Sheet 8: Monthly Targets
  const monthlyTargetRows = [
    {
      Month: targets.monthly?.month || 'Current Month',
      Year: targets.monthly?.year || new Date().getFullYear(),
      'Monthly Target Hours': targets.monthly?.targetHours || 100,
    }
  ];

  // Sheet 9: Break History
  const breakHistoryRows = [];
  filteredSessions.forEach((sess) => {
    if (sess.breaks && sess.breaks.length > 0) {
      sess.breaks.forEach((b) => {
        breakHistoryRows.push({
          Date: sess.date,
          Preparation: prepMap[sess.preparationId] || 'General',
          Subject: subMap[sess.subjectId] || 'General',
          Topic: topicMap[sess.topicId] || 'General',
          'Break Start': b.startTime || '',
          'Break End': b.endTime || '',
          'Break Duration': formatSecondsToHMS(b.duration || 0),
          Reason: b.reason || 'Rest',
        });
      });
    }
  });

  // Sheet 10: Goals
  const goalsData = goals.map((g) => ({
    'Goal Name': g.name,
    Preparation: prepMap[g.preparationId] || 'Overall',
    'Target Date': g.targetDate || '',
    'Target Hours': g.targetHours || 0,
    'Progress (%)': `${g.progress || 0}%`,
    Status: g.status || 'In Progress',
    Milestones: (g.milestones || [])
      .map((m) => `${m.title} [${m.completed ? 'Done' : 'Pending'}]`)
      .join('; '),
  }));

  // Build Workbook
  const wb = XLSX.utils.book_new();

  const addSheet = (data, sheetName) => {
    const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ Note: 'No records available' }]);
    autoFitColumns(ws, data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  addSheet(sessionsData, 'Study Sessions');
  addSheet(attendanceData, 'Attendance');
  addSheet(subjectsData, 'Subjects');
  addSheet(topicsData, 'Topics');
  addSheet(tasksData, 'To-Do & Tasks');
  addSheet(timetableData, 'Timetable');
  addSheet(dailyTargetRows, 'Daily Targets');
  addSheet(weeklyTargetRows, 'Weekly Targets');
  addSheet(monthlyTargetRows, 'Monthly Targets');
  addSheet(breakHistoryRows, 'Break History');
  addSheet(goalsData, 'Goals');

  const fileName = `StudyFlow_Export_${filterMode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Auto-fit Excel column widths based on content
 */
function autoFitColumns(ws, rows) {
  if (!rows || rows.length === 0) return;
  const colKeys = Object.keys(rows[0]);
  const colWidths = colKeys.map((key) => {
    let maxLen = key.length;
    for (let i = 0; i < Math.min(rows.length, 100); i++) {
      const val = rows[i][key];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
  });
  ws['!cols'] = colWidths;
}

/**
 * Date-Wise Study History & Reports Excel Export
 * Generates all 6 worksheets required by StudyFlow Analytics:
 * Sheet 1: Dashboard Summary
 * Sheet 2: Daily Study History
 * Sheet 3: Subject Analysis
 * Sheet 4: Attendance History
 * Sheet 5: Goals and Targets
 * Sheet 6: Revision History
 */
export function exportDateWiseStudyReportToExcel({
  sessions = [],
  subjects = [],
  topics = [],
  attendance = [],
  preparations = [],
  goals = [],
  targets = {},
  settings = {},
  filterMode = 'all', // 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'weekly' | 'monthly' | 'this_month' | 'prev_month' | 'this_year' | 'custom'
  startDate = null,
  endDate = null,
}) {
  const prepMap = Object.fromEntries(preparations.map((p) => [p.id, p.name]));
  const subMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  const daysAgoStr = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  // 1. Filter sessions & attendance by date
  let filteredSessions = [...sessions];
  let filteredAttendance = [...attendance];

  if (filterMode === 'today') {
    filteredSessions = filteredSessions.filter((s) => s.date === todayStr);
    filteredAttendance = filteredAttendance.filter((a) => a.date === todayStr);
  } else if (filterMode === 'yesterday') {
    const yStr = getYesterdayStr();
    filteredSessions = filteredSessions.filter((s) => s.date === yStr);
    filteredAttendance = filteredAttendance.filter((a) => a.date === yStr);
  } else if (filterMode === 'last7' || filterMode === 'weekly') {
    const start = daysAgoStr(7);
    filteredSessions = filteredSessions.filter((s) => s.date >= start && s.date <= todayStr);
    filteredAttendance = filteredAttendance.filter((a) => a.date >= start && a.date <= todayStr);
  } else if (filterMode === 'last30') {
    const start = daysAgoStr(30);
    filteredSessions = filteredSessions.filter((s) => s.date >= start && s.date <= todayStr);
    filteredAttendance = filteredAttendance.filter((a) => a.date >= start && a.date <= todayStr);
  } else if (filterMode === 'this_month' || filterMode === 'monthly' || filterMode === 'current_month') {
    const prefix = todayStr.slice(0, 7);
    filteredSessions = filteredSessions.filter((s) => s.date && s.date.startsWith(prefix));
    filteredAttendance = filteredAttendance.filter((a) => a.date && a.date.startsWith(prefix));
  } else if (filterMode === 'prev_month') {
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    filteredSessions = filteredSessions.filter((s) => s.date && s.date.startsWith(prefix));
    filteredAttendance = filteredAttendance.filter((a) => a.date && a.date.startsWith(prefix));
  } else if (filterMode === 'this_year') {
    const prefix = `${now.getFullYear()}-`;
    filteredSessions = filteredSessions.filter((s) => s.date && s.date.startsWith(prefix));
    filteredAttendance = filteredAttendance.filter((a) => a.date && a.date.startsWith(prefix));
  } else if (filterMode === 'custom' && startDate && endDate) {
    filteredSessions = filteredSessions.filter((s) => s.date >= startDate && s.date <= endDate);
    filteredAttendance = filteredAttendance.filter((a) => a.date >= startDate && a.date <= endDate);
  }

  // Sort sessions date descending, then start time
  filteredSessions.sort((a, b) => {
    const cmp = (b.date || '').localeCompare(a.date || '');
    if (cmp !== 0) return cmp;
    return (b.startTime || '').localeCompare(a.startTime || '');
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return daysOfWeek[d.getDay()] || '';
    } catch {
      return '';
    }
  };

  // Calculations for Sheet 1: Dashboard Summary
  const totalStudySeconds = filteredSessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);
  const totalStudyHours = (totalStudySeconds / 3600).toFixed(2);

  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const todaySeconds = todaySessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);

  const weekStart = daysAgoStr(7);
  const weeklySessions = sessions.filter((s) => s.date >= weekStart && s.date <= todayStr);
  const weeklySeconds = weeklySessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);

  const monthPrefix = todayStr.slice(0, 7);
  const monthlySessions = sessions.filter((s) => s.date && s.date.startsWith(monthPrefix));
  const monthlySeconds = monthlySessions.reduce((acc, s) => acc + (s.actualStudyDuration || 0), 0);

  const completedTopics = topics.filter((t) => t.status === 'Completed' || t.completed === true);
  const pendingTopics = topics.filter((t) => t.status !== 'Completed' && !t.completed);

  const presentDays = filteredAttendance.filter((a) => a.status === 'Present').length;
  const attendanceRate = filteredAttendance.length > 0 ? Math.round((presentDays / filteredAttendance.length) * 100) : 100;

  const completedRevisions = topics.filter((t) => t.revisionCompleted || t.status === 'Completed').length;
  const revisionRate = topics.length > 0 ? Math.round((completedRevisions / topics.length) * 100) : 0;

  const completedGoals = goals.filter((g) => g.status === 'Completed').length;
  const goalRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  const uniqueStudyDays = new Set(filteredSessions.map((s) => s.date)).size;
  const avgDailyHours = uniqueStudyDays > 0 ? (totalStudySeconds / uniqueStudyDays / 3600).toFixed(2) : '0.00';

  // Sheet 1: Dashboard Summary
  const summarySheetData = [
    { 'Metric Name': 'Report Scope', 'Value': filterMode === 'custom' && startDate && endDate ? `${startDate} to ${endDate}` : filterMode, 'Unit / Description': 'Filtered Date Range' },
    { 'Metric Name': 'Report Generated At', 'Value': new Date().toLocaleString(), 'Unit / Description': 'Timestamp' },
    { 'Metric Name': 'Total Study Hours', 'Value': Number(totalStudyHours), 'Unit / Description': 'Hours' },
    { 'Metric Name': 'Total Study Duration', 'Value': formatSecondsToHMS(totalStudySeconds), 'Unit / Description': 'HMS' },
    { 'Metric Name': "Today's Study Hours", 'Value': Number((todaySeconds / 3600).toFixed(2)), 'Unit / Description': 'Hours' },
    { 'Metric Name': 'Weekly Study Hours (Last 7 Days)', 'Value': Number((weeklySeconds / 3600).toFixed(2)), 'Unit / Description': 'Hours' },
    { 'Metric Name': 'Monthly Study Hours (Current Month)', 'Value': Number((monthlySeconds / 3600).toFixed(2)), 'Unit / Description': 'Hours' },
    { 'Metric Name': 'Average Daily Study Time', 'Value': Number(avgDailyHours), 'Unit / Description': 'Hours per active day' },
    { 'Metric Name': 'Total Study Sessions Logged', 'Value': filteredSessions.length, 'Unit / Description': 'Sessions' },
    { 'Metric Name': 'Total Completed Topics', 'Value': completedTopics.length, 'Unit / Description': 'Topics' },
    { 'Metric Name': 'Total Pending Topics', 'Value': pendingTopics.length, 'Unit / Description': 'Topics' },
    { 'Metric Name': 'Attendance Percentage', 'Value': `${attendanceRate}%`, 'Unit / Description': `${presentDays} / ${filteredAttendance.length || 0} Recorded Days` },
    { 'Metric Name': 'Revision Completion Rate', 'Value': `${revisionRate}%`, 'Unit / Description': `${completedRevisions} / ${topics.length || 0} Topics` },
    { 'Metric Name': 'Goal Completion Rate', 'Value': `${goalRate}%`, 'Unit / Description': `${completedGoals} / ${goals.length || 0} Goals Completed` },
  ];

  // Sheet 2: Daily Study History (Every date, session, lecture, notes, revision)
  const dateWiseRows = filteredSessions.map((s, idx) => {
    const netMins = Math.round((s.actualStudyDuration || 0) / 60);
    const netHours = ((s.actualStudyDuration || 0) / 3600).toFixed(2);
    const topicObj = topics.find((t) => t.id === s.topicId);
    return {
      '#': idx + 1,
      'Date': s.date || '',
      'Day': getDayName(s.date),
      'Subject': subMap[s.subjectId] || 'General',
      'Topic': topicMap[s.topicId] || 'General Study',
      'Course / Prep': prepMap[s.preparationId] || 'General',
      'Start Time': s.startTime || '',
      'End Time': s.endTime || '',
      'Study Duration': formatSecondsToHMS(s.actualStudyDuration || 0),
      'Study Minutes': netMins,
      'Study Hours': Number(netHours),
      'Break Duration': formatSecondsToHMS(s.breakDuration || 0),
      'Productive Study Duration': formatSecondsToHMS(s.actualStudyDuration || 0),
      'Lecture Status': (s.lectureCompleted ?? (topicObj?.lectureCompleted ?? (s.status === 'Completed'))) ? 'Completed' : 'Pending',
      'Notes Status': (s.notesCompleted ?? (topicObj?.notesCompleted ?? (s.status === 'Completed'))) ? 'Completed' : 'Pending',
      'Revision Status': (s.revisionCompleted ?? (topicObj?.revisionCompleted ?? (s.status === 'Completed'))) ? 'Completed' : 'Pending',
      'Attendance Status': s.attendance || (s.actualStudyDuration >= 1800 ? 'Present' : 'Logged'),
      'Status': s.status || 'Completed',
      'Notes / Takeaways': s.notes || '',
    };
  });

  // Sheet 3: Subject Analysis
  const subSummary = {};
  subjects.forEach((sub) => {
    subSummary[sub.id] = {
      id: sub.id,
      name: sub.name,
      prepName: prepMap[sub.preparationId] || 'General',
      targetHours: sub.targetHours || 0,
      studySeconds: 0,
      sessionsCount: 0,
      completedTopics: 0,
      pendingTopics: 0,
      revisionCount: 0,
    };
  });

  filteredSessions.forEach((s) => {
    const subId = s.subjectId;
    if (subId && subSummary[subId]) {
      subSummary[subId].studySeconds += (s.actualStudyDuration || 0);
      subSummary[subId].sessionsCount += 1;
    }
  });

  topics.forEach((t) => {
    const subId = t.subjectId;
    if (subId && subSummary[subId]) {
      if (t.status === 'Completed' || t.completed === true) {
        subSummary[subId].completedTopics += 1;
      } else {
        subSummary[subId].pendingTopics += 1;
      }
      if (t.revisionCompleted || t.status === 'Revision') {
        subSummary[subId].revisionCount += 1;
      }
    }
  });

  const subjectRows = Object.values(subSummary)
    .sort((a, b) => b.studySeconds - a.studySeconds)
    .map((sub, idx) => {
      const hours = (sub.studySeconds / 3600).toFixed(2);
      const totalTops = sub.completedTopics + sub.pendingTopics;
      const progress = totalTops > 0 ? Math.round((sub.completedTopics / totalTops) * 100) : 0;
      return {
        '#': idx + 1,
        'Subject Name': sub.name,
        'Course / Preparation': sub.prepName,
        'Total Study Time': formatSecondsToHMS(sub.studySeconds),
        'Total Study Hours': Number(hours),
        'Target Hours': sub.targetHours,
        'Completed Topics': sub.completedTopics,
        'Pending Topics': sub.pendingTopics,
        'Revision Statistics': `${sub.revisionCount} Topics in/completed Revision`,
        'Progress Percentage': `${progress}%`,
        'Total Sessions': sub.sessionsCount,
      };
    });

  // Sheet 4: Attendance History
  const minMins = settings?.minAttendanceMinutes || 30;
  const attendanceRows = filteredAttendance.map((a, idx) => ({
    '#': idx + 1,
    'Date': a.date,
    'Day': getDayName(a.date),
    'Attendance Status': a.status,
    'Required Study Duration': `${minMins} mins`,
    'Actual Study Duration': formatSecondsToHMS((a.studyMinutes || 0) * 60),
    'Study Minutes': a.studyMinutes || 0,
    'Study Hours': Number(((a.studyMinutes || 0) / 60).toFixed(2)),
    'Notes': a.notes || '',
  }));

  // Sheet 5: Goals and Targets
  const goalsRows = goals.map((g, idx) => ({
    '#': idx + 1,
    'Goal Name': g.name || 'Study Target',
    'Course / Prep': prepMap[g.preparationId] || 'General',
    'Target Duration (Hours)': g.targetHours || 0,
    'Actual Duration / Progress': `${g.progress || 0}%`,
    'Start Date': g.startDate || '',
    'Deadline': g.targetDate || '',
    'Completion Status': g.status || 'In Progress',
  }));

  // Sheet 6: Revision History
  const revisionRows = topics.map((t, idx) => ({
    '#': idx + 1,
    'Subject': subMap[t.subjectId] || 'General',
    'Topic': t.name,
    'Revision Date': t.targetDate || t.completedAt?.slice(0, 10) || '',
    'Revision Status': t.revisionCompleted ? 'Completed' : (t.status === 'Revision' ? 'Due Today' : (t.status === 'Completed' ? 'Mastered' : 'Pending')),
    'Number of Revisions': t.revisionCount || (t.status === 'Completed' ? 1 : 0),
    'Completion Note': t.completionNote || '',
  }));

  // Build Multi-Sheet Workbook
  const wb = XLSX.utils.book_new();

  const addSheetWithFormatting = (data, sheetName) => {
    const ws = XLSX.utils.json_to_sheet(
      data.length ? data : [{ Note: `No records found for ${sheetName}` }]
    );
    autoFitColumns(ws, data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  addSheetWithFormatting(summarySheetData, 'Dashboard Summary');
  addSheetWithFormatting(dateWiseRows, 'Daily Study History');
  addSheetWithFormatting(subjectRows, 'Subject Analysis');
  addSheetWithFormatting(attendanceRows, 'Attendance History');
  addSheetWithFormatting(goalsRows, 'Goals and Targets');
  addSheetWithFormatting(revisionRows, 'Revision History');

  const rangeLabel = filterMode === 'custom' && startDate && endDate
    ? `${startDate}_to_${endDate}`
    : filterMode;

  const fileName = `StudyFlow_Report_${rangeLabel}_${todayStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return { success: true, count: filteredSessions.length, fileName };
}

/**
 * Dedicated export for To-Do / Planned tasks specifically
 */
export function exportTodosToExcel({
  todos = [],
  subjects = [],
  preparations = [],
  topics = [],
}) {
  const prepMap = Object.fromEntries(preparations.map((p) => [p.id, p.name]));
  const subMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]));
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  const rows = todos.map((t, index) => ({
    '#': index + 1,
    'Task Title': t.title || 'Untitled Task',
    Time: t.time || '',
    Category: t.category || 'Study',
    Preparation: prepMap[t.preparationId] || 'General',
    Subject: subMap[t.subjectId] || 'General',
    Topic: topicMap[t.topicId] || 'General',
    'Target Duration (Mins)': t.targetDurationMinutes || 60,
    Priority: t.priority || 'Medium',
    Status: t.completed || t.status === 'Completed' ? 'Completed' : 'Pending',
    'Completion Note': t.completionNote || '',
    'Completed At': t.completedAt || '',
    'Created At': t.createdAt || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(
    rows.length ? rows : [{ Note: 'No To-Do items available' }]
  );
  autoFitColumns(ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, 'To-Do List');

  const fileName = `StudyFlow_Todos_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
