import assert from "node:assert/strict";
import test from "node:test";

async function loadPreviewModule() {
  try {
    return await import("./admin-refund-preview.ts");
  } catch (error) {
    assert.fail(
      `Expected lib/admin-refund-preview.ts to implement refund previews: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

test("previews a full donation or sponsor refund after retaining Stripe fees", async () => {
  const { buildFullPaymentRefundPreview } =
    await loadPreviewModule();

  assert.deepEqual(
    buildFullPaymentRefundPreview({
      checkoutSessionId: "cs_test_full",
      grossAmountCents: 10000,
      processingFeeCents: 329,
      expectedSource: "admin_donation_refund",
      refunds: [],
    }),
    {
      grossAmountCents: 10000,
      processingFeeCents: 329,
      refundAmountCents: 9671,
      alreadyRefunded: false,
      existingRefundId: "",
      blockedByUnknownRefund: false,
      fullyRefundedOutsideAdmin: false,
      activeRefundedAmountCents: 0,
    }
  );
});

test("recognizes an existing matching admin full-payment refund", async () => {
  const { buildFullPaymentRefundPreview } =
    await loadPreviewModule();

  const preview = buildFullPaymentRefundPreview({
    checkoutSessionId: "cs_test_full",
    grossAmountCents: 10000,
    processingFeeCents: 329,
    expectedSource: "admin_sponsor_refund",
    refunds: [
      {
        id: "re_test_existing",
        status: "succeeded",
        amount: 9671,
        metadata: {
          source: "admin_sponsor_refund",
          checkoutSessionId: "cs_test_full",
        },
      },
    ],
  });

  assert.equal(preview.alreadyRefunded, true);
  assert.equal(preview.existingRefundId, "re_test_existing");
  assert.equal(preview.blockedByUnknownRefund, false);
  assert.equal(preview.fullyRefundedOutsideAdmin, false);
});

test("identifies a fully refunded historical payment without offering another refund", async () => {
  const { buildFullPaymentRefundPreview } =
    await loadPreviewModule();

  const preview = buildFullPaymentRefundPreview({
    checkoutSessionId: "cs_test_full",
    grossAmountCents: 2000,
    processingFeeCents: 88,
    expectedSource: "admin_donation_refund",
    refunds: [
      {
        id: "re_test_manual_full",
        status: "succeeded",
        amount: 2000,
        metadata: {},
      },
    ],
  });

  assert.equal(preview.alreadyRefunded, false);
  assert.equal(preview.fullyRefundedOutsideAdmin, true);
  assert.equal(preview.activeRefundedAmountCents, 2000);
  assert.equal(preview.blockedByUnknownRefund, false);
});

test("blocks a full-payment refund when an unrelated partial active refund exists", async () => {
  const { buildFullPaymentRefundPreview } =
    await loadPreviewModule();

  const preview = buildFullPaymentRefundPreview({
    checkoutSessionId: "cs_test_full",
    grossAmountCents: 10000,
    processingFeeCents: 329,
    expectedSource: "admin_donation_refund",
    refunds: [
      {
        id: "re_test_manual",
        status: "succeeded",
        amount: 1000,
        metadata: {
          source: "manual",
        },
      },
    ],
  });

  assert.equal(preview.blockedByUnknownRefund, true);
  assert.equal(preview.alreadyRefunded, false);
  assert.equal(preview.fullyRefundedOutsideAdmin, false);
  assert.equal(preview.activeRefundedAmountCents, 1000);
});

test("previews each player refund with proportional fee allocation", async () => {
  const { buildPlayerRefundPreview } =
    await loadPreviewModule();

  const preview = buildPlayerRefundPreview({
    checkoutSessionId: "cs_test_players",
    grossAmountCents: 30000,
    processingFeeCents: 957,
    playerCount: 4,
    metadata: {
      p1FirstName: "Alpha",
      p1LastName: "Golfer",
      p2FirstName: "Beta",
      p2LastName: "Golfer",
      p3FirstName: "Gamma",
      p3LastName: "Golfer",
      p4FirstName: "Delta",
      p4LastName: "Golfer",
    },
    refunds: [],
  });

  assert.equal(preview.blockedByUnknownRefund, false);
  assert.equal(preview.players.length, 4);
  assert.deepEqual(preview.players[0], {
    playerNumber: 1,
    playerName: "Alpha Golfer",
    grossAmountCents: 7500,
    processingFeeCents: 240,
    refundAmountCents: 7260,
    refunded: false,
    existingRefundId: "",
  });
  assert.equal(preview.players[1].processingFeeCents, 239);
  assert.equal(preview.players[1].refundAmountCents, 7261);
});

test("marks a player refunded by either public or admin player refund source", async () => {
  const { buildPlayerRefundPreview } =
    await loadPreviewModule();

  const preview = buildPlayerRefundPreview({
    checkoutSessionId: "cs_test_players",
    grossAmountCents: 15000,
    processingFeeCents: 500,
    playerCount: 2,
    metadata: {
      p1FirstName: "Alpha",
      p1LastName: "Golfer",
      p2FirstName: "Beta",
      p2LastName: "Golfer",
    },
    refunds: [
      {
        id: "re_test_public",
        status: "succeeded",
        metadata: {
          source: "player_withdrawal",
          checkoutSessionId: "cs_test_players",
          playerNumber: "1",
        },
      },
      {
        id: "re_test_admin",
        status: "succeeded",
        metadata: {
          source: "admin_player_refund",
          checkoutSessionId: "cs_test_players",
          playerNumber: "2",
        },
      },
    ],
  });

  assert.equal(preview.players[0].refunded, true);
  assert.equal(preview.players[0].existingRefundId, "re_test_public");
  assert.equal(preview.players[1].refunded, true);
  assert.equal(preview.players[1].existingRefundId, "re_test_admin");
});

test("blocks player refunds when an active refund cannot be assigned to a golfer", async () => {
  const { buildPlayerRefundPreview } =
    await loadPreviewModule();

  const preview = buildPlayerRefundPreview({
    checkoutSessionId: "cs_test_players",
    grossAmountCents: 15000,
    processingFeeCents: 500,
    playerCount: 2,
    metadata: {},
    refunds: [
      {
        id: "re_test_manual",
        status: "succeeded",
        metadata: {
          source: "manual",
        },
      },
    ],
  });

  assert.equal(preview.blockedByUnknownRefund, true);
});
