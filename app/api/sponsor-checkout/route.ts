import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY;

const googleScriptInternalKey =
  process.env.GOOGLE_SCRIPT_INTERNAL_KEY;

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

type SponsorLevel =
  | "hole"
  | "grey"
  | "blue";

export async function POST(
  request: Request
) {
  let capacityHoldId = "";

  const origin =
    new URL(
      request.url
    ).origin;

  try {
    if (!stripeSecretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured."
      );
    }

    const stripe =
      new Stripe(
        stripeSecretKey
      );

    const formData =
      await request.formData();

    const sponsorLevel =
      formData
        .get("sponsorLevel")
        ?.toString() as SponsorLevel;

    const company =
      formData
        .get("company")
        ?.toString()
        .trim() || "";

    const contactName =
      formData
        .get("contactName")
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

    const website =
      formData
        .get("website")
        ?.toString()
        .trim() || "";

    const notes =
      formData
        .get("notes")
        ?.toString()
        .trim() || "";

    if (
      !company ||
      !contactName ||
      !email ||
      !phone
    ) {
      throw new Error(
        "Required sponsor information is missing."
      );
    }

    let amount = 0;

    let sponsorshipName =
      "";

    let includedPlayerCount =
      0;

    if (
      sponsorLevel === "hole"
    ) {
      amount = 500;

      sponsorshipName =
        "Hole Sponsor";

      includedPlayerCount = 0;
    }

    else if (
      sponsorLevel === "grey"
    ) {
      amount = 1000;

      sponsorshipName =
        "Grey Sponsor";

      includedPlayerCount = 4;
    }

    else if (
      sponsorLevel === "blue"
    ) {
      const requestedAmount =
        Number(
          formData
            .get("sponsorAmount")
            ?.toString() ||
          "2000"
        );

      amount =
        Math.max(
          Number.isFinite(
            requestedAmount
          )
            ? Math.round(
                requestedAmount
              )
            : 2000,
          2000
        );

      sponsorshipName =
        "Blue Sponsor";

      includedPlayerCount = 4;
    }

    else {
      throw new Error(
        "Invalid sponsorship level."
      );
    }

    /*
      Only Grey and Blue sponsorships need
      access to the protected sponsor-capacity
      endpoint.
    */
    if (
      includedPlayerCount === 4 &&
      !googleScriptInternalKey
    ) {
      throw new Error(
        "GOOGLE_SCRIPT_INTERNAL_KEY is not configured."
      );
    }

    /*
      Grey and Blue sponsorships include
      one foursome.

      Reserve exactly four physical player
      spots before sending the sponsor to
      Stripe Checkout.
    */
    if (
      includedPlayerCount === 4
    ) {
      const capacityResponse =
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
              JSON.stringify({
                action:
                  "reserveSponsorCapacity",

                playerCount:
                  4,

                internalKey:
                  googleScriptInternalKey,
              }),
          }
        );

      if (
        !capacityResponse.ok
      ) {
        throw new Error(
          "Unable to verify tournament capacity."
        );
      }

      const capacityResult =
        await capacityResponse
          .json();

      if (
        !capacityResult.ok
      ) {
        /*
          A legitimate capacity denial contains
          the remaining-capacity information.

          Security/configuration failures should
          not be disguised as "not enough spots."
        */
        const capacityUnavailable =
          capacityResult.full === true ||
          typeof capacityResult.remaining ===
            "number";

        if (
          !capacityUnavailable
        ) {
          throw new Error(
            capacityResult.error ||
            capacityResult.message ||
            "Unable to reserve sponsor tournament capacity."
          );
        }

        const unavailableUrl =
          new URL(
            "/sponsors",
            origin
          );

        unavailableUrl
          .searchParams
          .set(
            "capacity",
            "insufficient"
          );

        return NextResponse.redirect(
          unavailableUrl,
          303
        );
      }

      capacityHoldId =
        String(
          capacityResult.holdId ||
          ""
        ).trim();

      if (
        !capacityHoldId
      ) {
        throw new Error(
          "Tournament capacity was reserved but no hold ID was returned."
        );
      }
    }

    const metadata:
      Record<string, string> = {
        paymentType:
          "sponsorship",

        sponsorLevel,

        sponsorshipName,

        sponsorAmount:
          String(
            amount
          ),

        includedPlayerCount:
          String(
            includedPlayerCount
          ),

        capacityHoldId,

        company,

        contactName,

        email,

        phone,

        website:
          website.slice(
            0,
            450
          ),

        notes:
          notes.slice(
            0,
            450
          ),
      };

    const cancelUrl =
      capacityHoldId
        ? `${origin}/api/sponsor-cancel?holdId=${encodeURIComponent(
            capacityHoldId
          )}`
        : `${origin}/sponsors`;

    const session =
      await stripe
        .checkout
        .sessions
        .create({
          mode:
            "payment",

          customer_email:
            email,

          line_items: [
            {
              price_data: {
                currency:
                  "usd",

                product_data: {
                  name:
                    `SGM Chad Miller Memorial — ${sponsorshipName}`,

                  description:
                    includedPlayerCount ===
                    4
                      ? `${company} tournament sponsorship — includes one foursome`
                      : `${company} tournament sponsorship`,
                },

                unit_amount:
                  amount * 100,
              },

              quantity:
                1,
            },
          ],

          metadata,

          payment_intent_data: {
            metadata,
          },

          success_url:
            `${origin}/sponsors/confirmation?session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            cancelUrl,

          expires_at:
            Math.floor(
              Date.now() /
              1000
            ) +
            30 * 60,
        });

    if (
      !session.url
    ) {
      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    return NextResponse.redirect(
      session.url,
      303
    );

  } catch (error) {
    /*
      If we successfully reserved four sponsor
      spots but Stripe Checkout creation failed,
      release the hold through the protected
      sponsor-only endpoint.
    */
    if (
      capacityHoldId &&
      googleScriptInternalKey
    ) {
      try {
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
              JSON.stringify({
                action:
                  "releaseSponsorCapacity",

                holdId:
                  capacityHoldId,

                internalKey:
                  googleScriptInternalKey,
              }),
          }
        );

      } catch (
        releaseError
      ) {
        console.error(
          "Could not release sponsor capacity hold:",
          releaseError
        );
      }
    }

    console.error(
      "Sponsor checkout error:",
      error
    );

    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof Error
            ? error.message
            : "An unknown sponsorship error occurred.",
      },
      {
        status:
          500,
      }
    );
  }
}