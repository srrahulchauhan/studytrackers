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

  // Sheet 5: Planned Tasks & Targets
  const tasksData = (targets.tomorrow || []).map((tar) => ({
    'Task Title': tar.title || 'Study Task',
    Preparation: prepMap[tar.preparationId] || 'General',
    Subject: subMap[tar.subjectId] || 'General',
    Topic: topicMap[tar.topicId] || 'General',
    'Duration (Mins)': tar.targetDurationMinutes || 60,
    'Start Time': tar.startTime || '',
    Priority: tar.priority || 'Medium',
    Status: tar.completed || tar.status === 'Completed' ? 'Completed' : 'Pending',
    'Final Status Note': tar.completionNote || '',
    'Completed At': tar.completedAt || '',
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
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  addSheet(sessionsData, 'Study Sessions');
  addSheet(attendanceData, 'Attendance');
  addSheet(subjectsData, 'Subjects');
  addSheet(topicsData, 'Topics');
  addSheet(tasksData, 'Planned Tasks');
  addSheet(timetableData, 'Timetable');
  addSheet(dailyTargetRows, 'Daily Targets');
  addSheet(weeklyTargetRows, 'Weekly Targets');
  addSheet(monthlyTargetRows, 'Monthly Targets');
  addSheet(breakHistoryRows, 'Break History');
  addSheet(goalsData, 'Goals');

  const fileName = `StudyFlow_Export_${filterMode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
