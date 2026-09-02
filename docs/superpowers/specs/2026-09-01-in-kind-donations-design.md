# In-Kind Donations Design

Date: 2026-09-01

## Purpose

Add a public, non-monetary donation workflow to the CSM Chad Miller Memorial Golf Tournament website while leaving the existing monetary Stripe donation workflow unchanged.

The system will accept proposed donations of items, services, experiences, gift certificates, contest prizes, event supplies, food/beverage support, merchandise, and other non-cash contributions. Every in-kind contribution is **submitted for review** and is not considered accepted until the tournament team changes its status in the management workbook.

## Goals

- Give donors a clear website path for either a monetary or in-kind contribution.
- Keep monetary donations on the existing Stripe Checkout path with no behavior change.
- Bypass Stripe completely for in-kind contributions.
- Store in-kind submissions in the tournament management workbook as the authoritative record.
- Allow optional supporting-file uploads.
- Send automatic donor and tournament-team notifications.
- Keep acceptance/decline decisions in the Google workbook rather than adding another admin dashboard.
- Support optional public recognition for in-kind donors.
- Keep stated retail value separate from actual cash revenue.

## Non-Goals

- No new public or private admin dashboard.
- No Stripe products, payments, PaymentIntents, or Checkout Sessions for in-kind contributions.
- No automatic tax-receipt or tax-deductibility determination.
- No automatic accounting of stated retail value as cash income.
- No donor self-service editing after submission in the first version.

## Architecture

Use the existing application pattern:

**Website → Vercel/Next.js API → Google Apps Script → Google Sheets / Drive / Gmail**

This avoids adding Google service-account or OAuth credentials to Vercel and keeps the existing Google Apps Script web app as the controlled bridge into tournament Google resources.

### Monetary donations

The current flow remains unchanged:

`/register/donate` → `/api/donation-checkout` → Stripe Checkout → Stripe webhook → Google workbook.

### In-kind donations

The new flow is:

`/register/donate` → choose **In-Kind Donation** → complete form → `/api/in-kind-donation` → Apps Script → workbook / Drive / Gmail → confirmation page.

Stripe is not called anywhere in this path.

## Public User Experience

### Donation choice

The Donate experience will begin with two clear options:

1. **Monetary Donation** — continue into the current monetary donation form.
2. **In-Kind Donation** — open the new item/service contribution form.

The monetary form and its current Stripe behavior should not be rewritten beyond the minimum UI needed to expose this choice.

### In-kind form fields

Required unless explicitly marked optional:

- Donor / Business
- Contact Name
- Email
- Phone
- Contribution Type
- Contribution Type Write-In, when `Other` is selected
- Intended Use
- Intended Use Write-In, when `Other` is selected
- Item / Service Name
- Description
- Estimated Retail Value
- Quantity
- Restrictions / Expiration (optional)
- Redemption Instructions (optional)
- Website / Social (optional)
- Supporting Files (optional)
- Drop-Off / Pickup Plan (optional)
- Public Recognition preference
- Public Recognition Name (optional; defaults to donor/business name when recognition is requested)
- Notes (optional)

### Contribution Type choices

Provide useful presets without restricting the donor:

- Physical Item / Merchandise
- Gift Card / Gift Certificate
- Service
- Experience
- Food / Beverage
- Event Supply / Equipment
- Other — Write In

### Intended Use choices

Provide useful presets without restricting the tournament team or donor:

- Silent Auction
- Contest Prize
- Event Supply / Operations
- Food & Beverage
- Participant / Volunteer Support
- Other — Write In

The free-text Description field remains available regardless of preset selections. A donor may fully explain an unusual contribution in writing even when no preset category fits cleanly.

## Submission Status Model

The workbook is the authoritative review interface.

Status values:

1. `Submitted`
2. `Under Review`
3. `Accepted`
4. `Declined`
5. `Received`
6. `Ready for Event`

`Accepted` and `Declined` are mutually exclusive decision states.

A public submission always begins as `Submitted`.

Changing the workbook status is the authoritative action. No separate approve/decline control will be added to the website or admin site.

## Workbook Design

Rename the existing `Silent Auction Donations` sheet to **`In-Kind Donations`** and retain its existing useful columns while expanding the schema.

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
29. Notes

### Workbook controls

- Status uses data validation for the six defined statuses.
- Public Recognition uses a clear Yes/No value.
- Estimated Retail Value is formatted as currency but is informational, not recognized revenue.
- File Links may contain one or more Drive links associated with the submission.
- Attachment Status defaults to `No Attachments` or `Complete` and may be set to `Attachment Upload Issue` when one or more optional files fail after the record itself is created.
- Donor Notification Status records submission/review notification state so failures are visible and recoverable.

## Submission Identifiers

Apps Script generates the canonical ID in the format:

`IK-2026-0001`

The ID is unique within the workbook and is used in:

- the workbook row,
- Drive subfolder name,
- donor emails,
- tournament-admin emails,
- logs/error messages,
- future reconciliation or support work.

ID creation must be concurrency-safe. Apps Script should use locking when allocating the next sequence number so simultaneous submissions cannot receive the same ID.

## Google Drive Design

Rename the existing empty folder `Chad Miller Memorial - Silent Auction Contributions` to **`Chad Miller Memorial - In-Kind Contributions`**.

For each submission with one or more supporting files, create a subfolder using:

`IK-2026-0001 - <Donor or Business Name>`

The folder name must be sanitized for safe Drive naming and length.

### File rules

- File upload is optional.
- Maximum 3 files per submission.
- Maximum 10 MB per file.
- Accepted types:
  - PDF
  - JPG / JPEG
  - PNG
  - DOC
  - DOCX
- Reject unsupported file types before forwarding them to Google.
- Sanitize file names before storage.

Supporting files may include photos, gift certificates, logos, redemption documents, or written service details.

## API and Apps Script Data Flow

### 1. Browser submission

The public form submits multipart form data to a new Next.js route:

`POST /api/in-kind-donation`

The browser never receives Google folder IDs or privileged Google data.

### 2. Vercel validation

The Next.js route validates:

- required contact fields,
- valid email shape,
- numeric positive retail value,
- positive integer quantity,
- contribution type and any required write-in value,
- intended use and any required write-in value,
- maximum file count,
- maximum file size,
- allowed file MIME/type and extension.

Invalid submissions return a user-safe validation response and are not sent to Apps Script.

### 3. Create Google record

Vercel sends the validated metadata to the existing Apps Script web app using a new explicit action such as `createInKindDonation`.

Apps Script:

- validates the request again,
- allocates the unique submission ID,
- writes the workbook row,
- creates the submission Drive folder only when attachments exist,
- returns the submission ID and an opaque server-side upload reference needed for subsequent attachment calls.

The workbook record is the critical transaction. If it cannot be created, the donor does not receive a success result.

### 4. Upload optional attachments

To avoid one oversized request, each attachment is forwarded to Apps Script separately after the record exists, using an action such as `uploadInKindDonationFile`.

Each upload is associated with the canonical Submission ID.

Apps Script saves the file to the submission folder and updates File Links / Attachment Status.

If an optional attachment fails after the workbook row has been created:

- do not delete the submission,
- mark Attachment Status as `Attachment Upload Issue`,
- preserve successfully uploaded files,
- include the warning in the tournament-team notification,
- still allow the donor submission itself to complete.

### 5. Finalize submission

After attachment attempts are complete, Vercel calls an Apps Script finalization action such as `finalizeInKindDonation`.

Apps Script:

- confirms the row exists,
- ensures initial Status is `Submitted`,
- sends the donor submission confirmation,
- sends the internal tournament notification,
- updates Donor Notification Status,
- returns final success with the Submission ID.

A saved workbook record must not be discarded merely because an email notification fails. Email failures are recorded for manual follow-up.

## Email Behavior

### Donor submission confirmation

Sent only after the workbook row has been created successfully.

The message clearly states:

- the contribution was **submitted for review**,
- submission does not constitute acceptance,
- the Submission ID,
- a concise summary of the proposed contribution,
- the tournament team will follow up regarding acceptance and delivery/fulfillment.

Core language:

> Your contribution has been submitted for review. Submission does not constitute acceptance. The tournament team will contact you after review regarding acceptance and delivery or fulfillment.

### Internal submission alert

Send to `chadmillermemorial@gmail.com` with:

- Submission ID
- donor/business
- contact information
- contribution type
- intended use
- item/service name
- description
- estimated retail value
- quantity
- restrictions/expiration
- drop-off/pickup information
- public recognition preference
- attachment status / file links
- reminder that review takes place in the `In-Kind Donations` workbook tab.

### Accepted email

When Status is manually changed to `Accepted`, send the donor an acceptance email with:

- Submission ID
- accepted contribution summary
- instruction that the tournament team may follow up regarding delivery, pickup, redemption, or fulfillment.

The status change is not reverted if email delivery fails; instead Donor Notification Status is updated to show the failure.

### Declined email

When Status is manually changed to `Declined`, send a courteous donor notification thanking them for offering support and stating that the tournament cannot accept the proposed contribution at this time.

The email does not need to disclose an internal reason unless the tournament team adds one manually.

## Workbook Status-Change Automation

Use an **installable Google Sheets edit trigger** in the bound Apps Script project because sending Gmail requires authorized services.

The handler should act only when:

- the edited sheet is `In-Kind Donations`,
- the edited column is Status,
- the row is a valid submission row,
- the new status differs from the prior value.

Behavior:

- `Under Review`: set Reviewer/Review Date when appropriate; no donor email required.
- `Accepted`: set decision date and send Accepted email once.
- `Declined`: set decision date and send Declined email once.
- `Received`: set Received Date; no donor email required in version 1.
- `Ready for Event`: no donor email required in version 1.

The trigger must be idempotent: re-editing or recalculating the same status must not send duplicate Accepted/Declined emails.

## Public Recognition

In-kind donors receive the same optional recognition concept as monetary donors.

- Recognition is optional.
- If recognition is declined, retain donor identity privately for tournament administration.
- If recognition is requested and Public Recognition Name is blank, default to Donor / Business.
- Acceptance of the contribution and public recognition are separate concepts.
- A declined contribution should not automatically appear in public recognition.
- Only accepted contributions are eligible for downstream public recognition workflows.

## Accounting and Financial Treatment

Estimated Retail Value is an operational planning value and must not be posted automatically to `Financials` as Income.

Example:

- A golf package with estimated retail value of $500 is accepted for the silent auction.
- Receipt of the package creates **$0 cash income**.
- If the package later sells for $375, the **$375 actual auction proceeds** are recorded as income through the event financial process.

The system must not imply that the donor's stated retail value is a cash receipt or independently verified appraisal.

## Confirmation Page

A successful in-kind submission redirects to a dedicated confirmation state/page showing:

- successful receipt for review,
- Submission ID,
- explicit statement that the contribution is not yet accepted,
- expectation that the tournament team will follow up.

Do not show Drive links, workbook links, or internal status controls publicly.

## Error Handling

### Before workbook creation

If validation, network communication, Apps Script authorization, or workbook persistence fails before the record is created:

- return an error,
- do not show success,
- do not send a donor confirmation,
- tell the donor to retry or contact the tournament team.

### After workbook creation

Once a workbook row exists, preserve it.

Failures involving optional attachments or email notifications are recorded in the row rather than deleting the contribution.

The internal team should be able to see and recover from:

- `Attachment Upload Issue`
- submission confirmation email failure
- admin alert email failure
- Accepted/Declined email failure

### Duplicate protection

The generated Submission ID is the canonical identifier.

Finalization and status-email actions must be idempotent so retries from Vercel or Apps Script do not create duplicate workbook rows or duplicate donor emails.

## Security and Privacy

- No Google credentials are exposed to the browser.
- No new Google service-account credentials are added to Vercel.
- Vercel continues to communicate only with the established Apps Script web app.
- Server-side validation is mandatory even when browser validation exists.
- File names and text values are sanitized/length-limited before storage.
- Uploaded files remain in the tournament Google Drive rather than being published publicly.
- Public confirmation pages reveal only the Submission ID and donor-safe summary information.
- Do not log uploaded file contents or private donor data unnecessarily.

## Migration

Because the current `Silent Auction Donations` sheet contains only its header row, rename it and expand it in place rather than creating a second competing table.

Because the current `Chad Miller Memorial - Silent Auction Contributions` Drive folder is empty, rename it in place to the broader in-kind contributions name.

Existing monetary donation records remain in the `Donations` tab and are not migrated.

## Testing and Verification

Before production completion, verify all of the following:

1. Monetary donation flow still opens Stripe Checkout and records successfully.
2. In-kind flow never creates a Stripe Checkout Session.
3. Required-field validation works client-side and server-side.
4. `Other` contribution type requires a write-in value.
5. `Other` intended use requires a write-in value.
6. Free-text descriptions work for all contribution types.
7. Submission with no attachments succeeds.
8. Submission with 1, 2, and 3 valid attachments succeeds.
9. Fourth attachment is rejected.
10. File over 10 MB is rejected.
11. Unsupported file type is rejected.
12. Workbook row is created with a unique `IK-2026-####` ID.
13. Submission-specific Drive folder/files are created correctly.
14. Donor receives Submitted-for-Review confirmation once.
15. Tournament inbox receives internal alert once.
16. Manual `Accepted` status sends one acceptance email.
17. Re-saving `Accepted` does not send a duplicate email.
18. Manual `Declined` sends one decline email.
19. `Received` populates Received Date.
20. Attachment failure preserves the submission and flags the row.
21. Email failure preserves the submission and flags notification status.
22. Estimated Retail Value does not populate Financials income.
23. Public recognition defaults and opt-out behavior work correctly.
24. Production Vercel deployment is READY after release.
25. A live non-monetary test submission is visible end-to-end in the workbook and can be cleaned up afterward.

## Files / Systems Expected to Change During Implementation

Website repository, at minimum:

- `app/register/donate/page.tsx`
- new in-kind donation form component/page as appropriate
- new `app/api/in-kind-donation/route.ts`
- new in-kind confirmation page/state
- tests for validation/data mapping where practical

Google:

- bound Apps Script `Code.gs` or equivalent project files
- tournament workbook tab renamed/expanded to `In-Kind Donations`
- installable edit trigger for status-driven emails
- Drive contributions folder renamed and used for attachments

No Stripe configuration change is expected.

## Definition of Done

The feature is complete when a member of the public can submit an in-kind contribution from the tournament website, optionally attach up to three supported files, receive a review-pending confirmation, and have the complete proposal appear in the `In-Kind Donations` workbook with a unique ID and any Drive file links; the tournament team can then change status in the workbook and automatically send one Accepted or Declined email, all without creating or modifying a Stripe payment.