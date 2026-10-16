import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { parseDonation2027 } from '@/lib/donation-2027';
import { donation2027Ready } from '@/lib/year-2027-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get('origin') && request.headers.get('origin') !== origin) return NextResponse.json({ok:false,error:'Please submit from the tournament website.'},{status:403});
  let parsed: ReturnType<typeof parseDonation2027>;
  let attemptId = "";
  try { const form = await request.formData(); parsed = parseDonation2027(form); attemptId = String(form.get("checkoutAttemptId") || ""); if (attemptId && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(attemptId)) throw new Error("Please reload the donation form."); }
  catch (error) { return NextResponse.json({ok:false,error:error instanceof Error ? error.message : 'Please check your donation details.'},{status:400}); }
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !await donation2027Ready()) return NextResponse.json({ok:false,error:'2027 donations are temporarily unavailable. Please try again shortly.'},{status:503});
    const stripe = new Stripe(key);
    const {amountCents, metadata} = parsed;
    const session = await stripe.checkout.sessions.create({
      mode:'payment', customer_email:metadata.email,
      line_items:[{price_data:{currency:'usd',product_data:{name:'2027 CSM Chad Miller Memorial Donation',description:'Supports the 2027 tournament at Kings Grant, Fayetteville, NC. Does not reserve players or purchase a sponsorship.'},unit_amount:amountCents},quantity:1}],
      metadata, payment_intent_data:{metadata},
      success_url:`${origin}/register/donate/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${origin}/register/donate`,
    }, attemptId ? {idempotencyKey:`donation-2027-${attemptId}`} : undefined);
    if (!session.url) throw new Error('Missing checkout URL');
    if (request.headers.get('accept')?.includes('application/json')) return NextResponse.json({ok:true,url:session.url});
    return NextResponse.redirect(session.url,303);
  } catch {
    console.error('2027 donation checkout could not be created.');
    return NextResponse.json({ok:false,error:'Secure checkout is temporarily unavailable. Please try again.'},{status:503});
  }
}
