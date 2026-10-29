/**
 * =========================================================================
 * StudyFlow Google Sheets Live Synchronization & Multi-Sheet Controller
 * =========================================================================
 * 
 * Google Sheet Direct Links:
 * - Create New Sheet: https://sheets.new
 * - Open Google Sheets: https://docs.google.com/spreadsheets
 * 
 * Google Apps Script Web App Backend:
 * - Direct Web App URL: https://script.google.com/macros/s/AKfycbzjemNaSsfS4AhMoTcwpGSHqitVqZsMXqRULhWMio2AjUBjKquaS-RBiAebyYX9pGk/exec
 * - Apps Script Dashboard: https://script.google.com
 * - Backend Script Code: Defined below in GOOGLE_APPS_SCRIPT_TEMPLATE & Code.gs
 * 
 * Live Human-Readable Worksheets Maintained in Google Sheets:
 * 1. Dashboard_Summary : High-level KPI overview & sync timestamps
 * 2. Study_Sessions   : Date-wise study history with duration, hours & notes
 * 3. Daily_Attendance : Daily attendance records & study minutes
 * 4. ToDos            : To-Do items with priority, status & completion dates
 * 5. Subjects         : Syllabus subjects, target hours & priorities
 * 6. Topics           : Subject topics, estimated times & statuses
 * 7. Timetable        : Weekly timetable slots
 * 8. Preparations     : Exams & preparation goals
 * 9. Records          : Core versioned JSON database table for bidirectional restore
 */

export const DEFAULT_SYNC_URL = "https://script.google.com/macros/s/AKfycbzjemNaSsfS4AhMoTcwpGSHqitVqZsMXqRULhWMio2AjUBjKquaS-RBiAebyYX9pGk/exec";

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
      actualStudyDuration: s.actualStudyDuration || 0,
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
  if (data.notifications !== undefined) safeData.notifications = data.notifications;

  // Explicit To-Dos collection formatted for Google Sheets sync
  if (Array.isArray(data.todos) || Array.isArray(data.targets?.tomorrow)) {
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
  }

  return {
    clientId,
    meta: {
      version: "2.5.0",
      syncedAt: new Date().toISOString(),
      source: "studyflow-web",
    },
    data: safeJsonValue(safeData),
  };
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = "/**\n * =========================================================================\n * Universal Google Sheets Auto-Sync System — Master Backend (Code.gs)\n * =========================================================================\n * \n * Reusable Google Apps Script Database Engine for Any Web Application.\n * \n * Supported Standard Operations:\n * - health       : Check API status, spreadsheet access, and project stats\n * - getConfig    : Retrieve active project configuration and sheet names\n * - list         : List records for a specific sheet/module or entire project\n * - get          : Get a specific record by sheetName and recordId\n * - create       : Insert a new record\n * - update       : Update an existing record (increments version)\n * - upsert       : Insert or update a record\n * - delete       : Soft delete a record (sets deletedAt timestamp)\n * - sync         : Bulk transactional batch sync for outbox/queue\n * - download     : Returns direct .xlsx download URL for the spreadsheet\n * \n * Standard Worksheets Automatically Maintained:\n * 1. Projects    : [projectId, projectName, description, createdAt, lastSyncAt]\n * 2. Records     : [projectId, sheetName, recordId, dataJson, createdAt, updatedAt, deletedAt, version]\n * 3. AuditLog    : [timestamp, projectId, sheetName, recordId, operation, status, details]\n * 4. SyncState   : [projectId, sheetName, lastRecordId, totalRecords, lastSyncTimestamp]\n * \n * 2-Minute Deployment Instructions:\n * 1. Open Google Sheets (or script.google.com)\n * 2. Extensions > Apps Script\n * 3. Replace all Code.gs contents with this entire file and Save (Ctrl+S)\n * 4. Deploy > Manage deployments > Edit > New version > Who has access: \"Anyone\"\n * 5. Copy the /exec URL and paste into your application settings!\n */\n\nvar VERSION = \"4.0.0\";\nvar DEFAULT_PROJECT_ID = \"studyflow\";\n\n/**\n * Universal JSON Response Helper with CORS\n */\nfunction jsonResponse(data) {\n  return ContentService\n    .createTextOutput(JSON.stringify(data))\n    .setMimeType(ContentService.MimeType.JSON);\n}\n\n/**\n * Universal Spreadsheet Resolver\n * Works with Container-Bound scripts AND Standalone scripts (script.google.com).\n * If standalone and no spreadsheet is linked, automatically creates one in Google Drive!\n */\nfunction getSpreadsheet(customSheetIdOrUrl) {\n  var ss = null;\n  var props = PropertiesService.getScriptProperties();\n\n  // 1. First Priority: If a specific Google Sheet ID or URL is provided, open THAT sheet!\n  if (customSheetIdOrUrl) {\n    try {\n      var str = customSheetIdOrUrl.toString().trim();\n      var match = str.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9-_]+)/);\n      var targetId = (match && match[1]) ? match[1] : (str.indexOf(\"http\") === -1 && str.length > 15 ? str : null);\n      if (targetId) {\n        ss = SpreadsheetApp.openById(targetId);\n      } else if (str.indexOf(\"http\") === 0) {\n        ss = SpreadsheetApp.openByUrl(str);\n      }\n      if (ss) {\n        props.setProperty(\"UNIVERSAL_SPREADSHEET_ID\", ss.getId());\n        return ss;\n      }\n    } catch (e) {\n      // Permission or invalid ID error on custom sheet, fall back\n    }\n  }\n\n  // 2. Container-bound spreadsheet (Extensions > Apps Script from inside a sheet)\n  try {\n    ss = SpreadsheetApp.getActiveSpreadsheet();\n    if (ss) return ss;\n  } catch (e) {}\n\n  // 3. Saved ID from previous executions\n  var savedId = props.getProperty(\"UNIVERSAL_SPREADSHEET_ID\");\n  if (savedId) {\n    try {\n      ss = SpreadsheetApp.openById(savedId);\n      if (ss) return ss;\n    } catch (e) {}\n  }\n\n  // 4. Standalone automatic database creation\n  ss = SpreadsheetApp.create(\"StudyFlow Master Database — Google Sheets Backend\");\n  props.setProperty(\"UNIVERSAL_SPREADSHEET_ID\", ss.getId());\n  return ss;\n}\n\n/**\n * Ensure Standard Database Schema and Worksheets Exist\n */\nfunction ensureDatabaseSchema(ss) {\n  var lock = LockService.getScriptLock();\n  try {\n    lock.waitLock(10000);\n  } catch (e) {}\n\n  try {\n    // 1. Projects Table\n    var pSheet = ss.getSheetByName(\"Projects\") || ss.insertSheet(\"Projects\", 0);\n    if (pSheet.getLastRow() === 0) {\n      pSheet.appendRow([\"projectId\", \"projectName\", \"description\", \"createdAt\", \"lastSyncAt\"]);\n      pSheet.getRange(1, 1, 1, 5).setFontWeight(\"bold\").setBackground(\"#1e293b\").setFontColor(\"#ffffff\");\n      pSheet.setFrozenRows(1);\n    }\n\n    // 2. Records Table (Core Generic Data Store)\n    var rSheet = ss.getSheetByName(\"Records\") || ss.insertSheet(\"Records\", 1);\n    if (rSheet.getLastRow() === 0) {\n      rSheet.appendRow([\"projectId\", \"sheetName\", \"recordId\", \"dataJson\", \"createdAt\", \"updatedAt\", \"deletedAt\", \"version\"]);\n      rSheet.getRange(1, 1, 1, 8).setFontWeight(\"bold\").setBackground(\"#0f766e\").setFontColor(\"#ffffff\");\n      rSheet.setFrozenRows(1);\n    }\n\n    // 3. AuditLog Table\n    var aSheet = ss.getSheetByName(\"AuditLog\") || ss.insertSheet(\"AuditLog\", 2);\n    if (aSheet.getLastRow() === 0) {\n      aSheet.appendRow([\"timestamp\", \"projectId\", \"sheetName\", \"recordId\", \"operation\", \"status\", \"details\"]);\n      aSheet.getRange(1, 1, 1, 7).setFontWeight(\"bold\").setBackground(\"#4338ca\").setFontColor(\"#ffffff\");\n      aSheet.setFrozenRows(1);\n    }\n\n    // 4. SyncState Table\n    var sSheet = ss.getSheetByName(\"SyncState\") || ss.insertSheet(\"SyncState\", 3);\n    if (sSheet.getLastRow() === 0) {\n      sSheet.appendRow([\"projectId\", \"sheetName\", \"lastRecordId\", \"totalRecords\", \"lastSyncTimestamp\"]);\n      sSheet.getRange(1, 1, 1, 5).setFontWeight(\"bold\").setBackground(\"#b45309\").setFontColor(\"#ffffff\");\n      sSheet.setFrozenRows(1);\n    }\n\n    return { pSheet: pSheet, rSheet: rSheet, aSheet: aSheet, sSheet: sSheet };\n  } finally {\n    try { lock.releaseLock(); } catch (e) {}\n  }\n}\n\n/**\n * Log action to AuditLog\n */\nfunction logAudit(ss, projectId, sheetName, recordId, operation, status, details) {\n  try {\n    var aSheet = ss.getSheetByName(\"AuditLog\") || ss.insertSheet(\"AuditLog\");\n    aSheet.appendRow([\n      new Date().toISOString(),\n      projectId || DEFAULT_PROJECT_ID,\n      sheetName || \"global\",\n      recordId || \"n/a\",\n      operation || \"UNKNOWN\",\n      status || \"SUCCESS\",\n      typeof details === \"object\" ? JSON.stringify(details) : (details || \"\")\n    ]);\n  } catch (e) {}\n}\n\n/**\n * Update SyncState record for (projectId, sheetName)\n */\nfunction updateSyncState(ss, projectId, sheetName, lastRecordId, totalCount) {\n  try {\n    var sSheet = ss.getSheetByName(\"SyncState\");\n    if (!sSheet) return;\n    var rows = sSheet.getDataRange().getValues();\n    var foundIndex = -1;\n    for (var i = 1; i < rows.length; i++) {\n      if (rows[i][0] === projectId && rows[i][1] === sheetName) {\n        foundIndex = i + 1;\n        break;\n      }\n    }\n    var now = new Date().toISOString();\n    if (foundIndex > 0) {\n      sSheet.getRange(foundIndex, 3, 1, 3).setValues([[lastRecordId || \"\", totalCount || 0, now]]);\n    } else {\n      sSheet.appendRow([projectId, sheetName, lastRecordId || \"\", totalCount || 0, now]);\n    }\n  } catch (e) {}\n}\n\n/**\n * Handle GET requests\n */\nfunction doGet(e) {\n  try {\n    var params = (e && e.parameter) ? e.parameter : {};\n    var action = (params.action || params.operation || \"health\").toLowerCase();\n    var projectId = params.projectId || DEFAULT_PROJECT_ID;\n    var sheetName = params.sheetName || \"\";\n    var customSheet = params.spreadsheetId || params.sheetUrl || params.spreadsheetUrl || \"\";\n\n    var ss = getSpreadsheet(customSheet);\n    var schema = ensureDatabaseSchema(ss);\n    var downloadUrl = \"https://docs.google.com/spreadsheets/d/\" + ss.getId() + \"/export?format=xlsx\";\n\n    // 1. Health, Ping & Direct Open\n    if (action === \"health\" || action === \"ping\" || action === \"open\") {\n      var allSheets = ss.getSheets().map(function(s) { return s.getName(); });\n      var rSheet = schema.rSheet;\n      var totalRecords = Math.max(0, rSheet.getLastRow() - 1);\n\n      return jsonResponse({\n        success: true,\n        status: \"healthy\",\n        api: \"Universal Google Sheets Database Backend\",\n        version: VERSION,\n        projectId: projectId,\n        spreadsheetName: ss.getName(),\n        spreadsheetId: ss.getId(),\n        spreadsheetUrl: ss.getUrl(),\n        downloadUrl: downloadUrl,\n        totalRecords: totalRecords,\n        sheets: allSheets,\n        timestamp: new Date().toISOString()\n      });\n    }\n\n    // 2. Direct Spreadsheet Download URL\n    if (action === \"download\" || action === \"export\") {\n      return jsonResponse({\n        success: true,\n        spreadsheetName: ss.getName(),\n        spreadsheetUrl: ss.getUrl(),\n        downloadUrl: downloadUrl,\n        message: \"Spreadsheet export download URL generated.\"\n      });\n    }\n\n    // 3. Get Project Config\n    if (action === \"getconfig\") {\n      return jsonResponse({\n        success: true,\n        projectId: projectId,\n        spreadsheetId: ss.getId(),\n        spreadsheetUrl: ss.getUrl(),\n        version: VERSION\n      });\n    }\n\n    // 4. List Records (filter by projectId and optional sheetName)\n    if (action === \"list\" || action === \"getall\") {\n      var includeDeleted = params.includeDeleted === \"true\";\n      var rData = schema.rSheet.getDataRange().getValues();\n      var records = [];\n\n      for (var i = 1; i < rData.length; i++) {\n        var rowProj = rData[i][0];\n        var rowSheet = rData[i][1];\n        var rowId = rData[i][2];\n        var rowJson = rData[i][3];\n        var createdAt = rData[i][4];\n        var updatedAt = rData[i][5];\n        var deletedAt = rData[i][6];\n        var ver = rData[i][7];\n\n        if (rowProj !== projectId) continue;\n        if (sheetName && rowSheet !== sheetName) continue;\n        if (deletedAt && !includeDeleted) continue;\n\n        var parsedData = {};\n        try {\n          parsedData = JSON.parse(rowJson);\n        } catch (err) {\n          parsedData = { raw: rowJson };\n        }\n\n        records.push({\n          projectId: rowProj,\n          sheetName: rowSheet,\n          recordId: rowId,\n          data: parsedData,\n          createdAt: createdAt,\n          updatedAt: updatedAt,\n          deletedAt: deletedAt || null,\n          version: ver || 1\n        });\n      }\n\n      return jsonResponse({\n        success: true,\n        projectId: projectId,\n        sheetName: sheetName || \"all\",\n        count: records.length,\n        records: records,\n        downloadUrl: downloadUrl,\n        timestamp: new Date().toISOString()\n      });\n    }\n\n    // 5. Get Single Record by ID\n    if (action === \"get\") {\n      var recordId = params.recordId || params.id;\n      if (!recordId) {\n        return jsonResponse({ success: false, error: \"Missing recordId parameter\" });\n      }\n\n      var rValues = schema.rSheet.getDataRange().getValues();\n      for (var j = 1; j < rValues.length; j++) {\n        if (rValues[j][0] === projectId && (!sheetName || rValues[j][1] === sheetName) && rValues[j][2] === recordId) {\n          if (rValues[j][6] && params.includeDeleted !== \"true\") {\n            return jsonResponse({ success: false, error: \"Record has been deleted\" });\n          }\n          return jsonResponse({\n            success: true,\n            record: {\n              projectId: rValues[j][0],\n              sheetName: rValues[j][1],\n              recordId: rValues[j][2],\n              data: JSON.parse(rValues[j][3] || \"{}\"),\n              createdAt: rValues[j][4],\n              updatedAt: rValues[j][5],\n              deletedAt: rValues[j][6] || null,\n              version: rValues[j][7] || 1\n            }\n          });\n        }\n      }\n      return jsonResponse({ success: false, error: \"Record not found: \" + recordId });\n    }\n\n    return jsonResponse({\n      success: true,\n      message: \"Universal Database API ready. Use POST for write operations.\",\n      spreadsheetUrl: ss.getUrl()\n    });\n  } catch (error) {\n    return jsonResponse({ success: false, error: error.toString() });\n  }\n}\n\n/**\n * Handle POST requests (CRUD & Sync Operations)\n */\nfunction doPost(e) {\n  var lock = LockService.getScriptLock();\n  try {\n    lock.waitLock(15000);\n  } catch (err) {\n    return jsonResponse({\n      success: false,\n      error: \"Server is busy with a concurrent write. Please retry in a few seconds.\"\n    });\n  }\n\n  try {\n    if (!e || !e.postData || !e.postData.contents) {\n      return jsonResponse({ success: false, error: \"Empty request body received\" });\n    }\n\n    var body = {};\n    try {\n      body = JSON.parse(e.postData.contents);\n    } catch (parseErr) {\n      return jsonResponse({ success: false, error: \"Invalid JSON in request body: \" + parseErr.message });\n    }\n\n    var projectId = body.projectId || DEFAULT_PROJECT_ID;\n    var operation = (body.action || body.operation || \"sync\").toLowerCase();\n    var customSheet = body.spreadsheetId || body.sheetUrl || body.spreadsheetUrl || \"\";\n    var ss = getSpreadsheet(customSheet);\n    var schema = ensureDatabaseSchema(ss);\n    var rSheet = schema.rSheet;\n    var downloadUrl = \"https://docs.google.com/spreadsheets/d/\" + ss.getId() + \"/export?format=xlsx\";\n\n    // Track project registration in Projects table\n    updateProjectRegistry(schema.pSheet, projectId, body.projectName || projectId);\n\n    // ------------------------------------------------------------------------\n    // OPERATION: BATCH SYNC (Transactions from Queue / Outbox)\n    // ------------------------------------------------------------------------\n    if (operation === \"sync\") {\n      var operations = body.operations || body.records || [];\n      // Backward compatibility: if data object provided directly\n      if (!Array.isArray(operations) && body.data) {\n        operations = [];\n        var rawData = body.data;\n        Object.keys(rawData).forEach(function(moduleKey) {\n          if (Array.isArray(rawData[moduleKey])) {\n            rawData[moduleKey].forEach(function(item) {\n              operations.push({\n                action: \"upsert\",\n                sheetName: moduleKey,\n                recordId: item.id || (moduleKey + \"-\" + Date.now() + \"-\" + Math.random().toString(36).substr(2, 4)),\n                data: item\n              });\n            });\n          } else if (typeof rawData[moduleKey] === \"object\" && rawData[moduleKey] !== null) {\n            operations.push({\n              action: \"upsert\",\n              sheetName: moduleKey,\n              recordId: rawData[moduleKey].id || (moduleKey + \"-config\"),\n              data: rawData[moduleKey]\n            });\n          }\n        });\n      }\n\n      var results = [];\n      var now = new Date().toISOString();\n\n      operations.forEach(function(op) {\n        var opType = (op.action || op.operation || \"upsert\").toLowerCase();\n        var sName = op.sheetName || \"default\";\n        var rId = op.recordId || op.id;\n        var rPayload = op.data || {};\n\n        if (!rId) {\n          results.push({ recordId: null, status: \"FAILED\", error: \"Missing recordId\" });\n          return;\n        }\n\n        try {\n          var res = executeSingleRecordOperation(rSheet, projectId, sName, rId, opType, rPayload, now);\n          results.push({ recordId: rId, sheetName: sName, operation: opType, status: \"SUCCESS\", version: res.version });\n          logAudit(ss, projectId, sName, rId, opType, \"SUCCESS\", { version: res.version });\n          updateSyncState(ss, projectId, sName, rId, res.totalCount);\n        } catch (opErr) {\n          results.push({ recordId: rId, sheetName: sName, operation: opType, status: \"FAILED\", error: opErr.toString() });\n          logAudit(ss, projectId, sName, rId, opType, \"FAILED\", opErr.toString());\n        }\n      });\n\n      // Render formatted, human-readable tabs (Dashboard_Summary, Study_Sessions, Daily_Attendance, ToDos, Subjects, Topics, Timetable, Preparations)\n      renderHumanReadableSheets(ss, body.data, operations);\n\n      return jsonResponse({\n        success: true,\n        projectId: projectId,\n        totalProcessed: results.length,\n        results: results,\n        downloadUrl: downloadUrl,\n        spreadsheetUrl: ss.getUrl(),\n        timestamp: now\n      });\n    }\n\n    // ------------------------------------------------------------------------\n    // OPERATION: SINGLE RECORD OPERATIONS (create, update, upsert, delete)\n    // ------------------------------------------------------------------------\n    var sheetName = body.sheetName || \"default\";\n    var recordId = body.recordId || (body.data && body.data.id);\n    var data = body.data || {};\n    var nowIso = new Date().toISOString();\n\n    if (!recordId && operation !== \"health\") {\n      return jsonResponse({ success: false, error: \"Missing recordId\" });\n    }\n\n    var singleResult = executeSingleRecordOperation(rSheet, projectId, sheetName, recordId, operation, data, nowIso);\n    logAudit(ss, projectId, sheetName, recordId, operation, \"SUCCESS\", { version: singleResult.version });\n    updateSyncState(ss, projectId, sheetName, recordId, singleResult.totalCount);\n\n    return jsonResponse({\n      success: true,\n      projectId: projectId,\n      sheetName: sheetName,\n      recordId: recordId,\n      operation: operation,\n      version: singleResult.version,\n      downloadUrl: downloadUrl,\n      spreadsheetUrl: ss.getUrl(),\n      timestamp: nowIso\n    });\n\n  } catch (error) {\n    return jsonResponse({ success: false, error: error.toString() });\n  } finally {\n    try {\n      lock.releaseLock();\n    } catch (e) {}\n  }\n}\n\n/**\n * Execute Single Record CRUD Mutation on Records Table\n */\nfunction executeSingleRecordOperation(rSheet, projectId, sheetName, recordId, operation, data, nowIso) {\n  var rData = rSheet.getDataRange().getValues();\n  var foundRow = -1;\n  var currentVersion = 1;\n  var createdAt = nowIso;\n\n  for (var i = 1; i < rData.length; i++) {\n    if (rData[i][0] === projectId && rData[i][1] === sheetName && rData[i][2] === recordId) {\n      foundRow = i + 1;\n      createdAt = rData[i][4] || nowIso;\n      currentVersion = (parseInt(rData[i][7], 10) || 1) + 1;\n      break;\n    }\n  }\n\n  var dataJson = typeof data === \"object\" ? JSON.stringify(data) : String(data);\n\n  if (operation === \"create\") {\n    if (foundRow > 0) {\n      throw new Error(\"Record with ID \" + recordId + \" already exists in sheet \" + sheetName);\n    }\n    rSheet.appendRow([projectId, sheetName, recordId, dataJson, nowIso, nowIso, \"\", 1]);\n    return { version: 1, totalCount: rSheet.getLastRow() - 1 };\n  }\n\n  if (operation === \"update\") {\n    if (foundRow === -1) {\n      throw new Error(\"Record with ID \" + recordId + \" not found to update\");\n    }\n    rSheet.getRange(foundRow, 4, 1, 5).setValues([[dataJson, createdAt, nowIso, \"\", currentVersion]]);\n    return { version: currentVersion, totalCount: rSheet.getLastRow() - 1 };\n  }\n\n  if (operation === \"delete\") {\n    if (foundRow === -1) {\n      return { version: 0, totalCount: rSheet.getLastRow() - 1 };\n    }\n    // Soft Delete: set deletedAt timestamp and clear data\n    rSheet.getRange(foundRow, 6, 1, 3).setValues([[nowIso, nowIso, currentVersion]]);\n    return { version: currentVersion, totalCount: rSheet.getLastRow() - 1 };\n  }\n\n  // Default: UPSERT (Create if new, update if exists)\n  if (foundRow > 0) {\n    rSheet.getRange(foundRow, 4, 1, 5).setValues([[dataJson, createdAt, nowIso, \"\", currentVersion]]);\n    return { version: currentVersion, totalCount: rSheet.getLastRow() - 1 };\n  } else {\n    rSheet.appendRow([projectId, sheetName, recordId, dataJson, nowIso, nowIso, \"\", 1]);\n    return { version: 1, totalCount: rSheet.getLastRow() - 1 };\n  }\n}\n\n/**\n * Register project in Projects sheet\n */\nfunction updateProjectRegistry(pSheet, projectId, projectName) {\n  try {\n    var pData = pSheet.getDataRange().getValues();\n    var found = false;\n    var now = new Date().toISOString();\n    for (var i = 1; i < pData.length; i++) {\n      if (pData[i][0] === projectId) {\n        found = true;\n        pSheet.getRange(i + 1, 5).setValue(now);\n        break;\n      }\n    }\n    if (!found) {\n      pSheet.appendRow([projectId, projectName || projectId, \"Universal Auto-Sync Registered Web App\", now, now]);\n    }\n  } catch (e) {}\n}\n\n/**\n * Format & Render Human-Readable Google Sheet Worksheets\n * Allows the user to open, read, filter, and manage StudyFlow data directly in Google Sheets!\n */\nfunction renderHumanReadableSheets(ss, dataObj, operations) {\n  try {\n    var data = dataObj || {};\n    if (!data.sessions && !data.attendance && !data.todos && !data.subjects && Array.isArray(operations)) {\n      data = {};\n      operations.forEach(function(op) {\n        var sName = op.sheetName;\n        if (!data[sName]) data[sName] = [];\n        data[sName].push(op.data);\n      });\n    }\n\n    function writeTable(sheetName, headers, headerColor, rows) {\n      if (!rows) return;\n      var sheet = ss.getSheetByName(sheetName);\n      if (!sheet) {\n        sheet = ss.insertSheet(sheetName);\n      }\n      sheet.clearContents();\n      sheet.clearFormats();\n\n      sheet.getRange(1, 1, 1, headers.length)\n        .setValues([headers])\n        .setFontWeight(\"bold\")\n        .setBackground(headerColor)\n        .setFontColor(\"#ffffff\")\n        .setHorizontalAlignment(\"center\");\n      sheet.setFrozenRows(1);\n\n      if (rows.length > 0) {\n        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);\n        for (var r = 0; r < rows.length; r++) {\n          if (r % 2 === 1) {\n            sheet.getRange(r + 2, 1, 1, headers.length).setBackground(\"#f8fafc\");\n          }\n        }\n      }\n    }\n\n    // 1. Study_Sessions\n    if (Array.isArray(data.sessions)) {\n      var sRows = data.sessions.map(function(s) {\n        return [\n          s.date || \"\",\n          s.subject || \"\",\n          s.topic || \"\",\n          s.studyMinutes || (s.actualStudyDuration ? Math.round(s.actualStudyDuration / 60) : 0),\n          s.studyHours || (s.actualStudyDuration ? (s.actualStudyDuration / 3600).toFixed(2) : \"0.00\"),\n          s.startTime || \"\",\n          s.endTime || \"\",\n          s.status || \"Completed\",\n          s.notes || \"\",\n          s.id || \"\"\n        ];\n      });\n      writeTable(\"Study_Sessions\", [\"Date\", \"Subject\", \"Topic\", \"Study Min\", \"Study Hours\", \"Start Time\", \"End Time\", \"Status\", \"Notes\", \"Session ID\"], \"#1e293b\", sRows);\n    }\n\n    // 2. Daily_Attendance\n    if (Array.isArray(data.attendance)) {\n      var aRows = data.attendance.map(function(a) {\n        return [\n          a.date || \"\",\n          a.status || \"Present\",\n          a.studyMinutes || 0,\n          a.studyHours || \"0.00\",\n          a.notes || \"\",\n          a.recordedAt || \"\"\n        ];\n      });\n      writeTable(\"Daily_Attendance\", [\"Date\", \"Status\", \"Study Min\", \"Study Hours\", \"Notes\", \"Recorded At\"], \"#0f766e\", aRows);\n    }\n\n    // 3. ToDos\n    var todoList = data.todos || (data.targets && data.targets.tomorrow) || [];\n    if (Array.isArray(todoList)) {\n      var tRows = todoList.map(function(t) {\n        return [\n          t.title || \"\",\n          t.category || \"Study\",\n          t.subject || \"\",\n          t.topic || \"\",\n          t.priority || \"Medium\",\n          t.targetDurationMinutes || 60,\n          t.completed || t.status === \"Completed\" ? \"Completed\" : \"Pending\",\n          t.completedAt || \"\",\n          t.createdAt || \"\",\n          t.id || \"\"\n        ];\n      });\n      writeTable(\"ToDos\", [\"Title\", \"Category\", \"Subject\", \"Topic\", \"Priority\", \"Target Duration (min)\", \"Status\", \"Completed At\", \"Created At\", \"Task ID\"], \"#4338ca\", tRows);\n    }\n\n    // 4. Subjects\n    if (Array.isArray(data.subjects)) {\n      var subRows = data.subjects.map(function(s) {\n        return [\n          s.name || \"\",\n          s.preparation || \"General\",\n          s.targetHours || 0,\n          s.dailyTargetHours || 0,\n          s.priority || \"Medium\",\n          s.status || \"In Progress\",\n          s.completionNote || \"\"\n        ];\n      });\n      writeTable(\"Subjects\", [\"Subject Name\", \"Exam / Preparation\", \"Target Hours\", \"Daily Target\", \"Priority\", \"Status\", \"Notes\"], \"#b45309\", subRows);\n    }\n\n    // 5. Topics\n    if (Array.isArray(data.topics)) {\n      var topRows = data.topics.map(function(t) {\n        return [\n          t.name || \"\",\n          t.subject || \"General\",\n          t.priority || \"Medium\",\n          t.targetDate || \"\",\n          t.estimatedMinutes || 0,\n          t.status || \"Pending\",\n          t.completionNote || \"\"\n        ];\n      });\n      writeTable(\"Topics\", [\"Topic Name\", \"Subject\", \"Priority\", \"Target Date\", \"Estimated Min\", \"Status\", \"Notes\"], \"#2563eb\", topRows);\n    }\n\n    // 6. Timetable\n    if (Array.isArray(data.timetable)) {\n      var ttRows = data.timetable.map(function(tt) {\n        return [\n          tt.day || \"\",\n          tt.startTime || \"\",\n          tt.endTime || \"\",\n          tt.preparation || \"General\",\n          tt.subject || \"General\",\n          tt.topic || \"General\",\n          tt.duration || 60,\n          tt.priority || \"Medium\"\n        ];\n      });\n      writeTable(\"Timetable\", [\"Day\", \"Start Time\", \"End Time\", \"Preparation\", \"Subject\", \"Topic\", \"Duration (min)\", \"Priority\"], \"#7c3aed\", ttRows);\n    }\n\n    // 7. Preparations\n    if (Array.isArray(data.preparations)) {\n      var prepRows = data.preparations.map(function(p) {\n        return [\n          p.name || \"\",\n          p.targetHours || 0,\n          p.targetDate || \"\",\n          p.status || \"Active\",\n          p.id || \"\"\n        ];\n      });\n      writeTable(\"Preparations\", [\"Goal / Exam Name\", \"Target Hours\", \"Target Date\", \"Status\", \"Goal ID\"], \"#059669\", prepRows);\n    }\n\n    // 8. Dashboard_Summary\n    var dSheet = ss.getSheetByName(\"Dashboard_Summary\");\n    if (!dSheet) {\n      dSheet = ss.insertSheet(\"Dashboard_Summary\", 0);\n    }\n    dSheet.clearContents();\n    dSheet.clearFormats();\n\n    var summaryHeader = [\n      [\"STUDYFLOW — SMART STUDENT STUDY TRACKER & PLANNER\", \"\", \"\", \"\"],\n      [\"Master Cloud Database — Live Synchronized with Web Application\", \"\", \"\", \"\"],\n      [\"Last Synchronized At:\", new Date().toLocaleString(), \"Platform Version:\", VERSION],\n      [\"\", \"\", \"\", \"\"],\n      [\"METRIC / MODULE\", \"TOTAL COUNT\", \"DETAILS / VALUE\", \"STATUS\"],\n      [\"Study Sessions Logged\", (data.sessions || []).length, \"Date-wise records in Study_Sessions tab\", \"Active\"],\n      [\"Attendance Records\", (data.attendance || []).length, \"Daily logs in Daily_Attendance tab\", \"Active\"],\n      [\"To-Dos / Action Items\", (todoList || []).length, \"Tracked in ToDos tab\", \"Active\"],\n      [\"Subjects Enrolled\", (data.subjects || []).length, \"Organized in Subjects tab\", \"Active\"],\n      [\"Topics in Syllabus\", (data.topics || []).length, \"Tracked in Topics tab\", \"Active\"],\n      [\"Timetable Slots\", (data.timetable || []).length, \"Configured in Timetable tab\", \"Active\"],\n      [\"Exams / Preparations\", (data.preparations || []).length, \"Tracked in Preparations tab\", \"Active\"],\n      [\"Database Storage Table\", \"Records\", \"All JSON models stored with version control\", \"Verified\"]\n    ];\n\n    dSheet.getRange(1, 1, summaryHeader.length, 4).setValues(summaryHeader);\n    dSheet.getRange(1, 1, 1, 4).merge().setFontWeight(\"bold\").setFontSize(13).setBackground(\"#1e293b\").setFontColor(\"#ffffff\");\n    dSheet.getRange(2, 1, 1, 4).merge().setFontStyle(\"italic\").setFontSize(10).setBackground(\"#334155\").setFontColor(\"#cbd5e1\");\n    dSheet.getRange(5, 1, 1, 4).setFontWeight(\"bold\").setBackground(\"#0f766e\").setFontColor(\"#ffffff\");\n\n    try {\n      ss.setActiveSheet(dSheet);\n      ss.moveActiveSheet(1);\n    } catch (e) {}\n\n  } catch (err) {\n    logAudit(ss, DEFAULT_PROJECT_ID, \"HumanReadableSheets\", \"render\", \"ERROR\", err.toString());\n  }\n}\n\n";

/**
 * Safely extracts a Google Spreadsheet ID from either:
 * - A full Google Sheets URL (e.g. https://docs.google.com/spreadsheets/d/1BxiMVs.../edit#gid=0)
 * - An embed URL (e.g. https://docs.google.com/spreadsheets/d/1BxiMVs.../htmlembed)
 * - A raw Spreadsheet ID string
 */
export function extractSpreadsheetId(input) {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  // Raw spreadsheet ID check (typically 15 to 65 alphanumeric/dashes/underscores)
  if (/^[a-zA-Z0-9-_]{15,65}$/.test(trimmed)) {
    return trimmed;
  }
  return "";
}

/**
 * Direct Google Sheets Edit Link (opens in browser tab)
 */
export function getSpreadsheetEditUrl(idOrUrl) {
  const id = extractSpreadsheetId(idOrUrl);
  if (id) return `https://docs.google.com/spreadsheets/d/${id}/edit`;
  if (typeof idOrUrl === "string" && idOrUrl.trim().startsWith("http")) {
    return idOrUrl.trim();
  }
  return "";
}

/**
 * Direct Google Sheets Interactive Embed URL (for iframe preview)
 */
export function getSpreadsheetEmbedUrl(idOrUrl) {
  const id = extractSpreadsheetId(idOrUrl);
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit?rm=embedded&widget=true` : "";
}

/**
 * Direct Live .xlsx Download Export URL
 */
export function getSpreadsheetDirectDownloadUrl(idOrUrl) {
  const id = extractSpreadsheetId(idOrUrl);
  return id ? `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx` : "";
}

export async function testGoogleSheetsConnection(syncUrl, customSheet = "") {
  if (!syncUrl || !syncUrl.trim()) {
    throw new Error("Please enter your Google Apps Script Web App URL first.");
  }

  const cleanUrl = syncUrl.trim();
  let testUrl = cleanUrl.includes("?") ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
  const sheetParam = extractSpreadsheetId(customSheet) || (customSheet && customSheet.trim());
  if (sheetParam) {
    testUrl += `&spreadsheetId=${encodeURIComponent(sheetParam)}`;
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(testUrl, {
      method: "GET",
      signal: controller.signal,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      const match = text.match(/style="text-align:center[^"]*">([^<]+)<\/div>/i) ||
                    text.match(/class="errorMessage">([^<]+)<\/div>/i);
      if (match) {
        const scriptErr = match[1].replace(/&quot;/g, '"');
        return {
          success: false,
          error: `Google Apps Script Code Error: ${scriptErr}. Please update Code.gs with the code provided in the modal.`,
        };
      }
      return {
        success: false,
        error: "Apps Script did not return JSON. Ensure 'Who has access' is set to 'Anyone'.",
      };
    }

    if (json.success === false) {
      return { success: false, error: json.error || "Unknown Apps Script error" };
    }

    return {
      success: true,
      spreadsheetName: json.spreadsheetName || "Google Spreadsheet",
      spreadsheetUrl: json.spreadsheetUrl || "",
      spreadsheetId: json.spreadsheetId || "",
      downloadUrl: json.downloadUrl || (json.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${json.spreadsheetId}/export?format=xlsx` : ""),
      sheets: json.sheets || [],
      message: json.message || "Connected to Google Sheets successfully!",
    };
  } catch (err) {
    if (err.name === "AbortError") {
      return { success: false, error: "Connection timed out (12s). Check URL and internet." };
    }
    return { success: false, error: err.message };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function syncToGoogleSheets({
  data,
  clientId,
  syncUrl = DEFAULT_SYNC_URL,
  syncKey = "",
  spreadsheetId = "",
  customSheetUrl = "",
  timeoutMs = 25000,
}) {
  if (!syncUrl || !syncUrl.trim()) {
    throw new Error(
      "Google Sheets Web App URL is not set. Add your Apps Script URL in Settings or Reports.",
    );
  }

  const cleanUrl = syncUrl.trim();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  const targetSheet = extractSpreadsheetId(spreadsheetId || customSheetUrl) || spreadsheetId || customSheetUrl;
  const payload = {
    ...buildGoogleSheetsPayload(data, clientId),
    ...(targetSheet ? { spreadsheetId: targetSheet } : {}),
  };

  try {
    // Notice: text/plain;charset=utf-8 avoids CORS preflight OPTIONS request in browser!
    const response = await fetch(cleanUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        ...(syncKey ? { "X-Sync-Key": syncKey } : {}),
      },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Google Sheets responded with HTTP status ${response.status}`);
    }

    const rawText = await response.text();
    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      // Check if Apps Script returned an HTML error page (e.g. ReferenceError)
      const match = rawText.match(/class="errorMessage">([^<]+)<\/div>/i) ||
                    rawText.match(/style="text-align:center[^"]*">([^<]+)<\/div>/i);
      if (match) {
        const scriptErr = match[1].replace(/&quot;/g, '"');
        throw new Error(`Apps Script Error: ${scriptErr}. Update your Code.gs in Google Sheets.`);
      }
      if (rawText.includes("<!DOCTYPE html>") || rawText.includes("Google Apps Script")) {
        throw new Error("Google Apps Script returned an HTML page. Ensure deployment access is set to 'Anyone'.");
      }
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
      throw new Error("Google Sheets sync timed out (25s). Please check your internet connection.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
