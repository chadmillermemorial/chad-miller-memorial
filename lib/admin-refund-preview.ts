import {
  getNetRefundAmountCents,
  getProcessingFeeShare,
  isActiveRefund,
  isPlayerRefundSource,
  isRefundForPlayer,
  type RefundSource,
} from "./refunds.ts";

type RefundLike = {
  id?: string;
  amount?: number;
  status?: string | null;
  metadata?: Record<string, string> | null;
};

type FullPaymentPreviewInput = {
  checkoutSessionId: string;
  grossAmountCents: number;
  processingFeeCents: number;
  expectedSource:
    | "admin_donation_refund"
    | "admin_sponsor_refund";
  refunds: RefundLike[];
};

type PlayerPreviewInput = {
  checkoutSessionId: string;
  grossAmountCents: number;
  processingFeeCents: number;
  playerCount: number;
  metadata: Record<string, string | undefined>;
  refunds: RefundLike[];
};

function getRefundSource(
  refund: RefundLike
) {
  return refund.metadata?.source || "";
}

export function buildFullPaymentRefundPreview({
  checkoutSessionId,
  grossAmountCents,
  processingFeeCents,
  expectedSource,
  refunds,
}: FullPaymentPreviewInput) {
  const refundAmountCents =
    getNetRefundAmountCents(
      grossAmountCents,
      processingFeeCents
    );

  const activeRefunds =
    refunds.filter(isActiveRefund);

  const activeRefundedAmountCents =
    activeRefunds.reduce(
      (total, refund) =>
        total + Number(refund.amount || 0),
      0
    );

  const existingRefund =
    activeRefunds.find(
      (refund) =>
        getRefundSource(refund) ===
          expectedSource &&
        refund.metadata?.checkoutSessionId ===
          checkoutSessionId
    );

  const fullyRefundedOutsideAdmin =
    !existingRefund &&
    activeRefundedAmountCents >=
      grossAmountCents;

  const blockedByUnknownRefund =
    !fullyRefundedOutsideAdmin &&
    activeRefunds.some(
      (refund) =>
        refund !== existingRefund
    );

  return {
    grossAmountCents,
    processingFeeCents,
    refundAmountCents,
    alreadyRefunded:
      Boolean(existingRefund),
    existingRefundId:
      existingRefund?.id || "",
    blockedByUnknownRefund,
    fullyRefundedOutsideAdmin,
    activeRefundedAmountCents,
  };
}

function getPlayerName(
  metadata: Record<string, string | undefined>,
  playerNumber: number
) {
  const firstName = String(
    metadata[`p${playerNumber}FirstName`] || ""
  ).trim();

  const lastName = String(
    metadata[`p${playerNumber}LastName`] || ""
  ).trim();

  return (
    `${firstName} ${lastName}`.trim() ||
    `Player ${playerNumber}`
  );
}

function isKnownPlayerRefund(
  refund: RefundLike,
  checkoutSessionId: string,
  playerCount: number
) {
  if (!isActiveRefund(refund)) {
    return true;
  }

  if (
    !isPlayerRefundSource(
      getRefundSource(refund)
    )
  ) {
    return false;
  }

  if (
    refund.metadata?.checkoutSessionId !==
    checkoutSessionId
  ) {
    return false;
  }

  const playerNumber = Number(
    refund.metadata?.playerNumber || "0"
  );

  return (
    Number.isInteger(playerNumber) &&
    playerNumber >= 1 &&
    playerNumber <= playerCount
  );
}

export function buildPlayerRefundPreview({
  checkoutSessionId,
  grossAmountCents,
  processingFeeCents,
  playerCount,
  metadata,
  refunds,
}: PlayerPreviewInput) {
  if (
    !Number.isInteger(playerCount) ||
    playerCount < 1 ||
    playerCount > 4
  ) {
    throw new Error(
      "Player count must be an integer from 1 through 4."
    );
  }

  if (
    !Number.isInteger(grossAmountCents) ||
    grossAmountCents <= 0 ||
    grossAmountCents % playerCount !== 0
  ) {
    throw new Error(
      "Player payment must divide evenly by the number of golfers."
    );
  }

  const grossPerPlayer =
    grossAmountCents / playerCount;

  const blockedByUnknownRefund =
    refunds.some(
      (refund) =>
        !isKnownPlayerRefund(
          refund,
          checkoutSessionId,
          playerCount
        )
    );

  const players = Array.from(
    { length: playerCount },
    (_, index) => {
      const playerNumber = index + 1;

      const processingFeeShare =
        getProcessingFeeShare(
          processingFeeCents,
          playerCount,
          playerNumber
        );

      const refundAmountCents =
        getNetRefundAmountCents(
          grossPerPlayer,
          processingFeeShare
        );

      const existingRefund =
        refunds.find((refund) =>
          isRefundForPlayer(
            refund,
            checkoutSessionId,
            playerNumber
          )
        );

      return {
        playerNumber,
        playerName:
          getPlayerName(
            metadata,
            playerNumber
          ),
        grossAmountCents:
          grossPerPlayer,
        processingFeeCents:
          processingFeeShare,
        refundAmountCents,
        refunded:
          Boolean(existingRefund),
        existingRefundId:
          existingRefund?.id || "",
      };
    }
  );

  return {
    blockedByUnknownRefund,
    players,
  };
}

export function getAdminRefundSourceForPaymentType(
  paymentType: "player" | "sponsorship" | "donation"
): RefundSource {
  if (paymentType === "player") {
    return "admin_player_refund";
  }

  if (paymentType === "sponsorship") {
    return "admin_sponsor_refund";
  }

  return "admin_donation_refund";
}
