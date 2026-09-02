# In-Kind Donations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public in-kind donation workflow that accepts proposed non-cash contributions, optional supporting files, workbook-based review, and donor/admin notifications without changing the existing Stripe monetary donation flow.

**Architecture:** Keep the public website on Next.js/Vercel and use the existing Apps Script web app as the only bridge into Google Sheets, Drive, and Gmail. The new Vercel route validates multipart submissions, creates the canonical workbook record first, forwards optional files one at a time, finalizes notifications, and redirects to a donor-safe confirmation page. The Google workbook remains the authoritative review interface and an installable edit trigger sends one-time Accepted/Declined emails.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 5, Node built-in test runner, Vercel Functions, Google Apps Script, Google Sheets, Google Drive, Gmail.

**Spec:** `docs/superpowers/specs/2026-09-01-in-kind-donations-design.md`

## Global Constraints

- Existing monetary flow stays unchanged: `/register/donate` → `/api/donation-checkout` → Stripe Checkout → Stripe webhook → Google workbook.
- In-kind submissions must never create a Stripe Checkout Session, PaymentIntent, or Stripe product.
- Public in-kind submissions always start as `Submitted` and are not accepted until the workbook status is changed.
- Workbook status values are exactly: `Submitted`, `Under Review`, `Accepted`, `Declined`, `Received`, `Ready for Event`.
- Contribution Type and Intended Use must each support `Other — Write In`.
- Free-text Description must remain available for every contribution type; attachments are optional.
- File limit: maximum 3 files, maximum 10 MB each, accepted types PDF, JPG/JPEG, PNG, DOC, DOCX.
- Canonical submission IDs use `IK-2026-0001` format and must be concurrency-safe.
- Estimated Retail Value is informational and must never be posted automatically to `Financials` as cash income.
- Only accepted in-kind contributions are eligible for downstream public recognition.
- No new Google service-account or OAuth credentials may be added to Vercel.
- Workbook and Drive records must be preserved when optional attachment or email delivery fails after record creation.
- Accepted/Declined donor emails must be idempotent.
- The existing Apps Script endpoint remains the bridge: `https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec`.
- Management workbook ID: `178YXpJQLc5dnIziI8jiaSzx4cIGBctIAODCIr9JBwIw`.
- Existing sheet ID to migrate: `763058240` (`Silent Auction Donations`).
- Existing Drive folder ID to rename/use: `1pZ1Pb7ExUPa_fEGNhc88FAwCWtIFXwIi`.

---

## File Structure

### Create

- `lib/in-kind-donations.ts` — pure validation, normalization, constants, payload and file rules.
- `lib/in-kind-donations.test.mjs` — Node tests for all public/server validation rules.
- `app/api/in-kind-donation/route.ts` — multipart endpoint, Apps Script orchestration, attachment forwarding, finalization and redirect/error behavior.
- `app/register/donate/in-kind/page.tsx` — public in-kind donor form.
- `app/register/donate/in-kind/confirmation/page.tsx` — donor-safe submitted-for-review confirmation page.
- `apps-script/InKindDonationsPatch.gs` — source-controlled complete set of new in-kind Apps Script functions and the exact router insertion block required in deployed `Code.gs`.
- `lib/apps-script-in-kind.test.mjs` — static regression tests for Apps Script contract, status trigger, idempotency and financial separation.

### Modify

- `app/register/donate/page.tsx` — add a clear monetary vs. in-kind choice while preserving current monetary form behavior.
- Deployed bound Apps Script `Code.gs` — merge the new action routing and in-kind functions; when implementation reaches this task, first capture the current deployed full file and provide the user a complete replacement `Code.gs`, not a partial snippet.
- Google Sheet tab ID `763058240` — rename to `In-Kind Donations`, replace header schema, validation/formatting.
- Google Drive folder ID `1pZ1Pb7ExUPa_fEGNhc88FAwCWtIFXwIi` — rename to `Chad Miller Memorial - In-Kind Contributions`.

---

### Task 1: Pure In-Kind Validation and Payload Contract

**Files:**
- Create: `lib/in-kind-donations.ts`
- Create: `lib/in-kind-donations.test.mjs`

**Interfaces:**
- Produces: `CONTRIBUTION_TYPES`, `INTENDED_USES`, `MAX_IN_KIND_FILES`, `MAX_IN_KIND_FILE_BYTES`, `ALLOWED_IN_KIND_MIME_TYPES`, `parseInKindMetadata(input)`, `validateInKindFiles(files)`.
- `parseInKindMetadata(input)` returns normalized metadata with string fields trimmed, `estimatedRetailValue` as a positive number, `quantity` as a positive integer, recognition normalized to `Yes`/`No`, and write-in enforcement when the corresponding preset is `Other — Write In`.
- `validateInKindFiles(files)` returns the files unchanged when valid and throws a user-safe `Error` for count, size, MIME, or extension violations.

- [ ] **Step 1: Write failing validation tests**

```js
import assert from "node:assert/strict";
import test from "node:test";

async function loadModule() {
  return await import("./in-kind-donations.ts");
}

test("accepts presets and free-text description", async () => {
  const { parseInKindMetadata } = await loadModule();
  const value = parseInKindMetadata({
    donorBusiness: "Pinehurst Example",
    contactName: "Alex Donor",
    email: "alex@example.com",
    phone: "910-555-0100",
    contributionType: "Experience",
    contributionTypeWriteIn: "",
    intendedUse: "Silent Auction",
    intendedUseWriteIn: "",
    itemServiceName: "Golf Experience",
    description: "Round of golf for four guests.",
    estimatedRetailValue: "500",
    quantity: "1",
    restrictionsExpiration: "Expires 12/31/2027",
    redemptionInstructions: "Call to schedule.",
    websiteSocial: "https://example.com",
    dropOffPickupPlan: "Electronic certificate",
    publicRecognition: "Yes",
    publicRecognitionName: "Pinehurst Example",
    notes: "",
  });

  assert.equal(value.estimatedRetailValue, 500);
  assert.equal(value.quantity, 1);
  assert.equal(value.description, "Round of golf for four guests.");
});

test("requires contribution type write-in when Other is selected", async () => {
  const { parseInKindMetadata } = await loadModule();
  assert.throws(
    () => parseInKindMetadata({
      donorBusiness: "Donor",
      contactName: "Alex",
      email: "alex@example.com",
      phone: "9105550100",
      contributionType: "Other — Write In",
      contributionTypeWriteIn: "",
      intendedUse: "Other — Write In",
      intendedUseWriteIn: "Tournament support",
      itemServiceName: "Custom contribution",
      description: "Written description is supplied.",
      estimatedRetailValue: "25",
      quantity: "1",
      publicRecognition: "No",
    }),
    /write-in/i
  );
});

test("defaults recognition name to donor business", async () => {
  const { parseInKindMetadata } = await loadModule();
  const value = parseInKindMetadata({
    donorBusiness: "Example Family",
    contactName: "Alex",
    email: "alex@example.com",
    phone: "9105550100",
    contributionType: "Physical Item / Merchandise",
    intendedUse: "Contest Prize",
    itemServiceName: "Golf Bag",
    description: "New golf bag.",
    estimatedRetailValue: "250",
    quantity: "1",
    publicRecognition: "Yes",
    publicRecognitionName: "",
  });
  assert.equal(value.publicRecognitionName, "Example Family");
});

test("rejects invalid file count, size and type", async () => {
  const {
    validateInKindFiles,
    MAX_IN_KIND_FILE_BYTES,
  } = await loadModule();

  const makeFile = (name, type, size = 10) => ({ name, type, size });

  assert.throws(
    () => validateInKindFiles([
      makeFile("1.pdf", "application/pdf"),
      makeFile("2.pdf", "application/pdf"),
      makeFile("3.pdf", "application/pdf"),
      makeFile("4.pdf", "application/pdf"),
    ]),
    /maximum of 3/i
  );

  assert.throws(
    () => validateInKindFiles([
      makeFile("large.pdf", "application/pdf", MAX_IN_KIND_FILE_BYTES + 1),
    ]),
    /10 MB/i
  );

  assert.throws(
    () => validateInKindFiles([
      makeFile("script.exe", "application/octet-stream"),
    ]),
    /file type/i
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --experimental-strip-types --test lib/in-kind-donations.test.mjs`

Expected: FAIL because `lib/in-kind-donations.ts` does not exist.

- [ ] **Step 3: Implement the validation module**

```ts
export const CONTRIBUTION_TYPES = [
  "Physical Item / Merchandise",
  "Gift Card / Gift Certificate",
  "Service",
  "Experience",
  "Food / Beverage",
  "Event Supply / Equipment",
  "Other — Write In",
] as const;

export const INTENDED_USES = [
  "Silent Auction",
  "Contest Prize",
  "Event Supply / Operations",
  "Food & Beverage",
  "Participant / Volunteer Support",
  "Other — Write In",
] as const;

export const MAX_IN_KIND_FILES = 3;
export const MAX_IN_KIND_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IN_KIND_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "doc", "docx"]);

function text(value: unknown) {
  return String(value ?? "").trim();
}

export function parseInKindMetadata(input: Record<string, unknown>) {
  const donorBusiness = text(input.donorBusiness);
  const contactName = text(input.contactName);
  const email = text(input.email);
  const phone = text(input.phone);
  const contributionType = text(input.contributionType);
  const contributionTypeWriteIn = text(input.contributionTypeWriteIn);
  const intendedUse = text(input.intendedUse);
  const intendedUseWriteIn = text(input.intendedUseWriteIn);
  const itemServiceName = text(input.itemServiceName);
  const description = text(input.description);
  const estimatedRetailValue = Number(input.estimatedRetailValue);
  const quantity = Number(input.quantity);
  const publicRecognition = text(input.publicRecognition) === "Yes" ? "Yes" : "No";

  if (!donorBusiness || !contactName || !email || !phone || !itemServiceName || !description) {
    throw new Error("Please complete all required donor and contribution fields.");
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!CONTRIBUTION_TYPES.includes(contributionType as never)) {
    throw new Error("Please choose a valid contribution type.");
  }
  if (contributionType === "Other — Write In" && !contributionTypeWriteIn) {
    throw new Error("Please provide the contribution type write-in description.");
  }
  if (!INTENDED_USES.includes(intendedUse as never)) {
    throw new Error("Please choose a valid intended use.");
  }
  if (intendedUse === "Other — Write In" && !intendedUseWriteIn) {
    throw new Error("Please provide the intended-use write-in description.");
  }
  if (!Number.isFinite(estimatedRetailValue) || estimatedRetailValue <= 0) {
    throw new Error("Estimated retail value must be greater than $0.");
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a whole number of at least 1.");
  }

  return {
    donorBusiness,
    contactName,
    email,
    phone,
    contributionType,
    contributionTypeWriteIn,
    intendedUse,
    intendedUseWriteIn,
    itemServiceName,
    description,
    estimatedRetailValue,
    quantity,
    restrictionsExpiration: text(input.restrictionsExpiration),
    redemptionInstructions: text(input.redemptionInstructions),
    websiteSocial: text(input.websiteSocial),
    dropOffPickupPlan: text(input.dropOffPickupPlan),
    publicRecognition,
    publicRecognitionName:
      publicRecognition === "Yes"
        ? text(input.publicRecognitionName) || donorBusiness
        : "",
    notes: text(input.notes),
  };
}

export function validateInKindFiles<T extends { name: string; type: string; size: number }>(files: T[]) {
  if (files.length > MAX_IN_KIND_FILES) {
    throw new Error("A maximum of 3 supporting files may be uploaded.");
  }
  for (const file of files) {
    const extension = file.name.toLowerCase().split(".").pop() || "";
    if (file.size > MAX_IN_KIND_FILE_BYTES) {
      throw new Error("Each supporting file must be 10 MB or smaller.");
    }
    if (!ALLOWED_IN_KIND_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
      throw new Error("Unsupported supporting file type.");
    }
  }
  return files;
}
```

- [ ] **Step 4: Run the focused test and full test suite**

Run: `node --experimental-strip-types --test lib/in-kind-donations.test.mjs && npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/in-kind-donations.ts lib/in-kind-donations.test.mjs
git commit -m "feat: add in-kind donation validation"
```

---

### Task 2: Vercel In-Kind API Orchestration

**Files:**
- Create: `app/api/in-kind-donation/route.ts`
- Modify: `lib/in-kind-donations.test.mjs`

**Interfaces:**
- Consumes: `parseInKindMetadata()` and `validateInKindFiles()` from Task 1.
- Produces public endpoint `POST /api/in-kind-donation`.
- Apps Script actions sent in this exact order: `createInKindDonation`, zero-to-three `uploadInKindDonationFile`, `finalizeInKindDonation`.
- File payload fields: `submissionId`, `fileName`, `mimeType`, `base64Data`.
- Successful response redirects with HTTP 303 to `/register/donate/in-kind/confirmation?submissionId=<encoded id>`.

- [ ] **Step 1: Add failing tests for Apps Script payload helpers to the pure module**

Add exports `buildCreateInKindPayload`, `buildUploadInKindPayload`, and `buildFinalizeInKindPayload` to the test contract and assert:

```js
test("builds explicit Apps Script action payloads", async () => {
  const {
    buildCreateInKindPayload,
    buildUploadInKindPayload,
    buildFinalizeInKindPayload,
  } = await loadModule();

  const create = buildCreateInKindPayload({ donorBusiness: "Example" });
  assert.equal(create.action, "createInKindDonation");
  assert.equal(create.donorBusiness, "Example");

  const upload = buildUploadInKindPayload(
    "IK-2026-0001",
    "gift.pdf",
    "application/pdf",
    "YWJj"
  );
  assert.deepEqual(upload, {
    action: "uploadInKindDonationFile",
    submissionId: "IK-2026-0001",
    fileName: "gift.pdf",
    mimeType: "application/pdf",
    base64Data: "YWJj",
  });

  assert.deepEqual(buildFinalizeInKindPayload("IK-2026-0001"), {
    action: "finalizeInKindDonation",
    submissionId: "IK-2026-0001",
  });
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --experimental-strip-types --test lib/in-kind-donations.test.mjs`

Expected: FAIL because payload builders are missing.

- [ ] **Step 3: Add deterministic payload builders**

```ts
export function buildCreateInKindPayload(metadata: Record<string, unknown>) {
  return { action: "createInKindDonation", ...metadata };
}

export function buildUploadInKindPayload(
  submissionId: string,
  fileName: string,
  mimeType: string,
  base64Data: string
) {
  return {
    action: "uploadInKindDonationFile",
    submissionId,
    fileName,
    mimeType,
    base64Data,
  };
}

export function buildFinalizeInKindPayload(submissionId: string) {
  return { action: "finalizeInKindDonation", submissionId };
}
```

- [ ] **Step 4: Run focused tests and verify pass**

Run: `node --experimental-strip-types --test lib/in-kind-donations.test.mjs`

Expected: PASS.

- [ ] **Step 5: Implement the route using record-first semantics**

The route must:

```ts
import { NextResponse } from "next/server";
import {
  buildCreateInKindPayload,
  buildFinalizeInKindPayload,
  buildUploadInKindPayload,
  parseInKindMetadata,
  validateInKindFiles,
} from "@/lib/in-kind-donations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

async function callAppsScript(payload: Record<string, unknown>) {
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google Sheets returned status ${response.status}`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || "Google rejected the contribution.");
  return result;
}
```

Then parse `await request.formData()`, map named scalar fields into `parseInKindMetadata`, collect `File` entries from `files`, call `validateInKindFiles`, create the record, upload each file independently with `Buffer.from(await file.arrayBuffer()).toString("base64")`, record upload failures without deleting the record, call finalization once, and redirect 303 on success. If creation fails, return a donor-safe 400/500 response and never finalize.

- [ ] **Step 6: Verify route compiles without touching Stripe**

Run: `npm run lint && npm run build`

Expected: PASS; source inspection confirms `app/api/in-kind-donation/route.ts` does not import `stripe` or call `/api/donation-checkout`.

- [ ] **Step 7: Commit**

```bash
git add lib/in-kind-donations.ts lib/in-kind-donations.test.mjs app/api/in-kind-donation/route.ts
git commit -m "feat: add in-kind donation API"
```

---

### Task 3: Public Donation Choice, In-Kind Form, and Confirmation

**Files:**
- Modify: `app/register/donate/page.tsx`
- Create: `app/register/donate/in-kind/page.tsx`
- Create: `app/register/donate/in-kind/confirmation/page.tsx`

**Interfaces:**
- Monetary option remains on `/register/donate` and preserves the existing form action `/api/donation-checkout`.
- In-kind option links to `/register/donate/in-kind`.
- In-kind form posts `multipart/form-data` to `/api/in-kind-donation` and uses field names matching Task 1.
- Supporting file input uses `name="files"`, `multiple`, and accepts `.pdf,.jpg,.jpeg,.png,.doc,.docx`.

- [ ] **Step 1: Preserve the current monetary form and add the choice UI**

At the top of the existing Donate page, add two clear cards/buttons before the current Contribution Amount section:

```tsx
<div className="mb-10 grid gap-5 md:grid-cols-2">
  <a href="#monetary-donation" className="rounded-3xl border-2 border-[var(--brand-blue)] bg-white p-7">
    <h2 className="text-2xl font-bold text-[var(--brand-navy)]">Monetary Donation</h2>
    <p className="mt-3 text-slate-600">Make a secure financial contribution through Stripe.</p>
  </a>
  <a href="/register/donate/in-kind" className="rounded-3xl border-2 border-slate-200 bg-white p-7">
    <h2 className="text-2xl font-bold text-[var(--brand-navy)]">In-Kind Donation</h2>
    <p className="mt-3 text-slate-600">Offer an item, service, experience, prize, supply, or another non-cash contribution for review.</p>
  </a>
</div>
```

Add `id="monetary-donation"` to the current monetary form container. Do not alter the current Stripe form fields, recognition rules, or `/api/donation-checkout` action.

- [ ] **Step 2: Build the in-kind form with write-in behavior**

The form must include all approved fields and these exact preset values:

```ts
const contributionTypes = [
  "Physical Item / Merchandise",
  "Gift Card / Gift Certificate",
  "Service",
  "Experience",
  "Food / Beverage",
  "Event Supply / Equipment",
  "Other — Write In",
];

const intendedUses = [
  "Silent Auction",
  "Contest Prize",
  "Event Supply / Operations",
  "Food & Beverage",
  "Participant / Volunteer Support",
  "Other — Write In",
];
```

Render conditional text inputs only when `Other — Write In` is selected. Keep Description required for all donors and explicitly tell the donor that a written description is acceptable even without an attachment. Use an optional file control with helper text `Up to 3 files, 10 MB each. PDF, JPG, PNG, DOC, or DOCX.`

- [ ] **Step 3: Build donor-safe confirmation page**

Read only the `submissionId` query parameter and show:

```tsx
<h1>Contribution Submitted for Review</h1>
<p>
  Your contribution has been submitted for review. Submission does not constitute acceptance.
  The tournament team will contact you after review regarding acceptance and delivery or fulfillment.
</p>
<p>Submission ID: {submissionId}</p>
```

Do not display Drive URLs, workbook links, internal status controls, or private donor data.

- [ ] **Step 4: Run static verification**

Run: `npm test && npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 5: Manual local smoke test**

Run: `npm run dev` and verify:
- `/register/donate` still shows the existing monetary form and Stripe CTA.
- In-Kind Donation opens `/register/donate/in-kind`.
- Selecting each `Other — Write In` option reveals its write-in field.
- Description can be completed with no file selected.
- Browser blocks missing required fields.
- File picker accepts the approved extensions.

- [ ] **Step 6: Commit**

```bash
git add app/register/donate/page.tsx app/register/donate/in-kind/page.tsx app/register/donate/in-kind/confirmation/page.tsx
git commit -m "feat: add in-kind donation experience"
```

---

### Task 4: Apps Script In-Kind Persistence, Attachments, and Notification Logic

**Files:**
- Create: `apps-script/InKindDonationsPatch.gs`
- Create: `lib/apps-script-in-kind.test.mjs`
- Modify during deployment: bound Apps Script `Code.gs`

**Interfaces:**
- `createInKindDonation(data)` → JSON response `{ ok: true, submissionId }`.
- `uploadInKindDonationFile(data)` → JSON response `{ ok: true, submissionId, fileUrl }` or a controlled error.
- `finalizeInKindDonation(data)` → JSON response `{ ok: true, submissionId }` even if email delivery failed after persistence; notification status records the failure.
- `handleInKindDonationStatusEdit(e)` handles workbook status changes.
- `installInKindDonationStatusTrigger()` creates one installable spreadsheet edit trigger and removes duplicate triggers for the same handler before creation.

- [ ] **Step 1: Write static regression tests before the Apps Script patch exists**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadPatch() {
  return await readFile(new URL("../apps-script/InKindDonationsPatch.gs", import.meta.url), "utf8");
}

test("defines all three public in-kind actions", async () => {
  const source = await loadPatch();
  assert.match(source, /function createInKindDonation\(data\)/);
  assert.match(source, /function uploadInKindDonationFile\(data\)/);
  assert.match(source, /function finalizeInKindDonation\(data\)/);
});

test("uses LockService for canonical ID allocation", async () => {
  const source = await loadPatch();
  assert.match(source, /IK-2026-/);
  assert.match(source, /LockService\.getScriptLock\(\)/);
});

test("status handler sends accepted and declined emails only once", async () => {
  const source = await loadPatch();
  assert.match(source, /function handleInKindDonationStatusEdit\(e\)/);
  assert.match(source, /Accepted/);
  assert.match(source, /Declined/);
  assert.match(source, /Donor Notification Status/);
});

test("does not post estimated retail value to Financials", async () => {
  const source = await loadPatch();
  assert.doesNotMatch(source, /getSheetByName\(["']Financials["']\)/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --experimental-strip-types --test lib/apps-script-in-kind.test.mjs`

Expected: FAIL because `apps-script/InKindDonationsPatch.gs` does not exist.

- [ ] **Step 3: Implement the patch with canonical headers and folder ID**

Start the file with exact constants:

```js
const IN_KIND_SHEET_NAME = "In-Kind Donations";
const IN_KIND_FOLDER_ID = "1pZ1Pb7ExUPa_fEGNhc88FAwCWtIFXwIi";
const IN_KIND_ADMIN_EMAIL = "chadmillermemorial@gmail.com";
const IN_KIND_HEADERS = [
  "Submission ID", "Submitted At", "Donor / Business", "Contact Name", "Email", "Phone",
  "Contribution Type", "Contribution Type Write-In", "Intended Use", "Intended Use Write-In",
  "Item / Service Name", "Description", "Estimated Retail Value", "Quantity",
  "Restrictions / Expiration", "Redemption Instructions", "Website / Social", "File Links",
  "Drop-Off / Pickup Plan", "Public Recognition", "Public Recognition Name", "Status",
  "Reviewer", "Review Date", "Accepted / Declined Date", "Received Date",
  "Donor Notification Status", "Attachment Status", "Notes"
];
const IN_KIND_STATUSES = ["Submitted", "Under Review", "Accepted", "Declined", "Received", "Ready for Event"];
```

Implement `createInKindDonation(data)` so it obtains a script lock, allocates the next sequence from existing `Submission ID` values, writes a single row with Status=`Submitted`, Attachment Status=`No Attachments`, and returns the ID through existing `jsonResponse()`.

Implement `uploadInKindDonationFile(data)` so it validates the ID, MIME type and base64 payload, creates/reuses a submission-specific subfolder, writes the decoded blob, appends the Drive file URL into File Links, and sets Attachment Status=`Complete`. On error, set Attachment Status=`Attachment Upload Issue` before rethrowing.

Implement `finalizeInKindDonation(data)` so it finds the existing row by Submission ID, sends the donor submitted-for-review email and internal admin alert once, records `Submitted confirmation sent` / failure detail in Donor Notification Status, and does not delete or roll back the row when email delivery fails.

- [ ] **Step 4: Implement workbook status-change behavior**

The handler must gate on the sheet name, row > 1, and Status column. Use `e.oldValue` and `e.value` to skip no-op edits. For `Under Review`, set Reviewer to `Session.getActiveUser().getEmail()` when available and set Review Date. For `Accepted`/`Declined`, set the decision date and send only if Donor Notification Status does not already contain the corresponding sent marker. For `Received`, populate Received Date. For `Ready for Event`, make no donor email change.

Use distinct notification markers:

```js
const acceptedMarker = "Accepted email sent";
const declinedMarker = "Declined email sent";
```

- [ ] **Step 5: Add one-time setup and trigger installer**

`setupInKindDonations()` must rename the sheet with ID `763058240` if needed, replace row 1 with `IN_KIND_HEADERS`, freeze row 1, apply currency formatting to Estimated Retail Value, and apply status data validation to the Status column. It must rename the existing folder to `Chad Miller Memorial - In-Kind Contributions`.

`installInKindDonationStatusTrigger()` must delete existing project triggers whose handler is `handleInKindDonationStatusEdit` and then create exactly one `ScriptApp.newTrigger("handleInKindDonationStatusEdit").forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create()` trigger.

- [ ] **Step 6: Run Apps Script static tests and entire suite**

Run: `node --experimental-strip-types --test lib/apps-script-in-kind.test.mjs && npm test`

Expected: PASS.

- [ ] **Step 7: Commit source-controlled Apps Script reference**

```bash
git add apps-script/InKindDonationsPatch.gs lib/apps-script-in-kind.test.mjs
git commit -m "feat: add in-kind Apps Script workflow"
```

---

### Task 5: Merge the Approved Apps Script Into the Live Bound Project and Migrate Google Resources

**Files / Systems:**
- Deployed Apps Script `Code.gs`
- Google Sheet ID `178YXpJQLc5dnIziI8jiaSzx4cIGBctIAODCIr9JBwIw`, sheet ID `763058240`
- Drive folder ID `1pZ1Pb7ExUPa_fEGNhc88FAwCWtIFXwIi`

**Interfaces:**
- Existing `doPost(e)` must dispatch the three new action names before its generic/default response.
- Existing player, sponsor, volunteer, waitlist, donation and refund actions must remain unchanged.

- [ ] **Step 1: Capture the current deployed full `Code.gs` before editing**

Open the bound Apps Script project, select all of `Code.gs`, and copy the complete file into the implementation session. Save the captured snapshot locally/source-controlled during execution before making any change. This is mandatory because the current connector cannot read the bound Apps Script source directly.

- [ ] **Step 2: Produce a full replacement `Code.gs`**

Merge `InKindDonationsPatch.gs` into the captured file and add these exact router cases into the existing parsed-action dispatch, preserving every existing case:

```js
if (data.action === "createInKindDonation") {
  return createInKindDonation(data);
}
if (data.action === "uploadInKindDonationFile") {
  return uploadInKindDonationFile(data);
}
if (data.action === "finalizeInKindDonation") {
  return finalizeInKindDonation(data);
}
```

Provide the user the complete replacement `Code.gs`, never a partial snippet.

- [ ] **Step 3: Deploy the replacement and run setup**

Replace the bound `Code.gs`, save, run `setupInKindDonations()` once, grant required Sheets/Drive/Gmail scopes, then run `installInKindDonationStatusTrigger()` once and grant trigger authorization.

- [ ] **Step 4: Verify Google migration directly**

Confirm:
- Sheet ID `763058240` is titled `In-Kind Donations`.
- Row 1 contains all 29 canonical headers in order.
- Status cells have the six-value dropdown.
- Estimated Retail Value is currency-formatted.
- Existing contribution folder ID is unchanged but title is `Chad Miller Memorial - In-Kind Contributions`.
- There is exactly one installable edit trigger for `handleInKindDonationStatusEdit`.

- [ ] **Step 5: Verify existing Apps Script endpoints still respond**

Call the existing read-only capacity action and one other non-mutating existing action. Expected: `{ ok: true, ... }`; no regression to player/sponsor flows.

- [ ] **Step 6: Commit the captured/merged source reference if the project convention supports a complete snapshot**

If the repository stores only patch references, keep `InKindDonationsPatch.gs` as the source of record and do not add a duplicate `Code.gs` that would mislead future maintainers. Record the deployed revision in the commit/PR notes.

---

### Task 6: Preview Deployment and End-to-End In-Kind Verification

**Systems:**
- GitHub branch `in-kind-donations`
- Vercel preview deployment
- Live Apps Script web app
- Tournament management workbook
- Tournament Gmail inbox
- Tournament Drive contribution folder

- [ ] **Step 1: Run complete local verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all PASS.

- [ ] **Step 2: Deploy branch preview**

Create or use the Vercel preview for `in-kind-donations`. Confirm the deployment state is `READY` before testing.

- [ ] **Step 3: Submit a no-attachment test donation**

Use a clearly labeled test record:
- Donor / Business: `TEST — CSM In-Kind Workflow`
- Contribution Type: `Other — Write In`
- Contribution Type Write-In: `Written-only test contribution`
- Intended Use: `Other — Write In`
- Intended Use Write-In: `System verification`
- Item / Service Name: `Test contribution`
- Description: `This verifies that a written description is acceptable without any uploaded file.`
- Estimated Retail Value: `$1`
- Quantity: `1`
- Public Recognition: `No`

Expected: redirect to confirmation with an `IK-2026-####` ID, workbook row exists, Attachment Status=`No Attachments`, donor submitted-for-review email sent, admin alert received, Stripe has no new Checkout Session associated with the test.

- [ ] **Step 4: Submit attachment tests**

Verify one valid PDF/image succeeds and appears in the submission Drive folder. Verify unsupported extension, >10 MB file, and fourth file are blocked before Google persistence for that attempted invalid submission.

- [ ] **Step 5: Verify workbook decision automation**

For the test row:
1. Change Status to `Under Review`; verify Review Date is set and no donor decision email is sent.
2. Change Status to `Accepted`; verify exactly one acceptance email and decision date.
3. Re-enter `Accepted`; verify no second acceptance email.
4. Change a separate disposable test row to `Declined`; verify exactly one decline email.
5. Change the accepted row to `Received`; verify Received Date.
6. Change it to `Ready for Event`; verify no extra donor email.

- [ ] **Step 6: Verify financial separation**

Inspect `Financials` before and after all test submissions. Expected: no income row/value created from Estimated Retail Value.

- [ ] **Step 7: Clean up test data**

Delete only clearly labeled test workbook rows and their test Drive subfolders after screenshots/logs needed for verification are captured. Do not delete production donations.

- [ ] **Step 8: Commit any test-driven fixes**

```bash
git add app lib apps-script
git commit -m "fix: harden in-kind donation workflow"
```

Only create this commit if the end-to-end test required code changes.

---

### Task 7: Production Release and Regression Check

**Systems:**
- GitHub `main`
- Vercel production project `prj_7LDybhIDHUjWBVqd1QPYmeyIPJW2`
- Vercel team `team_NyLSkdJeM3Rp1QH0dysS8jhN`
- Stripe live account
- Google workbook/Drive/Gmail

- [ ] **Step 1: Review branch diff against the approved spec**

Confirm no unrelated refactors, no monetary Stripe behavior changes, and no new Google credentials/environment variables.

- [ ] **Step 2: Run final verification before merge**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 3: Merge/release the branch and wait for production deployment**

Merge `in-kind-donations` into `main` only after the preview and Apps Script tests pass. Confirm the new production Vercel deployment is `READY` and is based on the merged commit.

- [ ] **Step 4: Production smoke test the public pages**

Verify:
- `/register/donate` displays both support choices.
- Monetary donation still reaches the existing Stripe Checkout flow.
- `/register/donate/in-kind` loads and submits correctly.
- A written-only in-kind contribution can be submitted without an attachment.
- Confirmation page contains the submission ID and submitted-for-review language.

- [ ] **Step 5: Verify production Google effects**

Confirm the production test appears in `In-Kind Donations`, optional files land in the correct Drive subfolder, donor/admin emails arrive, and no estimated retail value is posted to `Financials`.

- [ ] **Step 6: Verify Stripe isolation**

Check the live Stripe account around the production in-kind test timestamp. Expected: no Checkout Session or PaymentIntent was created by the in-kind submission. Monetary test/known checkout behavior remains operational.

- [ ] **Step 7: Clean the final test record and document completion**

Remove only the clearly labeled production test row/subfolder after verification. Keep the implementation spec, plan, source-controlled Apps Script patch, and final commits as the audit trail.

---

## Self-Review Results

- **Spec coverage:** All approved requirements are mapped: dual donation choice, free-text/write-in support, optional uploads, record-first persistence, canonical IDs, workbook review, Drive storage, submitted/accepted/declined emails, idempotency, public recognition, financial separation, Google migration, and end-to-end verification.
- **Placeholder scan:** No implementation step depends on `TBD`, `TODO`, or an unspecified future behavior. The only manual prerequisite is capturing the currently deployed full `Code.gs`, which is an explicit safety step required because the connector cannot read the bound Apps Script source.
- **Type/interface consistency:** Website field names, validation module properties, Apps Script action names, canonical headers, submission ID format, status values, and file rules are consistent across tasks.
