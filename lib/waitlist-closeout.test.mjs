import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
test('closed 2026 background and direct waitlist offers cannot access records, send mail or create triggers',()=>{
 const ctx={};
 vm.runInNewContext(fs.readFileSync('apps-script/WaitlistPriority.gs','utf8'),ctx);
 // No service stubs: touching Sheets, Gmail, locks or triggers would throw.
 for(const name of ['setupAutomaticWaitlistOffers','processAutomaticWaitlistOffers']) {
  const result=ctx[name]();assert.equal(result.closed,true);assert.equal(result.eventYear,2026);
 }
 assert.equal(ctx.issueAutomaticWaitlistOffer_(),false);
});
