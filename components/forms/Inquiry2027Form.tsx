'use client';
import { useRef, useState } from 'react';

const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-[var(--brand-blue)]';
export default function Inquiry2027Form({ ready, initialType = 'player' }: { ready: boolean; initialType?: 'player' | 'sponsor' }) {
  const [type, setType] = useState(initialType);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState('');
  const submissionId = useRef('');
  const submitting = useRef(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !ready) return;
    const form = new FormData(event.currentTarget);
    const fields = Object.fromEntries(form);
    if (!submissionId.current) submissionId.current = `INQ-2027-${crypto.randomUUID()}`;
    submitting.current = true; setStatus('saving'); setError('');
    try {
      const response = await fetch('/api/2027/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, submissionId: submissionId.current, contactConsent: form.get('contactConsent') === 'on' }) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Your inquiry could not be saved.');
      setStatus('saved');
    } catch (error) { setError(error instanceof Error ? error.message : 'Your inquiry could not be saved. Please try again.'); setStatus('idle'); }
    finally { submitting.current = false; }
  }
  if (status === 'saved') return <div role="status" className="rounded-3xl bg-white p-8 shadow-sm">
    <h2 className="text-3xl font-bold text-[var(--brand-navy)]">Thank you. Your 2027 inquiry is saved.</h2>
    <p className="mt-4 leading-7 text-slate-600">The tournament team will contact you when details are ready. This is an expression of interest; it does not register players, reserve a spot, or purchase a sponsorship.</p>
    <p className="mt-4 break-all text-sm text-slate-500">Reference: {submissionId.current}</p>
  </div>;
  return <form onSubmit={submit} onChange={() => { if (!submitting.current) submissionId.current = ""; }} className="rounded-3xl bg-white p-8 shadow-sm md:p-12">
    <h2 className="text-3xl font-bold text-[var(--brand-navy)]">Keep me informed about 2027</h2>
    <p className="mt-4 leading-7 text-slate-600">Choose player interest or a sponsorship inquiry. Registration and pricing are not open yet. No payment is collected.</p>
    {!ready && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-amber-900">This form is being prepared. For now, please email <a href="mailto:chadmillermemorial@gmail.com?subject=2027%20Tournament%20Inquiry" className="underline">chadmillermemorial@gmail.com</a> with your 2027 inquiry.</p>}
    <fieldset disabled={!ready || status === 'saving'} className="mt-8 space-y-6 disabled:opacity-60">
      <label className="block font-semibold">I’m interested in<select name="type" value={type} onChange={e => { setType(e.target.value === 'sponsor' ? 'sponsor' : 'player'); submissionId.current = ''; }} className={inputClass}><option value="player">Playing in 2027</option><option value="sponsor">Sponsoring in 2027</option></select></label>
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block font-semibold">Your name<input required name="name" autoComplete="name" maxLength={120} className={inputClass} /></label>
        <label className="block font-semibold">Email<input required type="email" name="email" autoComplete="email" maxLength={254} className={inputClass} /></label>
        <label className="block font-semibold">Phone (optional)<input type="tel" name="phone" autoComplete="tel" maxLength={40} className={inputClass} /></label>
        {type === 'player' && <label className="block font-semibold">Interested players<select name="playersInterested" className={inputClass}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></label>}
      </div>
      {type === 'sponsor' && <div className="space-y-6">
        <label className="block font-semibold">Organization<input required name="organization" autoComplete="organization" maxLength={180} className={inputClass} /></label>
        <label className="block font-semibold">Website (optional)<input type="url" name="website" placeholder="https://" maxLength={500} className={inputClass} /></label>
        <label className="block font-semibold">Sponsorship interest (optional)<input name="interest" maxLength={180} placeholder="Tell us how you’d like to support the tournament" className={inputClass} /></label>
      </div>}
      <label className="block font-semibold">Notes (optional)<textarea name="notes" rows={4} maxLength={2000} className={inputClass} /></label>
      <div aria-hidden="true" className="hidden"><label>Leave blank<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input required name="contactConsent" type="checkbox" className="mt-1 h-5 w-5 shrink-0" /><span>I agree to be contacted about the 2027 CSM Chad Miller Memorial tournament. I understand this inquiry does not reserve a player spot or purchase a sponsorship.</span></label>
      <button className="rounded-full bg-[var(--brand-blue)] px-7 py-4 font-semibold text-white" type="submit">{status === 'saving' ? 'Saving your inquiry…' : 'Submit 2027 Interest'}</button>
    </fieldset>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
  </form>;
}
