import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getAdminEnvironment,
  isAdminCookieHeaderAuthenticated,
} from "@/lib/admin-auth";
import { toAdminCheckoutRecord } from "@/lib/admin-records";
import {
  buildFullPaymentRefundPreview,
  buildPlayerRefundPreview,
} from "@/lib/admin-refund-preview";
import {
  getAdminRefundIdempotencyKey,
  getAppsScriptRefundAction,
  getStripeAdminRefundSource,
} from "@/lib/admin-refund-execution";
import { isPlayerRefundSource } from "@/lib/refunds";

export const runtime = "nodejs";
export const maxDuration = 60;

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

function redirectToReview(
  request: Request,
  sessionId: string,
  key: "success" | "error",
  value: string
) {
  const url = new URL(
    "/admin/refund",
    request.url
  );

  url.searchParams.set(
    "session_id",
    sessionId
  );

  url.searchParams.set(key, value);

  return NextResponse.redirect(url, 303);
}

async function sendToGoogleSheets(
  data: Record<string, unknown>
) {
  const response = await fetch(
    GOOGLE_SCRIPT_URL,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Google Sheets returned status ${response.status}`
    );
  }

  const result = await response.json();

  if (!result.ok) {
    throw new Error(
      result.error ||
        "Google Sheets rejected the refund update."
    );
  }

  return result;
}

export async function POST(request: Request) {
  let sessionId = "";

  try {
    const {
      sessionSecret,
    } = getAdminEnvironment({
      ADMIN_PASSWORD:
        process.env.ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET:
        process.env.ADMIN_SESSION_SECRET,
    });

    if (
      !isAdminCookieHeaderAuthenticated(
        request.headers.get("cookie"),
        sessionSecret
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY;

    const googleScriptInternalKey =
      process.env.GOOGLE_SCRIPT_INTERNAL_KEY;

    if (!stripeSecretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured."
      );
    }

    if (!googleScriptInternalKey) {
      throw new Error(
        "GOOGLE_SCRIPT_INTERNAL_KEY is not configured."
      );
    }

    const formData =
      await request.formData();

    sessionId =
      formData
        .get("sessionId")
        ?.toString()
        .trim() || "";

    const confirmed =
      formData.get("confirmation") ===
      "on";

    if (!sessionId || !confirmed) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "A Stripe session and explicit refund confirmation are required.",
        },
        { status: 400 }
      );
    }

    const stripe =
      new Stripe(stripeSecretKey);

    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId,
        {
          expand: [
            "payment_intent.latest_charge.balance_transaction",
          ],
        }
      );

    const record =
      toAdminCheckoutRecord(session);

    if (!record) {
      throw new Error(
        "This is not a recognized paid tournament transaction."
      );
    }

    const paymentIntent =
      session.payment_intent;

    if (
      !paymentIntent ||
      typeof paymentIntent === "string"
    ) {
      throw new Error(
        "Stripe payment information could not be loaded."
      );
    }

    const latestCharge =
      paymentIntent.latest_charge;

    if (
      !latestCharge ||
      typeof latestCharge === "string"
    ) {
      throw new Error(
        "Stripe charge information could not be loaded."
      );
    }

    const balanceTransaction =
      latestCharge.balance_transaction;

    if (
      !balanceTransaction ||
      typeof balanceTransaction === "string"
    ) {
      throw new Error(
        "Stripe processing-fee information could not be loaded."
      );
    }

    const grossAmountCents =
      Number(session.amount_total || 0);

    const processingFeeCents =
      Number(balanceTransaction.fee || 0);

    const refunds =
      await stripe.refunds.list({
        payment_intent: paymentIntent.id,
        limit: 100,
      });

    if (record.type !== "player") {
      const source =
        getStripeAdminRefundSource(
          record.type
        );

      const preview =
        buildFullPaymentRefundPreview({
          checkoutSessionId: session.id,
          grossAmountCents,
          processingFeeCents,
          expectedSource:
            source as
              | "admin_donation_refund"
              | "admin_sponsor_refund",
          refunds: refunds.data,
        });

      if (preview.blockedByUnknownRefund) {
        throw new Error(
          "This transaction contains an unmatched active refund and cannot be safely refunded automatically."
        );
      }

      let refund =
        preview.existingRefundId
          ? refunds.data.find(
              (item) =>
                item.id ===
                preview.existingRefundId
            )
          : undefined;

      if (!refund) {
        refund = await stripe.refunds.create(
          {
            payment_intent:
              paymentIntent.id,
            amount:
              preview.refundAmountCents,
            reason:
              "requested_by_customer",
            metadata: {
              source,
              checkoutSessionId:
                session.id,
              grossPaymentAmount:
                String(
                  preview.grossAmountCents
                ),
              processingFeeWithheld:
                String(
                  preview.processingFeeCents
                ),
            },
          },
          {
            idempotencyKey:
              getAdminRefundIdempotencyKey(
                record.type,
                session.id
              ),
          }
        );
      }

      await sendToGoogleSheets({
        action:
          getAppsScriptRefundAction(
            record.type
          ),
        internalKey:
          googleScriptInternalKey,
        stripeSessionId:
          session.id,
        refundId: refund.id,
        stripeRefundStatus:
          refund.status || "",
        refundAmountCents:
          refund.amount,
        processingFeeCents:
          preview.processingFeeCents,
        refundDate:
          new Date().toISOString(),
      });

      return redirectToReview(
        request,
        session.id,
        "success",
        "1"
      );
    }

    const playerCount = Number(
      session.metadata?.playerCount || "0"
    );

    const preview =
      buildPlayerRefundPreview({
        checkoutSessionId: session.id,
        grossAmountCents,
        processingFeeCents,
        playerCount,
        metadata: session.metadata || {},
        refunds: refunds.data,
      });

    if (preview.blockedByUnknownRefund) {
      throw new Error(
        "This player registration contains an unmatched active refund and cannot be safely changed automatically."
      );
    }

    const selectedPlayerNumbers =
      Array.from(
        new Set(
          formData
            .getAll("playerNumber")
            .map((value) =>
              Number(value.toString())
            )
        )
      ).sort((a, b) => a - b);

    if (
      selectedPlayerNumbers.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Select at least one golfer to refund.",
        },
        { status: 400 }
      );
    }

    const withdrawalToken =
      session.metadata?.withdrawalToken ||
      "";

    if (!withdrawalToken) {
      throw new Error(
        "The registration is missing its server-side withdrawal authorization token."
      );
    }

    for (
      const playerNumber
      of selectedPlayerNumbers
    ) {
      const player =
        preview.players.find(
          (item) =>
            item.playerNumber ===
            playerNumber
        );

      if (!player) {
        throw new Error(
          "An invalid golfer was selected."
        );
      }

      let refund =
        player.existingRefundId
          ? refunds.data.find(
              (item) =>
                item.id ===
                player.existingRefundId
            )
          : undefined;

      if (!refund) {
        refund = await stripe.refunds.create(
          {
            payment_intent:
              paymentIntent.id,
            amount:
              player.refundAmountCents,
            reason:
              "requested_by_customer",
            metadata: {
              source:
                getStripeAdminRefundSource(
                  "player"
                ),
              checkoutSessionId:
                session.id,
              registrationId:
                session.id,
              playerNumber:
                String(playerNumber),
              playerName:
                player.playerName,
              grossRegistrationAmount:
                String(
                  player.grossAmountCents
                ),
              processingFeeWithheld:
                String(
                  player.processingFeeCents
                ),
            },
          },
          {
            idempotencyKey:
              getAdminRefundIdempotencyKey(
                "player",
                session.id,
                playerNumber
              ),
          }
        );
      } else if (
        !isPlayerRefundSource(
          refund.metadata?.source
        )
      ) {
        throw new Error(
          "The existing refund cannot be safely matched to this golfer."
        );
      }

      await sendToGoogleSheets({
        action:
          getAppsScriptRefundAction(
            "player"
          ),
        registrationId:
          session.id,
        stripeSessionId:
          session.id,
        playerNumber,
        playerName:
          player.playerName,
        withdrawalToken,
        refundId:
          refund.id,
        stripeRefundStatus:
          refund.status || "",
        grossRegistrationAmountCents:
          player.grossAmountCents,
        processingFeeCents:
          player.processingFeeCents,
        refundAmountCents:
          refund.amount,
        withdrawalDate:
          new Date().toISOString(),
      });
    }

    return redirectToReview(
      request,
      session.id,
      "success",
      "1"
    );
  } catch (error) {
    console.error(
      "Admin refund error:",
      error
    );

    if (sessionId) {
      return redirectToReview(
        request,
        sessionId,
        "error",
        "1"
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "The admin refund could not be processed.",
      },
      { status: 500 }
    );
  }
}
