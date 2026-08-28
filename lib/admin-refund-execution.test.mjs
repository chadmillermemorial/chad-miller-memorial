import assert from "node:assert/strict";
import test from "node:test";

async function loadExecutionModule() {
  try {
    return await import("./admin-refund-execution.ts");
  } catch (error) {
    assert.fail(
      `Expected lib/admin-refund-execution.ts to implement refund execution helpers: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

test("uses deterministic idempotency keys for full-payment refunds", async () => {
  const { getAdminRefundIdempotencyKey } =
    await loadExecutionModule();

  assert.equal(
    getAdminRefundIdempotencyKey(
      "donation",
      "cs_test_123"
    ),
    "admin-donation-refund:cs_test_123"
  );

  assert.equal(
    getAdminRefundIdempotencyKey(
      "sponsorship",
      "cs_test_456"
    ),
    "admin-sponsor-refund:cs_test_456"
  );
});

test("uses a golfer-specific idempotency key for player refunds", async () => {
  const { getAdminRefundIdempotencyKey } =
    await loadExecutionModule();

  assert.equal(
    getAdminRefundIdempotencyKey(
      "player",
      "cs_test_players",
      3
    ),
    "admin-player-refund:cs_test_players:player-3"
  );

  assert.throws(() =>
    getAdminRefundIdempotencyKey(
      "player",
      "cs_test_players"
    )
  );
});

test("maps payment types to existing Apps Script refund actions", async () => {
  const { getAppsScriptRefundAction } =
    await loadExecutionModule();

  assert.equal(
    getAppsScriptRefundAction("donation"),
    "donationRefund"
  );
  assert.equal(
    getAppsScriptRefundAction("sponsorship"),
    "sponsorRefund"
  );
  assert.equal(
    getAppsScriptRefundAction("player"),
    "playerWithdrawal"
  );
});

test("maps payment types to Stripe admin refund metadata sources", async () => {
  const { getStripeAdminRefundSource } =
    await loadExecutionModule();

  assert.equal(
    getStripeAdminRefundSource("donation"),
    "admin_donation_refund"
  );
  assert.equal(
    getStripeAdminRefundSource("sponsorship"),
    "admin_sponsor_refund"
  );
  assert.equal(
    getStripeAdminRefundSource("player"),
    "admin_player_refund"
  );
});
