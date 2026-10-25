const DEFAULT_SYNC_URL = "";

function safeJsonValue(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    return Array.isArray(value)
      ? value.map((item) => safeJsonValue(item))
      : Object.fromEntries(
          Object.entries(value).flatMap(([key, entry]) =>
            entry === undefined ? [] : [[key, safeJsonValue(entry)]],
          ),
        );
  }
  return value;
}

export function buildGoogleSheetsPayload(data, clientId = "local-user") {
  const safeData = {};

  const prepMap = Object.fromEntries(
    (data.preparations || []).map((p) => [p.id, p.name])
  );
  const subMap = Object.fromEntries(
    (data.subjects || []).map((s) => [s.id, s.name])
  );
  const topicMap = Object.fromEntries(
    (data.topics || []).map((t) => [t.id, t.name])
  );

  if (Array.isArray(data.preparations)) safeData.preparations = data.preparations;
  
  // Enriched Subjects
  if (Array.isArray(data.subjects)) {
    safeData.subjects = data.subjects.map((s) => ({
      name: s.name,
      preparation: prepMap[s.preparationId] || "General",
      targetHours: s.targetHours || 0,
      dailyTargetHours: s.dailyTargetHours || 0,
      priority: s.priority || "Medium",
      status: s.status || "In Progress",
      completionNote: s.completionNote || "",
    }));
  }

  // Enriched Topics
  if (Array.isArray(data.topics)) {
    safeData.topics = data.topics.map((t) => ({
      name: t.name,
      subject: subMap[t.subjectId] || "General",
      priority: t.priority || "Medium",
      targetDate: t.targetDate || "",
      estimatedMinutes: t.estimatedStudyTime || 0,
      status: t.status || "Pending",
      completionNote: t.completionNote || "",
    }));
  }

  // Enriched Timetable
  if (Array.isArray(data.timetable)) {
    safeData.timetable = data.timetable.map((tt) => ({
      day: tt.day,
      startTime: tt.startTime,
      endTime: tt.endTime,
      preparation: prepMap[tt.preparationId] || "General",
      subject: subMap[tt.subjectId] || "General",
      topic: topicMap[tt.topicId] || "General",
      duration: tt.targetDuration || 60,
      priority: tt.priority || "Medium",
    }));
  }

  // Enriched Sessions (Date-wise History)
  if (Array.isArray(data.sessions)) {
    safeData.sessions = data.sessions.map((s) => ({
      id: s.id,
      date: s.date,
      preparation: prepMap[s.preparationId] || "General",
      subject: subMap[s.subjectId] || "General",
      topic: topicMap[s.topicId] || "General Study",
      startTime: s.startTime || "",
      endTime: s.endTime || "",
      studyMinutes: Math.round((s.actualStudyDuration || 0) / 60),
      studyHours: ((s.actualStudyDuration || 0) / 3600).toFixed(2),
      status: s.status || "Completed",
      notes: s.notes || "",
    }));
  }

  // Enriched Attendance
  if (Array.isArray(data.attendance)) {
    safeData.attendance = data.attendance.map((a) => ({
      date: a.date,
      status: a.status,
      studyMinutes: a.studyMinutes || Math.round((a.totalStudyDuration || 0) / 60),
      studyHours: ((a.studyMinutes || (a.totalStudyDuration || 0) / 60) / 60).toFixed(2),
      notes: a.notes || "",
      recordedAt: a.recordedAt || "",
    }));
  }

  // Enriched Goals
  if (Array.isArray(data.goals)) {
    safeData.goals = data.goals.map((g) => ({
      name: g.name,
      preparation: prepMap[g.preparationId] || "General",
      targetDate: g.targetDate || "",
      targetHours: g.targetHours || 0,
      progress: (g.progress || 0) + "%",
      status: g.status || "In Progress",
    }));
  }

  if (data.targets && typeof data.targets === "object") safeData.targets = data.targets;
  if (data.settings && typeof data.settings === "object") safeData.settings = data.settings;

  // Explicit To-Dos collection formatted for Google Sheets sync
  const rawTodos = data.targets?.tomorrow || data.todos || [];
  safeData.todos = rawTodos.map((t, idx) => ({
    id: t.id || `todo-${idx + 1}`,
    title: t.title || "Untitled Task",
    time: t.time || "",
    category: t.category || "Study",
    preparation: prepMap[t.preparationId] || "General",
    subject: subMap[t.subjectId] || "General",
    topic: topicMap[t.topicId] || "General",
    targetDurationMinutes: t.targetDurationMinutes || 60,
    priority: t.priority || "Medium",
    completed: Boolean(t.completed || t.status === "Completed"),
    status: t.completed || t.status === "Completed" ? "Completed" : "Pending",
    completionNote: t.completionNote || "",
    completedAt: t.completedAt || "",
    createdAt: t.createdAt || "",
  }));

  return {
    clientId,
    meta: {
      version: "2.0.0",
      syncedAt: new Date().toISOString(),
      source: "studyflow-web",
    },
    data: safeJsonValue(safeData),
  };
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * Google Apps Script for StudyFlow
 * Deploy as Web App:
 * 1. Click "Deploy" > "New deployment"
 * 2. Select type: "Web app"
 * 3. Execute as: "Me"
 * 4. Who has access: "Anyone"
 * 5. Copy the Web App URL and paste it into StudyFlow Settings or Reports
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var data = payload.data || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Helper: Create/reset sheet with styled header
    function initSheet(sheetName, headers, bgColor) {
      var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
      sheet.clearContents();
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold").setBackground(bgColor || "#dbeafe").setFontColor("#0f172a");
      sheet.setFrozenRows(1);
      return sheet;
    }

    var totalUpdated = 0;

    // 1. Study Sessions (Date-wise History)
    if (data.sessions && data.sessions.length > 0) {
      var sSheet = initSheet("Study Sessions", [
        "Date", "Course / Prep", "Subject", "Topic", "Start Time", 
        "End Time", "Study Minutes", "Study Hours", "Status", "Notes"
      ], "#ccfbf1");
      data.sessions.forEach(function(s) {
        sSheet.appendRow([
          s.date || "", s.preparation || "", s.subject || "", s.topic || "",
          s.startTime || "", s.endTime || "", s.studyMinutes || 0,
          s.studyHours || 0, s.status || "Completed", s.notes || ""
        ]);
        totalUpdated++;
      });
    }

    // 2. Attendance
    if (data.attendance && data.attendance.length > 0) {
      var aSheet = initSheet("Attendance", [
        "Date", "Status", "Study Minutes", "Study Hours", "Notes", "Recorded At"
      ], "#fef3c7");
      data.attendance.forEach(function(a) {
        aSheet.appendRow([
          a.date || "", a.status || "", a.studyMinutes || 0,
          a.studyHours || 0, a.notes || "", a.recordedAt || ""
        ]);
        totalUpdated++;
      });
    }

    // 3. To-Do List
    if (data.todos && data.todos.length > 0) {
      var tSheet = initSheet("To-Do List", [
        "Task ID", "Task Title", "Time", "Category", "Course", 
        "Subject", "Topic", "Duration (Mins)", "Priority", "Status", 
        "Completion Note", "Completed At"
      ], "#dbeafe");
      data.todos.forEach(function(t) {
        tSheet.appendRow([
          t.id || "", t.title || "", t.time || "", t.category || "Study",
          t.preparation || "", t.subject || "", t.topic || "",
          t.targetDurationMinutes || 60, t.priority || "Medium",
          t.status || "Pending", t.completionNote || "", t.completedAt || ""
        ]);
        totalUpdated++;
      });
    }

    // 4. Subjects
    if (data.subjects && data.subjects.length > 0) {
      var subSheet = initSheet("Subjects", [
        "Subject Name", "Course", "Target Hours", "Daily Target Hours", "Priority", "Status", "Completion Note"
      ], "#f3e8ff");
      data.subjects.forEach(function(s) {
        subSheet.appendRow([
          s.name || "", s.preparation || "", s.targetHours || 0,
          s.dailyTargetHours || 0, s.priority || "Medium",
          s.status || "In Progress", s.completionNote || ""
        ]);
        totalUpdated++;
      });
    }

    // 5. Topics
    if (data.topics && data.topics.length > 0) {
      var topSheet = initSheet("Topics", [
        "Topic Name", "Subject", "Priority", "Target Date", "Estimated Mins", "Status", "Completion Note"
      ], "#fce7f3");
      data.topics.forEach(function(t) {
        topSheet.appendRow([
          t.name || "", t.subject || "", t.priority || "Medium",
          t.targetDate || "", t.estimatedMinutes || 0,
          t.status || "Pending", t.completionNote || ""
        ]);
        totalUpdated++;
      });
    }

    // 6. Timetable
    if (data.timetable && data.timetable.length > 0) {
      var ttSheet = initSheet("Timetable", [
        "Day", "Start Time", "End Time", "Course", "Subject", "Topic", "Duration (Mins)", "Priority"
      ], "#e0e7ff");
      data.timetable.forEach(function(tt) {
        ttSheet.appendRow([
          tt.day || "", tt.startTime || "", tt.endTime || "",
          tt.preparation || "", tt.subject || "", tt.topic || "",
          tt.duration || 60, tt.priority || "Medium"
        ]);
        totalUpdated++;
      });
    }

    // 7. Goals
    if (data.goals && data.goals.length > 0) {
      var gSheet = initSheet("Goals", [
        "Goal Name", "Course", "Target Date", "Target Hours", "Progress (%)", "Status"
      ], "#ede9fe");
      data.goals.forEach(function(g) {
        gSheet.appendRow([
          g.name || "", g.preparation || "", g.targetDate || "",
          g.targetHours || 0, g.progress || "0%", g.status || "In Progress"
        ]);
        totalUpdated++;
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: "StudyFlow data auto-saved to Google Sheets! (" + totalUpdated + " records updated)",
        rowCount: totalUpdated 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export async function syncToGoogleSheets({
  data,
  clientId,
  syncUrl = DEFAULT_SYNC_URL,
  syncKey = "",
  timeoutMs = 20000,
}) {
  if (!syncUrl || !syncUrl.trim()) {
    throw new Error(
      "Google Sheets Web App URL is not set. Add your Apps Script URL in Settings or Reports.",
    );
  }

  const cleanUrl = syncUrl.trim();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Notice: text/plain;charset=utf-8 avoids CORS preflight OPTIONS request in browser!
    const response = await fetch(cleanUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        ...(syncKey ? { "X-Sync-Key": syncKey } : {}),
      },
      body: JSON.stringify(buildGoogleSheetsPayload(data, clientId)),
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Google Sheets responded with status ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
    } catch {
      result = { success: true, message: "StudyFlow data saved to Google Sheets successfully!" };
    }

    if (result.success === false) {
      throw new Error(result.error || "Google Apps Script returned an error.");
    }

    return {
      success: true,
      message: result.message || "Data saved to Google Sheets successfully!",
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Google Sheets sync timed out (20s). Please check your internet connection.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
