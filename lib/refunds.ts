export type RefundSource =
  | "player_withdrawal"
  | "admin_player_refund"
  | "admin_donation_refund"
  | "admin_sponsor_refund";

type RefundLike = {
  status?: string | null;
  metadata?: Record<string, string> | null;
};

function assertIntegerCents(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer number of cents.`);
  }
}

export function getProcessingFeeShare(
  totalProcessingFeeCents: number,
  playerCount: number,
  playerNumber: number
) {
  assertIntegerCents(
    totalProcessingFeeCents,
    "Processing fee"
  );

  if (
    !Number.isInteger(playerCount) ||
    playerCount < 1 ||
    playerCount > 4
  ) {
    throw new Error("Player count must be an integer from 1 through 4.");
  }

  if (
    !Number.isInteger(playerNumber) ||
    playerNumber < 1 ||
    playerNumber > playerCount
  ) {
    throw new Error("Player number is outside the registration.");
  }

  const baseFee = Math.floor(
    totalProcessingFeeCents / playerCount
  );

  const remainder =
    totalProcessingFeeCents % playerCount;

  return (
    baseFee +
    (playerNumber <= remainder ? 1 : 0)
  );
}

export function getNetRefundAmountCents(
  grossAmountCents: number,
  processingFeeCents: number
) {
  assertIntegerCents(grossAmountCents, "Gross amount");
  assertIntegerCents(processingFeeCents, "Processing fee");

  const refundAmountCents =
    grossAmountCents - processingFeeCents;

  if (refundAmountCents <= 0) {
    throw new Error("Refund amount must be greater than zero after processing fees.");
  }

  return refundAmountCents;
}

export function isPlayerRefundSource(
  source?: string | null
) {
  return (
    source === "player_withdrawal" ||
    source === "admin_player_refund"
  );
}

export function isActiveRefund(refund: RefundLike) {
  const status =
    String(refund.status || "").toLowerCase();

  return (
    status !== "failed" &&
    status !== "canceled"
  );
}

export function isRefundForPlayer(
  refund: RefundLike,
  checkoutSessionId: string,
  playerNumber: number
) {
  return (
    isActiveRefund(refund) &&
    isPlayerRefundSource(
      refund.metadata?.source
    ) &&
    refund.metadata?.checkoutSessionId ===
      checkoutSessionId &&
    Number(
      refund.metadata?.playerNumber || "0"
    ) === playerNumber
  );
}
