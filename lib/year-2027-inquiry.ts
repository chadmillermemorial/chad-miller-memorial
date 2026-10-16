export type Inquiry2027 = {
  eventYear: 2027;
  type: 'player' | 'sponsor';
  name: string;
  email: string;
  phone: string;
  organization: string;
  website: string;
  playersInterested: number;
  interest: string;
  notes: string;
  contactConsent: true;
};

function text(value: unknown, label: string, max: number, required = false): string {
  const result = typeof value === 'string' ? value.trim() : '';
  if ((required && !result) || result.length > max) throw new Error(`Please enter a valid ${label}.`);
  return result;
}

export function parse2027Inquiry(input: Record<string, unknown>): Inquiry2027 {
  if (input.companyWebsite) throw new Error('Automated submission rejected.');
  if (input.type !== 'player' && input.type !== 'sponsor') throw new Error('Please choose player interest or a sponsorship inquiry.');
  const name = text(input.name, 'name', 120, true);
  const email = text(input.email, 'email address', 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  const phone = text(input.phone, 'phone number', 40);
  if (input.contactConsent !== true) throw new Error('Please agree to be contacted about the 2027 tournament.');
  const organization = text(input.organization, 'organization name', 180, input.type === 'sponsor');
  let website = text(input.website, 'website', 500);
  if (website) {
    let url: URL;
    try { url = new URL(website); } catch { throw new Error('Please enter a full website address beginning with https://.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Please enter a valid website address.');
    website = url.href;
  }
  const playersInterested = input.type === 'player' ? Number(input.playersInterested) : 0;
  if (input.type === 'player' && (!Number.isInteger(playersInterested) || playersInterested < 1 || playersInterested > 4)) throw new Error('Please choose 1 to 4 interested players.');
  return {
    eventYear: 2027, type: input.type, name, email, phone, organization, website,
    playersInterested, interest: text(input.interest, 'sponsorship interest', 180),
    notes: text(input.notes, 'notes (up to 2,000 characters)', 2000), contactConsent: true,
  };
}
