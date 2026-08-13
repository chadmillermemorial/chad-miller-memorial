import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

// September 25, 2026 at 11:59:59 PM Eastern.
// Eastern Time is UTC-4 on this date.
const REFUND_DEADLINE_UTC =
  Date.UTC(2026, 8, 26, 3, 59, 59);

function getProcessingFeeShare(
  totalProcessingFee: number,
  playerCount: number,
  playerNumber: number
) {
  const baseFee =
    Math.floor(totalProcessingFee / playerCount);

  const remainder =
    totalProcessingFee % playerCount;

  return (
    baseFee +
    (playerNumber <= remainder ? 1 : 0)
  );
}

function activeRefund(
  refund: Stripe.Refund
) {
  const status =
    String(refund.status || "").toLowerCase();

  return (
    status !== "failed" &&
    status !== "canceled"
  );
}

async function updateGoogleSheets(
  data: Record<string, unknown>
) {
  const response =
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    });

  if (!response.ok) {
    throw new Error(
      `Google Sheets returned status ${response.status}`
    );
  }

  const result =
    await response.json();

  if (!result.ok) {
    throw new Error(
      result.error ||
        "Google Sheets rejected the withdrawal update."
    );
  }

  return result;
}

export async function POST(
  request: Request
) {
  try {
    if (!stripeSecretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured."
      );
    }

    const stripe =
      new Stripe(stripeSecretKey);

    const formData =
      await request.formData();

    const sessionId =
      formData
        .get("sessionId")
        ?.toString()
        .trim() || "";

    const withdrawalToken =
      formData
        .get("token")
        ?.toString()
        .trim() || "";

    const withdrawalConfirmation =
      formData.get(
        "withdrawalConfirmation"
      ) === "on";

    const requestedPlayerNumbers =
      formData
        .getAll("playerNumber")
        .map((value) =>
          Number(value.toString())
        );

    if (
      !sessionId ||
      !withdrawalToken
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "The withdrawal link is invalid.",
        },
        { status: 400 }
      );
    }

    if (!withdrawalConfirmation) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "You must confirm the withdrawal before continuing.",
        },
        { status: 400 }
      );
    }

    if (
      requestedPlayerNumbers.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Select at least one golfer to withdraw.",
        },
        { status: 400 }
      );
    }

    if (
      Date.now() >
      REFUND_DEADLINE_UTC
    ) {
      return NextResponse.json(
        {
          ok: false,
          deadlinePassed: true,
          error:
            "The self-service refund deadline has passed. Please contact the tournament organizers if you need assistance.",
        },
        { status: 403 }
      );
    }

    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId,
        {
          expand: [
            "payment_intent.latest_charge.balance_transaction",
          ],
        }
      );

    if (
      session.payment_status !==
      "paid"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This registration does not have a completed payment.",
        },
        { status: 409 }
      );
    }

    const metadata =
      session.metadata || {};

    const storedToken =
      metadata.withdrawalToken || "";

    if (
      !storedToken ||
      withdrawalToken !== storedToken
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "The withdrawal link is invalid.",
        },
        { status: 403 }
      );
    }

    const playerCount =
      Number(
        metadata.playerCount || "0"
      );

    if (
      !Number.isInteger(playerCount) ||
      playerCount < 1 ||
      playerCount > 4
    ) {
      throw new Error(
        "The Stripe registration does not contain a valid player count."
      );
    }

    const uniquePlayerNumbers =
      Array.from(
        new Set(
          requestedPlayerNumbers
        )
      ).sort(
        (a, b) => a - b
      );

    for (
      const playerNumber
      of uniquePlayerNumbers
    ) {
      if (
        !Number.isInteger(
          playerNumber
        ) ||
        playerNumber < 1 ||
        playerNumber > playerCount
      ) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "An invalid golfer was selected.",
          },
          { status: 400 }
        );
      }
    }

    const paymentIntent =
      session.payment_intent;

    if (
      !paymentIntent ||
      typeof paymentIntent ===
        "string"
    ) {
      throw new Error(
        "Stripe payment information could not be loaded."
      );
    }

    const latestCharge =
      paymentIntent.latest_charge;

    if (
      !latestCharge ||
      typeof latestCharge ===
        "string"
    ) {
      throw new Error(
        "Stripe charge information could not be loaded."
      );
    }

    const balanceTransaction =
      latestCharge.balance_transaction;

    if (
      !balanceTransaction ||
      typeof balanceTransaction ===
        "string"
    ) {
      throw new Error(
        "Stripe processing-fee information could not be loaded."
      );
    }

    const totalPaid =
      Number(
        session.amount_total || 0
      );

    if (totalPaid <= 0) {
      throw new Error(
        "The original payment amount could not be determined."
      );
    }

    if (
      totalPaid % playerCount !== 0
    ) {
      throw new Error(
        "The registration payment cannot be divided evenly by golfer."
      );
    }

    const grossPerPlayer =
      totalPaid / playerCount;

    const totalProcessingFee =
      Number(
        balanceTransaction.fee || 0
      );

    const refunds =
      await stripe.refunds.list({
        payment_intent:
          paymentIntent.id,
        limit: 100,
      });

    /*
      If somebody manually issued a refund
      through Stripe, we cannot safely know
      which golfer it belongs to.

      In that situation, disable additional
      self-service refunds for this transaction.
    */
    const unclassifiedRefund =
      refunds.data.find(
        (refund) =>
          activeRefund(refund) &&
          refund.metadata?.source !==
            "player_withdrawal"
      );

    if (unclassifiedRefund) {
      return NextResponse.json(
        {
          ok: false,
          manualRefundPresent: true,
          error:
            "This registration already has a manually processed refund. Please contact the tournament organizers to make additional changes.",
        },
        { status: 409 }
      );
    }

    for (
      const playerNumber
      of uniquePlayerNumbers
    ) {
      const playerName =
        `${
          metadata[
            `p${playerNumber}FirstName`
          ] || ""
        } ${
          metadata[
            `p${playerNumber}LastName`
          ] || ""
        }`.trim();

      /*
        PERMANENT DUPLICATE PROTECTION

        Search Stripe for a refund that is
        already associated with this exact
        registration and golfer.
      */
      let refund =
        refunds.data.find(
          (existingRefund) =>
            activeRefund(
              existingRefund
            ) &&
            existingRefund
              .metadata
              ?.source ===
              "player_withdrawal" &&
            existingRefund
              .metadata
              ?.checkoutSessionId ===
              session.id &&
            Number(
              existingRefund
                .metadata
                ?.playerNumber || "0"
            ) === playerNumber
        );

      const processingFeeShare =
        getProcessingFeeShare(
          totalProcessingFee,
          playerCount,
          playerNumber
        );

      const refundAmount =
        grossPerPlayer -
        processingFeeShare;

      if (refundAmount <= 0) {
        throw new Error(
          `The refund amount for Player ${playerNumber} is invalid.`
        );
      }

      /*
        Only create a Stripe refund if one
        does not already exist for this golfer.
      */
      if (!refund) {
        refund =
          await stripe.refunds.create(
            {
              payment_intent:
                paymentIntent.id,

              amount:
                refundAmount,

              reason:
                "requested_by_customer",

              metadata: {
                source:
                  "player_withdrawal",

                checkoutSessionId:
                  session.id,

                registrationId:
                  session.id,

                playerNumber:
                  String(
                    playerNumber
                  ),

                playerName,

                grossRegistrationAmount:
                  String(
                    grossPerPlayer
                  ),

                processingFeeWithheld:
                  String(
                    processingFeeShare
                  ),
              },
            },
            {
              idempotencyKey:
                `player-withdrawal:${session.id}:player-${playerNumber}`,
            }
          );
      }

      /*
        Update Google Sheets.

        IMPORTANT:
        The private withdrawal token is sent
        here so Apps Script can compare its
        SHA-256 hash against the hash stored
        with the original registration.

        If Sheets fails after Stripe succeeds,
        the user can safely retry. The existing
        Stripe refund will be found above and
        another refund will NOT be created.
      */
      await updateGoogleSheets({
        action:
          "playerWithdrawal",

        registrationId:
          session.id,

        stripeSessionId:
          session.id,

        playerNumber,

        playerName,

        withdrawalToken,

        refundId:
          refund.id,

        stripeRefundStatus:
          refund.status || "",

        grossRegistrationAmountCents:
          grossPerPlayer,

        processingFeeCents:
          processingFeeShare,

        refundAmountCents:
          refund.amount,

        withdrawalDate:
          new Date().toISOString(),
      });
    }

    const returnUrl =
      new URL(
        "/register/player/manage",
        request.url
      );

    returnUrl.searchParams.set(
      "session_id",
      session.id
    );

    returnUrl.searchParams.set(
      "token",
      withdrawalToken
    );

    returnUrl.searchParams.set(
      "updated",
      "1"
    );

    return NextResponse.redirect(
      returnUrl,
      303
    );
  } catch (error) {
    console.error(
      "Player withdrawal error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "An unknown withdrawal error occurred.",
      },
      { status: 500 }
    );
  }
}