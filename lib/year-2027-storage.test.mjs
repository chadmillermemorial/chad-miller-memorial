import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
function fixture() {
 const playerHeaders=['Submission ID','Submitted At','Event Year','Name','Email','Phone','Players Interested','Notes','Contact Consent','Status'];
 const sponsorHeaders=['Submission ID','Submitted At','Event Year','Organization','Contact Name','Email','Phone','Website','Interest','Notes','Contact Consent','Status'];
 const rows={ '2027 Player Interest':[playerHeaders], '2027 Sponsor Inquiries':[sponsorHeaders] };
 const touched=[];const sheet=name=>({
  getLastRow:()=>rows[name].length,
  getRange(row,col,numRows,numCols){return {getValues:()=>rows[name].slice(row-1,row-1+numRows).map(r=>r.slice(col-1,col-1+numCols))};},
  appendRow(row){rows[name].push(row.map(x=>typeof x==='string' && /^'[=+\-@]/.test(x)?x.slice(1):x));touched.push(name);},
 });
 const ctx={JSON,Date,requireSponsorCapacityInternalKey_(d){if(d.internalKey!=='test-key')throw new Error('Unauthorized');},jsonResponse:d=>d,LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:name=>{assert.ok(name in rows,'2026 sheets must not be accessed');return sheet(name);}})}};
 const path='apps-script/Year2027Inquiries.gs';
 if(fs.existsSync(path))vm.runInNewContext(fs.readFileSync(path,'utf8'),ctx);
 return {ctx,rows,touched};
}
const payload={action:'save2027Inquiry',internalKey:'test-key',submissionId:'INQ-2027-11111111-1111-4111-8111-111111111111',eventYear:2027,type:'player',name:'Test Golfer',email:'test@example.test',phone:'5550100000',playersInterested:4,notes:'Please contact me',contactConsent:true};
test('2027 storage is isolated and duplicate retries create only one record',()=>{
 const h=fixture();assert.equal(typeof h.ctx.save2027Inquiry,'function');
 const a=h.ctx.save2027Inquiry(payload),b=h.ctx.save2027Inquiry(payload);
 assert.equal(a.ok,true);assert.equal(b.ok,true);assert.equal(b.reused,true);assert.equal(h.rows['2027 Player Interest'].length,2);assert.equal(h.rows['2027 Sponsor Inquiries'].length,1);assert.deepEqual(h.touched,['2027 Player Interest']);
});
test('sponsor inquiries never become paid sponsor or player records',()=>{
 const h=fixture();assert.equal(typeof h.ctx.save2027Inquiry,'function');
 const r=h.ctx.save2027Inquiry({...payload,type:'sponsor',organization:'Example Co',playersInterested:0,website:'https://example.test',interest:'Grey'});
 assert.equal(r.inquiryType,'sponsor');assert.equal(h.rows['2027 Sponsor Inquiries'][1][3],'Example Co');assert.equal(h.rows['2027 Player Interest'].length,1);
});
test('storage refuses invalid year, missing consent and unauthorized callers',()=>{
 const h=fixture();assert.equal(typeof h.ctx.save2027Inquiry,'function');
 for(const override of [{eventYear:2026},{internalKey:'wrong'},{contactConsent:false},{email:'bad'},{type:'other'},{name:' '},{playersInterested:0}]){
  let ok=false;try{ok=h.ctx.save2027Inquiry({...payload,...override}).ok;}catch{}
  assert.equal(ok,false);
 }
 assert.equal(h.rows['2027 Player Interest'].length,1);
});
test('sheets formula injection is stored as plain text',()=>{
 const h=fixture();assert.equal(typeof h.ctx.save2027Inquiry,'function');
 h.ctx.save2027Inquiry({...payload,name:'=IMPORTXML("https://example.test")',notes:'+SUM(1,2)'});
 assert.equal(h.rows['2027 Player Interest'][1][3], '=IMPORTXML("https://example.test")');
 const r=h.ctx.save2027Inquiry({...payload,name:'=IMPORTXML("https://example.test")',notes:'+SUM(1,2)'});assert.equal(r.reused,true);
});
