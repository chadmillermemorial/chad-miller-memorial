import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import test from 'node:test';
import {parseDonation2027} from './donation-2027.ts';
function fixture(ready=true){
 const calls=[];const source=stripTypeScriptTypes(fs.readFileSync('app/api/donation-checkout/route.ts','utf8')).replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'');
 const api=vm.runInNewContext(source+'\n({POST})',{NextResponse:{json:(data,init)=>Response.json(data,init),redirect:(url,status)=>Response.redirect(url,status)},parseDonation2027,donation2027Ready:async()=>ready,Stripe:class{checkout={sessions:{create:async(data,options)=>{calls.push({data,options});return {url:'https://checkout.stripe.com/c/pay/test'};}}};},process:{env:{STRIPE_SECRET_KEY:'test-key'}},console,URL});
 return {...api,calls};
}
function request(overrides={},origin='https://example.test'){
 const form=new FormData();for(const [k,v] of Object.entries({donorName:'Test Donor',email:'donor@example.test',phone:'5550100000',donationAmount:'100',donation2027Acknowledgment:'on',checkoutAttemptId:'11111111-1111-4111-8111-111111111111',...overrides}))form.set(k,v);
 return new Request('https://example.test/api/donation-checkout',{method:'POST',headers:{origin,accept:'application/json'},body:form});
}
test('missing 2027 acknowledgment, invalid origin or unavailable storage never reaches Stripe',async()=>{
 for(const [req,ready,status] of [[request({donation2027Acknowledgment:''}),true,400],[request({},'https://other.test'),true,403],[request(),false,503]]){const api=fixture(ready);assert.equal((await api.POST(req)).status,status);assert.equal(api.calls.length,0);}
});
test('checkout records the designated year and acknowledgment on session and PaymentIntent',async()=>{
 const api=fixture();const res=await api.POST(request());assert.equal(res.status,200);assert.equal((await res.json()).url,'https://checkout.stripe.com/c/pay/test');
 const {data,options}=api.calls[0];assert.equal(data.metadata.eventYear,'2027');assert.equal(data.metadata.donation2027Acknowledgment,'Yes');assert.deepEqual(data.payment_intent_data.metadata,data.metadata);assert.equal(data.line_items[0].price_data.unit_amount,10000);assert.match(data.line_items[0].price_data.product_data.description,/Kings Grant/);assert.equal(options.idempotencyKey,'donation-2027-11111111-1111-4111-8111-111111111111');
});
