import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  try {
    if (!stripeSecretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is missing. Check .env.local and restart npm run dev."
      );
    }

    if (!stripeSecretKey.startsWith("sk_test_")) {
      throw new Error(
        `STRIPE_SECRET_KEY is the wrong kind of key. It currently starts with "${stripeSecretKey.slice(
          0,
          8
        )}". For local testing it must start with "sk_test_".`
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const formData = await request.formData();

    const registrationType = String(
      formData.get("registrationType") || "individual"
    );

    if (
      registrationType !== "individual" &&
      registrationType !== "foursome"
    ) {
      throw new Error(`Invalid registrationType: ${registrationType}`);
    }

    const playerCount = registrationType === "foursome" ? 4 : 1;

    const players = [1, 2, 3, 4].map((number) => ({
      firstName: String(formData.get(`player${number}FirstName`) || ""),
      lastName: String(formData.get(`player${number}LastName`) || ""),
      email: String(formData.get(`player${number}Email`) || ""),
      phone: String(formData.get(`player${number}Phone`) || ""),
      handicap: String(formData.get(`player${number}Handicap`) || ""),
      ghin: String(formData.get(`player${number}Ghin`) || ""),
      shirtSize: String(formData.get(`player${number}ShirtSize`) || ""),
      teeSelection: String(
        formData.get(`player${number}TeeSelection`) || ""
      ),
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
          `Player ${i + 1} is missing required information.`
        );
      }
    }

    const emergencyContactName = String(
      formData.get("emergencyContactName") || ""
    );

    const emergencyContactPhone = String(
      formData.get("emergencyContactPhone") || ""
    );

    if (!emergencyContactName || !emergencyContactPhone) {
      throw new Error("Emergency contact information is required.");
    }

    const rulesAcknowledgment =
      formData.get("rulesAcknowledgment") === "on";

    const photoRelease = formData.get("photoRelease") === "on";

    if (!rulesAcknowledgment) {
      throw new Error("Tournament rules acknowledgment is required.");
    }

    if (!photoRelease) {
      throw new Error("Photo release acknowledgment is required.");
    }

    const teamName = String(formData.get("teamName") || "");
    const needsPairing = formData.get("needsPairing") === "on";

    const metadata: Record<string, string> = {
      registrationType,
      playerCount: String(playerCount),
      teamName,
      needsPairing: needsPairing ? "Yes" : "No",
      emergencyContactName,
      emergencyContactPhone,
      rulesAcknowledgment: "Yes",
      photoRelease: "Yes",
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
              description:
                registrationType === "foursome"
                  ? "Foursome Registration — 4 Players"
                  : "Individual Player Registration",
            },
            unit_amount: 7500,
          },
          quantity: playerCount,
        },
      ],

      metadata,

      success_url: `${origin}/register/player/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/register/player`,
    });

    if (!session.url) {
      throw new Error("Stripe created a session but did not return a checkout URL.");
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error: unknown) {
    console.error("Stripe checkout diagnostic error:", error);

    let message = "Unknown checkout error";

    if (error instanceof Error) {
      message = error.message;
    }

    const stripeError = error as {
      type?: string;
      code?: string;
      decline_code?: string;
      param?: string;
      raw?: {
        message?: string;
        type?: string;
        code?: string;
        param?: string;
      };
    };

    return NextResponse.json(
      {
        ok: false,
        diagnostic: {
          message,
          type: stripeError?.type || stripeError?.raw?.type || null,
          code: stripeError?.code || stripeError?.raw?.code || null,
          param: stripeError?.param || stripeError?.raw?.param || null,
          rawMessage: stripeError?.raw?.message || null,
        },
      },
      { status: 500 }
    );
  }
}