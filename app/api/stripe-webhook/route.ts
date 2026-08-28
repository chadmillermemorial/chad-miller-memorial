import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

export async function POST(
  request: Request
) {
  try {
    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY;

    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured."
      );
    }

    if (!webhookSecret) {
      throw new Error(
        "STRIPE_WEBHOOK_SECRET is not configured."
      );
    }

    const stripe =
      new Stripe(
        stripeSecretKey
      );

    const signature =
      request.headers.get(
        "stripe-signature"
      );

    if (!signature) {
      return NextResponse.json(
        {
          error:
            "Missing Stripe signature.",
        },
        {
          status:
            400,
        }
      );
    }

    const body =
      await request.text();

    let event:
      Stripe.Event;

    try {
      event =
        stripe.webhooks.constructEvent(
          body,
          signature,
          webhookSecret
        );
    } catch (error) {
      console.error(
        "Webhook signature verification failed:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
      We process successful Checkout payments.

      The Apps Script write must finish successfully
      BEFORE we return HTTP 200 to Stripe.

      If Apps Script fails, this route returns HTTP
      500 so Stripe can retry the webhook.
    */
    if (
      event.type !==
      "checkout.session.completed"
    ) {
      return NextResponse.json({
        received:
          true,
      });
    }

    const session =
      event.data.object as
        Stripe.Checkout.Session;

    if (
      session.payment_status !==
      "paid"
    ) {
      return NextResponse.json({
        received:
          true,
      });
    }

    await processPaidCheckout(
      session
    );

    return NextResponse.json({
      received:
        true,
    });

  } catch (error) {
    console.error(
      "Stripe webhook processing failed:",
      error
    );

    /*
      IMPORTANT:

      Do not return 200 here.

      A 500 response tells Stripe that
      persistence failed and allows Stripe
      to retry delivery.
    */
    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      {
        status:
          500,
      }
    );
  }
}

async function processPaidCheckout(
  session:
    Stripe.Checkout.Session
) {
  const metadata =
    session.metadata ||
    {};

  /*
    ========================================================
    SPONSORSHIP
    ========================================================

    Hole Sponsor:
      0 included golfers

    Grey Sponsor:
      4 included golfers

    Blue Sponsor:
      4 included golfers

    Grey and Blue capacity was temporarily reserved
    before Stripe Checkout opened.

    After payment, Apps Script changes that temporary
    hold to "Sponsor Reserved".
  */
  if (
    metadata.paymentType ===
    "sponsorship"
  ) {
    const includedPlayerCount =
      Number(
        metadata.includedPlayerCount ||
        "0"
      );

    if (
      includedPlayerCount !==
        0 &&
      includedPlayerCount !==
        4
    ) {
      throw new Error(
        "Stripe sponsorship contains an invalid included-player count."
      );
    }

    if (
      includedPlayerCount ===
        4 &&
      !metadata.capacityHoldId
    ) {
      throw new Error(
        "Paid sponsor foursome is missing its capacity hold ID."
      );
    }

    await sendToGoogleSheets({
      paymentType:
        "sponsorship",

      stripeSessionId:
        session.id,

      company:
        metadata.company ||
        "",

      contactName:
        metadata.contactName ||
        "",

      email:
        metadata.email ||
        "",

      phone:
        metadata.phone ||
        "",

      website:
        metadata.website ||
        "",

      sponsorshipName:
        metadata.sponsorshipName ||
        "",

      sponsorLevel:
        metadata.sponsorLevel ||
        "",

      sponsorAmount:
        (
          session.amount_total ||
          0
        ) /
        100,

      includedPlayerCount,

      capacityHoldId:
        metadata.capacityHoldId ||
        "",

      notes:
        metadata.notes ||
        "",
    });

    return;
  }

  /*
    ========================================================
    DONATION
    ========================================================
  */
  if (
    metadata.paymentType ===
    "donation"
  ) {
    await sendToGoogleSheets({
      paymentType:
        "donation",

      stripeSessionId:
        session.id,

      donorName:
        metadata.donorName ||
        "",

      email:
        metadata.email ||
        "",

      phone:
        metadata.phone ||
        "",

      donationAmount:
        (
          session.amount_total ||
          0
        ) /
        100,

      registeredPlayer:
        metadata.registeredPlayer ||
        "No",

      anonymous:
        metadata.anonymous ||
        "No",

      publicRecognition:
        metadata.publicRecognition ||
        "No",

      publicRecognitionName:
        metadata.publicRecognitionName ||
        "",

      notes:
        metadata.notes ||
        "",
    });

    return;
  }

  /*
    ========================================================
    PLAYER REGISTRATION
    ========================================================
  */

  const playerCount =
    Number(
      metadata.playerCount ||
      "1"
    );

  if (
    !Number.isInteger(
      playerCount
    ) ||
    playerCount <
      1 ||
    playerCount >
      4
  ) {
    throw new Error(
      "Stripe Checkout contains an invalid player count."
    );
  }

  const players = [];

  for (
    let number = 1;
    number <=
    playerCount;
    number++
  ) {
    players.push({
      firstName:
        metadata[
          `p${number}FirstName`
        ] ||
        "",

      lastName:
        metadata[
          `p${number}LastName`
        ] ||
        "",

      email:
        metadata[
          `p${number}Email`
        ] ||
        "",

      phone:
        metadata[
          `p${number}Phone`
        ] ||
        "",

      handicap:
        metadata[
          `p${number}Handicap`
        ] ||
        "",

      ghin:
        metadata[
          `p${number}Ghin`
        ] ||
        "",

      shirtSize:
        metadata[
          `p${number}ShirtSize`
        ] ||
        "",

      teeSelection:
        metadata[
          `p${number}Tee`
        ] ||
        "",
    });
  }

  const totalPaid =
    (
      session.amount_total ||
      0
    ) /
    100;

  const amountPerPlayer =
    playerCount >
    0
      ? totalPaid /
        playerCount
      : 0;

  await sendToGoogleSheets({
    registrationId:
      session.id,

    paymentStatus:
      "Paid",

    paymentAmount:
      amountPerPlayer,

    teamName:
      metadata.teamName ||
      "",

    needsPairing:
      metadata.needsPairing ===
      "Yes",

    emergencyContactName:
      metadata
        .emergencyContactName ||
      "",

    emergencyContactPhone:
      metadata
        .emergencyContactPhone ||
      "",

    rulesAcknowledgment:
      metadata.rulesAcknowledgment ||
      "",

    photoRelease:
      metadata.photoRelease ||
      "",

    refundPolicyAcknowledgment:
      metadata
        .refundPolicyAcknowledgment ||
      "",

    refundDeadline:
      metadata.refundDeadline ||
      "",

    processingFeeNonRefundable:
      metadata
        .processingFeeNonRefundable ||
      "",

    withdrawalToken:
      metadata.withdrawalToken ||
      "",

    capacityHoldId:
      metadata.capacityHoldId ||
      "",

    waitlistId:
      metadata.waitlistId ||
      "",

    stripeSessionId:
      session.id,

    players,
  });
}

async function sendToGoogleSheets(
  data:
    Record<string, unknown>
) {
  const response =
    await fetch(
      GOOGLE_SCRIPT_URL,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            data
          ),

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Google Sheets returned status ${response.status}`
    );
  }

  const result =
    await response.json();

  if (
    !result.ok
  ) {
    throw new Error(
      result.error ||
        "Google Sheets rejected the payment."
    );
  }

  return result;
}