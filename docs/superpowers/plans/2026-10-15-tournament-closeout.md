# Tournament Closeout Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close 2026 enrollment, celebrate the event, and prepare a separately tracked 2027 experience.
**Architecture:** Retain Next.js, Stripe, and the existing Apps Script/Sheets integration. Use a central closed-event response before any enrollment side effects. Keep historical handlers intact. Release 2027 intake only after its separate storage contract is verified.
**Tech Stack:** Next.js 16, React 19, TypeScript, Stripe, Google Sheets / Apps Script.
**Spec:** ../specs/2026-10-15-tournament-closeout.md

## Global Constraints
- Preserve all 2026 records; no email outreach or financial movements.
- 2027 registration and paid sponsorships remain closed.
- Keep Hyland imagery until registration launch; no public results or fundraising totals.

## Review Focus
- Direct old form POSTs must not reach Stripe or Apps Script.
- Historical confirmations, webhooks and refunds must continue to work.
- Legacy data without year metadata belongs to 2026.
- Interest is not registration or reserved capacity.
- Gallery must not request 1,020 originals on initial load.

### Task 1: Preserve records and close enrollment
- [x] Copy the management workbook and inspect current repository baseline.
- [x] Test JSON and browser HTML closed-event responses.
- [x] Add lib/event-lifecycle.ts and guard player, sponsor, waitlist, volunteer and in-kind POST handlers.
- [x] Replace public enrollment pages with closed-event messaging, preserving original code in git history.
- [x] Run full npm test and npm run build.

### Task 2: Public closeout
- [x] Update Hero, homepage, TournamentPreview, tournament, sponsor, register and navigation/footer copy.
- [x] Retain the existing approved sponsor list and website links.
- [x] Update metadata and social image to completed-2026 / upcoming-2027 messaging.
- [x] Verify route HTML and closed API behavior; publish a verified release.

### Task 3: Year-separated 2027 intake and donations
- [x] Verify an authenticated Apps Script update path and current source before changing its router.
- [x] Add year-specific inquiry and donation tabs without touching historical data.
- [x] Implement schema validation, idempotent storage, year filter and acknowledgment.
- [ ] Verify storage and confirmation content before exposing forms. Prepare email workflow without sending outreach.

2026-10-15 script checkpoint: `apps-script/Code.gs` is the complete replacement for the production project's Code.gs, including the helper in `Year2027Inquiries.gs`. Do not also add that helper as another live file. Production project `1_yCZJNnLlA3ZEAJPZt2WxEN3uVFtW4KTxfyHbIkTuJU5lktP3JkLoonN` deployed version 37 through the existing web-app URL. Its original Code.gs matched the supplied source exactly before editing. A separate undeployed copy exists; it was left untouched. The original source is backed up separately. All preexisting handlers after the router remain byte-for-byte unchanged. The router now closes old enrollment, routes authenticated year-specific inquiries, and refuses unknown actions and future-year data on legacy payment handlers. 119 tests pass. Live capabilities report `2027-inquiry-v1`; direct closed enrollment requests and an unauthorized inquiry were rejected. Successful inquiry storage is covered with simulated Sheets tests; public website intake remains in draft PR #8. The 2027 donation checkout, storage and receipt transition remains pending and must ship together.

### Task 4: Photos and recognition
- [ ] Obtain the current sponsor banner and complete uploaded image inventory.
- [ ] Produce optimized display assets, preserve original downloads and build paged gallery with accessible modal.
- [ ] Add 2026/2027 views, sponsor links, verified credit and removal contact.
- [ ] Check mobile layouts, network payloads, links and production deployment.

2026-10-16 checkpoint: 2027 inquiry and donation website implementation complete, with required acknowledgment, capability-gated checkout, year-tagged Stripe Session/PaymentIntent metadata, authenticated donation storage, historical-year compatibility, paid status verification, updated receipts and isolated refund recording. Pending refunds cannot be labeled complete. 139 tests pass; production build passed. Independent review found no confirmed blocker. Native Sheets validation caught numeric/date coercion despite text formatting; all string writes now use an explicit literal prefix and duplicate matching compares the original values. Native Sheets verification passed for player, sponsor and donation storage, duplicate retries, exact leading-zero/date-like/formula-like text, and captured 2027 receipt content. No email was sent and no money moved. Temporary test records and verification code were removed. The public website release is in progress. Grey sponsor follow-up remains a later, inactive workflow; no outreach is sent.
