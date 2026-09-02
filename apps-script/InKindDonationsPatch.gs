/*
  CSM Chad Miller Memorial - In-Kind Donations Apps Script patch source

  This file is a source-controlled reference for functions that must be merged
  into the bound tournament Code.gs. It intentionally does not redefine the
  existing doPost(e) or jsonResponse() functions.

  ROUTER INSERTION — add these cases to the existing parsed-action dispatch:

  if (data.action === "createInKindDonation") {
    return createInKindDonation(data);
  }
  if (data.action === "uploadInKindDonationFile") {
    return uploadInKindDonationFile(data);
  }
  if (data.action === "finalizeInKindDonation") {
    return finalizeInKindDonation(data);
  }
*/

const IN_KIND_SHEET_NAME = "In-Kind Donations";
const IN_KIND_SOURCE_SHEET_ID = 763058240;
const IN_KIND_FOLDER_ID = "1pZ1Pb7ExUPa_fEGNhc88FAwCWtIFXwIi";
const IN_KIND_FOLDER_NAME = "Chad Miller Memorial - In-Kind Contributions";
const IN_KIND_ADMIN_EMAIL = "chadmillermemorial@gmail.com";
const IN_KIND_MAX_FILE_BYTES = 4 * 1024 * 1024;

const IN_KIND_HEADERS = [
  "Submission ID",
  "Submitted At",
  "Donor / Business",
  "Contact Name",
  "Email",
  "Phone",
  "Contribution Type",
  "Contribution Type Write-In",
  "Intended Use",
  "Intended Use Write-In",
  "Item / Service Name",
  "Description",
  "Estimated Retail Value",
  "Quantity",
  "Restrictions / Expiration",
  "Redemption Instructions",
  "Website / Social",
  "File Links",
  "Drop-Off / Pickup Plan",
  "Public Recognition",
  "Public Recognition Name",
  "Status",
  "Reviewer",
  "Review Date",
  "Accepted / Declined Date",
  "Received Date",
  "Donor Notification Status",
  "Attachment Status",
  "Notes",
];

const IN_KIND_STATUSES = [
  "Submitted",
  "Under Review",
  "Accepted",
  "Declined",
  "Received",
  "Ready for Event",
];

const IN_KIND_CONTRIBUTION_TYPES = [
  "Physical Item / Merchandise",
  "Gift Card / Gift Certificate",
  "Service",
  "Experience",
  "Food / Beverage",
  "Event Supply / Equipment",
  "Other — Write In",
];

const IN_KIND_INTENDED_USES = [
  "Silent Auction",
  "Contest Prize",
  "Event Supply / Operations",
  "Food & Beverage",
  "Participant / Volunteer Support",
  "Other — Write In",
];

const IN_KIND_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const IN_KIND_ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
];

function createInKindDonation(data) {
  const metadata = normalizeInKindDonationData_(data);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = requireInKindSheet_(spreadsheet);
    const submissionId = allocateInKindSubmissionId_(sheet);
    const submittedAt = new Date();

    sheet.appendRow([
      submissionId,
      submittedAt,
      sheetSafeInKindText_(metadata.donorBusiness),
      sheetSafeInKindText_(metadata.contactName),
      sheetSafeInKindText_(metadata.email),
      sheetSafeInKindText_(metadata.phone),
      sheetSafeInKindText_(metadata.contributionType),
      sheetSafeInKindText_(metadata.contributionTypeWriteIn),
      sheetSafeInKindText_(metadata.intendedUse),
      sheetSafeInKindText_(metadata.intendedUseWriteIn),
      sheetSafeInKindText_(metadata.itemServiceName),
      sheetSafeInKindText_(metadata.description),
      metadata.estimatedRetailValue,
      metadata.quantity,
      sheetSafeInKindText_(metadata.restrictionsExpiration),
      sheetSafeInKindText_(metadata.redemptionInstructions),
      sheetSafeInKindText_(metadata.websiteSocial),
      "",
      sheetSafeInKindText_(metadata.dropOffPickupPlan),
      metadata.publicRecognition,
      sheetSafeInKindText_(metadata.publicRecognitionName),
      "Submitted",
      "",
      "",
      "",
      "",
      "",
      "No Attachments",
      sheetSafeInKindText_(metadata.notes),
    ]);

    return jsonResponse({
      ok: true,
      submissionId: submissionId,
    });
  } finally {
    lock.releaseLock();
  }
}

function uploadInKindDonationFile(data) {
  const submissionId = requireInKindSubmissionId_(data && data.submissionId);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = requireInKindSheet_(spreadsheet);
    const rowNumber = findInKindSubmissionRow_(sheet, submissionId);

    if (!rowNumber) {
      throw new Error("The in-kind contribution submission could not be found.");
    }

    const fileName = sanitizeInKindFileName_(data && data.fileName);
    const mimeType = cleanInKindText_(data && data.mimeType, 200);
    const base64Data = String((data && data.base64Data) || "");

    if (IN_KIND_ALLOWED_MIME_TYPES.indexOf(mimeType) === -1) {
      throw new Error("Unsupported supporting file type.");
    }

    const extension = getInKindFileExtension_(fileName);
    if (IN_KIND_ALLOWED_EXTENSIONS.indexOf(extension) === -1) {
      throw new Error("Unsupported supporting file type.");
    }

    if (!base64Data) {
      throw new Error("The supporting file is empty.");
    }

    let bytes;
    try {
      bytes = Utilities.base64Decode(base64Data);
    } catch (error) {
      throw new Error("The supporting file could not be decoded.");
    }

    if (bytes.length > IN_KIND_MAX_FILE_BYTES) {
      throw new Error("Each supporting file must be 4 MB or smaller.");
    }

    const donorBusiness = cleanInKindText_(
      sheet.getRange(rowNumber, 3).getDisplayValue(),
      200
    );
    const contributionFolder = getOrCreateInKindSubmissionFolder_(
      submissionId,
      donorBusiness
    );
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    const file = contributionFolder.createFile(blob);
    const fileUrl = file.getUrl();

    appendInKindCellText_(sheet, rowNumber, 18, fileUrl);

    const currentAttachmentStatus = cleanInKindText_(
      sheet.getRange(rowNumber, 28).getDisplayValue(),
      200
    );
    if (currentAttachmentStatus !== "Attachment Upload Issue") {
      sheet.getRange(rowNumber, 28).setValue("Complete");
    }

    return jsonResponse({
      ok: true,
      submissionId: submissionId,
      fileUrl: fileUrl,
    });
  } catch (error) {
    markInKindAttachmentIssue_(submissionId);
    throw error;
  }
}

function finalizeInKindDonation(data) {
  const submissionId = requireInKindSubmissionId_(data && data.submissionId);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = requireInKindSheet_(spreadsheet);
  const rowNumber = findInKindSubmissionRow_(sheet, submissionId);

  if (!rowNumber) {
    throw new Error("The in-kind contribution submission could not be found.");
  }

  if (data && data.attachmentIssue === true) {
    sheet.getRange(rowNumber, 28).setValue("Attachment Upload Issue");
  }

  const row = sheet.getRange(rowNumber, 1, 1, IN_KIND_HEADERS.length).getDisplayValues()[0];
  const email = cleanInKindText_(row[4], 320);
  let notificationStatus = cleanInKindText_(row[26], 5000);

  if (notificationStatus.indexOf("Submitted confirmation sent") === -1) {
    try {
      sendInKindSubmittedConfirmation_(row);
      notificationStatus = appendInKindStatusText_(
        notificationStatus,
        "Submitted confirmation sent"
      );
    } catch (error) {
      notificationStatus = appendInKindStatusText_(
        notificationStatus,
        "Submitted confirmation failed: " + inKindErrorMessage_(error)
      );
    }
  }

  if (notificationStatus.indexOf("Admin alert sent") === -1) {
    try {
      sendInKindAdminAlert_(row);
      notificationStatus = appendInKindStatusText_(
        notificationStatus,
        "Admin alert sent"
      );
    } catch (error) {
      notificationStatus = appendInKindStatusText_(
        notificationStatus,
        "Admin alert failed: " + inKindErrorMessage_(error)
      );
    }
  }

  sheet.getRange(rowNumber, 27).setValue(notificationStatus);

  return jsonResponse({
    ok: true,
    submissionId: submissionId,
    donorEmail: email,
  });
}

function handleInKindDonationStatusEdit(e) {
  if (!e || !e.range) {
    return;
  }

  const range = e.range;
  const sheet = range.getSheet();

  if (sheet.getName() !== IN_KIND_SHEET_NAME) {
    return;
  }

  if (range.getRow() <= 1 || range.getNumRows() !== 1 || range.getNumColumns() !== 1) {
    return;
  }

  const statusColumn = getInKindHeaderColumn_(sheet, "Status");
  if (range.getColumn() !== statusColumn) {
    return;
  }

  const oldStatus = cleanInKindText_(e.oldValue, 100);
  const newStatus = cleanInKindText_(e.value, 100);

  if (!newStatus || oldStatus === newStatus) {
    return;
  }

  if (IN_KIND_STATUSES.indexOf(newStatus) === -1) {
    return;
  }

  const rowNumber = range.getRow();
  const reviewerColumn = getInKindHeaderColumn_(sheet, "Reviewer");
  const reviewDateColumn = getInKindHeaderColumn_(sheet, "Review Date");
  const decisionDateColumn = getInKindHeaderColumn_(sheet, "Accepted / Declined Date");
  const receivedDateColumn = getInKindHeaderColumn_(sheet, "Received Date");
  const notificationColumn = getInKindHeaderColumn_(sheet, "Donor Notification Status");

  if (newStatus === "Under Review") {
    setInKindReviewerIfBlank_(sheet, rowNumber, reviewerColumn);
    setInKindDateIfBlank_(sheet, rowNumber, reviewDateColumn);
    return;
  }

  if (newStatus === "Accepted" || newStatus === "Declined") {
    setInKindReviewerIfBlank_(sheet, rowNumber, reviewerColumn);
    setInKindDateIfBlank_(sheet, rowNumber, reviewDateColumn);
    setInKindDateIfBlank_(sheet, rowNumber, decisionDateColumn);

    const marker = newStatus === "Accepted"
      ? "Accepted email sent"
      : "Declined email sent";
    const failurePrefix = newStatus === "Accepted"
      ? "Accepted email failed: "
      : "Declined email failed: ";
    let notificationStatus = cleanInKindText_(
      sheet.getRange(rowNumber, notificationColumn).getDisplayValue(),
      5000
    );

    if (notificationStatus.indexOf(marker) !== -1) {
      return;
    }

    const row = sheet.getRange(rowNumber, 1, 1, IN_KIND_HEADERS.length).getDisplayValues()[0];

    try {
      if (newStatus === "Accepted") {
        sendInKindAcceptedEmail_(row);
      } else {
        sendInKindDeclinedEmail_(row);
      }
      notificationStatus = appendInKindStatusText_(notificationStatus, marker);
    } catch (error) {
      notificationStatus = appendInKindStatusText_(
        notificationStatus,
        failurePrefix + inKindErrorMessage_(error)
      );
    }

    sheet.getRange(rowNumber, notificationColumn).setValue(notificationStatus);
    return;
  }

  if (newStatus === "Received") {
    setInKindDateIfBlank_(sheet, rowNumber, receivedDateColumn);
  }
}

function setupInKindDonations() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  let sheet = null;

  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === IN_KIND_SOURCE_SHEET_ID) {
      sheet = sheets[i];
      break;
    }
  }

  if (!sheet) {
    throw new Error("The existing Silent Auction Donations sheet could not be found.");
  }

  if (sheet.getName() !== IN_KIND_SHEET_NAME) {
    sheet.setName(IN_KIND_SHEET_NAME);
  }

  if (sheet.getMaxColumns() < IN_KIND_HEADERS.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      IN_KIND_HEADERS.length - sheet.getMaxColumns()
    );
  }

  if (sheet.getMaxRows() < 2) {
    sheet.insertRowsAfter(1, 1);
  }

  sheet.getRange(1, 1, 1, IN_KIND_HEADERS.length).setValues([IN_KIND_HEADERS]);
  sheet.setFrozenRows(1);

  const dataRowCount = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, 13, dataRowCount, 1).setNumberFormat("$#,##0.00");
  sheet.getRange(2, 2, dataRowCount, 1).setNumberFormat("m/d/yyyy h:mm am/pm");
  sheet.getRange(2, 24, dataRowCount, 3).setNumberFormat("m/d/yyyy h:mm am/pm");

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(IN_KIND_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 22, dataRowCount, 1).setDataValidation(statusRule);

  const recognitionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Yes", "No"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 20, dataRowCount, 1).setDataValidation(recognitionRule);

  DriveApp.getFolderById(IN_KIND_FOLDER_ID).setName(IN_KIND_FOLDER_NAME);

  return {
    ok: true,
    sheetName: sheet.getName(),
    folderName: IN_KIND_FOLDER_NAME,
  };
}

function installInKindDonationStatusTrigger() {
  const handlerName = "handleInKindDonationStatusEdit";
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === handlerName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger("handleInKindDonationStatusEdit")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  return {
    ok: true,
    handler: handlerName,
  };
}

function normalizeInKindDonationData_(data) {
  data = data || {};

  const donorBusiness = cleanInKindText_(data.donorBusiness, 200);
  const contactName = cleanInKindText_(data.contactName, 200);
  const email = cleanInKindText_(data.email, 320);
  const phone = cleanInKindText_(data.phone, 100);
  const contributionType = cleanInKindText_(data.contributionType, 200);
  const contributionTypeWriteIn = cleanInKindText_(data.contributionTypeWriteIn, 500);
  const intendedUse = cleanInKindText_(data.intendedUse, 200);
  const intendedUseWriteIn = cleanInKindText_(data.intendedUseWriteIn, 500);
  const itemServiceName = cleanInKindText_(data.itemServiceName, 300);
  const description = cleanInKindText_(data.description, 5000);
  const estimatedRetailValue = Number(data.estimatedRetailValue);
  const quantity = Number(data.quantity);
  const publicRecognition = cleanInKindText_(data.publicRecognition, 20) === "Yes"
    ? "Yes"
    : "No";
  let publicRecognitionName = cleanInKindText_(data.publicRecognitionName, 300);

  if (!donorBusiness || !contactName || !email || !phone || !itemServiceName || !description) {
    throw new Error("Required in-kind donor or contribution information is missing.");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("A valid donor email address is required.");
  }

  if (IN_KIND_CONTRIBUTION_TYPES.indexOf(contributionType) === -1) {
    throw new Error("The contribution type is invalid.");
  }

  if (contributionType === "Other — Write In" && !contributionTypeWriteIn) {
    throw new Error("A contribution type write-in is required.");
  }

  if (IN_KIND_INTENDED_USES.indexOf(intendedUse) === -1) {
    throw new Error("The intended use is invalid.");
  }

  if (intendedUse === "Other — Write In" && !intendedUseWriteIn) {
    throw new Error("An intended-use write-in is required.");
  }

  if (!isFinite(estimatedRetailValue) || estimatedRetailValue <= 0) {
    throw new Error("Estimated retail value must be greater than zero.");
  }

  if (!isFinite(quantity) || quantity < 1 || Math.floor(quantity) !== quantity) {
    throw new Error("Quantity must be a whole number of at least one.");
  }

  if (publicRecognition === "Yes" && !publicRecognitionName) {
    publicRecognitionName = donorBusiness;
  }

  if (publicRecognition === "No") {
    publicRecognitionName = "";
  }

  return {
    donorBusiness: donorBusiness,
    contactName: contactName,
    email: email,
    phone: phone,
    contributionType: contributionType,
    contributionTypeWriteIn: contributionTypeWriteIn,
    intendedUse: intendedUse,
    intendedUseWriteIn: intendedUseWriteIn,
    itemServiceName: itemServiceName,
    description: description,
    estimatedRetailValue: estimatedRetailValue,
    quantity: quantity,
    restrictionsExpiration: cleanInKindText_(data.restrictionsExpiration, 2000),
    redemptionInstructions: cleanInKindText_(data.redemptionInstructions, 3000),
    websiteSocial: cleanInKindText_(data.websiteSocial, 1000),
    dropOffPickupPlan: cleanInKindText_(data.dropOffPickupPlan, 2000),
    publicRecognition: publicRecognition,
    publicRecognitionName: publicRecognitionName,
    notes: cleanInKindText_(data.notes, 5000),
  };
}

function requireInKindSheet_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(IN_KIND_SHEET_NAME);
  if (!sheet) {
    throw new Error("The In-Kind Donations sheet is not configured. Run setupInKindDonations first.");
  }
  return sheet;
}

function allocateInKindSubmissionId_(sheet) {
  const lastRow = sheet.getLastRow();
  let maxSequence = 0;

  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
    values.forEach(function (row) {
      const match = String(row[0] || "").match(/^IK-2026-(\d+)$/);
      if (match) {
        maxSequence = Math.max(maxSequence, Number(match[1]) || 0);
      }
    });
  }

  return "IK-2026-" + String(maxSequence + 1).padStart(4, "0");
}

function requireInKindSubmissionId_(value) {
  const submissionId = cleanInKindText_(value, 100);
  if (!/^IK-2026-\d{4,}$/.test(submissionId)) {
    throw new Error("Invalid in-kind contribution submission ID.");
  }
  return submissionId;
}

function findInKindSubmissionRow_(sheet, submissionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 0;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === submissionId) {
      return i + 2;
    }
  }
  return 0;
}

function getInKindHeaderColumn_(sheet, headerName) {
  const headers = sheet
    .getRange(1, 1, 1, IN_KIND_HEADERS.length)
    .getDisplayValues()[0];
  const index = headers.indexOf(headerName);

  if (index === -1) {
    throw new Error("Missing In-Kind Donations column: " + headerName);
  }

  return index + 1;
}

function getOrCreateInKindSubmissionFolder_(submissionId, donorBusiness) {
  const root = DriveApp.getFolderById(IN_KIND_FOLDER_ID);
  const safeDonor = sanitizeInKindDriveName_(donorBusiness || "Donor");
  const folderName = (submissionId + " - " + safeDonor).slice(0, 180);
  const existing = root.getFoldersByName(folderName);

  if (existing.hasNext()) {
    return existing.next();
  }

  return root.createFolder(folderName);
}

function markInKindAttachmentIssue_(submissionId) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(IN_KIND_SHEET_NAME);
    if (!sheet) {
      return;
    }
    const rowNumber = findInKindSubmissionRow_(sheet, submissionId);
    if (rowNumber) {
      sheet.getRange(rowNumber, 28).setValue("Attachment Upload Issue");
    }
  } catch (ignored) {
    console.error("Unable to mark in-kind attachment issue", ignored);
  }
}

function sendInKindSubmittedConfirmation_(row) {
  const submissionId = cleanInKindText_(row[0], 100);
  const donorBusiness = cleanInKindText_(row[2], 200);
  const email = cleanInKindText_(row[4], 320);
  const itemName = cleanInKindText_(row[10], 300);

  if (!email) {
    throw new Error("Donor email is missing.");
  }

  const subject = "CSM Chad Miller Memorial — Contribution Submitted for Review";
  const body = [
    "Thank you for offering to support the CSM Chad Miller Memorial Golf Tournament.",
    "",
    "Your contribution has been submitted for review. Submission does not constitute acceptance.",
    "The tournament team will contact you after review regarding acceptance and delivery or fulfillment.",
    "",
    "Submission ID: " + submissionId,
    "Donor / Business: " + donorBusiness,
    "Proposed Contribution: " + itemName,
    "",
    "Please keep your submission ID for reference.",
    "",
    "CSM Chad Miller Memorial Golf Tournament",
  ].join("\n");

  GmailApp.sendEmail(email, subject, body, {
    name: "CSM Chad Miller Memorial Golf Tournament",
  });
}

function sendInKindAdminAlert_(row) {
  const attachmentStatus = cleanInKindText_(row[27], 300);
  const body = [
    "A new in-kind contribution has been submitted for review.",
    "",
    "Submission ID: " + cleanInKindText_(row[0], 100),
    "Donor / Business: " + cleanInKindText_(row[2], 200),
    "Contact Name: " + cleanInKindText_(row[3], 200),
    "Email: " + cleanInKindText_(row[4], 320),
    "Phone: " + cleanInKindText_(row[5], 100),
    "Contribution Type: " + inKindDisplayChoice_(row[6], row[7]),
    "Intended Use: " + inKindDisplayChoice_(row[8], row[9]),
    "Item / Service: " + cleanInKindText_(row[10], 300),
    "Description: " + cleanInKindText_(row[11], 5000),
    "Estimated Retail Value: " + cleanInKindText_(row[12], 100),
    "Quantity: " + cleanInKindText_(row[13], 100),
    "Restrictions / Expiration: " + cleanInKindText_(row[14], 2000),
    "Redemption Instructions: " + cleanInKindText_(row[15], 3000),
    "Website / Social: " + cleanInKindText_(row[16], 1000),
    "File Links: " + cleanInKindText_(row[17], 5000),
    "Drop-Off / Pickup Plan: " + cleanInKindText_(row[18], 2000),
    "Public Recognition: " + cleanInKindText_(row[19], 20),
    "Recognition Name: " + cleanInKindText_(row[20], 300),
    "Attachment Status: " + attachmentStatus,
    "Notes: " + cleanInKindText_(row[28], 5000),
    "",
    "Review and update the Status in the In-Kind Donations tab of the tournament management workbook.",
  ].join("\n");

  GmailApp.sendEmail(
    IN_KIND_ADMIN_EMAIL,
    "CSM Chad Miller Memorial — New In-Kind Contribution " + cleanInKindText_(row[0], 100),
    body,
    { name: "CSM Chad Miller Memorial Golf Tournament" }
  );
}

function sendInKindAcceptedEmail_(row) {
  const email = cleanInKindText_(row[4], 320);
  if (!email) {
    throw new Error("Donor email is missing.");
  }

  const body = [
    "Thank you for supporting the CSM Chad Miller Memorial Golf Tournament.",
    "",
    "We are pleased to confirm that your proposed contribution has been accepted.",
    "",
    "Submission ID: " + cleanInKindText_(row[0], 100),
    "Contribution: " + cleanInKindText_(row[10], 300),
    "",
    "The tournament team may follow up with you regarding delivery, pickup, redemption, or fulfillment details.",
    "",
    "CSM Chad Miller Memorial Golf Tournament",
  ].join("\n");

  GmailApp.sendEmail(
    email,
    "CSM Chad Miller Memorial — In-Kind Contribution Accepted",
    body,
    { name: "CSM Chad Miller Memorial Golf Tournament" }
  );
}

function sendInKindDeclinedEmail_(row) {
  const email = cleanInKindText_(row[4], 320);
  if (!email) {
    throw new Error("Donor email is missing.");
  }

  const body = [
    "Thank you for offering to support the CSM Chad Miller Memorial Golf Tournament.",
    "",
    "After review, we are unable to accept the proposed contribution at this time.",
    "We sincerely appreciate your willingness to support the memorial and The Honor Foundation.",
    "",
    "Submission ID: " + cleanInKindText_(row[0], 100),
    "Contribution: " + cleanInKindText_(row[10], 300),
    "",
    "CSM Chad Miller Memorial Golf Tournament",
  ].join("\n");

  GmailApp.sendEmail(
    email,
    "CSM Chad Miller Memorial — In-Kind Contribution Review",
    body,
    { name: "CSM Chad Miller Memorial Golf Tournament" }
  );
}

function setInKindReviewerIfBlank_(sheet, rowNumber, columnNumber) {
  const cell = sheet.getRange(rowNumber, columnNumber);
  if (cleanInKindText_(cell.getDisplayValue(), 320)) {
    return;
  }

  let reviewer = "Tournament Admin";
  try {
    reviewer = Session.getActiveUser().getEmail() || reviewer;
  } catch (ignored) {
    // Some trigger contexts do not expose the active editor email.
  }

  cell.setValue(reviewer);
}

function setInKindDateIfBlank_(sheet, rowNumber, columnNumber) {
  const cell = sheet.getRange(rowNumber, columnNumber);
  if (!cell.getValue()) {
    cell.setValue(new Date());
  }
}

function appendInKindCellText_(sheet, rowNumber, columnNumber, value) {
  const cell = sheet.getRange(rowNumber, columnNumber);
  const existing = cleanInKindText_(cell.getDisplayValue(), 20000);
  const nextValue = cleanInKindText_(value, 10000);

  if (!nextValue || existing.indexOf(nextValue) !== -1) {
    return;
  }

  cell.setValue(existing ? existing + "\n" + nextValue : nextValue);
}

function appendInKindStatusText_(existing, value) {
  const current = cleanInKindText_(existing, 5000);
  const addition = cleanInKindText_(value, 1000);

  if (!addition || current.indexOf(addition) !== -1) {
    return current;
  }

  return current ? current + " | " + addition : addition;
}

function inKindDisplayChoice_(preset, writeIn) {
  const presetValue = cleanInKindText_(preset, 300);
  const writeInValue = cleanInKindText_(writeIn, 500);
  if (presetValue === "Other — Write In" && writeInValue) {
    return writeInValue;
  }
  return presetValue;
}

function cleanInKindText_(value, maxLength) {
  const text = String(value == null ? "" : value).trim();
  const limit = Number(maxLength) || 1000;
  return text.slice(0, limit);
}

function sheetSafeInKindText_(value) {
  const text = cleanInKindText_(value, 10000);
  if (/^[=+\-@]/.test(text)) {
    return "'" + text;
  }
  return text;
}

function sanitizeInKindDriveName_(value) {
  const text = cleanInKindText_(value, 120)
    .replace(/[\\/:*?"<>|\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || "Donor";
}

function sanitizeInKindFileName_(value) {
  const text = cleanInKindText_(value, 180)
    .replace(/[\\/\r\n]+/g, "_")
    .trim();

  if (!text || text === "." || text === "..") {
    throw new Error("Invalid supporting file name.");
  }

  return text;
}

function getInKindFileExtension_(fileName) {
  const parts = String(fileName || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function inKindErrorMessage_(error) {
  const message = error && error.message ? error.message : String(error || "Unknown error");
  return cleanInKindText_(message, 500);
}
