import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

type SponsorLevel = "hole" | "grey" | "blue";

export async function POST(request: Request) {
  try {
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }

    const stripe = new Stripe(stripeSecretKey);
    const formData = await request.formData();

    const sponsorLevel =
      formData.get("sponsorLevel")?.toString() as SponsorLevel;

    const company =
      formData.get("company")?.toString().trim() || "";

    const contactName =
      formData.get("contactName")?.toString().trim() || "";

    const email =
      formData.get("email")?.toString().trim() || "";

    const phone =
      formData.get("phone")?.toString().trim() || "";

    const website =
      formData.get("website")?.toString().trim() || "";

    const notes =
      formData.get("notes")?.toString().trim() || "";

    if (!company || !contactName || !email || !phone) {
      throw new Error("Required sponsor information is missing.");
    }

    let amount = 0;
    let sponsorshipName = "";

    if (sponsorLevel === "hole") {
      amount = 500;
      sponsorshipName = "Hole Sponsor";
    } else if (sponsorLevel === "grey") {
      amount = 1000;
      sponsorshipName = "Grey Sponsor";
    } else if (sponsorLevel === "blue") {
      const requestedAmount = Number(
        formData.get("sponsorAmount")?.toString() || "2000"
      );

      amount = Math.max(
        Number.isFinite(requestedAmount)
          ? Math.round(requestedAmount)
          : 2000,
        2000
      );

      sponsorshipName = "Blue Sponsor";
    } else {
      throw new Error("Invalid sponsorship level.");
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_email: email,

      line_items: [
        {
          price_data: {
            currency: "usd",

            product_data: {
              name: `SGM Chad Miller Memorial — ${sponsorshipName}`,
              description: `${company} tournament sponsorship`,
            },

            unit_amount: amount * 100,
          },

          quantity: 1,
        },
      ],

      metadata: {
        paymentType: "sponsorship",
        sponsorLevel,
        sponsorshipName,
        sponsorAmount: String(amount),
        company,
        contactName,
        email,
        phone,
        website: website.slice(0, 450),
        notes: notes.slice(0, 450),
      },

      success_url:
        `${origin}/sponsors/confirmation?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${origin}/sponsors`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Sponsor checkout error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "An unknown sponsorship error occurred.",
      },
      { status: 500 }
    );
  }
}