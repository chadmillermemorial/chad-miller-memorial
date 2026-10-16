import assert from 'node:assert/strict';
import test from 'node:test';
async function load() { try { return await import('./year-2027-inquiry.ts'); } catch(e) { if(e.code==='ERR_MODULE_NOT_FOUND') return {}; throw e; } }
const base={type:'player',name:'Test Golfer',email:'golfer@example.test',phone:'5550100000',playersInterested:'4',contactConsent:true,notes:'Interested in playing',companyWebsite:''};
test('player interest is exclusively a 2027 inquiry with no reserved capacity',async()=>{
 const {parse2027Inquiry}=await load();assert.equal(typeof parse2027Inquiry,'function');
 const inquiry=parse2027Inquiry({...base,eventYear:2026});
 assert.equal(inquiry.eventYear,2027);assert.equal(inquiry.type,'player');assert.equal(inquiry.playersInterested,4);
 assert.equal('paymentType' in inquiry,false);assert.equal('playerCount' in inquiry,false);
});
test('sponsor inquiry captures organization and optional website without a price',async()=>{
 const {parse2027Inquiry}=await load();assert.equal(typeof parse2027Inquiry,'function');
 const inquiry=parse2027Inquiry({...base,type:'sponsor',organization:'Example Company',website:'https://example.test',interest:'Grey sponsorship'});
 assert.equal(inquiry.organization,'Example Company');assert.equal(inquiry.eventYear,2027);assert.equal(inquiry.website,'https://example.test/');assert.equal('amount' in inquiry,false);
});
test('invalid inquiries cannot be submitted',async()=>{
 const {parse2027Inquiry}=await load();assert.equal(typeof parse2027Inquiry,'function');
 for(const invalid of [{email:'bad'},{contactConsent:false},{type:'paid-sponsor'},{playersInterested:'0'},{playersInterested:'2.5'},{companyWebsite:'bot'},{name:' '},{notes:'x'.repeat(2001)}])assert.throws(()=>parse2027Inquiry({...base,...invalid}));
 assert.throws(()=>parse2027Inquiry({...base,type:'sponsor',organization:''}));
 assert.throws(()=>parse2027Inquiry({...base,type:'sponsor',organization:'Company',website:'javascript:alert(1)'}));
});
