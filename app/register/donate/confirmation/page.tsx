import Link from 'next/link';
import Stripe from 'stripe';
import { donationConfirmationState } from '@/lib/donation-2027';
export const dynamic='force-dynamic';
export const metadata={title:'Donation Status',robots:{index:false,follow:false}};
export default async function DonationConfirmationPage({searchParams}:{searchParams:Promise<{session_id?:string}>}) {
 const {session_id}=await searchParams;
 let state:ReturnType<typeof donationConfirmationState>='unverified';
 if(session_id && /^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(session_id) && session_id.length<255 && process.env.STRIPE_SECRET_KEY) {
  try { const stripe=new Stripe(process.env.STRIPE_SECRET_KEY); state=donationConfirmationState(await stripe.checkout.sessions.retrieve(session_id)); }
  catch { /* Do not reveal payment or contact details for an invalid reference. */ }
 }
 const paid=state==='paid2027'||state==='paid2026';
 return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-center shadow-sm md:p-16">
  <p className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">{paid?'Payment received':state==='pending'?'Payment processing':'Donation status'}</p>
  <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">{paid?'Thank you for your support.':state==='pending'?'Your payment is still processing.':'We couldn’t verify a payment here.'}</h1>
  <p className="mt-7 text-lg leading-8 text-slate-600">{state==='paid2027'?'Your contribution supports the 2027 CSM Chad Miller Memorial Golf Tournament at Kings Grant in Fayetteville, NC, benefiting The Honor Foundation. This donation does not purchase a sponsorship or reserve a player spot.':state==='paid2026'?'Your contribution to the 2026 CSM Chad Miller Memorial Golf Tournament was received. Thank you for supporting the inaugural outing and its mission of benefiting The Honor Foundation.':state==='pending'?'We will record your contribution after Stripe confirms successful payment. Please do not submit another payment while this one is processing.':'If you completed checkout, check your Stripe payment confirmation or contact the tournament team before making another payment.'}</p>
  <p className="mt-5 leading-7 text-slate-600">{paid?'Our records update after Stripe’s payment confirmation. ':''}<a href="mailto:chadmillermemorial@gmail.com?subject=Donation%20Question" className="underline">Contact the tournament team</a> with any questions.</p>
  <Link href="/" className="mt-9 inline-flex rounded-full bg-[var(--brand-blue)] px-8 py-4 font-semibold text-white">Return Home</Link>
 </div></main>;
}
