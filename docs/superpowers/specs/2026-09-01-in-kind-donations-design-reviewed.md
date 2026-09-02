# In-Kind Donations Design — Reviewed Addendum

This addendum resolves the final design clarifications for the in-kind donation workflow:

- Structured contribution and intended-use selections are helpful presets, not restrictions.
- `Other / Write-in` is accepted for both Contribution Type and Intended Use.
- A donor's written Description is valid supporting detail by itself; file upload remains optional.
- Submission creation and finalization must be idempotent so retries cannot create duplicate rows or duplicate emails.
- The workbook remains the authoritative review interface.

The implementation plan should treat these points as part of the approved design.