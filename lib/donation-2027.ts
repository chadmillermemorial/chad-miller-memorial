export const donation2027Acknowledgment = 'I understand that this donation supports the 2027 CSM Chad Miller Memorial Golf Tournament at Kings Grant in Fayetteville, NC. It does not purchase a sponsorship or reserve a player spot.';

export function parseDonation2027(form: FormData) {
  const text = (key: string, max: number, required = false) => {
    const value = String(form.get(key) || '').trim();
    if ((required && !value) || value.length > max) throw new Error(`Please check ${key === 'donorName' ? 'your name' : key}.`);
    return value;
  };
  if (form.get('donation2027Acknowledgment') !== 'on') throw new Error('Please acknowledge that your donation supports the 2027 tournament.');
  const donorName = text('donorName', 120, true);
  const email = text('email', 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  const phone = text('phone', 40, true);
  const amount = Number(form.get('donationAmount'));
  const amountCents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(amountCents) || amountCents < 100 || amountCents > 99999999) throw new Error('Donation amount must be between $1 and $999,999.99.');
  const anonymous = form.get('anonymous') === 'on';
  const recognition = !anonymous && form.get('publicRecognition') === 'on';
  return { amountCents, metadata: {
    paymentType: 'donation', eventYear: '2027', donation2027Acknowledgment: 'Yes',
    donorName, email, phone, registeredPlayer: 'No', anonymous: anonymous ? 'Yes' : 'No',
    publicRecognition: recognition ? 'Yes' : 'No',
    publicRecognitionName: recognition ? text('publicRecognitionName', 120) || donorName : '',
    notes: text('notes', 450),
  } };
}

export function donationConfirmationState(session: { payment_status?: string | null; metadata?: Record<string, string> | null } | null) {
  if (!session || session.metadata?.paymentType !== 'donation') return 'unverified';
  const year = session.metadata.eventYear || '2026';
  if (year !== '2026' && year !== '2027') return 'unverified';
  if (session.payment_status !== 'paid') return 'pending';
  return year === '2027' ? 'paid2027' : 'paid2026';
}
