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
