'use client';
import { useRef, useState } from 'react';
import { donation2027Acknowledgment } from '@/lib/donation-2027';

const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3';
export default function Donation2027Form({ready}:{ready:boolean}) {
 const [amount,setAmount]=useState('100');
 const [anonymous,setAnonymous]=useState(false);
 const [recognition,setRecognition]=useState(false);
 const [acknowledged,setAcknowledged]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const submitting=useRef(false);
 const attempt=useRef('');
 async function submit(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if(submitting.current || !ready) return;
  const data=new FormData(event.currentTarget);
  if(!attempt.current) attempt.current=crypto.randomUUID();
  data.set('checkoutAttemptId',attempt.current);
  submitting.current=true;setSaving(true);setError('');
  try {
   const response=await fetch('/api/donation-checkout',{method:'POST',headers:{Accept:'application/json'},body:data});
   const result=await response.json();
   if(!response.ok || !result.url) throw new Error(result.error || 'Secure checkout could not be opened. Please try again.');
   window.location.assign(result.url);
  } catch(error) {setError(error instanceof Error ? error.message : 'Please try again.');submitting.current=false;setSaving(false);}
 }
 return <form id="monetary-donation" onSubmit={submit} onChange={()=>{if(!submitting.current) attempt.current='';}} className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm md:p-12">
  <h2 className="text-3xl font-bold text-[var(--brand-navy)]">Make a donation for 2027</h2>
  <p className="mt-4 leading-7 text-slate-600">Your contribution supports next year’s CSM Chad Miller Memorial Golf Tournament at Kings Grant in Fayetteville, NC, benefiting The Honor Foundation. The tournament will take place on October 8, 2027.</p>
  {!ready && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-amber-900">Donations are temporarily unavailable. Please try again shortly or <a className="underline" href="mailto:chadmillermemorial@gmail.com?subject=2027%20Donation%20Question">contact the tournament team</a>.</p>}
  <fieldset disabled={!ready || saving} className="mt-8 space-y-6 disabled:opacity-60">
   <div><p className="font-semibold">Contribution amount</p><div className="mt-3 grid grid-cols-4 gap-3">{[50,100,250,500].map(preset=><button key={preset} type="button" aria-pressed={amount===String(preset)} onClick={()=>{setAmount(String(preset));attempt.current='';}} className={`rounded-xl border-2 px-3 py-4 font-bold ${amount===String(preset)?'border-[var(--brand-blue)] bg-[var(--brand-sky)]':'border-slate-200'}`}>${preset}</button>)}</div>
    <label className="mt-5 block font-semibold">Amount in US dollars<input required name="donationAmount" type="number" min="1" max="999999.99" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className={inputClass}/></label>
   </div>
   <div className="grid gap-6 md:grid-cols-2">
    <label className="block font-semibold">Name<input required name="donorName" autoComplete="name" maxLength={120} className={inputClass}/></label>
    <label className="block font-semibold">Email<input required type="email" name="email" autoComplete="email" maxLength={254} className={inputClass}/></label>
    <label className="block font-semibold">Phone<input required type="tel" name="phone" autoComplete="tel" maxLength={40} className={inputClass}/></label>
   </div>
   <div className="border-t border-slate-200 pt-6">
    <h3 className="text-xl font-bold">Public recognition</h3>
    <p className="mt-2 text-sm leading-6 text-slate-600">Recognition is optional. We retain contact information privately for donation administration.</p>
    <label className="mt-5 flex items-start gap-3"><input name="anonymous" type="checkbox" checked={anonymous} onChange={e=>{setAnonymous(e.target.checked);if(e.target.checked)setRecognition(false);}} className="mt-1 h-5 w-5 shrink-0"/><span>Keep my donation anonymous in public recognition.</span></label>
    <label className="mt-5 flex items-start gap-3"><input name="publicRecognition" type="checkbox" checked={recognition} disabled={anonymous} onChange={e=>setRecognition(e.target.checked)} className="mt-1 h-5 w-5 shrink-0"/><span>Recognize me publicly as a 2027 tournament supporter.</span></label>
    {recognition && !anonymous && <label className="mt-5 block font-semibold">Recognition name (optional)<input name="publicRecognitionName" maxLength={120} placeholder="Leave blank to use your name" className={inputClass}/></label>}
   </div>
   <label className="block font-semibold">Message / notes (optional)<textarea name="notes" maxLength={450} rows={3} className={inputClass}/></label>
   <label className="flex items-start gap-3 rounded-2xl bg-[var(--brand-sky)] p-5 leading-7"><input required name="donation2027Acknowledgment" type="checkbox" checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)} className="mt-1.5 h-5 w-5 shrink-0"/><span>{donation2027Acknowledgment}</span></label>
   <button type="submit" disabled={!acknowledged || Number(amount)<1} className="w-full rounded-full bg-[var(--brand-blue)] px-7 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving?'Opening secure checkout…':'Continue to Secure Payment'}</button>
  </fieldset>
  {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
 </form>;
}
