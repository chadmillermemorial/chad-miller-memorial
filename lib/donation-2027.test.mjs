import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDonation2027, donationConfirmationState } from './donation-2027.ts';

const fields={donorName:'Test Donor',email:'donor@example.test',phone:'5550100000',donationAmount:'100.25',donation2027Acknowledgment:'on',publicRecognition:'on',publicRecognitionName:'Test Family'};
test('new donations always identify 2027 and preserve the explicit acknowledgment',()=>{
 const r=parseDonation2027(new FormDataFrom(fields));
 assert.equal(r.amountCents,10025);assert.equal(r.metadata.eventYear,'2027');assert.equal(r.metadata.donation2027Acknowledgment,'Yes');assert.equal(r.metadata.publicRecognitionName,'Test Family');
});
class FormDataFrom extends FormData{constructor(obj){super();for(const [k,v] of Object.entries(obj))this.set(k,v);}}
test('missing consent, invalid contacts and invalid amounts cannot create checkout',()=>{
 for(const override of [{donation2027Acknowledgment:''},{email:'bad'},{donorName:''},{phone:''},{donationAmount:'NaN'},{donationAmount:'0'},{donationAmount:'1000000'},{notes:'x'.repeat(451)}]) assert.throws(()=>parseDonation2027(new FormDataFrom({...fields,...override})));
});
test('anonymous donors cannot opt into public recognition',()=>{
 const r=parseDonation2027(new FormDataFrom({...fields,anonymous:'on'}));
 assert.equal(r.metadata.publicRecognition,'No');assert.equal(r.metadata.publicRecognitionName,'');
});
test('confirmation requires a paid donation and distinguishes historical payments',()=>{
 assert.equal(donationConfirmationState(null),'unverified');
 assert.equal(donationConfirmationState({payment_status:'unpaid',metadata:{paymentType:'donation',eventYear:'2027'}}),'pending');
 assert.equal(donationConfirmationState({payment_status:'paid',metadata:{paymentType:'sponsorship'}}),'unverified');
 assert.equal(donationConfirmationState({payment_status:'paid',metadata:{paymentType:'donation',eventYear:'2027'}}),'paid2027');
 assert.equal(donationConfirmationState({payment_status:'paid',metadata:{paymentType:'donation'}}),'paid2026');
 assert.equal(donationConfirmationState({payment_status:'paid',metadata:{paymentType:'donation',eventYear:'2028'}}),'unverified');
});
