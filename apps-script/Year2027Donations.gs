/* Included in the complete Code.gs. Do not add a second live copy.
 * Only authenticated successful-payment webhooks may record 2027 donations.
 * This file records refunds that have already occurred; it never moves money.
 */
function donation2027Headers_() {
  return ['Stripe Session ID','Received At','Event Year','Donor Name','Email','Phone','Amount USD','2027 Acknowledgment','Anonymous','Recognition Name','Notes','Status','Refund Amount USD','Processing Fee Retained USD','Refunded At','Stripe Refund ID','Thank You Status'];
}
function donation2027Sheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('2027 Donations');
  if (!sheet) throw new Error('2027 donation sheet is missing.');
  var headers = donation2027Headers_();
  if (JSON.stringify(sheet.getRange(1,1,1,headers.length).getValues()[0]) !== JSON.stringify(headers)) throw new Error('2027 donation headers do not match.');
  return sheet;
}
function donation2027FindRow_(sheet, sessionId) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var ids = sheet.getRange(2,1,last-1,1).getValues();
  for (var i=0;i<ids.length;i++) if (String(ids[i][0]) === sessionId) return i+2;
  return 0;
}
function save2027Donation(data) {
  requireSponsorCapacityInternalKey_(data);
  if (data.eventYear !== 2027 || data.donation2027Acknowledgment !== true) throw new Error('A 2027 donation acknowledgment is required.');
  var sessionId = inquiry2027Text_(data.stripeSessionId,'Stripe session',255,true);
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error('Invalid Stripe session.');
  var name = inquiry2027Text_(data.donorName,'donor name',120,true);
  var email = inquiry2027Text_(data.email,'email',254,true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid donor email.');
  var phone = inquiry2027Text_(data.phone,'phone',40,true);
  var amount = Number(data.donationAmount);
  var cents = Math.round(amount*100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(cents) || cents<100 || cents>99999999 || Math.abs(amount-cents/100)>0.0000001) throw new Error('Invalid donation amount.');
  var anonymous = data.anonymous === 'Yes' ? 'Yes' : 'No';
  var recognition = anonymous === 'No' && data.publicRecognition === 'Yes'
    ? inquiry2027Text_(data.publicRecognitionName,'recognition name',120,false) || name : '';
  var notes = inquiry2027Text_(data.notes,'notes',450,false);
  var received = new Date(data.receivedAt);
  if (!data.receivedAt || isNaN(received.getTime())) throw new Error('Invalid payment date.');
  var details = [2027,name,email,phone,cents/100,'Yes',anonymous,recognition,notes];
  // This web app executes as its owner. All 2027 writers share this owner
  // lock, separate from the script lock held by legacy dashboard jobs.
  var lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    var sheet = donation2027Sheet_();
    var row = donation2027FindRow_(sheet,sessionId);
    var duplicate = Boolean(row);
    if (row) {
      var existing = sheet.getRange(row,3,1,9).getValues()[0];
      if (JSON.stringify(existing) !== JSON.stringify(details)) throw new Error('This payment already has different donation details.');
    } else {
      sheet.appendRow([sessionId,received.toISOString()].concat(details,['Paid',0,0,'','','Pending']).map(inquiry2027Cell_));
      row = sheet.getLastRow();
    }
    // A refund must never trigger a new donation thank-you on replay.
    if (sheet.getRange(row,12).getValues()[0][0] !== 'Refunded') {
      try {
        send2027DonationConfirmationOnce_({stripeSessionId:sessionId,donorName:name,email:email,donationAmount:cents/100,recognitionName:recognition});
        sheet.getRange(row,17).setValue('Sent');
      } catch (error) {
        sheet.getRange(row,17).setValue('Pending retry');
        throw new Error('Donation confirmation is temporarily unavailable. Retry this payment reference.');
      }
    }
    return jsonResponse({ok:true,donationSaved:true,eventYear:2027,stripeSessionId:sessionId,duplicate:duplicate});
  } finally { lock.releaseLock(); }
}
function send2027DonationConfirmationOnce_(data) {
  if (emailAlreadySent('donation2027',data.stripeSessionId)) return;
  var recognition = data.recognitionName
    ? 'You requested public recognition as: ' + data.recognitionName + '.'
    : 'Your donation will remain private from public recognition.';
  var subject = 'Thank you for supporting the 2027 CSM Chad Miller Memorial Tournament';
  var plain = 'Hi ' + data.donorName + ',\n\nThank you for your contribution of ' + formatCurrency(data.donationAmount) + ' to the 2027 CSM Chad Miller Memorial Golf Tournament, benefiting The Honor Foundation.\n\nYour donation supports next year’s tournament at Kings Grant in Fayetteville, NC. The date will be announced when ready. You acknowledged this purpose at checkout. This donation does not purchase a sponsorship or reserve a player spot.\n\n' + recognition + '\n\nThank you from The Honor Foundation and Chad’s family.\n\nQuestions: chadmillermemorial@gmail.com';
  var html = emailWrapper('<h2>Thank you for supporting 2027.</h2><p>Hi ' + escapeHtml(data.donorName) + ',</p><p>Your contribution of <strong>' + formatCurrency(data.donationAmount) + '</strong> supports the <strong>2027 CSM Chad Miller Memorial Golf Tournament</strong> at Kings Grant in Fayetteville, NC, benefiting The Honor Foundation.</p><p>The date will be announced when ready. You acknowledged this purpose at checkout. This donation does not purchase a sponsorship or reserve a player spot.</p><p>' + escapeHtml(recognition) + '</p><p>Thank you from The Honor Foundation and Chad’s family.</p><p>Questions: chadmillermemorial@gmail.com</p>').replace('Southern Pines, North Carolina','Kings Grant · Fayetteville, North Carolina');
  sendConfirmationEmail('donation2027',data.stripeSessionId,data.email,subject,plain,html);
}
function save2027DonationRefund(data) {
  requireSponsorCapacityInternalKey_(data);
  if (data.eventYear !== 2027) throw new Error('Invalid donation refund year.');
  assertStripeRefundActive_(data);
  if (String(data.stripeRefundStatus || '').toLowerCase() !== 'succeeded') throw new Error('The donation refund is still processing. Recheck its Stripe status before recording it as refunded.');
  var sessionId = inquiry2027Text_(data.stripeSessionId,'Stripe session',255,true);
  var refundId = inquiry2027Text_(data.refundId,'refund reference',255,true);
  var refundCents = Number(data.refundAmountCents);
  var feeCents = Number(data.processingFeeCents);
  var refundedAt = new Date(data.refundDate);
  if (!/^re_[A-Za-z0-9_]+$/.test(refundId) || !Number.isSafeInteger(refundCents) || refundCents<=0 || !Number.isSafeInteger(feeCents) || feeCents<0 || isNaN(refundedAt.getTime())) throw new Error('Invalid donation refund details.');
  // This web app executes as its owner. All 2027 writers share this owner
  // lock, separate from the script lock held by legacy dashboard jobs.
  var lock = LockService.getUserLock();
  lock.waitLock(10000);
  try {
    var sheet = donation2027Sheet_();
    var row = donation2027FindRow_(sheet,sessionId);
    if (!row) throw new Error('The 2027 donation payment could not be found.');
    var old = sheet.getRange(row,1,1,17).getValues()[0];
    if (old[15]) {
      if (old[15] !== refundId || Math.round(Number(old[12])*100)!==refundCents || Math.round(Number(old[13])*100)!==feeCents) throw new Error('A different refund is already recorded.');
      return jsonResponse({ok:true,refunded:true,duplicate:true,eventYear:2027,stripeSessionId:sessionId,refundId:refundId});
    }
    if (refundCents+feeCents>Math.round(Number(old[6])*100)) throw new Error('The refund exceeds the recorded donation.');
    sheet.getRange(row,12,1,5).setValues([['Refunded',refundCents/100,feeCents/100,refundedAt.toISOString(),refundId]]);
    return jsonResponse({ok:true,refunded:true,eventYear:2027,stripeSessionId:sessionId,refundId:refundId});
  } finally { lock.releaseLock(); }
}
