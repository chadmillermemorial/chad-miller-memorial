import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const headers=['Stripe Session ID','Received At','Event Year','Donor Name','Email','Phone','Amount USD','2027 Acknowledgment','Anonymous','Recognition Name','Notes','Status','Refund Amount USD','Processing Fee Retained USD','Refunded At','Stripe Refund ID','Thank You Status'];
function sheetsCell(x) {if(typeof x!=='string')return x;if(x.startsWith("'"))return x.slice(1);if(/^\d+$/.test(x))return Number(x);if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(x))return 46311;return x;}
function fixture(){
 const rows=[headers.slice()],sent=new Set(),emails=[];let failEmail=false;
 const sheet={getLastRow:()=>rows.length,getRange:(r,c,n=1,m=1)=>({getValues:()=>rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+m)),setNumberFormat:format=>{assert.equal(format,'@');},setValue:v=>{rows[r-1][c-1]=v;},setValues:values=>values.forEach((row,i)=>row.forEach((v,j)=>{rows[r-1+i][c-1+j]=v;}))}),appendRow:row=>rows.push(row.map(sheetsCell))};
 const ctx={SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:name=>{assert.equal(name,'2027 Donations');return sheet;}})},LockService:{getScriptLock:()=>{throw Error('Legacy dashboard lock is busy');},getUserLock:()=>({waitLock(){},releaseLock(){}})},requireSponsorCapacityInternalKey_:data=>{if(data.internalKey!=='test-key')throw Error('Unauthorized');},jsonResponse:x=>x,inquiry2027Cell_:x=>typeof x==='string'&&/^[=+\-@]/.test(x)?"'"+x:x,inquiry2027CompareCell_:x=>typeof x==='string'&&/^'[=+\-@]/.test(x)?x.slice(1):x,inquiry2027Text_:(x,label,max,required)=>{if(typeof x!=='string'||x.trim().length>max||(required&&!x.trim()))throw Error('Invalid '+label);return x.trim();},emailAlreadySent:(_type,id)=>sent.has(id),sendConfirmationEmail:(_type,id,to,subject,plain,html)=>{if(failEmail)throw Error('mail unavailable');emails.push({to,subject,plain,html});sent.add(id);},escapeHtml:x=>String(x).replaceAll('<','&lt;'),emailWrapper:x=>x,formatCurrency:n=>'$'+n.toFixed(2),assertStripeRefundActive_:d=>{if(d.stripeRefundStatus!=='succeeded')throw Error('Refund not active');},Date,JSON};
 vm.runInNewContext(fs.readFileSync('apps-script/Year2027Inquiries.gs','utf8'),ctx);
 if(fs.existsSync('apps-script/Year2027Donations.gs'))vm.runInNewContext(fs.readFileSync('apps-script/Year2027Donations.gs','utf8'),ctx);
 return {ctx,rows,emails,setFailEmail:v=>{failEmail=v;}};
}
const payload={action:'save2027Donation',eventYear:2027,internalKey:'test-key',stripeSessionId:'cs_test_2027Donation',donorName:'Test Donor',email:'donor@example.test',phone:'5550100000',donationAmount:100.25,donation2027Acknowledgment:true,anonymous:'No',publicRecognition:'Yes',publicRecognitionName:'Test Family',notes:'For next year',receivedAt:'2026-10-15T22:30:00.000Z'};
test('paid 2027 donations and duplicate webhooks affect only the 2027 sheet',()=>{
 const h=fixture();const a=h.ctx.save2027Donation(payload),b=h.ctx.save2027Donation(payload);
 assert.equal(a.donationSaved,true);assert.equal(b.duplicate,true);assert.equal(a.eventYear,2027);assert.equal(h.rows.length,2);assert.equal(h.emails.length,1);
 assert.equal(h.rows[1][7],'Yes');assert.equal(h.rows[1][16],'Sent');
 assert.match(h.emails[0].plain,/2027/);assert.match(h.emails[0].plain,/Kings Grant/);assert.doesNotMatch(h.emails[0].plain,/Hyland|October 9|September 25/);
});
test('unauthorized, unacknowledged and invalid 2027 payments cannot write or email',()=>{
 const h=fixture();for(const delta of [{eventYear:2026},{internalKey:'wrong'},{donation2027Acknowledgment:false},{donationAmount:0},{email:'bad'},{stripeSessionId:''}])assert.throws(()=>h.ctx.save2027Donation({...payload,...delta}));assert.equal(h.rows.length,1);assert.equal(h.emails.length,0);
});
test('a duplicate session with different details cannot overwrite or email again',()=>{
 const h=fixture();h.ctx.save2027Donation(payload);assert.throws(()=>h.ctx.save2027Donation({...payload,donationAmount:200}));assert.equal(h.rows[1][6],100.25);assert.equal(h.emails.length,1);
});
test('mail failures leave one persisted row for a safe webhook retry',()=>{
 const h=fixture();h.setFailEmail(true);assert.throws(()=>h.ctx.save2027Donation(payload));assert.equal(h.rows.length,2);h.setFailEmail(false);h.ctx.save2027Donation(payload);assert.equal(h.rows.length,2);assert.equal(h.emails.length,1);
});
test('refund recording is isolated and idempotent and does not send mail',()=>{
 const h=fixture();h.ctx.save2027Donation(payload);const refund={eventYear:2027,internalKey:'test-key',stripeSessionId:payload.stripeSessionId,refundId:'re_test_2027',stripeRefundStatus:'succeeded',refundAmountCents:9700,processingFeeCents:325,refundDate:'2026-10-16T12:00:00.000Z'};
 assert.equal(h.ctx.save2027DonationRefund(refund).refunded,true);assert.equal(h.ctx.save2027DonationRefund(refund).duplicate,true);assert.equal(h.rows[1][11],'Refunded');assert.equal(h.rows[1][12],97);assert.equal(h.rows[1][15],'re_test_2027');assert.equal(h.emails.length,1);
});
test('a schema mismatch stops storage before writes',()=>{const h=fixture();h.rows[0][0]='Wrong header';assert.throws(()=>h.ctx.save2027Donation(payload));assert.equal(h.rows.length,1);});

test('a pending refund cannot mark a donation as refunded even under legacy permissive validation',()=>{
 const h=fixture();h.ctx.assertStripeRefundActive_=()=>{};h.ctx.save2027Donation(payload);
 const refund={eventYear:2027,internalKey:'test-key',stripeSessionId:payload.stripeSessionId,refundId:'re_test_pending',stripeRefundStatus:'pending',refundAmountCents:9700,processingFeeCents:325,refundDate:'2026-10-16T12:00:00.000Z'};
 assert.throws(()=>h.ctx.save2027DonationRefund(refund),/still processing/);assert.equal(h.rows[1][11],'Paid');assert.equal(h.rows[1][15],'');
 assert.equal(h.ctx.save2027DonationRefund({...refund,stripeRefundStatus:'succeeded'}).refunded,true);
});

test('donor text survives numeric and date parsing and duplicate delivery',()=>{
 const h=fixture(),data={...payload,donorName:"'quoted",phone:'0015550100000',notes:'10/16/2026'};
 h.ctx.save2027Donation(data);assert.equal(h.ctx.save2027Donation(data).duplicate,true);assert.equal(h.rows[1][3],data.donorName);assert.equal(h.rows[1][5],data.phone);assert.equal(h.rows[1][10],data.notes);
});
