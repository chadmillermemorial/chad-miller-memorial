export const eventStatus = { registrationOpen: false, completedYear: 2026, upcomingYear: 2027 };

export const closedMessage = 'The 2026 tournament has concluded. Registration and the waitlist are closed. 2027 registration is not open yet.';

export function registrationClosed(request: Request): Response {
  if (request.headers.get('accept')?.includes('text/html')) {
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>2026 enrollment closed</title><style>body{font-family:system-ui;max-width:640px;margin:10vh auto;padding:24px;line-height:1.7;color:#172033}a{color:#176b87}</style></head><body><h1>Thank you for an incredible inaugural tournament.</h1><p>${closedMessage}</p><p>2026 sponsorship and volunteer enrollment have also closed.</p><a href="/register">See what’s next for 2027</a></body></html>`, { status: 410, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
  return Response.json({ ok: false, closed: true, eventYear: 2026, error: closedMessage }, { status: 410, headers: { 'cache-control': 'no-store' } });
}
