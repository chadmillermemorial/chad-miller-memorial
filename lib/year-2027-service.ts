const scriptUrl = 'https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec';

// Read-only capability check: older deployments return a generic message.
// Never POST a new action to the old router, which falls back to registration.
export async function inquiry2027Ready(): Promise<boolean> {
  if (!process.env.GOOGLE_SCRIPT_INTERNAL_KEY) return false;
  try {
    const response = await fetch(`${scriptUrl}?action=get2027Capabilities`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) return false;
    const result = await response.json();
    return result?.ok === true && result?.eventYear === 2027 && result?.inquirySchema === '2027-inquiry-v1';
  } catch { return false; }
}

export async function saveInquiry2027(payload: Record<string, unknown>) {
  const internalKey = process.env.GOOGLE_SCRIPT_INTERNAL_KEY;
  if (!internalKey || !await inquiry2027Ready()) throw new Error('2027 inquiry storage is not ready.');
  const response = await fetch(scriptUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    body: JSON.stringify({ ...payload, action: 'save2027Inquiry', eventYear: 2027, internalKey }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Inquiry storage did not respond.');
  const result = await response.json();
  if (result?.ok !== true || result?.eventYear !== 2027 || result?.submissionId !== payload.submissionId || result?.inquiryType !== payload.type) throw new Error('Inquiry save was not acknowledged.');
  return result;
}

export async function donation2027Ready(): Promise<boolean> {
  if (!process.env.GOOGLE_SCRIPT_INTERNAL_KEY) return false;
  try {
    const response = await fetch(`${scriptUrl}?action=get2027Capabilities`, { cache:'no-store', signal:AbortSignal.timeout(8000) });
    if (!response.ok) return false;
    const result = await response.json();
    return result?.ok === true && result?.eventYear === 2027 && result?.donationSchema === '2027-donation-v1';
  } catch { return false; }
}
