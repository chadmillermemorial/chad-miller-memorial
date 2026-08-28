export type AdminRefundPaymentType =
  | "player"
  | "sponsorship"
  | "donation";

export function getAdminRefundIdempotencyKey(
  paymentType: AdminRefundPaymentType,
  checkoutSessionId: string,
  playerNumber?: number
) {
  if (paymentType === "player") {
    if (
      !Number.isInteger(playerNumber) ||
      Number(playerNumber) < 1 ||
      Number(playerNumber) > 4
    ) {
      throw new Error(
        "Player refunds require a valid player number."
      );
    }

    return `admin-player-refund:${checkoutSessionId}:player-${playerNumber}`;
  }

  if (paymentType === "sponsorship") {
    return `admin-sponsor-refund:${checkoutSessionId}`;
  }

  return `admin-donation-refund:${checkoutSessionId}`;
}

export function getAppsScriptRefundAction(
  paymentType: AdminRefundPaymentType
) {
  if (paymentType === "player") {
    return "playerWithdrawal" as const;
  }

  if (paymentType === "sponsorship") {
    return "sponsorRefund" as const;
  }

  return "donationRefund" as const;
}

export function getStripeAdminRefundSource(
  paymentType: AdminRefundPaymentType
) {
  if (paymentType === "player") {
    return "admin_player_refund" as const;
  }

  if (paymentType === "sponsorship") {
    return "admin_sponsor_refund" as const;
  }

  return "admin_donation_refund" as const;
}
