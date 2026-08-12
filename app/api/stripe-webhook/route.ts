import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
    }

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature." },
        { status: 400 }
      );
    }

    const body = await request.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);

      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session =
      event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const metadata = session.metadata || {};

    // SPONSORSHIP
    if (metadata.paymentType === "sponsorship") {
      await sendToGoogleSheets({
        paymentType: "sponsorship",
        stripeSessionId: session.id,
        company: metadata.company || "",
        contactName: metadata.contactName || "",
        email: metadata.email || "",
        phone: metadata.phone || "",
        website: metadata.website || "",
        sponsorshipName: metadata.sponsorshipName || "",
        sponsorAmount: (session.amount_total || 0) / 100,
        notes: metadata.notes || "",
      });

      return NextResponse.json({
        received: true,
        saved: true,
        type: "sponsorship",
      });
    }

    // DONATION
    if (metadata.paymentType === "donation") {
      await sendToGoogleSheets({
        paymentType: "donation",
        stripeSessionId: session.id,
        donorName: metadata.donorName || "",
        email: metadata.email || "",
        donationAmount: (session.amount_total || 0) / 100,
        anonymous: metadata.anonymous || "No",
        notes: metadata.notes || "",
      });

      return NextResponse.json({
        received: true,
        saved: true,
        type: "donation",
      });
    }

    // PLAYER REGISTRATION
    const playerCount =
      Number(metadata.playerCount || "1");

    const players = [];

    for (let number = 1; number <= playerCount; number++) {
      players.push({
        firstName: metadata[`p${number}FirstName`] || "",
        lastName: metadata[`p${number}LastName`] || "",
        email: metadata[`p${number}Email`] || "",
        phone: metadata[`p${number}Phone`] || "",
        handicap: metadata[`p${number}Handicap`] || "",
        ghin: metadata[`p${number}Ghin`] || "",
        shirtSize: metadata[`p${number}ShirtSize`] || "",
        teeSelection: metadata[`p${number}Tee`] || "",
      });
    }

    const totalPaid =
      (session.amount_total || 0) / 100;

    const amountPerPlayer =
      playerCount > 0
        ? totalPaid / playerCount
        : 0;

    await sendToGoogleSheets({
      registrationId: session.id,
      paymentStatus: "Paid",
      paymentAmount: amountPerPlayer,
      teamName: metadata.teamName || "",
      needsPairing: metadata.needsPairing === "Yes",
      emergencyContactName:
        metadata.emergencyContactName || "",
      emergencyContactPhone:
        metadata.emergencyContactPhone || "",
      capacityHoldId:
        metadata.capacityHoldId || "",
      stripeSessionId: session.id,
      players,
    });

    return NextResponse.json({
      received: true,
      saved: true,
      type: "player",
    });

  } catch (error) {
    console.error("Stripe webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}

async function sendToGoogleSheets(
  data: Record<string, unknown>
) {
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      `Google Sheets returned status ${response.status}`
    );
  }

  const result = await response.json();

  if (!result.ok) {
    throw new Error(
      result.error || "Google Sheets rejected the payment."
    );
  }

  return result;
}