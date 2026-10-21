/**
 * =========================================================================
 * StudyFlow - Google Sheets Synchronization Apps Script
 * =========================================================================
 * 
 * Instructions to set up:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. In the menu, go to: Extensions > Apps Script
 * 3. Delete any default code in Code.gs, paste this entire file, and click Save (Ctrl+S)
 * 4. Click "Deploy" > "New deployment"
 * 5. Select type: "Web app"
 * 6. Set "Execute as": "Me"
 * 7. Set "Who has access": "Anyone"
 * 8. Click "Deploy", authorize Google account access, and copy the Web App URL
 * 9. Paste that URL in StudyFlow (Settings > Apps Script Web App URL) and click "Sync Now"!
 *
 * This script automatically creates and organizes:
 * - "To-Do List" (All planned tasks, status, priorities, subjects)
 * - "Study Sessions" (Detailed study timer logs)
 * - "Attendance" (Daily presence/absence history)
 * - "Subjects & Topics" (Syllabus status and progress)
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No POST body received"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var data = payload.data || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sync To-Do Tasks to "To-Do List" Sheet
    if (data.todos && Array.isArray(data.todos)) {
      var todoSheet = ss.getSheetByName("To-Do List") || ss.insertSheet("To-Do List");
      todoSheet.clearContents();
      
      var todoHeaders = [
        "Task ID", "Task Title", "Time", "Category", 
        "Preparation", "Subject", "Topic", "Duration (Mins)", 
        "Priority", "Status", "Completion Note", "Completed At", "Created At"
      ];
      todoSheet.appendRow(todoHeaders);
      
      data.todos.forEach(function(t) {
        todoSheet.appendRow([
          t.id || "",
          t.title || "",
          t.time || "",
          t.category || "Study",
          t.preparation || "General",
          t.subject || "General",
          t.topic || "General",
          t.targetDurationMinutes || 60,
          t.priority || "Medium",
          t.status || (t.completed ? "Completed" : "Pending"),
          t.completionNote || "",
          t.completedAt || "",
          t.createdAt || ""
        ]);
      });

      // Format header row
      var todoHeaderRange = todoSheet.getRange(1, 1, 1, todoHeaders.length);
      todoHeaderRange.setFontWeight("bold");
      todoHeaderRange.setBackground("#4338ca");
      todoHeaderRange.setFontColor("#ffffff");
      todoSheet.setFrozenRows(1);
    }

    // 2. Sync Study Sessions to "Study Sessions" Sheet
    if (data.sessions && Array.isArray(data.sessions)) {
      var sessSheet = ss.getSheetByName("Study Sessions") || ss.insertSheet("Study Sessions");
      sessSheet.clearContents();
      
      var sessHeaders = [
        "Session ID", "Date", "Start Time", "End Time", 
        "Actual Study (Min)", "Break (Min)", "Status", "Notes"
      ];
      sessSheet.appendRow(sessHeaders);
      
      data.sessions.forEach(function(s) {
        sessSheet.appendRow([
          s.id || "",
          s.date || "",
          s.startTime || "",
          s.endTime || "",
          Math.round((s.actualStudyDuration || 0) / 60),
          Math.round((s.breakDuration || 0) / 60),
          s.completionStatus || s.status || "Completed",
          s.notes || ""
        ]);
      });

      var sessHeaderRange = sessSheet.getRange(1, 1, 1, sessHeaders.length);
      sessHeaderRange.setFontWeight("bold");
      sessHeaderRange.setBackground("#0284c7");
      sessHeaderRange.setFontColor("#ffffff");
      sessSheet.setFrozenRows(1);
    }

    // 3. Sync Attendance to "Attendance" Sheet
    if (data.attendance && Array.isArray(data.attendance)) {
      var attSheet = ss.getSheetByName("Attendance") || ss.insertSheet("Attendance");
      attSheet.clearContents();
      
      var attHeaders = ["Date", "Status", "Study Duration (Mins)", "Recorded Timestamp"];
      attSheet.appendRow(attHeaders);
      
      data.attendance.forEach(function(a) {
        attSheet.appendRow([
          a.date || "",
          a.status || "",
          Math.round((a.totalStudyDuration || 0) / 60),
          a.recordedAt || ""
        ]);
      });

      var attHeaderRange = attSheet.getRange(1, 1, 1, attHeaders.length);
      attHeaderRange.setFontWeight("bold");
      attHeaderRange.setBackground("#059669");
      attHeaderRange.setFontColor("#ffffff");
      attSheet.setFrozenRows(1);
    }

    // 4. Sync Subjects to "Subjects" Sheet
    if (data.subjects && Array.isArray(data.subjects)) {
      var subSheet = ss.getSheetByName("Subjects") || ss.insertSheet("Subjects");
      subSheet.clearContents();
      
      var subHeaders = ["Subject Name", "Priority", "Status", "Progress (%)"];
      subSheet.appendRow(subHeaders);
      
      data.subjects.forEach(function(s) {
        subSheet.appendRow([
          s.name || "",
          s.priority || "Medium",
          s.status || "In Progress",
          s.progress || 0
        ]);
      });

      var subHeaderRange = subSheet.getRange(1, 1, 1, subHeaders.length);
      subHeaderRange.setFontWeight("bold");
      subHeaderRange.setBackground("#d97706");
      subHeaderRange.setFontColor("#ffffff");
      subSheet.setFrozenRows(1);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: "StudyFlow To-Dos and Data successfully synced to Google Sheets!",
        rowCount: (data.todos ? data.todos.length : 0) + (data.sessions ? data.sessions.length : 0)
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput("StudyFlow Google Sheets Sync API is live and ready to accept POST requests.")
    .setMimeType(ContentService.MimeType.TEXT);
}
