# In-Kind Donations Design

Date: 2026-09-01

## Purpose

Add a public non-monetary donation workflow to the CSM Chad Miller Memorial Golf Tournament website while leaving the existing monetary Stripe donation workflow unchanged.

Every in-kind contribution is **submitted for review**. Submission does not constitute acceptance; the tournament team accepts or declines contributions from the Google workbook.

## Goals

- Give donors a clear choice between monetary and in-kind support.
- Keep the existing Stripe monetary donation path unchanged.
- Bypass Stripe completely for in-kind contributions.
- Use the tournament management workbook as the authoritative record and review interface.
- Allow optional supporting-file uploads.
- Allow donors to describe unusual contributions in writing even when no preset fits.
- Send automatic donor and tournament-team notifications.
- Support optional public recognition for accepted in-kind donors.
- Keep estimated retail value separate from actual cash revenue.

## Non-Goals

- No new admin dashboard.
- No Stripe products, Checkout Sessions, PaymentIntents, or payments for in-kind contributions.
- No automatic tax-receipt or tax-deductibility determination.
- No automatic posting of stated retail value as Financials income.
- No donor self-service editing after submission in version 1.

## Architecture

Use the existing application pattern:

**Website → Vercel / Next.js API → Google Apps Script → Google Sheets / Drive / Gmail**

This avoids adding Google service-account or OAuth credentials to Vercel and keeps Apps Script as the controlled bridge into tournament Google resources.

### Monetary donations

Existing flow remains unchanged:

`/register/donate` → `/api/donation-checkout` → Stripe Checkout → Stripe webhook → Google workbook.

### In-kind donations

New flow:

`/register/donate` → choose **In-Kind Donation** → form → `/api/in-kind-donation` → Apps Script → workbook / Drive / Gmail → confirmation page.

Stripe is never called by this path.

## Public User Experience

The Donate experience begins with two clear choices:

1. **Monetary Donation** — current Stripe form.
2. **In-Kind Donation** — new item/service contribution form.

The monetary implementation should not be rewritten beyond the minimum UI needed to expose the choice.

### In-kind form fields

Required unless marked optional:

- Donor / Business
- Contact Name
- Email
- Phone
- Contribution Type
- Contribution Type Write-In when `Other` is selected
- Intended Use
- Intended Use Write-In when `Other` is selected
- Item / Service Name
- Description
- Estimated Retail Value
- Quantity
- Restrictions / Expiration — optional
- Redemption Instructions — optional
- Website / Social — optional
- Supporting Files — optional
- Drop-Off / Pickup Plan — optional
- Public Recognition preference
- Public Recognition Name — optional; defaults to donor/business name when recognition is requested
- Notes — optional

### Contribution Type presets

- Physical Item / Merchandise
- Gift Card / Gift Certificate
- Service
- Experience
- Food / Beverage
- Event Supply / Equipment
- Other — Write In

### Intended Use presets

- Silent Auction
- Contest Prize
- Event Supply / Operations
- Food & Beverage
- Participant / Volunteer Support
- Other — Write In

These selections are helpful presets, not restrictions. The donor may use **Other / Write-In** and may fully describe the contribution in the free-text Description field. A written description is acceptable supporting detail by itself; file upload is never required merely because the contribution is unusual or does not fit a preset.

## Status Model

The workbook is the authoritative review interface.

Allowed statuses:

1. `Submitted`
2. `Under Review`
3. `Accepted`
4. `Declined`
5. `Received`
6. `Ready for Event`

A public submission always starts as `Submitted`. `Accepted` and `Declined` are mutually exclusive decision states. No separate approve/decline controls are added to the website.

## Workbook Design

Rename the existing `Silent Auction Donations` tab to **`In-Kind Donations`** and expand it in place. It currently contains only its header row, so no donation records need migration.

Canonical columns:

1. Submission ID
2. Submitted At
3. Donor / Business
4. Contact Name
5. Email
6. Phone
7. Contribution Type
8. Contribution Type Write-In
9. Intended Use
10. Intended Use Write-In
11. Item / Service Name
12. Description
13. Estimated Retail Value
14. Quantity
15. Restrictions / Expiration
16. Redemption Instructions
17. Website / Social
18. File Links
19. Drop-Off / Pickup Plan
20. Public Recognition
21. Public Recognition Name
22. Status
23. Reviewer
24. Review Date
25. Accepted / Declined Date
26. Received Date
27. Donor Notification Status
28. Attachment Status
29. Request Idempotency Key
30. Notes

Workbook controls:

- Status uses data validation with the six defined values.
- Public Recognition uses Yes/No.
- Estimated Retail Value is formatted as currency but remains informational.
- Attachment Status uses `No Attachments`, `Complete`, or `Attachment Upload Issue`.
- Donor Notification Status makes submission/review email failures visible and recoverable.
- Request Idempotency Key prevents duplicate rows from retrying the same browser submission after an ambiguous network failure.

## Submission ID

Apps Script generates the canonical ID:

`IK-2026-0001`

It is used in the workbook, Drive folder, donor emails, admin emails, logs, and future reconciliation.

ID allocation must be concurrency-safe using Apps Script locking so simultaneous submissions cannot receive the same ID.

## Google Drive Design

Rename the existing empty folder:

`Chad Miller Memorial - Silent Auction Contributions`

To:

`Chad Miller Memorial - In-Kind Contributions`

For submissions with attachments, create a subfolder:

`IK-2026-0001 - <Donor or Business Name>`

Sanitize and length-limit folder and file names.

### File rules

- Upload is optional.
- Maximum 3 files per submission.
- Maximum 10 MB per file.
- Accepted types: PDF, JPG/JPEG, PNG, DOC, DOCX.
- Reject unsupported files before forwarding them to Google.

Supporting files may include photos, gift certificates, logos, redemption documents, or written service details.

## API and Apps Script Data Flow

### 1. Browser submission

The form submits multipart form data to:

`POST /api/in-kind-donation`

The browser never receives privileged Google identifiers or credentials.

### 2. Vercel validation

The Next.js route validates required fields, email shape, positive retail value, positive integer quantity, any required `Other` write-ins, file count, file size, and file type.

The route also creates a random request idempotency key for the browser submission. Invalid submissions are not forwarded to Apps Script.

### 3. Create workbook record

Vercel calls Apps Script action `createInKindDonation` with validated metadata and the idempotency key.

Apps Script validates again, checks whether the idempotency key already exists, and:

- returns the existing Submission ID if this exact request was already created, or
- allocates a new Submission ID and writes the workbook row.

If attachments exist, Apps Script creates the submission Drive folder and returns only the server-side identifiers needed for the API route to continue.

The workbook row is the critical transaction. If it cannot be created, the donor must not see success.

### 4. Upload optional attachments

Vercel forwards each attachment separately using Apps Script action `uploadInKindDonationFile` so three 10 MB files are never packaged into one oversized request.

Each upload is tied to the canonical Submission ID.

If one attachment fails after the workbook row exists:

- preserve the submission,
- preserve successfully uploaded files,
- set Attachment Status to `Attachment Upload Issue`,
- include the warning in the internal admin alert,
- still allow the contribution submission itself to complete.

### 5. Finalize

Vercel calls Apps Script action `finalizeInKindDonation` after attachment attempts.

Apps Script confirms the row, ensures initial Status is `Submitted`, sends the donor submission confirmation, sends the internal tournament alert, updates notification status, and returns final success with the Submission ID.

Finalization is idempotent: a retry must not send duplicate donor or admin emails.

A saved workbook row is never discarded merely because an email fails. Email failure is recorded for manual follow-up.

## Email Behavior

### Submitted-for-review confirmation

Sent after the workbook row is created. It includes the Submission ID, a concise contribution summary, and this core message:

> Your contribution has been submitted for review. Submission does not constitute acceptance. The tournament team will contact you after review regarding acceptance and delivery or fulfillment.

### Internal submission alert

Send to `chadmillermemorial@gmail.com` with the Submission ID, donor/contact information, contribution type, intended use, item/service name, description, estimated value, quantity, restrictions, drop-off/pickup details, recognition preference, attachment status/file links, and reminder to review the `In-Kind Donations` tab.

### Accepted email

When workbook Status is manually changed to `Accepted`, send one acceptance email with the Submission ID, accepted contribution summary, and notice that the tournament team may follow up about delivery, pickup, redemption, or fulfillment.

### Declined email

When Status is manually changed to `Declined`, send one courteous thank-you message stating that the tournament cannot accept the proposed contribution at this time. An internal reason is not required in the email.

## Workbook Status Automation

Use an **installable Google Sheets edit trigger** in the bound Apps Script project because Gmail actions require authorization.

The handler acts only when the edited sheet is `In-Kind Donations`, the edited column is Status, the row is a valid submission, and the new status differs from the prior status.

Behavior:

- `Under Review` — populate Reviewer / Review Date as appropriate; no donor email.
- `Accepted` — populate decision date and send Accepted email once.
- `Declined` — populate decision date and send Declined email once.
- `Received` — populate Received Date; no donor email in version 1.
- `Ready for Event` — no donor email in version 1.

Status-driven emails must be idempotent. Editing the same status again must not send another Accepted/Declined email.

## Public Recognition

- Recognition is optional.
- If recognition is requested and Public Recognition Name is blank, default to Donor / Business.
- Donor identity remains private for administration when public recognition is declined.
- Acceptance and recognition are separate concepts.
- Declined contributions are not publicly recognized through this workflow.
- Only accepted contributions are eligible for downstream recognition.

## Accounting Treatment

Estimated Retail Value is planning information only and must not be posted automatically to `Financials` as Income.

Example: a donated golf package estimated at $500 creates $0 cash income when received. If it later sells at auction for $375, the event financial process records the actual $375 proceeds.

The website/workbook must not imply that the donor's stated value is a cash receipt or verified appraisal.

## Confirmation Page

A successful submission displays:

- confirmation that the proposal was received for review,
- Submission ID,
- explicit statement that it has not yet been accepted,
- expectation that the tournament team will follow up.

Do not expose Drive links, workbook links, or internal controls publicly.

## Error Handling

### Before workbook creation

If validation, Apps Script communication, authorization, or workbook persistence fails before the row exists:

- do not show success,
- do not send donor confirmation,
- return a user-safe retry/contact message.

### After workbook creation

Preserve the row. Optional attachment or email failures are flagged instead of deleting the submission.

Recoverable visible states include:

- `Attachment Upload Issue`
- submission-confirmation email failure
- admin-alert email failure
- Accepted/Declined email failure

### Duplicate protection

The request idempotency key prevents duplicate workbook rows from API retries. Submission ID remains the canonical human-facing identifier. Create, finalize, and status-email operations must all be retry-safe.

## Security and Privacy

- No Google credentials are exposed to the browser.
- No new Google service-account credentials are added to Vercel.
- Vercel communicates through the established Apps Script web app.
- Validate on both Vercel and Apps Script sides.
- Sanitize and length-limit text/file names before storage.
- Keep uploads private in tournament Google Drive.
- Do not log file contents or unnecessary donor private information.

## Migration

- Rename/expand the existing empty-header-only `Silent Auction Donations` tab rather than create a second table.
- Rename the existing empty Silent Auction Contributions Drive folder in place.
- Leave existing monetary donation records in `Donations` untouched.
- No Stripe configuration change is expected.

## Testing and Verification

Before production completion verify:

1. Monetary donation flow still opens Stripe Checkout and records successfully.
2. In-kind flow never creates a Stripe Checkout Session.
3. Required-field validation works client-side and server-side.
4. `Other` Contribution Type requires its write-in.
5. `Other` Intended Use requires its write-in.
6. Free-text descriptions work for every contribution type and can be used without attachments.
7. No-attachment submission succeeds.
8. One, two, and three valid attachments succeed.
9. A fourth attachment is rejected.
10. A file over 10 MB is rejected.
11. Unsupported file types are rejected.
12. Unique `IK-2026-####` IDs are created safely.
13. Retrying the same create request does not create a second row.
14. Drive subfolder/files are stored and linked correctly.
15. Donor receives Submitted-for-Review confirmation once.
16. Tournament inbox receives internal alert once.
17. `Accepted` sends one acceptance email.
18. Re-entering `Accepted` does not send a duplicate.
19. `Declined` sends one decline email.
20. `Received` populates Received Date.
21. Attachment failure preserves the record and flags it.
22. Email failure preserves the record and flags notification status.
23. Estimated Retail Value does not populate Financials income.
24. Recognition opt-in/default behavior works correctly.
25. Production Vercel deployment is READY after release.
26. A live end-to-end test submission is visible in the workbook and can be cleaned up afterward.

## Systems Expected to Change During Implementation

Website repository, at minimum:

- `app/register/donate/page.tsx`
- new in-kind form page/component as appropriate
- new `app/api/in-kind-donation/route.ts`
- new in-kind confirmation page/state
- validation/data-mapping tests

Google:

- bound Apps Script `Code.gs` or equivalent files
- workbook tab renamed/expanded to `In-Kind Donations`
- installable edit trigger for status-driven emails
- Drive contributions folder renamed and used for attachments

## Definition of Done

The feature is complete when a public donor can submit an in-kind contribution from the tournament website, optionally attach up to three supported files, use write-in/free-text descriptions when needed, receive a review-pending confirmation, and have the proposal appear in `In-Kind Donations` with a unique Submission ID and any Drive links; the tournament team can then change Status in the workbook and automatically send one Accepted or Declined email, all without creating or modifying a Stripe payment.