import { after, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 60;

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

export async function POST(request: Request) {
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
      new Stripe(stripeSecretKey);

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
        { status: 400 }
      );
    }

    const body =
      await request.text();

    let event: Stripe.Event;

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
        { status: 400 }
      );
    }

    /*
      We only care about completed Checkout sessions.
    */
    if (
      event.type !==
      "checkout.session.completed"
    ) {
      return NextResponse.json({
        received: true,
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
        received: true,
      });
    }

    /*
      IMPORTANT:

      Stripe gets its successful response immediately.

      Google Sheets and confirmation-email processing
      continue after the response has been returned.

      This preserves the webhook timeout fix.
    */
    after(async () => {
      try {
        await processPaidCheckout(
          session
        );
      } catch (error) {
        console.error(
          "Background payment processing failed:",
          error
        );
      }
    });

    return NextResponse.json({
      received: true,
    });

  } catch (error) {
    console.error(
      "Stripe webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}

async function processPaidCheckout(
  session: Stripe.Checkout.Session
) {
  const metadata =
    session.metadata || {};

  /*
    SPONSORSHIP
  */
  if (
    metadata.paymentType ===
    "sponsorship"
  ) {
    await sendToGoogleSheetsWithRetry({
      paymentType:
        "sponsorship",

      stripeSessionId:
        session.id,

      company:
        metadata.company || "",

      contactName:
        metadata.contactName || "",

      email:
        metadata.email || "",

      phone:
        metadata.phone || "",

      website:
        metadata.website || "",

      sponsorshipName:
        metadata.sponsorshipName || "",

      sponsorAmount:
        (session.amount_total || 0) /
        100,

      notes:
        metadata.notes || "",
    });

    return;
  }

  /*
    DONATION
  */
  if (
    metadata.paymentType ===
    "donation"
  ) {
    await sendToGoogleSheetsWithRetry({
      paymentType:
        "donation",

      stripeSessionId:
        session.id,

      donorName:
        metadata.donorName || "",

      email:
        metadata.email || "",

      donationAmount:
        (session.amount_total || 0) /
        100,

      anonymous:
        metadata.anonymous || "No",

      notes:
        metadata.notes || "",
    });

    return;
  }

  /*
    PLAYER REGISTRATION
  */
  const playerCount =
    Number(
      metadata.playerCount || "1"
    );

  if (
    !Number.isInteger(
      playerCount
    ) ||
    playerCount < 1 ||
    playerCount > 4
  ) {
    throw new Error(
      "Stripe Checkout contains an invalid player count."
    );
  }

  const players = [];

  for (
    let number = 1;
    number <= playerCount;
    number++
  ) {
    players.push({
      firstName:
        metadata[
          `p${number}FirstName`
        ] || "",

      lastName:
        metadata[
          `p${number}LastName`
        ] || "",

      email:
        metadata[
          `p${number}Email`
        ] || "",

      phone:
        metadata[
          `p${number}Phone`
        ] || "",

      handicap:
        metadata[
          `p${number}Handicap`
        ] || "",

      ghin:
        metadata[
          `p${number}Ghin`
        ] || "",

      shirtSize:
        metadata[
          `p${number}ShirtSize`
        ] || "",

      teeSelection:
        metadata[
          `p${number}Tee`
        ] || "",
    });
  }

  const totalPaid =
    (session.amount_total || 0) /
    100;

  const amountPerPlayer =
    playerCount > 0
      ? totalPaid / playerCount
      : 0;

  await sendToGoogleSheetsWithRetry({
    registrationId:
      session.id,

    paymentStatus:
      "Paid",

    paymentAmount:
      amountPerPlayer,

    teamName:
      metadata.teamName || "",

    needsPairing:
      metadata.needsPairing ===
      "Yes",

    emergencyContactName:
      metadata.emergencyContactName ||
      "",

    emergencyContactPhone:
      metadata.emergencyContactPhone ||
      "",

    rulesAcknowledgment:
      metadata.rulesAcknowledgment ||
      "",

    photoRelease:
      metadata.photoRelease || "",

    refundPolicyAcknowledgment:
      metadata
        .refundPolicyAcknowledgment ||
      "",

    refundDeadline:
      metadata.refundDeadline || "",

    processingFeeNonRefundable:
      metadata
        .processingFeeNonRefundable ||
      "",

    /*
      This is the private token created when
      Checkout was opened.

      Apps Script stores only its SHA-256 hash,
      while the confirmation email receives
      the original token in the private
      registration-management link.
    */
    withdrawalToken:
      metadata.withdrawalToken || "",

    capacityHoldId:
      metadata.capacityHoldId || "",

    /*
      Preserve waitlist information if the
      registration originated from a waitlist
      offer.
    */
    waitlistId:
      metadata.waitlistId || "",

    stripeSessionId:
      session.id,

    players,
  });
}

async function sendToGoogleSheetsWithRetry(
  data: Record<string, unknown>
) {
  const attempts = 3;

  for (
    let attempt = 1;
    attempt <= attempts;
    attempt++
  ) {
    try {
      return await sendToGoogleSheets(
        data
      );
    } catch (error) {
      console.error(
        `Google Sheets attempt ${attempt} failed:`,
        error
      );

      if (
        attempt === attempts
      ) {
        throw error;
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            2000 * attempt
          )
      );
    }
  }
}

async function sendToGoogleSheets(
  data: Record<string, unknown>
) {
  const response =
    await fetch(
      GOOGLE_SCRIPT_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(data),
      }
    );

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
        "Google Sheets rejected the payment."
    );
  }

  return result;
}