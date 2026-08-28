# Admin Refund System Design

Date: 2026-08-27

## Goal

Give the tournament organizer a simple, private `/admin` workflow for issuing refunds without terminal commands or manually editing Stripe/Google Sheets.

The admin system will support donation refunds, sponsor refunds, and player refunds, including refunds after the public self-service deadline. All refunds will withhold the applicable original Stripe processing fee so the tournament does not absorb payment-processing costs.

## Existing System to Preserve

The current player self-service withdrawal flow remains in place for normal player withdrawals before the published deadline. It already validates Stripe payment state, protects against duplicate refunds, allocates processing fees proportionally, and updates Google Sheets.

The new admin flow supplements that system. It does not replace or weaken the public player withdrawal rules.

## Admin Authentication

- `/admin` presents a password screen when not authenticated.
- One private tournament-admin password is stored only in Vercel.
- Successful authentication creates a secure server-side session cookie.
- Refund endpoints independently verify the admin session.
- The admin page is not linked in public navigation.

## Admin Interface

The `/admin` page will have three sections:

- Players
- Sponsors
- Donations

The organizer can search by name, email, company, or Stripe Checkout Session ID.

Before any refund, the page shows:

- original payment amount
- Stripe processing fee being retained
- refund amount going back to the customer
- tournament records/capacity/recognition that will change

A separate confirmation action is required before issuing the refund.

## Data Sources

Stripe remains the payment source of truth.

Google Sheets remains the tournament operational source for player, sponsor, donation, capacity, recognition, and audit status.

Refund amounts are calculated from Stripe transaction data, never from an amount supplied by the browser.

## Processing Fee Rule

The tournament does not reimburse Stripe processing fees.

For donations and sponsors:

`refund = original payment - original Stripe processing fee`

For player registrations, an individual golfer receives their registration share minus their proportional share of the original Stripe processing fee.

A full registration refund withholds the entire original Stripe processing fee.

## Donation Refund Flow

1. Admin locates the paid donation.
2. Server verifies the Stripe Checkout Session is a paid donation.
3. Existing refunds are checked to prevent duplicates.
4. Original Stripe fee is retrieved.
5. Admin reviews and confirms the calculated refund.
6. Stripe refund is created with an idempotency key.
7. Existing Apps Script donation-refund handling records the refund.
8. Donation becomes ineligible for public recognition/banner display.
9. Historical donor data remains for audit.

## Sponsor Refund Flow

1. Admin locates the paid sponsorship.
2. Server verifies the paid Stripe sponsorship.
3. Existing refunds are checked.
4. Original Stripe fee is retrieved.
5. Admin reviews refund and cleanup effects.
6. Stripe refund is created idempotently.
7. Sponsor is marked refunded/inactive in Sheets.
8. Sponsor is removed from active website, banner, signage, Blue Feature recognition where applicable, and tournament communications.
9. Included golfer capacity is released.

If the sponsor's included foursome has already been converted into player records, those sponsor-funded golfers must actually be marked withdrawn/inactive in Players and Pairings before the four spots are released.

Historical sponsor/player records are preserved rather than deleted.

## Player Admin Refund Flow

The existing public self-service withdrawal system remains unchanged.

The admin system may refund:

- one golfer
- multiple golfers
- the entire registration

The admin route may operate after the public refund deadline.

For every selected golfer:

- membership in the Stripe registration is verified
- correct gross share is calculated
- proportional Stripe fee is retained
- duplicate refund protection is enforced
- refund uses a deterministic idempotency key
- Players and Pairings are updated
- capacity is released only once

The admin route does not require the customer's withdrawal token because authorization comes from the authenticated admin session.

## Duplicate and Failure Protection

Before Stripe mutation:

- verify payment type
- verify payment is paid
- verify the selected tournament record belongs to the transaction
- inspect existing refunds
- calculate the refund from Stripe
- reject ambiguous or already-refunded states

Every refund uses a deterministic Stripe idempotency key.

If Stripe succeeds but Google Sheets synchronization fails, retrying must reuse the existing Stripe refund and update Sheets without generating another refund.

## Audit Trail

Refunded records are never deleted.

Operational records retain at minimum:

- refund status
- refund amount
- processing fee retained
- refund date
- Stripe Refund ID

Stripe refund metadata identifies the admin refund source, payment type, Checkout Session ID, and player identity when applicable.

## Error Handling

The admin interface will give clear errors for:

- payment not completed
- already refunded transaction
- record mismatch
- unavailable Stripe fee data
- failed Stripe refund
- successful Stripe refund with failed tournament-record synchronization

Ambiguous transactions fail closed rather than being refunded automatically.

## Expected Implementation Areas

- `/admin` login/dashboard
- server-side admin session/auth helper
- admin search endpoints
- refund preview endpoints
- refund execution endpoints
- shared Stripe refund/fee utilities
- reuse of existing player fee-allocation logic
- Apps Script converted sponsor golfer cleanup
- Apps Script refund persistence where required

## Testing

Before production use:

1. Build and TypeScript checks pass.
2. Incorrect admin passwords are rejected.
3. Every admin API route requires authentication.
4. Sign-out invalidates the admin session.
5. Refund previews match Stripe's original payment and fee.
6. Duplicate attempts cannot create multiple refunds.
7. Stripe-success/Sheets-failure can be retried safely.
8. Donation refunds remove recognition eligibility.
9. Sponsor refunds remove recognition and release capacity.
10. Converted sponsor golfers are withdrawn and release exactly four spots once.
11. Admin player refunds work before and after the public deadline.
12. Partial player refunds allocate Stripe fees correctly.
13. Existing public self-service withdrawal behavior remains unchanged.

Destructive testing should use Stripe test mode/sandbox where possible. No real refund will be issued without explicit authorization.

## Success Criteria

The system is complete when the organizer can open `/admin`, authenticate, find a player, sponsor, or donation, see the exact refund net of Stripe fees, confirm it, and have Stripe plus all related tournament records, capacity, and recognition update safely without terminal work or manual spreadsheet editing.
