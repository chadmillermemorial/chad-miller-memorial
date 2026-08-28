import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadAppsScriptSource() {
  try {
    return await readFile(
      new URL("../apps-script/Code.gs", import.meta.url),
      "utf8"
    );
  } catch (error) {
    assert.fail(
      `Expected apps-script/Code.gs to mirror the deployed Apps Script source: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function between(source, startText, endText) {
  const start = source.indexOf(startText);
  assert.notEqual(start, -1, `Missing ${startText}`);

  const end = source.indexOf(endText, start + startText.length);
  assert.notEqual(end, -1, `Missing ${endText}`);

  return source.slice(start, end);
}

test("public capacity lookup remains lock-free and read-only", async () => {
  const source = await loadAppsScriptSource();
  const capacity = between(
    source,
    "function getCapacity() {",
    "function countCurrentActiveHoldsReadOnly_("
  );

  assert.doesNotMatch(capacity, /LockService/);
  assert.doesNotMatch(capacity, /cleanupExpiredHolds/);
  assert.match(capacity, /countCurrentActiveHoldsReadOnly_/);
  assert.match(capacity, /getWaitlistPriorityStateReadOnly_/);
});

test("admin sponsor and donation refund actions remain routed", async () => {
  const source = await loadAppsScriptSource();

  assert.match(source, /data\.action ===\s*"sponsorRefund"/);
  assert.match(source, /return saveSponsorRefund\(data\)/);
  assert.match(source, /data\.action ===\s*"donationRefund"/);
  assert.match(source, /return saveDonationRefund\(data\)/);
});

test("duplicate sponsor refund retries rerun capacity and roster synchronization", async () => {
  const source = await loadAppsScriptSource();
  const sponsorRefund = between(
    source,
    "function saveSponsorRefund(data) {",
    "function findSponsorRowByStripeSession_("
  );

  const duplicateStart = sponsorRefund.indexOf("existingRefundId &&");
  const refundAmountStart = sponsorRefund.indexOf("const refundAmount =");
  assert.notEqual(duplicateStart, -1);
  assert.notEqual(refundAmountStart, -1);

  const duplicateBlock = sponsorRefund.slice(
    duplicateStart,
    refundAmountStart
  );

  assert.match(duplicateBlock, /refundSponsorCapacityHold_/);
});

test("converted sponsor rosters are withdrawn by the sponsor Stripe session registration ID", async () => {
  const source = await loadAppsScriptSource();
  const cleanup = between(
    source,
    "function withdrawConvertedSponsorGolfers_(",
    "function markSponsorPairingWithdrawn_("
  );

  assert.match(cleanup, /row\[0\]/);
  assert.match(cleanup, /stripeSessionId/);
  assert.match(cleanup, /matches\.length !== expected/);
  assert.match(cleanup, /"Sponsor Refunded"/);
  assert.match(cleanup, /markSponsorPairingWithdrawn_/);
});

test("converted sponsor cleanup is idempotent and no manual removal flag remains", async () => {
  const source = await loadAppsScriptSource();
  const capacityRefund = between(
    source,
    "function refundSponsorCapacityHold_(",
    "function withdrawConvertedSponsorGolfers_("
  );

  assert.match(capacityRefund, /previousStatus ===\s*"Converted"/);
  assert.match(capacityRefund, /withdrawConvertedSponsorGolfers_/);
  assert.match(capacityRefund, /convertedRosterNeedsRemoval:\s*false/);
  assert.match(capacityRefund, /convertedRosterRemoved/);
});
