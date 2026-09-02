# In-Kind Donations Upload Plan Amendment

> This file supersedes only the file-size and attachment-transport steps in `docs/superpowers/plans/2026-09-01-in-kind-donations.md`.

**Approved limit:** maximum 3 attachments, maximum **4 MB per file**.

**Approved transport:** do not send donor metadata plus all files in one multipart request. Use the existing `/api/in-kind-donation` route in three phases:

1. `create` — JSON metadata only; validate metadata, call Apps Script `createInKindDonation`, return `submissionId`.
2. `upload` — one multipart request per attachment containing `submissionId` and exactly one file; validate the file, base64-encode it server-side, call Apps Script `uploadInKindDonationFile`.
3. `finalize` — JSON containing `submissionId`; call Apps Script `finalizeInKindDonation`, then return the confirmation URL/result.

The public in-kind form performs the phases sequentially: create record first, upload zero-to-three files one at a time, then finalize. If an optional upload fails after record creation, preserve the record, continue to finalization, and surface the attachment issue to the admin through the workbook/notification status.

Tests must prove the 4 MB limit and the create → upload(s) → finalize contract before production code is added.
