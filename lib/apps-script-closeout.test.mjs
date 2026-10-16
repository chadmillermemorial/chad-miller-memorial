import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

function fixture() {
  const ctx = { ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ setMimeType() { return JSON.parse(s); } }) } };
  vm.runInNewContext(fs.readFileSync('apps-script/Code.gs', 'utf8'), ctx);
  const called = [];
  for (const name of ['attachPlayerCheckout','getPlayerCapacityHold','reserveCapacity','reserveSponsorCapacity','validateWaitlistOffer','saveVolunteerRegistration','saveWaitlistRegistration','createInKindDonation','uploadInKindDonationFile','finalizeInKindDonation','savePaidRegistration','savePaidSponsor','savePaidDonation','releaseCapacity','releaseSponsorCapacity','saveSponsorRefund','saveDonationRefund','savePlayerWithdrawal','getSponsorFulfillment','saveSponsorFulfillment']) {
    ctx[name] = () => { called.push(name); return { ok: true, handler: name }; };
  }
  ctx.requireSponsorCapacityInternalKey_ = () => {};
  ctx.get2027Capabilities = () => ({ ok:true, eventYear:2027, inquirySchema:'2027-inquiry-v1' });
  ctx.save2027Inquiry = () => ({ ok:true, eventYear:2027, handler:'save2027Inquiry' });
  ctx.save2027Donation = () => ({ok:true,eventYear:2027,handler:'save2027Donation'});
  ctx.save2027DonationRefund = () => ({ok:true,eventYear:2027,handler:'save2027DonationRefund'});
  return { ctx, called, post: data => ctx.doPost({ postData: { contents: JSON.stringify(data) } }) };
}

test('the complete replacement parses and routes 2027 inquiries before legacy registration', () => {
  const h = fixture();
  assert.equal(h.ctx.doGet({parameter:{action:'get2027Capabilities'}}).inquirySchema,'2027-inquiry-v1');
  assert.equal(h.post({action:'save2027Inquiry',eventYear:2027}).handler,'save2027Inquiry');
  assert.equal(h.post({action:'save2027Donation',eventYear:2027}).handler,'save2027Donation');
  assert.equal(h.post({action:'donationRefund',eventYear:2027}).handler,'save2027DonationRefund');
  assert.deepEqual(h.called,[]);
});

test('direct Apps Script requests cannot reopen any 2026 enrollment path', () => {
  const h = fixture();
  for (const action of ['attachPlayerCheckout','getPlayerCapacityHold','reserveCapacity','reserveSponsorCapacity','validateWaitlistOffer','volunteerRegistration','waitlistRegistration','createInKindDonation','uploadInKindDonationFile','finalizeInKindDonation']) {
    const result=h.post({action});
    assert.equal(result.ok,false,action);
    assert.equal(result.registrationClosed,true,action);
  }
  assert.deepEqual(h.called,[]);
});

test('historical settlements, refunds and fulfillment keep their existing handlers', () => {
  const h = fixture();
  for (const [data,name] of [
    [{registrationId:'cs_historical'},'savePaidRegistration'],
    [{paymentType:'sponsorship'},'savePaidSponsor'],
    [{paymentType:'donation'},'savePaidDonation'],
    ...['releaseCapacity','releaseSponsorCapacity','sponsorRefund','donationRefund','playerWithdrawal','getSponsorFulfillment','saveSponsorFulfillment'].map(action=>[{action},({sponsorRefund:'saveSponsorRefund',donationRefund:'saveDonationRefund',playerWithdrawal:'savePlayerWithdrawal'})[action]||action]),
  ]) assert.equal(h.post(data).handler,name);
});

test('unknown actions and explicit future years never fall into 2026 payment storage', () => {
  const h = fixture();
  for (const data of [{action:'typo'},{action:'typo',paymentType:'donation'},{eventYear:2027,paymentType:'donation'},{eventYear:'2027',registrationId:'cs_future'},{paymentType:'unknown'}]) assert.equal(h.post(data).ok,false);
  assert.deepEqual(h.called,[]);
});

test('malformed requests return a failure without executing a handler', () => {
  const h=fixture();
  for (const contents of ['{','null','[]','1']) assert.equal(h.ctx.doPost({postData:{contents}}).ok,false);
  assert.deepEqual(h.called,[]);
});
