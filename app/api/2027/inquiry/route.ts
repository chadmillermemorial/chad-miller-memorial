import { parse2027Inquiry } from '@/lib/year-2027-inquiry';
import { saveInquiry2027 } from '@/lib/year-2027-service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ ok: false, error: 'Please submit this form from the tournament website.' }, { status: 403 });
  let payload;
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Please check the form.');
    const submissionId = typeof body.submissionId === 'string' ? body.submissionId : '';
    if (!/^INQ-2027-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(submissionId)) throw new Error('Please reload the form and try again.');
    payload = { ...parse2027Inquiry(body), submissionId };
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Please check the form.' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  }
  try {
    await saveInquiry2027(payload);
    return Response.json({ ok: true, submissionId: payload.submissionId, eventYear: 2027 }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return Response.json({ ok: false, error: 'We could not confirm your inquiry was saved. Please retry this form or email chadmillermemorial@gmail.com. You have not registered or reserved a spot.' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
