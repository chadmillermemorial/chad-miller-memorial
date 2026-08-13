import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

const REFUND_DEADLINE =
  "September 25, 2026 at 11:59 PM ET";

type RegistrationType =
  | "individual"
  | "pair"
  | "threesome"
  | "foursome";

const playerCounts: Record<RegistrationType, number> = {
  individual: 1,
  pair: 2,
  threesome: 3,
  foursome: 4,
};

export async function POST(request: Request) {
  let capacityHoldId = "";

  try {
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }

    const stripe = new Stripe(stripeSecretKey);

    const formData = await request.formData();

    const registrationType =
      formData.get("registrationType")?.toString() as RegistrationType;

    if (!registrationType || !playerCounts[registrationType]) {
      throw new Error("Invalid registration type.");
    }

    const playerCount = playerCounts[registrationType];

    const players = [1, 2, 3, 4].map((number) => ({
      firstName:
        formData.get(`player${number}FirstName`)?.toString().trim() || "",
      lastName:
        formData.get(`player${number}LastName`)?.toString().trim() || "",
      email:
        formData.get(`player${number}Email`)?.toString().trim() || "",
      phone:
        formData.get(`player${number}Phone`)?.toString().trim() || "",
      handicap:
        formData.get(`player${number}Handicap`)?.toString().trim() || "",
      ghin:
        formData.get(`player${number}Ghin`)?.toString().trim() || "",
      shirtSize:
        formData.get(`player${number}ShirtSize`)?.toString().trim() || "",
      teeSelection:
        formData.get(`player${number}TeeSelection`)?.toString().trim() || "",
    }));

    const activePlayers = players.slice(0, playerCount);

    for (let i = 0; i < activePlayers.length; i++) {
      const player = activePlayers[i];

      if (
        !player.firstName ||
        !player.lastName ||
        !player.email ||
        !player.phone ||
        !player.shirtSize ||
        !player.teeSelection
      ) {
        throw new Error(
          `Required information is missing for Player ${i + 1}.`
        );
      }
    }

    const emergencyContactName =
      formData.get("emergencyContactName")?.toString().trim() || "";

    const emergencyContactPhone =
      formData.get("emergencyContactPhone")?.toString().trim() || "";

    if (!emergencyContactName || !emergencyContactPhone) {
      throw new Error("Emergency contact information is required.");
    }

    const rulesAcknowledgment =
      formData.get("rulesAcknowledgment") === "on";

    const photoRelease =
      formData.get("photoRelease") === "on";

    const refundPolicyAcknowledgment =
      formData.get("refundPolicyAcknowledgment") === "on";

    if (
      !rulesAcknowledgment ||
      !photoRelease ||
      !refundPolicyAcknowledgment
    ) {
      throw new Error(
        "Required acknowledgments must be accepted."
      );
    }

    const teamName =
      formData.get("teamName")?.toString().trim() || "";

    // This private token will be used in the player's
    // self-service withdrawal/refund link.
    const withdrawalToken = randomUUID();

    // Reserve the requested player spots before opening Stripe Checkout.
    const capacityResponse = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "reserveCapacity",
        playerCount,
      }),
    });

    const capacityResult = await capacityResponse.json();

    if (!capacityResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          registrationFull: capacityResult.full || false,
          remaining: capacityResult.remaining ?? 0,
          error:
            capacityResult.message ||
            "There are not enough tournament spots remaining.",
        },
        { status: 409 }
      );
    }

    capacityHoldId = capacityResult.holdId;

    const metadata: Record<string, string> = {
      registrationType,
      playerCount: String(playerCount),
      teamName,
      needsPairing: playerCount < 4 ? "Yes" : "No",
      emergencyContactName,
      emergencyContactPhone,
      rulesAcknowledgment: "Yes",
      photoRelease: "Yes",
      refundPolicyAcknowledgment: "Yes",
      refundDeadline: REFUND_DEADLINE,
      processingFeeNonRefundable: "Yes",
      withdrawalToken,
      capacityHoldId,
    };

    activePlayers.forEach((player, index) => {
      const number = index + 1;

      metadata[`p${number}FirstName`] = player.firstName;
      metadata[`p${number}LastName`] = player.lastName;
      metadata[`p${number}Email`] = player.email;
      metadata[`p${number}Phone`] = player.phone;
      metadata[`p${number}Handicap`] = player.handicap;
      metadata[`p${number}Ghin`] = player.ghin;
      metadata[`p${number}ShirtSize`] = player.shirtSize;
      metadata[`p${number}Tee`] = player.teeSelection;
    });

    let registrationLabel = "Individual Registration";

    if (playerCount === 2) {
      registrationLabel = "Pair Registration";
    }

    if (playerCount === 3) {
      registrationLabel = "Threesome Registration";
    }

    if (playerCount === 4) {
      registrationLabel = "Foursome Registration";
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      customer_email: activePlayers[0].email,

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "SGM Chad Miller Memorial Golf Tournament",
              description: registrationLabel,
            },
            unit_amount: 7500,
          },
          quantity: playerCount,
        },
      ],

      metadata,

      // Store the same registration metadata on the PaymentIntent.
      // This will make the future refund workflow easier to audit.
      payment_intent_data: {
        metadata,
      },

      success_url:
        `${origin}/register/player/confirmation?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${origin}/register/player`,

      expires_at:
        Math.floor(Date.now() / 1000) + 30 * 60,
    });

    if (!session.url) {
      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    // If Stripe fails after we reserved spots, release the hold.
    if (capacityHoldId) {
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "releaseCapacity",
            holdId: capacityHoldId,
          }),
        });
      } catch (releaseError) {
        console.error(
          "Could not release capacity hold:",
          releaseError
        );
      }
    }

    console.error(
      "Player registration checkout error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "An unknown registration error occurred.",
      },
      { status: 500 }
    );
  }
}