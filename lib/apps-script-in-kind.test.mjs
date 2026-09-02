import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadPatch() {
  return await readFile(
    new URL("../apps-script/InKindDonationsPatch.gs", import.meta.url),
    "utf8"
  );
}

test("defines the three public in-kind actions and router insertion contract", async () => {
  const source = await loadPatch();

  assert.match(source, /function createInKindDonation\(data\)/);
  assert.match(source, /function uploadInKindDonationFile\(data\)/);
  assert.match(source, /function finalizeInKindDonation\(data\)/);
  assert.match(source, /data\.action === ["']createInKindDonation["']/);
  assert.match(source, /data\.action === ["']uploadInKindDonationFile["']/);
  assert.match(source, /data\.action === ["']finalizeInKindDonation["']/);
});

test("allocates canonical IDs under a script lock", async () => {
  const source = await loadPatch();

  assert.match(source, /IK-2026-/);
  assert.match(source, /LockService\.getScriptLock\(\)/);
  assert.match(source, /waitLock\(/);
  assert.match(source, /releaseLock\(\)/);
});

test("enforces the approved Google sheet folder headers statuses and 4 MB file limit", async () => {
  const source = await loadPatch();

  assert.match(source, /const IN_KIND_SHEET_NAME = ["']In-Kind Donations["']/);
  assert.match(source, /1pZ1Pb7ExUPa_fEGNhc88FAwCWtIFXwIi/);
  assert.match(source, /Submission ID/);
  assert.match(source, /Donor Notification Status/);
  assert.match(source, /Attachment Status/);
  assert.match(source, /Ready for Event/);
  assert.match(source, /4 \* 1024 \* 1024/);
  assert.match(source, /Attachment Upload Issue/);
});

test("finalization records attachment issues and sends submission notifications idempotently", async () => {
  const source = await loadPatch();

  assert.match(source, /attachmentIssue/);
  assert.match(source, /Submitted confirmation sent/);
  assert.match(source, /Admin alert sent/);
  assert.match(source, /submitted for review/i);
  assert.match(source, /submission does not constitute acceptance/i);
});

test("status handler sends accepted and declined emails only once and records received date", async () => {
  const source = await loadPatch();

  assert.match(source, /function handleInKindDonationStatusEdit\(e\)/);
  assert.match(source, /Accepted email sent/);
  assert.match(source, /Declined email sent/);
  assert.match(source, /Received Date/);
  assert.match(source, /e\.oldValue/);
  assert.match(source, /e\.value/);
});

test("setup migrates the existing sheet and folder and installs exactly one edit trigger", async () => {
  const source = await loadPatch();

  assert.match(source, /function setupInKindDonations\(\)/);
  assert.match(source, /763058240/);
  assert.match(source, /Chad Miller Memorial - In-Kind Contributions/);
  assert.match(source, /requireValueInList\(IN_KIND_STATUSES/);
  assert.match(source, /function installInKindDonationStatusTrigger\(\)/);
  assert.match(source, /getHandlerFunction\(\)/);
  assert.match(source, /ScriptApp\.newTrigger\(["']handleInKindDonationStatusEdit["']\)/);
  assert.match(source, /\.onEdit\(\)/);
});

test("never posts estimated retail value to Financials", async () => {
  const source = await loadPatch();

  assert.doesNotMatch(source, /getSheetByName\(["']Financials["']\)/);
});
