import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatSecondsToHMS } from './timerUtils';

/**
 * Generate and download a comprehensive, professional PDF report for StudyFlow.
 * Includes executive summary cards, daily study hours, subject breakdown,
 * topic completion, attendance, revision progress, goals, and complete session history.
 */
export function exportStudyAnalyticsPdf({
  dateRangeLabel = 'Complete History',
  startDate = null,
  endDate = null,
  summaryStats = {},
  filteredSessions = [],
  dailyAggregates = [],
  subjectAggregates = [],
  topicStats = {},
  attendanceStats = {},
  revisionStats = {},
  goals = [],
  preparations = [],
  subjects = [],
  topics = [],
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [11, 19, 43]; // #0b132b
  const accentBlue = [29, 104, 246]; // #1d68f6
  const emeraldColor = [16, 185, 129]; // #10b981
  const darkTextColor = [30, 41, 59];
  const mutedTextColor = [100, 116, 139];

  // Helper for adding section header
  const addSectionHeader = (title, yPos) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(36, yPos, pageWidth - 72, 22, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text(title, 46, yPos + 15);
    return yPos + 28;
  };

  // Header Banner on first page
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 74, 'F');

  // Accent highlight strip
  doc.setFillColor(...accentBlue);
  doc.rect(0, 72, pageWidth, 3, 'F');

  // Brand title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('StudyFlow', 36, 36);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Student Study Management & Analytics Report', 36, 52);

  // Date Range and Generated Timestamp on the right
  const now = new Date();
  const generatedAt = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  doc.setFontSize(9);
  doc.setTextColor(241, 245, 249);
  doc.text(`Scope: ${dateRangeLabel}`, pageWidth - 36, 34, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${generatedAt}`, pageWidth - 36, 50, { align: 'right' });

  let currentY = 92;

  // 1. Executive Summary Cards (Rendered as 2-row structured table)
  currentY = addSectionHeader('1. Executive Analytics Summary', currentY);

  const summaryRows = [
    [
      { content: 'Total Study Time:\n' + (summaryStats.totalHoursFormatted || '0h 0m'), styles: { fontStyle: 'bold' } },
      { content: "Today's Study:\n" + (summaryStats.todayHoursFormatted || '0h 0m'), styles: { fontStyle: 'bold' } },
      { content: 'Weekly Study:\n' + (summaryStats.weeklyHoursFormatted || '0h 0m'), styles: { fontStyle: 'bold' } },
      { content: 'Monthly Study:\n' + (summaryStats.monthlyHoursFormatted || '0h 0m'), styles: { fontStyle: 'bold' } },
      { content: 'Daily Average:\n' + (summaryStats.avgDailyFormatted || '0h 0m'), styles: { fontStyle: 'bold' } },
    ],
    [
      { content: `Completed Topics:\n${summaryStats.completedTopicsCount || 0} Topics`, styles: { fontStyle: 'bold' } },
      { content: `Pending Topics:\n${summaryStats.pendingTopicsCount || 0} Topics`, styles: { fontStyle: 'bold' } },
      { content: `Attendance Rate:\n${summaryStats.attendancePct || 0}%`, styles: { fontStyle: 'bold' } },
      { content: `Revision Rate:\n${summaryStats.revisionPct || 0}%`, styles: { fontStyle: 'bold' } },
      { content: `Goal Completion:\n${summaryStats.goalPct || 0}%`, styles: { fontStyle: 'bold' } },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: 36, right: 36 },
    body: summaryRows,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: darkTextColor,
      halign: 'center',
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { fillColor: [248, 250, 252] },
      1: { fillColor: [240, 253, 250] },
      2: { fillColor: [239, 246, 255] },
      3: { fillColor: [250, 245, 255] },
      4: { fillColor: [254, 243, 199] },
    },
  });

  currentY = doc.lastAutoTable.finalY + 16;

  // 2. Daily Study Hours Analysis Table
  currentY = addSectionHeader('2. Daily Study Hours Analysis', currentY);

  const dailyRows = (dailyAggregates || []).slice(0, 15).map((d) => [
    d.date,
    d.dayName || '',
    ((d.studySeconds || 0) / 3600).toFixed(2) + ' hrs',
    formatSecondsToHMS(d.studySeconds || 0),
    formatSecondsToHMS(d.breakSeconds || 0),
    d.sessionsCount || 0,
    d.attendance || 'Present',
    d.subjects || 'General',
  ]);

  if (dailyRows.length === 0) {
    dailyRows.push(['No study activity recorded for this period', '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 36, right: 36 },
    head: [['Date', 'Day', 'Study Hours', 'Net Study (HMS)', 'Breaks', 'Sessions', 'Attendance', 'Subjects Studied']],
    body: dailyRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4.5,
      textColor: darkTextColor,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  currentY = doc.lastAutoTable.finalY + 16;

  // Check if we need page break before next sections
  if (currentY > pageHeight - 120) {
    doc.addPage();
    currentY = 40;
  }

  // 3. Subject-Wise Study Analysis
  currentY = addSectionHeader('3. Subject-Wise Study Breakdown', currentY);

  const subjectRows = (subjectAggregates || []).map((s) => [
    s.name,
    s.prepName || 'General',
    ((s.studySeconds || 0) / 3600).toFixed(2) + ' hrs',
    formatSecondsToHMS(s.studySeconds || 0),
    s.sharePct ? `${s.sharePct}%` : '0%',
    s.completedTopics || 0,
    s.pendingTopics || 0,
    s.sessionsCount || 0,
  ]);

  if (subjectRows.length === 0) {
    subjectRows.push(['No subjects studied in this period', '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 36, right: 36 },
    head: [['Subject Name', 'Course / Prep', 'Study Hours', 'Duration (HMS)', 'Time Share', 'Completed Topics', 'Pending Topics', 'Sessions']],
    body: subjectRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138], // Dark Indigo
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4.5,
      textColor: darkTextColor,
    },
  });

  currentY = doc.lastAutoTable.finalY + 16;

  // 4. Attendance, Revision & Topics Progress Summary
  if (currentY > pageHeight - 140) {
    doc.addPage();
    currentY = 40;
  }

  currentY = addSectionHeader('4. Attendance, Revision & Goals Summary', currentY);

  const attSummaryRows = [
    ['Metric', 'Current Status / Value', 'Notes / Standard'],
    ['Attendance Rate', `${attendanceStats.attendancePercentage || 0}%`, `${attendanceStats.presentDays || 0} Present / ${attendanceStats.totalRecordedDays || 0} Days Logged`],
    ['Present Days', `${attendanceStats.presentDays || 0} Days`, 'Met minimum daily study criteria'],
    ['Absent / Off Days', `${attendanceStats.absentDays || 0} Days`, 'Below threshold study time or marked absent'],
    ['Revision Completion', `${revisionStats.revisionPercentage || 0}%`, `${revisionStats.completedRevisions || 0} Completed / ${revisionStats.totalRevisions || 0} Total Topics`],
    ['Topic Completion', `${topicStats.completionRate || 0}%`, `${topicStats.completedTopics || 0} Done / ${topicStats.totalTopics || 0} Total`],
    ['Goals Active & Completed', `${goals.filter((g) => g.status === 'Completed').length} / ${goals.length}`, 'Active study targets & milestones'],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: 36, right: 36 },
    head: [attSummaryRows[0]],
    body: attSummaryRows.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110], // Teal
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4.5,
      textColor: darkTextColor,
    },
  });

  currentY = doc.lastAutoTable.finalY + 16;

  // 5. Complete Date-Wise Study History Sessions
  if (currentY > pageHeight - 140) {
    doc.addPage();
    currentY = 40;
  }

  currentY = addSectionHeader('5. Complete Study Session History', currentY);

  const subMap = Object.fromEntries((subjects || []).map((s) => [s.id, s.name]));
  const topicMap = Object.fromEntries((topics || []).map((t) => [t.id, t.name]));

  const sessionRows = (filteredSessions || []).map((s, idx) => {
    const netMins = Math.round((s.actualStudyDuration || 0) / 60);
    return [
      idx + 1,
      s.date || '',
      subMap[s.subjectId] || 'General',
      topicMap[s.topicId] || 'General Study',
      s.startTime || '-',
      s.endTime || '-',
      `${netMins}m (${formatSecondsToHMS(s.actualStudyDuration || 0)})`,
      s.lectureCompleted ?? (s.status === 'Completed') ? 'Done' : 'Pending',
      s.notesCompleted ?? (s.status === 'Completed') ? 'Done' : 'Pending',
      s.revisionCompleted ?? (s.status === 'Completed') ? 'Done' : 'Pending',
      s.status || 'Completed',
    ];
  });

  if (sessionRows.length === 0) {
    sessionRows.push(['', 'No study sessions found for selected filters', '', '', '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 36, right: 36 },
    head: [['#', 'Date', 'Subject', 'Topic', 'Start', 'End', 'Duration', 'Lecture', 'Notes', 'Revision', 'Status']],
    body: sessionRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: darkTextColor,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Footer on each page with Page X of Y and timestamp
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(36, pageHeight - 24, pageWidth - 36, pageHeight - 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedTextColor);
    doc.text('StudyFlow Student Study Management System — Confidential', 36, pageHeight - 12);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 36, pageHeight - 12, { align: 'right' });
  }

  // Save PDF
  const cleanRange = dateRangeLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `StudyFlow_Analytics_Report_${cleanRange}.pdf`;
  doc.save(filename);

  return { success: true, filename, pageCount: totalPages };
}
