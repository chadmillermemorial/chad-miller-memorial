# Admin Refund System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private `/admin` workflow that lets the tournament organizer safely find and refund player registrations, sponsorships, and donations while always retaining the original Stripe processing fee and keeping Stripe, tournament records, capacity, pairings, and recognition state synchronized.

**Architecture:** Add a small server-side admin-auth layer, a shared refund domain layer around Stripe Checkout/PaymentIntent/Charge data, protected admin search/preview/execute APIs, and a simple admin dashboard. Keep Stripe as the payment source of truth and Google Sheets/Apps Script as the operational record. Reuse the existing player withdrawal persistence path by passing the server-held Stripe withdrawal token, so the public player deadline remains unchanged while the authenticated admin route can operate after it. Extend the sponsor refund Apps Script path so a converted sponsor foursome is withdrawn from Players/Pairings before its capacity hold is released.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript, Stripe Node SDK 22.x, Google Apps Script/Google Sheets, Vercel environment variables, Vitest for new automated tests.

**Spec:** `docs/superpowers/specs/2026-08-27-admin-refund-system-design.md`

## Global Constraints

- Never issue a live Stripe refund without the organizer explicitly authorizing that specific real refund.
- Never trust a browser-supplied refund amount. Recompute payment, fee, refund, and selected-player ownership from Stripe immediately before mutation.
- The tournament never absorbs the original Stripe processing fee.
- Public player self-service withdrawal remains available under its existing deadline and token rules.
- Existing player refunds with `source=player_withdrawal` must remain recognized after adding `source=admin_player_refund`.
- Every refund mutation must be retry-safe and use deterministic Stripe idempotency keys.
- A Stripe-success/Sheets-failure retry must synchronize the existing refund instead of creating another refund.
- Ambiguous or manually altered payment state fails closed.
- Never delete historical sponsor, donor, or player rows.
- All new user-facing copy must use **CSM / Command Sergeant Major**, never SGM.
- Do not replace the live Apps Script `Code.gs` from an archived source. Before any Apps Script change, obtain the exact current live `Code.gs`, then merge into that source so the read-only capacity fix remains intact.
- Do not expose an Admin link in the public navigation.

---

## Task 1: Create an isolated implementation branch and test harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `lib/refunds.test.ts`

- [ ] Create branch `admin-refund-system` from current `main` (`9be52c0` or newer if documentation commits advanced main).
- [ ] Add Vitest as a dev dependency and add `"test": "vitest run"` plus `"test:watch": "vitest"` scripts.
- [ ] Configure Vitest for Node and the repo `@/` path alias.
- [ ] Create the first failing tests for the refund math that the existing player route already uses:
  - whole processing fee retained for a donation/sponsor refund;
  - proportional fee allocation across 1–4 players;
  - integer-cent remainder assigned deterministically to lower player numbers;
  - refund amount cannot be zero/negative.
- [ ] Run `npm test -- lib/refunds.test.ts` and verify the tests fail because `lib/refunds.ts` does not exist yet.
- [ ] Commit: `test: add refund domain test harness`

## Task 2: Extract the shared refund domain helpers without changing public behavior

**Files:**
- Create: `lib/refunds.ts`
- Modify: `app/api/player-withdrawal/route.ts`
- Modify: `app/register/player/manage/page.tsx`
- Modify: `lib/refunds.test.ts`

**Core interfaces:**

```ts
export type RefundSource =
  | "player_withdrawal"
  | "admin_player_refund"
  | "admin_donation_refund"
  | "admin_sponsor_refund";

export function getProcessingFeeShare(
  totalProcessingFeeCents: number,
  playerCount: number,
  playerNumber: number
): number;

export function isActiveRefund(refund: Stripe.Refund): boolean;

export function isPlayerRefundSource(source?: string | null): boolean;
```

- [ ] Implement the fee-allocation helper in cents and make the Task 1 tests pass.
- [ ] Add tests proving both `player_withdrawal` and `admin_player_refund` are recognized as classified player refunds, while unrelated/manual refund sources are not.
- [ ] Replace the duplicated fee helper in `app/api/player-withdrawal/route.ts` with the shared helper.
- [ ] Update the public route’s “manual/unclassified refund” check so a prior `admin_player_refund` is treated as classified rather than blocking every remaining golfer.
- [ ] Update per-golfer duplicate detection so a golfer already refunded by either public or admin flow cannot be refunded again.
- [ ] Replace corresponding duplicated refund classification/fee math in `app/register/player/manage/page.tsx` so the management page correctly displays admin-refunded golfers.
- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] Confirm no deadline/token behavior changed for public self-service.
- [ ] Commit: `refactor: share refund calculation rules`

## Task 3: Add server-side admin authentication

**Files:**
- Create: `lib/admin-auth.ts`
- Create: `lib/admin-auth.test.ts`
- Create: `app/api/admin/login/route.ts`
- Create: `app/api/admin/logout/route.ts`

**Environment variables:**
- `ADMIN_PASSWORD` — organizer-chosen private password, stored only in Vercel/local env.
- `ADMIN_SESSION_SECRET` — high-entropy signing secret, stored only in Vercel/local env.

**Session format:** signed, stateless, expiring token in cookie `cmm_admin_session`; cookie is `HttpOnly`, `SameSite=Strict`, `Secure` in production, path `/`, max age 8 hours.

- [ ] Write failing tests for constant-time password verification, valid signed token, tampered token rejection, expired token rejection, and missing secret configuration.
- [ ] Implement pure token/password helpers using Node `crypto` HMAC SHA-256 and `timingSafeEqual`.
- [ ] Implement `isAdminRequestAuthenticated()` for route handlers and `isAdminPageAuthenticated()` for the server page.
- [ ] Implement POST `/api/admin/login`: validate form password server-side, issue the cookie, redirect to `/admin`; return a generic invalid-password error without exposing configuration details.
- [ ] Implement POST `/api/admin/logout`: expire the admin cookie and redirect to `/admin`.
- [ ] Add route-level tests or pure handler-helper tests proving no admin secret is returned to the browser.
- [ ] Run `npm test`, lint, build.
- [ ] Commit: `feat: add private admin authentication`

## Task 4: Build the Stripe payment-context loader and transaction classifier

**Files:**
- Modify: `lib/refunds.ts`
- Modify: `lib/refunds.test.ts`

**Core interface:**

```ts
export type TournamentPaymentType = "player" | "sponsorship" | "donation";

export interface PaidCheckoutContext {
  paymentType: TournamentPaymentType;
  session: Stripe.Checkout.Session;
  paymentIntent: Stripe.PaymentIntent;
  charge: Stripe.Charge;
  balanceTransaction: Stripe.BalanceTransaction;
  refunds: Stripe.Refund[];
  originalAmountCents: number;
  processingFeeCents: number;
}

export async function loadPaidCheckoutContext(
  stripe: Stripe,
  sessionId: string
): Promise<PaidCheckoutContext>;
```

- [ ] Write failing tests for transaction classification:
  - `metadata.paymentType=donation` → donation;
  - `metadata.paymentType=sponsorship` → sponsorship;
  - a valid `metadata.playerCount` without those payment types → player;
  - unknown metadata → reject.
- [ ] Write failing tests for missing/unpaid Checkout Session, missing PaymentIntent, missing Charge/balance transaction, and non-positive original amount.
- [ ] Implement a loader that retrieves the Checkout Session with `payment_intent.latest_charge.balance_transaction` expanded and then lists refunds for that PaymentIntent.
- [ ] Return Stripe’s balance-transaction `fee` as the only processing-fee source used by previews/execution.
- [ ] Add a helper that detects conflicting/unclassified refunds and a helper that finds an existing deterministic admin refund for retry synchronization.
- [ ] Run tests/lint/build.
- [ ] Commit: `feat: add Stripe refund payment context`

## Task 5: Add protected admin transaction search

**Files:**
- Create: `lib/admin-refund-search.ts`
- Create: `lib/admin-refund-search.test.ts`
- Create: `app/api/admin/search/route.ts`

**Search result shape (sanitized):**

```ts
interface AdminSearchResult {
  sessionId: string;
  type: "player" | "sponsorship" | "donation";
  primaryName: string;
  email: string;
  secondaryLabel: string;
  amountCents: number;
  created: number;
}
```

- [ ] Write failing tests for matching donation donor name/email, sponsor company/contact/email, and any player name/email/team name across p1–p4 metadata.
- [ ] Implement `/api/admin/search` with authentication as the first operation.
- [ ] If query begins with `cs_`, retrieve only that session; otherwise page through at most 500 recent Checkout Sessions (`limit=100`) and filter server-side.
- [ ] Return paid/complete tournament sessions only and never return withdrawal tokens, capacity tokens, internal keys, raw Stripe objects, or unrelated metadata.
- [ ] Require a non-empty search query; cap response count (e.g. 50) and normalize case/whitespace.
- [ ] Test unauthorized requests and metadata sanitization.
- [ ] Run tests/lint/build.
- [ ] Commit: `feat: add admin payment search`

## Task 6: Add refund preview service and protected preview API

**Files:**
- Create: `lib/admin-refund-preview.ts`
- Create: `lib/admin-refund-preview.test.ts`
- Create: `app/api/admin/refund-preview/route.ts`

**Preview rules:**

Donation/sponsorship:
- refundable gross = original Checkout total;
- retained fee = original balance-transaction fee;
- refund = gross − fee;
- reject conflicting active partial/manual refund state unless it is the exact existing admin refund being synchronized.

Player:
- validate selected player numbers are unique integers within 1..playerCount;
- gross per player = original total / playerCount and must divide evenly;
- fee share = shared deterministic cent allocation;
- exclude/reject any player already refunded by public/admin source;
- reject any genuinely unclassified refund because it cannot be safely assigned to a golfer.

- [ ] Write failing preview tests for donation, sponsor, single player, multiple players, full registration, previously refunded golfer, manual refund conflict, and invalid player selection.
- [ ] Implement `buildAdminRefundPreview(context, selection)` as a pure function over a loaded Stripe context.
- [ ] Return a user-display model containing original amount, retained fee, customer refund, selected player rows where applicable, and cleanup consequences.
- [ ] Implement authenticated POST `/api/admin/refund-preview` that accepts only `sessionId` and optional `playerNumbers`; all amounts are recomputed server-side.
- [ ] Run tests/lint/build.
- [ ] Commit: `feat: add admin refund preview`

## Task 7: Add retry-safe admin refund execution

**Files:**
- Create: `lib/google-script.ts`
- Create: `lib/admin-refund-execute.ts`
- Create: `lib/admin-refund-execute.test.ts`
- Create: `app/api/admin/refund/route.ts`

**Deterministic Stripe idempotency keys:**
- Donation: `admin-refund:donation:<sessionId>`
- Sponsor: `admin-refund:sponsorship:<sessionId>`
- Player: `admin-player-refund:<sessionId>:player-<n>`

**Stripe refund metadata sources:**
- `admin_donation_refund`
- `admin_sponsor_refund`
- `admin_player_refund`

- [ ] Extract the common authenticated Google Apps Script POST helper using `GOOGLE_SCRIPT_INTERNAL_KEY`; preserve existing endpoint URL and reject non-OK Apps Script responses.
- [ ] Write mocked-Stripe tests proving the execution function recomputes preview state immediately before mutation and does not trust caller amounts.
- [ ] Write a retry test: first run creates Stripe refund then simulated Sheets failure; second run finds the existing matching Stripe refund, skips `stripe.refunds.create`, and retries only Apps Script synchronization.
- [ ] Donation execution: create/reuse refund for `originalAmount - fee`; call Apps Script `action=donationRefund` with session/refund/status/refund cents/fee cents/date/internal key.
- [ ] Sponsor execution: create/reuse refund for `originalAmount - fee`; call Apps Script `action=sponsorRefund` with equivalent audit fields/internal key.
- [ ] Player execution: for each selected player create/reuse the per-player refund; read `metadata.withdrawalToken` from Stripe server-side and call the existing `action=playerWithdrawal` with that token. This intentionally bypasses only the Next.js public deadline, not the existing Apps Script token verification.
- [ ] If a player session lacks the stored withdrawal token, fail closed before creating a new refund for that player.
- [ ] Make `/api/admin/refund` authenticate first, accept only session/player selection, and return structured success vs. `stripeRefundSucceededButSyncFailed` errors.
- [ ] Ensure the route never refunds a session whose current Stripe state no longer matches its freshly recomputed preview.
- [ ] Run tests/lint/build.
- [ ] Commit: `feat: execute admin refunds safely`

## Task 8: Build the private admin dashboard UI

**Files:**
- Create: `app/admin/page.tsx`
- Create: `app/admin/AdminDashboardClient.tsx`
- Optionally create: `components/admin/RefundPreviewCard.tsx` if the client component becomes too large.

- [ ] Unauthenticated `/admin` renders a simple CSM-branded password form posting to `/api/admin/login`.
- [ ] Authenticated view renders Players / Sponsors / Donations tabs plus search input; no public navigation link is added.
- [ ] Search calls `/api/admin/search` and displays compact result cards with name/company/team, email, amount, date, and type.
- [ ] Selecting a result calls `/api/admin/refund-preview`.
- [ ] Preview shows **Original Payment**, **Stripe Fee Retained**, **Refund to Customer**, and exact operational consequences.
- [ ] Player preview allows selecting one, multiple, or all currently refundable golfers.
- [ ] Require a second explicit confirmation click before calling `/api/admin/refund`; disable the button while submitting.
- [ ] On success, refresh preview/search state and show Stripe refund reference(s).
- [ ] On Stripe-success/Sheets-failure, show a prominent “refund sent; records need synchronization” state and a **Retry synchronization** action that reuses the existing refund.
- [ ] Add Sign Out button posting to `/api/admin/logout`.
- [ ] Verify responsive layout and existing brand styles (`Container`, navy/teal/sand/sky variables).
- [ ] Run tests/lint/build.
- [ ] Commit: `feat: add admin refund dashboard`

## Task 9: Extend the live sponsor refund Apps Script for converted foursomes

**External file:** exact current live Apps Script `Code.gs` (not the archived replacement files).

**Why this task is separate:** The archived revenue source contains `saveSponsorRefund()` and `refundSponsorCapacityHold_()`, but it predates the later read-only `getCapacity()` lock fix. The current live `Code.gs` must be used as the merge base.

**Current live-data safety fact:** As of 2026-08-27, the Capacity Holds sheet contains no paid sponsor hold in `Converted` state. Existing `Converted` holds belong to ordinary player Checkout Sessions. The only `SPONSOR-...` test hold is `Released`, and the manual “Chad Miller Family Reservation” is `Sponsor Reserved`. Therefore the converted-sponsor cleanup can be installed before it is needed by a real sponsor roster.

- [ ] Obtain/export the exact current live `Code.gs` before editing. Confirm it contains the read-only `getCapacity()`, `countCurrentActiveHoldsReadOnly_()`, and `getWaitlistPriorityStateReadOnly_()` functions; if any are absent, stop rather than replacing live code from an archive.
- [ ] Add/verify `doPost` routes for `sponsorRefund` and `donationRefund` without changing existing public actions.
- [ ] Change `refundSponsorCapacityHold_()` so it retrieves both the sponsor hold ID and its previous status before changing anything.
- [ ] For `Sponsor Reserved`, mark the hold `Refunded` and release the held player count exactly once.
- [ ] For `Converted`, call a new `refundConvertedSponsorRoster_()` before marking the hold `Refunded`.
- [ ] Implement `refundConvertedSponsorRoster_()` with **safe multi-key matching**, not fuzzy names:
  1. match Player rows whose Registration ID equals the sponsor hold ID or sponsor Stripe Session ID; OR
  2. match rows whose Notes contain the exact sponsor hold ID (a unique `SPONSOR-...` token).
  Do not match by golfer/company name alone.
- [ ] For a converted hold, require the number of active matched player rows to equal the hold’s player count, except rows already marked Refunded by the same sponsor refund ID. If the roster cannot be matched safely, throw and leave the hold unreleased so capacity is never overstated.
- [ ] Mark matched Players rows `Refunded`, append `Sponsor sponsorship refunded — <refundId>` to Notes, set refund date/refund ID, and use $0 individual refund/fee fields because the Stripe money belongs to the sponsorship transaction rather than individual golfer charges.
- [ ] For every matched Player row, call the existing pairing-withdrawal helper using that row’s actual Registration ID and Player Number so Pairings are marked Withdrawn.
- [ ] Only after roster cleanup succeeds, mark the sponsor hold `Refunded`.
- [ ] Reorder/structure `saveSponsorRefund()` so sponsor Paid/recognition/refund fields and capacity cleanup are idempotent on retry. If Stripe has refunded but Apps Script cleanup fails, a retry must complete the same refund ID without creating duplicate roster changes.
- [ ] Ensure website removal remains automatic through `Sponsors!G = No`; preserve AE:AJ “Removed — Refunded” and AL:AP refund audit fields.
- [ ] Add a non-destructive Apps Script test helper or temporary synthetic test sheet procedure for the four cases: Sponsor Reserved, Converted with 4 exact linked players, Converted with missing roster (must fail), duplicate same refund ID (must succeed idempotently).
- [ ] Deploy the Apps Script as a new web-app version only after those tests pass.
- [ ] Re-run production `/api/player-capacity` and verify the read-only capacity endpoint still returns successfully and existing counts have not changed unexpectedly.
- [ ] Commit a synchronized reference copy of the deployed `Code.gs` to the project documentation or retain the exact deployed source in the conversation/library for future merges; do not overwrite live code from an older copy.

## Task 10: Configure secrets and verify admin authorization in Vercel preview

**Vercel environment:**
- Existing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_SCRIPT_INTERNAL_KEY`
- New: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`

- [ ] Create an `ADMIN_SESSION_SECRET` with at least 32 random bytes.
- [ ] Have the organizer set the private `ADMIN_PASSWORD` without committing it to Git or exposing it in client code.
- [ ] Add both variables to Vercel Preview and Production environments; keep `.env.local` untracked.
- [ ] Confirm `.vercel-production.env` and any credential documents remain untracked and are never committed.
- [ ] Deploy the `admin-refund-system` branch to a Vercel preview.
- [ ] Verify unauthenticated `/admin` shows login only, incorrect password fails, correct password creates secure session, direct admin API requests without cookie get 401/403, and logout invalidates the session.
- [ ] Commit only code/config changes that contain no secrets.

## Task 11: End-to-end read-only verification against live payments

**No refunds in this task.**

- [ ] Search and preview the known live paid donation and confirm the preview equals Stripe original payment less Stripe’s recorded original processing fee.
- [ ] Search and preview at least one current player registration; verify golfer names/player numbers, per-player gross, fee allocation, and net refund without executing.
- [ ] If no paid sponsor exists yet, verify sponsor preview logic with unit fixtures and the next paid sponsor before first use; do not create a fake live sponsor charge just for testing.
- [ ] Verify an existing already-refunded player is recognized and cannot be refunded again.
- [ ] Confirm the public player manage page still works and displays the same public deadline.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check` with clean output.
- [ ] Commit: `test: verify admin refund workflow`

## Task 12: Destructive-path testing without risking live funds

- [ ] Run all refund execution tests with mocked Stripe/Apps Script failures to cover duplicate prevention, fee retention, partial players, full registration, donation, sponsor, and sync retry.
- [ ] If a deployable Stripe sandbox secret can be configured for the preview without exposing credentials, run one sandbox donation refund, one sandbox sponsor refund, and one multi-player partial refund through `/admin` and confirm metadata/idempotency behavior.
- [ ] If sandbox-to-Apps-Script testing would write into the live management sheet, do **not** use the live sheet; use a test Apps Script deployment/sheet or stop at mocked integration tests.
- [ ] Do not substitute a real live $1 charge/refund merely to satisfy a test checklist.
- [ ] Record any intentionally deferred sandbox-only validation in the implementation notes; production refund execution still requires explicit organizer confirmation for each real transaction.

## Task 13: Final review and production merge

- [ ] Review changed files for accidental public Admin links, client-side secrets, raw Stripe objects returned to browser, SGM text, and any browser-supplied refund amount usage.
- [ ] Verify donation/sponsor admin refunds always retain the full original Stripe processing fee.
- [ ] Verify player admin refunds retain each selected golfer’s deterministic proportional fee share.
- [ ] Verify admin player refunds can run after the public deadline while `/api/player-withdrawal` still enforces the deadline.
- [ ] Verify a prior admin player refund does not incorrectly block public withdrawal of a different golfer in the same registration.
- [ ] Verify sponsor refund never releases a `Converted` hold unless the linked roster was safely identified and withdrawn.
- [ ] Verify refunded sponsors are excluded from the public approved-sponsor endpoint and refund state remains in the sheet for audit.
- [ ] Run final `npm test`, `npm run lint`, `npm run build`, `git diff --check`.
- [ ] Review Vercel preview runtime logs for admin route errors.
- [ ] Merge `admin-refund-system` to `main` only after preview verification passes.
- [ ] Verify production `/admin` login, production read-only search/preview, public player capacity, donation page, sponsor page, and player registration page after deployment.
- [ ] Commit/merge message: `Complete admin refund system`

---

## Plan Self-Review

**Spec coverage:** Authentication, Players/Sponsors/Donations, fee withholding, preview-before-confirmation, Stripe source-of-truth calculations, post-deadline admin player refunds, duplicate protection, retry synchronization, sponsor recognition/capacity cleanup, audit preservation, failure states, and test expectations are all assigned to explicit tasks.

**Placeholder scan:** No implementation requirement is left as TBD/TODO. Sponsor converted-roster matching is explicitly fail-closed and based on unique hold/session identifiers rather than guessed names.

**Type/data consistency:** All monetary values crossing the Next.js refund domain are integer cents. Google Apps Script payload field names remain compatible with the existing refund functions (`refundAmountCents`, `processingFeeCents`, `stripeSessionId`, `refundId`). Player numbers remain 1-based integers. Stripe processing fee comes only from the original Charge balance transaction.