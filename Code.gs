/**
 * =========================================================================
 * Universal Google Sheets Auto-Sync System — Master Backend (Code.gs)
 * =========================================================================
 * 
 * Reusable Google Apps Script Database Engine for Any Web Application.
 * 
 * Supported Standard Operations:
 * - health       : Check API status, spreadsheet access, and project stats
 * - getConfig    : Retrieve active project configuration and sheet names
 * - list         : List records for a specific sheet/module or entire project
 * - get          : Get a specific record by sheetName and recordId
 * - create       : Insert a new record
 * - update       : Update an existing record (increments version)
 * - upsert       : Insert or update a record
 * - delete       : Soft delete a record (sets deletedAt timestamp)
 * - sync         : Bulk transactional batch sync for outbox/queue
 * - download     : Returns direct .xlsx download URL for the spreadsheet
 * 
 * Standard Worksheets Automatically Maintained:
 * 1. Projects    : [projectId, projectName, description, createdAt, lastSyncAt]
 * 2. Records     : [projectId, sheetName, recordId, dataJson, createdAt, updatedAt, deletedAt, version]
 * 3. AuditLog    : [timestamp, projectId, sheetName, recordId, operation, status, details]
 * 4. SyncState   : [projectId, sheetName, lastRecordId, totalRecords, lastSyncTimestamp]
 * 
 * 2-Minute Deployment Instructions:
 * 1. Open Google Sheets (or script.google.com)
 * 2. Extensions > Apps Script
 * 3. Replace all Code.gs contents with this entire file and Save (Ctrl+S)
 * 4. Deploy > Manage deployments > Edit > New version > Who has access: "Anyone"
 * 5. Copy the /exec URL and paste into your application settings!
 */

var VERSION = "4.0.0";
var DEFAULT_PROJECT_ID = "studyflow";

/**
 * Universal JSON Response Helper with CORS
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Universal Spreadsheet Resolver
 * Works with Container-Bound scripts AND Standalone scripts (script.google.com).
 * If standalone and no spreadsheet is linked, automatically creates one in Google Drive!
 */
function getSpreadsheet(customSheetIdOrUrl) {
  var ss = null;
  var props = PropertiesService.getScriptProperties();

  // 1. First Priority: If a specific Google Sheet ID or URL is provided, open THAT sheet!
  if (customSheetIdOrUrl) {
    try {
      var str = customSheetIdOrUrl.toString().trim();
      var match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      var targetId = (match && match[1]) ? match[1] : (str.indexOf("http") === -1 && str.length > 15 ? str : null);
      if (targetId) {
        ss = SpreadsheetApp.openById(targetId);
      } else if (str.indexOf("http") === 0) {
        ss = SpreadsheetApp.openByUrl(str);
      }
      if (ss) {
        props.setProperty("UNIVERSAL_SPREADSHEET_ID", ss.getId());
        return ss;
      }
    } catch (e) {
      // Permission or invalid ID error on custom sheet, fall back
    }
  }

  // 2. Container-bound spreadsheet (Extensions > Apps Script from inside a sheet)
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}

  // 3. Saved ID from previous executions
  var savedId = props.getProperty("UNIVERSAL_SPREADSHEET_ID");
  if (savedId) {
    try {
      ss = SpreadsheetApp.openById(savedId);
      if (ss) return ss;
    } catch (e) {}
  }

  // 4. Standalone automatic database creation
  ss = SpreadsheetApp.create("StudyFlow Master Database — Google Sheets Backend");
  props.setProperty("UNIVERSAL_SPREADSHEET_ID", ss.getId());
  return ss;
}

/**
 * Ensure Standard Database Schema and Worksheets Exist
 */
function ensureDatabaseSchema(ss) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {}

  try {
    // 1. Projects Table
    var pSheet = ss.getSheetByName("Projects") || ss.insertSheet("Projects", 0);
    if (pSheet.getLastRow() === 0) {
      pSheet.appendRow(["projectId", "projectName", "description", "createdAt", "lastSyncAt"]);
      pSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
      pSheet.setFrozenRows(1);
    }

    // 2. Records Table (Core Generic Data Store)
    var rSheet = ss.getSheetByName("Records") || ss.insertSheet("Records", 1);
    if (rSheet.getLastRow() === 0) {
      rSheet.appendRow(["projectId", "sheetName", "recordId", "dataJson", "createdAt", "updatedAt", "deletedAt", "version"]);
      rSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");
      rSheet.setFrozenRows(1);
    }

    // 3. AuditLog Table
    var aSheet = ss.getSheetByName("AuditLog") || ss.insertSheet("AuditLog", 2);
    if (aSheet.getLastRow() === 0) {
      aSheet.appendRow(["timestamp", "projectId", "sheetName", "recordId", "operation", "status", "details"]);
      aSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#4338ca").setFontColor("#ffffff");
      aSheet.setFrozenRows(1);
    }

    // 4. SyncState Table
    var sSheet = ss.getSheetByName("SyncState") || ss.insertSheet("SyncState", 3);
    if (sSheet.getLastRow() === 0) {
      sSheet.appendRow(["projectId", "sheetName", "lastRecordId", "totalRecords", "lastSyncTimestamp"]);
      sSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#b45309").setFontColor("#ffffff");
      sSheet.setFrozenRows(1);
    }

    return { pSheet: pSheet, rSheet: rSheet, aSheet: aSheet, sSheet: sSheet };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Log action to AuditLog
 */
function logAudit(ss, projectId, sheetName, recordId, operation, status, details) {
  try {
    var aSheet = ss.getSheetByName("AuditLog") || ss.insertSheet("AuditLog");
    aSheet.appendRow([
      new Date().toISOString(),
      projectId || DEFAULT_PROJECT_ID,
      sheetName || "global",
      recordId || "n/a",
      operation || "UNKNOWN",
      status || "SUCCESS",
      typeof details === "object" ? JSON.stringify(details) : (details || "")
    ]);
  } catch (e) {}
}

/**
 * Update SyncState record for (projectId, sheetName)
 */
function updateSyncState(ss, projectId, sheetName, lastRecordId, totalCount) {
  try {
    var sSheet = ss.getSheetByName("SyncState");
    if (!sSheet) return;
    var rows = sSheet.getDataRange().getValues();
    var foundIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === projectId && rows[i][1] === sheetName) {
        foundIndex = i + 1;
        break;
      }
    }
    var now = new Date().toISOString();
    if (foundIndex > 0) {
      sSheet.getRange(foundIndex, 3, 1, 3).setValues([[lastRecordId || "", totalCount || 0, now]]);
    } else {
      sSheet.appendRow([projectId, sheetName, lastRecordId || "", totalCount || 0, now]);
    }
  } catch (e) {}
}

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = (params.action || params.operation || "health").toLowerCase();
    var projectId = params.projectId || DEFAULT_PROJECT_ID;
    var sheetName = params.sheetName || "";
    var customSheet = params.spreadsheetId || params.sheetUrl || params.spreadsheetUrl || "";

    var ss = getSpreadsheet(customSheet);
    var schema = ensureDatabaseSchema(ss);
    var downloadUrl = "https://docs.google.com/spreadsheets/d/" + ss.getId() + "/export?format=xlsx";

    // 1. Health, Ping & Direct Open
    if (action === "health" || action === "ping" || action === "open") {
      var allSheets = ss.getSheets().map(function(s) { return s.getName(); });
      var rSheet = schema.rSheet;
      var totalRecords = Math.max(0, rSheet.getLastRow() - 1);

      return jsonResponse({
        success: true,
        status: "healthy",
        api: "Universal Google Sheets Database Backend",
        version: VERSION,
        projectId: projectId,
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        spreadsheetUrl: ss.getUrl(),
        downloadUrl: downloadUrl,
        totalRecords: totalRecords,
        sheets: allSheets,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Direct Spreadsheet Download URL
    if (action === "download" || action === "export") {
      return jsonResponse({
        success: true,
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        downloadUrl: downloadUrl,
        message: "Spreadsheet export download URL generated."
      });
    }

    // 3. Get Project Config
    if (action === "getconfig") {
      return jsonResponse({
        success: true,
        projectId: projectId,
        spreadsheetId: ss.getId(),
        spreadsheetUrl: ss.getUrl(),
        version: VERSION
      });
    }

    // 4. List Records (filter by projectId and optional sheetName)
    if (action === "list" || action === "getall") {
      var includeDeleted = params.includeDeleted === "true";
      var rData = schema.rSheet.getDataRange().getValues();
      var records = [];

      for (var i = 1; i < rData.length; i++) {
        var rowProj = rData[i][0];
        var rowSheet = rData[i][1];
        var rowId = rData[i][2];
        var rowJson = rData[i][3];
        var createdAt = rData[i][4];
        var updatedAt = rData[i][5];
        var deletedAt = rData[i][6];
        var ver = rData[i][7];

        if (rowProj !== projectId) continue;
        if (sheetName && rowSheet !== sheetName) continue;
        if (deletedAt && !includeDeleted) continue;

        var parsedData = {};
        try {
          parsedData = JSON.parse(rowJson);
        } catch (err) {
          parsedData = { raw: rowJson };
        }

        records.push({
          projectId: rowProj,
          sheetName: rowSheet,
          recordId: rowId,
          data: parsedData,
          createdAt: createdAt,
          updatedAt: updatedAt,
          deletedAt: deletedAt || null,
          version: ver || 1
        });
      }

      return jsonResponse({
        success: true,
        projectId: projectId,
        sheetName: sheetName || "all",
        count: records.length,
        records: records,
        downloadUrl: downloadUrl,
        timestamp: new Date().toISOString()
      });
    }

    // 5. Get Single Record by ID
    if (action === "get") {
      var recordId = params.recordId || params.id;
      if (!recordId) {
        return jsonResponse({ success: false, error: "Missing recordId parameter" });
      }

      var rValues = schema.rSheet.getDataRange().getValues();
      for (var j = 1; j < rValues.length; j++) {
        if (rValues[j][0] === projectId && (!sheetName || rValues[j][1] === sheetName) && rValues[j][2] === recordId) {
          if (rValues[j][6] && params.includeDeleted !== "true") {
            return jsonResponse({ success: false, error: "Record has been deleted" });
          }
          return jsonResponse({
            success: true,
            record: {
              projectId: rValues[j][0],
              sheetName: rValues[j][1],
              recordId: rValues[j][2],
              data: JSON.parse(rValues[j][3] || "{}"),
              createdAt: rValues[j][4],
              updatedAt: rValues[j][5],
              deletedAt: rValues[j][6] || null,
              version: rValues[j][7] || 1
            }
          });
        }
      }
      return jsonResponse({ success: false, error: "Record not found: " + recordId });
    }

    return jsonResponse({
      success: true,
      message: "Universal Database API ready. Use POST for write operations.",
      spreadsheetUrl: ss.getUrl()
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Handle POST requests (CRUD & Sync Operations)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return jsonResponse({
      success: false,
      error: "Server is busy with a concurrent write. Please retry in a few seconds."
    });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Empty request body received" });
    }

    var body = {};
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ success: false, error: "Invalid JSON in request body: " + parseErr.message });
    }

    var projectId = body.projectId || DEFAULT_PROJECT_ID;
    var operation = (body.action || body.operation || "sync").toLowerCase();
    var customSheet = body.spreadsheetId || body.sheetUrl || body.spreadsheetUrl || "";
    var ss = getSpreadsheet(customSheet);
    var schema = ensureDatabaseSchema(ss);
    var rSheet = schema.rSheet;
    var downloadUrl = "https://docs.google.com/spreadsheets/d/" + ss.getId() + "/export?format=xlsx";

    // Track project registration in Projects table
    updateProjectRegistry(schema.pSheet, projectId, body.projectName || projectId);

    // ------------------------------------------------------------------------
    // OPERATION: BATCH SYNC (Transactions from Queue / Outbox)
    // ------------------------------------------------------------------------
    if (operation === "sync") {
      var operations = body.operations || body.records || [];
      // Backward compatibility: if data object provided directly
      if (!Array.isArray(operations) && body.data) {
        operations = [];
        var rawData = body.data;
        Object.keys(rawData).forEach(function(moduleKey) {
          if (Array.isArray(rawData[moduleKey])) {
            rawData[moduleKey].forEach(function(item) {
              operations.push({
                action: "upsert",
                sheetName: moduleKey,
                recordId: item.id || (moduleKey + "-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4)),
                data: item
              });
            });
          } else if (typeof rawData[moduleKey] === "object" && rawData[moduleKey] !== null) {
            operations.push({
              action: "upsert",
              sheetName: moduleKey,
              recordId: rawData[moduleKey].id || (moduleKey + "-config"),
              data: rawData[moduleKey]
            });
          }
        });
      }

      var results = [];
      var now = new Date().toISOString();

      operations.forEach(function(op) {
        var opType = (op.action || op.operation || "upsert").toLowerCase();
        var sName = op.sheetName || "default";
        var rId = op.recordId || op.id;
        var rPayload = op.data || {};

        if (!rId) {
          results.push({ recordId: null, status: "FAILED", error: "Missing recordId" });
          return;
        }

        try {
          var res = executeSingleRecordOperation(rSheet, projectId, sName, rId, opType, rPayload, now);
          results.push({ recordId: rId, sheetName: sName, operation: opType, status: "SUCCESS", version: res.version });
          logAudit(ss, projectId, sName, rId, opType, "SUCCESS", { version: res.version });
          updateSyncState(ss, projectId, sName, rId, res.totalCount);
        } catch (opErr) {
          results.push({ recordId: rId, sheetName: sName, operation: opType, status: "FAILED", error: opErr.toString() });
          logAudit(ss, projectId, sName, rId, opType, "FAILED", opErr.toString());
        }
      });

      // Render formatted, human-readable tabs (Dashboard_Summary, Study_Sessions, Daily_Attendance, ToDos, Subjects, Topics, Timetable, Preparations)
      renderHumanReadableSheets(ss, body.data, operations);

      return jsonResponse({
        success: true,
        projectId: projectId,
        totalProcessed: results.length,
        results: results,
        downloadUrl: downloadUrl,
        spreadsheetUrl: ss.getUrl(),
        timestamp: now
      });
    }

    // ------------------------------------------------------------------------
    // OPERATION: SINGLE RECORD OPERATIONS (create, update, upsert, delete)
    // ------------------------------------------------------------------------
    var sheetName = body.sheetName || "default";
    var recordId = body.recordId || (body.data && body.data.id);
    var data = body.data || {};
    var nowIso = new Date().toISOString();

    if (!recordId && operation !== "health") {
      return jsonResponse({ success: false, error: "Missing recordId" });
    }

    var singleResult = executeSingleRecordOperation(rSheet, projectId, sheetName, recordId, operation, data, nowIso);
    logAudit(ss, projectId, sheetName, recordId, operation, "SUCCESS", { version: singleResult.version });
    updateSyncState(ss, projectId, sheetName, recordId, singleResult.totalCount);

    return jsonResponse({
      success: true,
      projectId: projectId,
      sheetName: sheetName,
      recordId: recordId,
      operation: operation,
      version: singleResult.version,
      downloadUrl: downloadUrl,
      spreadsheetUrl: ss.getUrl(),
      timestamp: nowIso
    });

  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/**
 * Execute Single Record CRUD Mutation on Records Table
 */
function executeSingleRecordOperation(rSheet, projectId, sheetName, recordId, operation, data, nowIso) {
  var rData = rSheet.getDataRange().getValues();
  var foundRow = -1;
  var currentVersion = 1;
  var createdAt = nowIso;

  for (var i = 1; i < rData.length; i++) {
    if (rData[i][0] === projectId && rData[i][1] === sheetName && rData[i][2] === recordId) {
      foundRow = i + 1;
      createdAt = rData[i][4] || nowIso;
      currentVersion = (parseInt(rData[i][7], 10) || 1) + 1;
      break;
    }
  }

  var dataJson = typeof data === "object" ? JSON.stringify(data) : String(data);

  if (operation === "create") {
    if (foundRow > 0) {
      throw new Error("Record with ID " + recordId + " already exists in sheet " + sheetName);
    }
    rSheet.appendRow([projectId, sheetName, recordId, dataJson, nowIso, nowIso, "", 1]);
    return { version: 1, totalCount: rSheet.getLastRow() - 1 };
  }

  if (operation === "update") {
    if (foundRow === -1) {
      throw new Error("Record with ID " + recordId + " not found to update");
    }
    rSheet.getRange(foundRow, 4, 1, 5).setValues([[dataJson, createdAt, nowIso, "", currentVersion]]);
    return { version: currentVersion, totalCount: rSheet.getLastRow() - 1 };
  }

  if (operation === "delete") {
    if (foundRow === -1) {
      return { version: 0, totalCount: rSheet.getLastRow() - 1 };
    }
    // Soft Delete: set deletedAt timestamp and clear data
    rSheet.getRange(foundRow, 6, 1, 3).setValues([[nowIso, nowIso, currentVersion]]);
    return { version: currentVersion, totalCount: rSheet.getLastRow() - 1 };
  }

  // Default: UPSERT (Create if new, update if exists)
  if (foundRow > 0) {
    rSheet.getRange(foundRow, 4, 1, 5).setValues([[dataJson, createdAt, nowIso, "", currentVersion]]);
    return { version: currentVersion, totalCount: rSheet.getLastRow() - 1 };
  } else {
    rSheet.appendRow([projectId, sheetName, recordId, dataJson, nowIso, nowIso, "", 1]);
    return { version: 1, totalCount: rSheet.getLastRow() - 1 };
  }
}

/**
 * Register project in Projects sheet
 */
function updateProjectRegistry(pSheet, projectId, projectName) {
  try {
    var pData = pSheet.getDataRange().getValues();
    var found = false;
    var now = new Date().toISOString();
    for (var i = 1; i < pData.length; i++) {
      if (pData[i][0] === projectId) {
        found = true;
        pSheet.getRange(i + 1, 5).setValue(now);
        break;
      }
    }
    if (!found) {
      pSheet.appendRow([projectId, projectName || projectId, "Universal Auto-Sync Registered Web App", now, now]);
    }
  } catch (e) {}
}

/**
 * Format & Render Human-Readable Google Sheet Worksheets
 * Allows the user to open, read, filter, and manage StudyFlow data directly in Google Sheets!
 */
function renderHumanReadableSheets(ss, dataObj, operations) {
  try {
    var data = dataObj || {};
    if (!data.sessions && !data.attendance && !data.todos && !data.subjects && Array.isArray(operations)) {
      data = {};
      operations.forEach(function(op) {
        var sName = op.sheetName;
        if (!data[sName]) data[sName] = [];
        data[sName].push(op.data);
      });
    }

    function writeTable(sheetName, headers, headerColor, rows) {
      if (!rows) return;
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      sheet.clearContents();
      sheet.clearFormats();

      sheet.getRange(1, 1, 1, headers.length)
        .setValues([headers])
        .setFontWeight("bold")
        .setBackground(headerColor)
        .setFontColor("#ffffff")
        .setHorizontalAlignment("center");
      sheet.setFrozenRows(1);

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        for (var r = 0; r < rows.length; r++) {
          if (r % 2 === 1) {
            sheet.getRange(r + 2, 1, 1, headers.length).setBackground("#f8fafc");
          }
        }
      }
    }

    // 1. Study_Sessions
    if (Array.isArray(data.sessions)) {
      var sRows = data.sessions.map(function(s) {
        return [
          s.date || "",
          s.subject || "",
          s.topic || "",
          s.studyMinutes || (s.actualStudyDuration ? Math.round(s.actualStudyDuration / 60) : 0),
          s.studyHours || (s.actualStudyDuration ? (s.actualStudyDuration / 3600).toFixed(2) : "0.00"),
          s.startTime || "",
          s.endTime || "",
          s.status || "Completed",
          s.notes || "",
          s.id || ""
        ];
      });
      writeTable("Study_Sessions", ["Date", "Subject", "Topic", "Study Min", "Study Hours", "Start Time", "End Time", "Status", "Notes", "Session ID"], "#1e293b", sRows);
    }

    // 2. Daily_Attendance
    if (Array.isArray(data.attendance)) {
      var aRows = data.attendance.map(function(a) {
        return [
          a.date || "",
          a.status || "Present",
          a.studyMinutes || 0,
          a.studyHours || "0.00",
          a.notes || "",
          a.recordedAt || ""
        ];
      });
      writeTable("Daily_Attendance", ["Date", "Status", "Study Min", "Study Hours", "Notes", "Recorded At"], "#0f766e", aRows);
    }

    // 3. ToDos
    var todoList = data.todos || (data.targets && data.targets.tomorrow) || [];
    if (Array.isArray(todoList)) {
      var tRows = todoList.map(function(t) {
        return [
          t.title || "",
          t.category || "Study",
          t.subject || "",
          t.topic || "",
          t.priority || "Medium",
          t.targetDurationMinutes || 60,
          t.completed || t.status === "Completed" ? "Completed" : "Pending",
          t.completedAt || "",
          t.createdAt || "",
          t.id || ""
        ];
      });
      writeTable("ToDos", ["Title", "Category", "Subject", "Topic", "Priority", "Target Duration (min)", "Status", "Completed At", "Created At", "Task ID"], "#4338ca", tRows);
    }

    // 4. Subjects
    if (Array.isArray(data.subjects)) {
      var subRows = data.subjects.map(function(s) {
        return [
          s.name || "",
          s.preparation || "General",
          s.targetHours || 0,
          s.dailyTargetHours || 0,
          s.priority || "Medium",
          s.status || "In Progress",
          s.completionNote || ""
        ];
      });
      writeTable("Subjects", ["Subject Name", "Exam / Preparation", "Target Hours", "Daily Target", "Priority", "Status", "Notes"], "#b45309", subRows);
    }

    // 5. Topics
    if (Array.isArray(data.topics)) {
      var topRows = data.topics.map(function(t) {
        return [
          t.name || "",
          t.subject || "General",
          t.priority || "Medium",
          t.targetDate || "",
          t.estimatedMinutes || 0,
          t.status || "Pending",
          t.completionNote || ""
        ];
      });
      writeTable("Topics", ["Topic Name", "Subject", "Priority", "Target Date", "Estimated Min", "Status", "Notes"], "#2563eb", topRows);
    }

    // 6. Timetable
    if (Array.isArray(data.timetable)) {
      var ttRows = data.timetable.map(function(tt) {
        return [
          tt.day || "",
          tt.startTime || "",
          tt.endTime || "",
          tt.preparation || "General",
          tt.subject || "General",
          tt.topic || "General",
          tt.duration || 60,
          tt.priority || "Medium"
        ];
      });
      writeTable("Timetable", ["Day", "Start Time", "End Time", "Preparation", "Subject", "Topic", "Duration (min)", "Priority"], "#7c3aed", ttRows);
    }

    // 7. Preparations
    if (Array.isArray(data.preparations)) {
      var prepRows = data.preparations.map(function(p) {
        return [
          p.name || "",
          p.targetHours || 0,
          p.targetDate || "",
          p.status || "Active",
          p.id || ""
        ];
      });
      writeTable("Preparations", ["Goal / Exam Name", "Target Hours", "Target Date", "Status", "Goal ID"], "#059669", prepRows);
    }

    // 8. Dashboard_Summary
    var dSheet = ss.getSheetByName("Dashboard_Summary");
    if (!dSheet) {
      dSheet = ss.insertSheet("Dashboard_Summary", 0);
    }
    dSheet.clearContents();
    dSheet.clearFormats();

    var summaryHeader = [
      ["STUDYFLOW — SMART STUDENT STUDY TRACKER & PLANNER", "", "", ""],
      ["Master Cloud Database — Live Synchronized with Web Application", "", "", ""],
      ["Last Synchronized At:", new Date().toLocaleString(), "Platform Version:", VERSION],
      ["", "", "", ""],
      ["METRIC / MODULE", "TOTAL COUNT", "DETAILS / VALUE", "STATUS"],
      ["Study Sessions Logged", (data.sessions || []).length, "Date-wise records in Study_Sessions tab", "Active"],
      ["Attendance Records", (data.attendance || []).length, "Daily logs in Daily_Attendance tab", "Active"],
      ["To-Dos / Action Items", (todoList || []).length, "Tracked in ToDos tab", "Active"],
      ["Subjects Enrolled", (data.subjects || []).length, "Organized in Subjects tab", "Active"],
      ["Topics in Syllabus", (data.topics || []).length, "Tracked in Topics tab", "Active"],
      ["Timetable Slots", (data.timetable || []).length, "Configured in Timetable tab", "Active"],
      ["Exams / Preparations", (data.preparations || []).length, "Tracked in Preparations tab", "Active"],
      ["Database Storage Table", "Records", "All JSON models stored with version control", "Verified"]
    ];

    dSheet.getRange(1, 1, summaryHeader.length, 4).setValues(summaryHeader);
    dSheet.getRange(1, 1, 1, 4).merge().setFontWeight("bold").setFontSize(13).setBackground("#1e293b").setFontColor("#ffffff");
    dSheet.getRange(2, 1, 1, 4).merge().setFontStyle("italic").setFontSize(10).setBackground("#334155").setFontColor("#cbd5e1");
    dSheet.getRange(5, 1, 1, 4).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");

    try {
      ss.setActiveSheet(dSheet);
      ss.moveActiveSheet(1);
    } catch (e) {}

  } catch (err) {
    logAudit(ss, DEFAULT_PROJECT_ID, "HumanReadableSheets", "render", "ERROR", err.toString());
  }
}

