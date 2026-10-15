/*
 * CSM Chad Miller Memorial — isolated 2027 inquiry storage.
 * Add to the existing bound project without replacing 2026 handlers.
 * Reuses requireSponsorCapacityInternalKey_ and jsonResponse.
 * The live doGet router must dispatch get2027Capabilities to
 * get2027Capabilities(), and doPost must dispatch save2027Inquiry to
 * save2027Inquiry(data) BEFORE the legacy paid-registration fallback.
 * No emails are sent by this file; no payment or capacity is created.
 */
function get2027Capabilities() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('2027 Player Interest') || !ss.getSheetByName('2027 Sponsor Inquiries')) {
    return jsonResponse({ ok: false, eventYear: 2027 });
  }
  return jsonResponse({ ok: true, eventYear: 2027, inquirySchema: '2027-inquiry-v1' });
}

function inquiry2027Text_(value, label, max, required) {
  var result = typeof value === 'string' ? value.trim() : '';
  if ((required && !result) || result.length > max) throw new Error('Invalid ' + label + '.');
  return result;
}
function inquiry2027Cell_(value) {
  return typeof value === 'string' && /^[=+\-@]/.test(value) ? "'" + value : value;
}

function inquiry2027CompareCell_(value) {
  return typeof value === 'string' && /^'[=+\-@]/.test(value) ? value.slice(1) : value;
}

function save2027Inquiry(data) {
  requireSponsorCapacityInternalKey_(data);
  if (data.eventYear !== 2027 || (data.type !== 'player' && data.type !== 'sponsor') || data.contactConsent !== true) throw new Error('Invalid 2027 inquiry.');
  if (!/^INQ-2027-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(String(data.submissionId || ''))) throw new Error('Invalid inquiry reference.');
  var name = inquiry2027Text_(data.name, 'name', 120, true);
  var email = inquiry2027Text_(data.email, 'email', 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email.');
  var phone = inquiry2027Text_(data.phone, 'phone', 40, false);
  var notes = inquiry2027Text_(data.notes, 'notes', 2000, false);
  var organization = inquiry2027Text_(data.organization, 'organization', 180, data.type === 'sponsor');
  var website = inquiry2027Text_(data.website, 'website', 500, false);
  if (website && !/^https?:\/\/[^\s/@]+(?:[/:?#]|$)/i.test(website)) throw new Error('Invalid website.');
  var interest = inquiry2027Text_(data.interest, 'interest', 180, false);
  var count = data.type === 'player' ? Number(data.playersInterested) : 0;
  if (data.type === 'player' && (!Number.isInteger(count) || count < 1 || count > 4)) throw new Error('Invalid player interest count.');
  var sheetName = data.type === 'player' ? '2027 Player Interest' : '2027 Sponsor Inquiries';
  var headers = data.type === 'player'
    ? ['Submission ID','Submitted At','Event Year','Name','Email','Phone','Players Interested','Notes','Contact Consent','Status']
    : ['Submission ID','Submitted At','Event Year','Organization','Contact Name','Email','Phone','Website','Interest','Notes','Contact Consent','Status'];
  var details = data.type === 'player'
    ? [2027,name,email,phone,count,notes,'Yes','New interest']
    : [2027,organization,name,email,phone,website,interest,notes,'Yes','New inquiry'];
  details = details.map(inquiry2027Cell_);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error('2027 inquiry sheet is missing.');
    var actualHeaders = sheet.getRange(1,1,1,headers.length).getValues()[0];
    if (JSON.stringify(actualHeaders) !== JSON.stringify(headers)) throw new Error('2027 inquiry headers do not match.');
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var existing = sheet.getRange(2,1,lastRow - 1,headers.length).getValues();
      for (var i = 0; i < existing.length; i++) {
        if (existing[i][0] === data.submissionId) {
          // Keep human-managed Status out of the retry comparison.
          if (JSON.stringify(existing[i].slice(2,-1).map(inquiry2027CompareCell_)) !== JSON.stringify(details.slice(0,-1).map(inquiry2027CompareCell_))) throw new Error('This reference already has different details. Reload the form before a new inquiry.');
          return jsonResponse({ ok: true, eventYear: 2027, inquiryType: data.type, submissionId: data.submissionId, reused: true });
        }
      }
    }
    sheet.appendRow([data.submissionId,new Date().toISOString()].concat(details));
    return jsonResponse({ ok: true, eventYear: 2027, inquiryType: data.type, submissionId: data.submissionId });
  } finally { lock.releaseLock(); }
}
