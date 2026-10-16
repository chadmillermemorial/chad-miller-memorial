import assert from 'node:assert/strict';
import test from 'node:test';
import { saveInquiry2027, inquiry2027Ready, donation2027Ready } from './year-2027-service.ts';
const payload={submissionId:'INQ-2027-11111111-1111-4111-8111-111111111111',type:'player',eventYear:2027,name:'Test Golfer'};
async function withService(handler,run){
 const fetch=globalThis.fetch,key=process.env.GOOGLE_SCRIPT_INTERNAL_KEY;
 globalThis.fetch=handler;process.env.GOOGLE_SCRIPT_INTERNAL_KEY='test-key';
 try{await run();}finally{globalThis.fetch=fetch;if(key===undefined)delete process.env.GOOGLE_SCRIPT_INTERNAL_KEY;else process.env.GOOGLE_SCRIPT_INTERNAL_KEY=key;}
}
test('legacy script cannot receive an inquiry POST until its capabilities are verified',async()=>{
 const calls=[];
 await withService(async(url,init)=>{calls.push(init?.method||'GET');return Response.json({ok:true,message:'Legacy registration endpoint'});},async()=>{
  assert.equal(await inquiry2027Ready(),false);
  await assert.rejects(()=>saveInquiry2027(payload),/not ready/);
 });
 assert.deepEqual(calls,['GET','GET']);
});

test('donations are gated independently until the exact year-specific schema is available',async()=>{
 for(const capabilities of [{ok:true,eventYear:2027,inquirySchema:'2027-inquiry-v1'},{ok:true,eventYear:2026,donationSchema:'2027-donation-v1'},{ok:false,eventYear:2027,donationSchema:'2027-donation-v1'}]) await withService(async()=>Response.json(capabilities),async()=>assert.equal(await donation2027Ready(),false));
 await withService(async()=>Response.json({ok:true,eventYear:2027,donationSchema:'2027-donation-v1'}),async()=>assert.equal(await donation2027Ready(),true));
});
test('only an exact storage acknowledgment reports a successful inquiry',async()=>{
 let stored;
 await withService(async(url,init)=>{
  if(init?.method!=='POST')return Response.json({ok:true,eventYear:2027,inquirySchema:'2027-inquiry-v1'});
  stored=JSON.parse(init.body);
  return Response.json({ok:true,eventYear:2027,inquiryType:'player',submissionId:payload.submissionId});
 },async()=>{assert.equal((await saveInquiry2027(payload)).ok,true);});
 assert.equal(stored.action,'save2027Inquiry');assert.equal(stored.eventYear,2027);assert.equal(stored.internalKey,'test-key');
 await withService(async(url,init)=>Response.json(init?.method==='POST'?{ok:true}:{ok:true,eventYear:2027,inquirySchema:'2027-inquiry-v1'}),async()=>{await assert.rejects(()=>saveInquiry2027(payload),/not acknowledged/);});
});
