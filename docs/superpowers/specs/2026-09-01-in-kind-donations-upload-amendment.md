# In-Kind Donations Upload Design Amendment

Date: 2026-09-01

This amendment is approved by the user and supersedes only the attachment transport and file-size portions of `docs/superpowers/specs/2026-09-01-in-kind-donations-design.md`.

## Reason

Vercel Functions enforce a request-body ceiling that makes the originally approved 10 MB-per-file multipart submission unsafe. The feature will therefore keep the existing architecture and Google Drive destination while reducing the per-file limit and sending attachments separately.

## Approved Changes

- Maximum attachment size is **4 MB per file** instead of 10 MB.
- Maximum attachment count remains **3 files per submission**.
- Accepted extensions remain PDF, JPG/JPEG, PNG, DOC, DOCX.
- Attachments remain optional; a written description alone is acceptable.
- The donor metadata is submitted first and the canonical workbook record is created before any file upload.
- Each attachment is then uploaded in its own request through the existing Next.js/Vercel API route and forwarded to Apps Script/Google Drive.
- After all attachment attempts are complete, the browser requests finalization and the donor/admin notification flow runs.
- A failed optional attachment must not delete a successfully created workbook record.
- No Vercel Blob store, Google service account, OAuth credential, or new external storage service will be introduced.

All other requirements in the approved design remain unchanged.
