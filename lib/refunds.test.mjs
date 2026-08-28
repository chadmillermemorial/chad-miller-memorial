import assert from "node:assert/strict";
import test from "node:test";

async function loadRefundModule() {
  try {
    return await import("./refunds.ts");
  } catch (error) {
    assert.fail(
      `Expected lib/refunds.ts to implement the refund rules: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

test("splits an evenly divisible processing fee equally", async () => {
  const { getProcessingFeeShare } = await loadRefundModule();

  assert.equal(typeof getProcessingFeeShare, "function");
  assert.equal(getProcessingFeeShare(100, 4, 1), 25);
  assert.equal(getProcessingFeeShare(100, 4, 2), 25);
  assert.equal(getProcessingFeeShare(100, 4, 3), 25);
  assert.equal(getProcessingFeeShare(100, 4, 4), 25);
});

test("assigns fee remainder cents deterministically to lower player numbers", async () => {
  const { getProcessingFeeShare } = await loadRefundModule();

  assert.equal(getProcessingFeeShare(103, 4, 1), 26);
  assert.equal(getProcessingFeeShare(103, 4, 2), 26);
  assert.equal(getProcessingFeeShare(103, 4, 3), 26);
  assert.equal(getProcessingFeeShare(103, 4, 4), 25);
});

test("supports one through four player registrations", async () => {
  const { getProcessingFeeShare } = await loadRefundModule();

  assert.equal(getProcessingFeeShare(87, 1, 1), 87);
  assert.equal(getProcessingFeeShare(87, 2, 1), 44);
  assert.equal(getProcessingFeeShare(87, 2, 2), 43);
  assert.equal(getProcessingFeeShare(87, 3, 1), 29);
  assert.equal(getProcessingFeeShare(87, 4, 4), 21);
});

test("rejects invalid player fee allocations", async () => {
  const { getProcessingFeeShare } = await loadRefundModule();

  assert.throws(() => getProcessingFeeShare(100, 0, 1));
  assert.throws(() => getProcessingFeeShare(100, 5, 1));
  assert.throws(() => getProcessingFeeShare(100, 4, 0));
  assert.throws(() => getProcessingFeeShare(100, 4, 5));
  assert.throws(() => getProcessingFeeShare(-1, 4, 1));
});

test("returns the customer refund after retaining processing fees", async () => {
  const { getNetRefundAmountCents } = await loadRefundModule();

  assert.equal(typeof getNetRefundAmountCents, "function");
  assert.equal(getNetRefundAmountCents(10_000, 329), 9_671);
  assert.equal(getNetRefundAmountCents(7_500, 248), 7_252);
});

test("rejects a zero or negative net refund", async () => {
  const { getNetRefundAmountCents } = await loadRefundModule();

  assert.throws(() => getNetRefundAmountCents(100, 100));
  assert.throws(() => getNetRefundAmountCents(100, 101));
  assert.throws(() => getNetRefundAmountCents(0, 0));
});

test("classifies both public and admin player refund sources", async () => {
  const { isPlayerRefundSource } = await loadRefundModule();

  assert.equal(typeof isPlayerRefundSource, "function");
  assert.equal(isPlayerRefundSource("player_withdrawal"), true);
  assert.equal(isPlayerRefundSource("admin_player_refund"), true);
  assert.equal(isPlayerRefundSource("admin_donation_refund"), false);
  assert.equal(isPlayerRefundSource("admin_sponsor_refund"), false);
  assert.equal(isPlayerRefundSource("manual"), false);
  assert.equal(isPlayerRefundSource(undefined), false);
});

test("treats failed and canceled Stripe refunds as inactive", async () => {
  const { isActiveRefund } = await loadRefundModule();

  assert.equal(typeof isActiveRefund, "function");
  assert.equal(isActiveRefund({ status: "succeeded" }), true);
  assert.equal(isActiveRefund({ status: "pending" }), true);
  assert.equal(isActiveRefund({ status: "failed" }), false);
  assert.equal(isActiveRefund({ status: "canceled" }), false);
  assert.equal(isActiveRefund({ status: null }), true);
});

test("matches a refund to an exact registration golfer across public or admin sources", async () => {
  const { isRefundForPlayer } = await loadRefundModule();

  const baseRefund = {
    status: "succeeded",
    metadata: {
      checkoutSessionId: "cs_test_123",
      playerNumber: "2",
    },
  };

  assert.equal(
    isRefundForPlayer(
      {
        ...baseRefund,
        metadata: {
          ...baseRefund.metadata,
          source: "player_withdrawal",
        },
      },
      "cs_test_123",
      2
    ),
    true
  );

  assert.equal(
    isRefundForPlayer(
      {
        ...baseRefund,
        metadata: {
          ...baseRefund.metadata,
          source: "admin_player_refund",
        },
      },
      "cs_test_123",
      2
    ),
    true
  );

  assert.equal(
    isRefundForPlayer(
      {
        ...baseRefund,
        metadata: {
          ...baseRefund.metadata,
          source: "admin_player_refund",
        },
      },
      "cs_other",
      2
    ),
    false
  );

  assert.equal(
    isRefundForPlayer(
      {
        ...baseRefund,
        metadata: {
          ...baseRefund.metadata,
          source: "manual",
        },
      },
      "cs_test_123",
      2
    ),
    false
  );

  assert.equal(
    isRefundForPlayer(
      {
        ...baseRefund,
        metadata: {
          ...baseRefund.metadata,
          source: "admin_player_refund",
        },
      },
      "cs_test_123",
      3
    ),
    false
  );
});
