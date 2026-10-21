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
  if (Array.isArray(data.subjects)) safeData.subjects = data.subjects;
  if (Array.isArray(data.topics)) safeData.topics = data.topics;
  if (Array.isArray(data.timetable)) safeData.timetable = data.timetable;
  if (Array.isArray(data.sessions)) safeData.sessions = data.sessions;
  if (Array.isArray(data.attendance)) safeData.attendance = data.attendance;
  if (Array.isArray(data.goals)) safeData.goals = data.goals;
  if (data.targets && typeof data.targets === "object") safeData.targets = data.targets;
  if (data.settings && typeof data.settings === "object") safeData.settings = data.settings;
  if ("notifications" in data) {
    safeData.notifications = Array.isArray(data.notifications) ? data.notifications : null;
  }

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
      version: "1.0.0",
      syncedAt: new Date().toISOString(),
      source: "studyflow-web",
    },
    data: safeJsonValue(safeData),
  };
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * Google Apps Script for StudyFlow
 * Deploy as Web App: Execute as "Me", Who has access: "Anyone"
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var data = payload.data || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sync To-Do Tasks to "To-Do List" Sheet
    if (data.todos && data.todos.length > 0) {
      var sheet = ss.getSheetByName("To-Do List") || ss.insertSheet("To-Do List");
      sheet.clearContents();
      sheet.appendRow([
        "Task ID", "Task Title", "Time", "Category", 
        "Preparation", "Subject", "Topic", "Duration (Mins)", 
        "Priority", "Status", "Completion Note", "Completed At"
      ]);
      data.todos.forEach(function(t) {
        sheet.appendRow([
          t.id || "", t.title || "", t.time || "", t.category || "Study",
          t.preparation || "", t.subject || "", t.topic || "", t.targetDurationMinutes || 60,
          t.priority || "Medium", t.status || "Pending", t.completionNote || "", t.completedAt || ""
        ]);
      });
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#e0e7ff");
    }

    // 2. Sync Study Sessions
    if (data.sessions && data.sessions.length > 0) {
      var sSheet = ss.getSheetByName("Study Sessions") || ss.insertSheet("Study Sessions");
      sSheet.clearContents();
      sSheet.appendRow(["Session ID", "Date", "Start Time", "End Time", "Study Minutes", "Notes"]);
      data.sessions.forEach(function(s) {
        sSheet.appendRow([
          s.id || "", s.date || "", s.startTime || "", s.endTime || "",
          Math.round((s.actualStudyDuration || 0) / 60), s.notes || ""
        ]);
      });
      sSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#e0f2fe");
    }

    // 3. Sync Attendance
    if (data.attendance && data.attendance.length > 0) {
      var aSheet = ss.getSheetByName("Attendance") || ss.insertSheet("Attendance");
      aSheet.clearContents();
      aSheet.appendRow(["Date", "Status", "Study Duration (Sec)", "Recorded At"]);
      data.attendance.forEach(function(a) {
        aSheet.appendRow([a.date || "", a.status || "", a.totalStudyDuration || 0, a.recordedAt || ""]);
      });
      aSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#fef3c7");
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: "StudyFlow data & To-Dos saved successfully!" }))
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
  timeoutMs = 15000,
}) {
  if (!syncUrl) {
    throw new Error(
      "Google Sheets sync endpoint is not configured. Add your Apps Script web URL in Settings.",
    );
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(syncUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(syncKey ? { "X-Sync-Key": syncKey } : {}),
      },
      body: JSON.stringify(buildGoogleSheetsPayload(data, clientId)),
      mode: "cors",
      credentials: "omit",
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = `Google Sheets sync failed with status ${response.status}`;
      throw new Error(message);
    }

    let result;
    try {
      result = await response.json();
    } catch {
      result = {};
    }

    return {
      success: true,
      message: result.message || "Data saved to Google Sheets.",
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Google Sheets sync timed out. Please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
