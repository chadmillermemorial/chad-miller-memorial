import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  try {
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }

    const stripe = new Stripe(stripeSecretKey);
    const formData = await request.formData();

    const donorName =
      formData.get("donorName")?.toString().trim() || "";

    const email =
      formData.get("email")?.toString().trim() || "";

    const anonymous =
      formData.get("anonymous") === "on";

    const notes =
      formData.get("notes")?.toString().trim() || "";

    const requestedAmount = Number(
      formData.get("donationAmount")?.toString()
    );

    if (!donorName || !email) {
      throw new Error("Donor name and email are required.");
    }

    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount < 1
    ) {
      throw new Error("Donation amount must be at least $1.");
    }

    const donationAmount =
      Math.round(requestedAmount * 100) / 100;

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "usd",

            product_data: {
              name: "SGM Chad Miller Memorial Donation",
              description:
                "Contribution benefiting the Sergeant Major Chad Miller Memorial Golf Tournament.",
            },

            unit_amount: Math.round(donationAmount * 100),
          },

          quantity: 1,
        },
      ],

      metadata: {
        paymentType: "donation",
        donorName,
        email,
        anonymous: anonymous ? "Yes" : "No",
        notes: notes.slice(0, 450),
      },

      success_url:
        `${origin}/register/donate/confirmation?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${origin}/register/donate`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Donation checkout error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "An unknown donation error occurred.",
      },
      { status: 500 }
    );
  }
}