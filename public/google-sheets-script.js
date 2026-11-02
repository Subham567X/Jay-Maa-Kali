/**
 * ========================================================================
 * নকুন্ডা কালীপূজা ও ভাইফোঁটা ২০২৬ — গুগল শিট অটোমেশন স্ক্রিপ্ট (Google Apps Script)
 * ========================================================================
 * এই কোডটি আপনার গুগল শিটে স্বয়ংক্রিয়ভাবে প্রতিযোগী ও তাদের লাইভ স্কোর সিঙ্ক করবে।
 * 
 * সেটআপ করার সহজ ৪টি ধাপ:
 * ১. একটি নতুন Google Sheet তৈরি করুন: https://sheets.new
 * ২. উপরের মেনু থেকে: Extensions > Apps Script-এ ক্লিক করুন।
 * ৩. আগের কোডটি মুছে ফেলে নিচের সম্পূর্ণ কোডটি পেস্ট করুন এবং Save আইকনে ক্লিক করুন।
 * ৪. উপরের ডানদিকের Deploy > New deployment ক্লিক করুন:
 *    - Select type: "Web app" সিলেক্ট করুন
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" সিলেক্ট করুন
 *    - "Deploy" বাটনে ক্লিক করে তৈরি হওয়া Web app URL কপি করে অ্যাডমিন প্যানেলে পেস্ট করুন!
 * ========================================================================
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    setupHeaders(sheet);

    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "TEST") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "নকুন্ডা গুগল শিট কানেকশন সম্পূর্ণ সফল!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "REGISTER" || action === "SCORE_UPDATE") {
      upsertParticipantRow(sheet, data.row);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", updatedCode: data.row.code })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "BULK_SYNC") {
      var rows = data.rows || [];
      for (var i = 0; i < rows.length; i++) {
        upsertParticipantRow(sheet, rows[i]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: rows.length })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "unknown_action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function setupHeaders(sheet) {
  var headers = [
    "প্রতিযোগী কোড (Code)",
    "নাম (Name)",
    "রেজিস্ট্রেশনের সময় (Registered At)",
    "কমিটি সদস্য (Is Committee)",
    "Day 1 স্কোর (/৫০)",
    "Day 1 সময়",
    "Day 2 স্কোর (/৫০)",
    "Day 2 সময়",
    "মোট স্কোর (/১০০)",
    "মোট সময়",
    "কুইজ স্ট্যাটাস",
    "সর্বশেষ আপডেট"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#991b1b"); // Deep Crimson Red
    headerRange.setFontColor("#fef08a"); // Divine Gold
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Auto column widths
    for (var col = 1; col <= headers.length; col++) {
      sheet.setColumnWidth(col, 160);
    }
  }
}

function upsertParticipantRow(sheet, row) {
  var values = sheet.getDataRange().getValues();
  var rowIndex = -1;

  // Search if participant code already exists in Column A
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] && values[i][0].toString().trim() === row.code.toString().trim()) {
      rowIndex = i + 1; // 1-based index
      break;
    }
  }

  var rowArray = [
    row.code,
    row.name,
    row.registeredAt,
    row.isCommittee,
    row.day1Score,
    row.day1Duration,
    row.day2Score,
    row.day2Duration,
    row.totalScore,
    row.totalDuration,
    row.status,
    row.lastUpdated
  ];

  if (rowIndex > 0) {
    // Update existing row
    sheet.getRange(rowIndex, 1, 1, rowArray.length).setValues([rowArray]);
  } else {
    // Append new row
    sheet.appendRow(rowArray);
    rowIndex = sheet.getLastRow();
  }

  // Highlight top scorers with soft gold tint
  if (typeof row.totalScore === "number" && row.totalScore >= 90) {
    sheet.getRange(rowIndex, 1, 1, rowArray.length).setBackground("#fef9c3");
  }
}
