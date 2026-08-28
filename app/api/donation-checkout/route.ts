import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
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

    const donorName =
      formData
        .get("donorName")
        ?.toString()
        .trim() || "";

    const email =
      formData
        .get("email")
        ?.toString()
        .trim() || "";

    const phone =
      formData
        .get("phone")
        ?.toString()
        .trim() || "";

    const registeredPlayer =
      formData
        .get("registeredPlayer")
        ?.toString()
        .trim() || "";

    const anonymous =
      formData.get("anonymous") === "on";

    const requestedPublicRecognition =
      formData.get("publicRecognition") ===
      "on";

    const requestedPublicRecognitionName =
      formData
        .get("publicRecognitionName")
        ?.toString()
        .trim() || "";

    const notes =
      formData
        .get("notes")
        ?.toString()
        .trim() || "";

    const requestedAmount =
      Number(
        formData
          .get("donationAmount")
          ?.toString()
      );

    /*
     * Required donor information.
     */
    if (
      !donorName ||
      !email ||
      !phone
    ) {
      throw new Error(
        "Donor name, email, and phone are required."
      );
    }

    if (
      registeredPlayer !== "Yes" &&
      registeredPlayer !== "No"
    ) {
      throw new Error(
        "Please indicate whether you are registered to play in the tournament."
      );
    }

    if (
      !Number.isFinite(
        requestedAmount
      ) ||
      requestedAmount < 1
    ) {
      throw new Error(
        "Donation amount must be at least $1."
      );
    }

    const donationAmount =
      Math.round(
        requestedAmount * 100
      ) / 100;

    /*
     * Public recognition rules are enforced
     * on the server as well as in the form.
     *
     * A donor may only receive community-donor
     * recognition when:
     *
     * - they are NOT registered to play;
     * - the donation is NOT anonymous; and
     * - they explicitly request recognition.
     */
    const publicRecognition =
      registeredPlayer === "No" &&
      !anonymous &&
      requestedPublicRecognition;

    /*
     * If an eligible donor requests recognition
     * but leaves the recognition name blank,
     * use the donor's entered name.
     */
    const publicRecognitionName =
      publicRecognition
        ? (
            requestedPublicRecognitionName ||
            donorName
          ).slice(0, 450)
        : "";

    const metadata: Record<
      string,
      string
    > = {
      paymentType: "donation",

      donorName:
        donorName.slice(0, 450),

      email:
        email.slice(0, 450),

      phone:
        phone.slice(0, 450),

      registeredPlayer,

      anonymous:
        anonymous
          ? "Yes"
          : "No",

      publicRecognition:
        publicRecognition
          ? "Yes"
          : "No",

      publicRecognitionName,

      notes:
        notes.slice(0, 450),
    };

    const origin =
      new URL(
        request.url
      ).origin;

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        customer_email:
          email,

        line_items: [
          {
            price_data: {
              currency:
                "usd",

              product_data: {
                name:
                  "CSM Chad Miller Memorial Donation",

                description:
                  "Contribution benefiting the Command Sergeant Major Chad Miller Memorial Golf Tournament.",
              },

              unit_amount:
                Math.round(
                  donationAmount *
                    100
                ),
            },

            quantity: 1,
          },
        ],

        /*
         * Session metadata is what our Stripe
         * webhook reads after successful payment.
         */
        metadata,

        /*
         * Also store the same metadata on the
         * PaymentIntent for payment/refund auditing.
         */
        payment_intent_data: {
          metadata,
        },

        success_url:
          `${origin}/register/donate/confirmation?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${origin}/register/donate`,
      });

    if (!session.url) {
      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    return NextResponse.redirect(
      session.url,
      303
    );
  } catch (error) {
    console.error(
      "Donation checkout error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "An unknown donation error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}