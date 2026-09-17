import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function GET(request: Request) {
  try {
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }

    const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() || "";

    if (!sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { ok: false, error: "Invalid checkout session." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = session.metadata || {};

    if (
      session.payment_status !== "paid" ||
      metadata.paymentType !== "sponsorship"
    ) {
      return NextResponse.json(
        { ok: false, error: "Paid sponsorship session not found." },
        { status: 404 }
      );
    }

    const includedPlayerCount = Number(metadata.includedPlayerCount || "0");

    return NextResponse.json({
      ok: true,
      sponsorshipName: metadata.sponsorshipName || "",
      includedPlayerCount:
        Number.isFinite(includedPlayerCount) && includedPlayerCount === 4 ? 4 : 0,
      email: metadata.email || session.customer_details?.email || session.customer_email || "",
    });
  } catch (error) {
    console.error("Sponsor session lookup failed:", error);

    return NextResponse.json(
      { ok: false, error: "Unable to confirm sponsorship details." },
      { status: 500 }
    );
  }
}
