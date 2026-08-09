import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzwwzOmHMHnTlPmw8eOQ4RtzOAisgAmEjm1wxc-aK6_bplj8ZYFHxNuCrBSBJlym1UcDg/exec";

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

    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const metadata = session.metadata || {};
    const playerCount = Number(metadata.playerCount || "1");

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

    const totalPaid = (session.amount_total || 0) / 100;

    const amountPerPlayer =
      playerCount > 0 ? totalPaid / playerCount : 0;

    const registration = {
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
    };

    const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registration),
    });

    if (!googleResponse.ok) {
      throw new Error(
        `Google Sheets returned status ${googleResponse.status}`
      );
    }

    const googleResult = await googleResponse.json();

    if (!googleResult.ok) {
      throw new Error(
        googleResult.error ||
          "Google Sheets rejected the registration."
      );
    }

    console.log(`Paid registration saved: ${session.id}`);

    return NextResponse.json({
      received: true,
      saved: true,
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}