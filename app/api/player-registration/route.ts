import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8JNX9r6r5aFIYg3bYpetDnUy54ywxcaoN_qX3upY5TQH_4poQIeXxyWSxL9f22fhHqQ/exec";

const REFUND_DEADLINE = "September 25, 2026 at 11:59 PM ET";
const PRICE_PER_PLAYER = 7500;

const playerCounts = {
  individual: 1,
  pair: 2,
  threesome: 3,
  foursome: 4,
};

type RegistrationType = keyof typeof playerCounts;

type ScriptReply = {
  ok: boolean;
  message?: string;
  error?: string;
  holdId?: string;
  expiresAt?: string;
  stripeSessionId?: string;
  holdProtocol?: string;
  holdStatus?: string;
  reused?: boolean;
  alreadyRegistered?: boolean;
  full?: boolean;
  remaining?: number;
};

class CheckoutProblem extends Error {
  constructor(
    message: string,
    public status = 503,
    public retry = true,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "CheckoutProblem";
  }
}

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new CheckoutProblem(
      "Payment configuration needs organizer attention.",
      503,
      false
    );
  }

  return key;
}

function digest(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function signedToken(key: string, text: string): string {
  return createHmac("sha256", key).update(text).digest("hex");
}

function holdIdFor(attemptId: string): string {
  return "PLAYER-" + digest("player-capacity-v2:" + attemptId);
}

function requestOptions(
  deadline: number,
  idempotencyKey?: string
): Stripe.RequestOptions {
  const timeout = Math.min(8000, deadline - Date.now() - 500);

  if (timeout < 1000) {
    throw new CheckoutProblem(
      "The request timed out. Please retry this same checkout."
    );
  }

  return {
    timeout,
    maxNetworkRetries: 0,
    ...(idempotencyKey ? { idempotencyKey } : {}),
  };
}

async function scriptCall(
  data: Record<string, unknown>,
  deadline: number
): Promise<ScriptReply> {
  const body = JSON.stringify(data);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const timeout = requestOptions(deadline).timeout as number;

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        throw new Error("Capacity service HTTP error.");
      }

      const result = (await response.json()) as ScriptReply;

      if (!result || typeof result.ok !== "boolean") {
        throw new Error("Invalid capacity response.");
      }

      if (
        data.action === "reserveCapacity" &&
        result.ok &&
        (!result.holdId || !result.expiresAt)
      ) {
        throw new Error(
          "Reservation response is missing its hold details."
        );
      }

      if (
        !result.ok &&
        /lock timeout|timed out|temporar|try again/i.test(
          result.error || result.message || ""
        )
      ) {
        throw new Error("Capacity service temporarily busy.");
      }

      return result;
    } catch {
      if (attempt === 1) {
        throw new CheckoutProblem(
          "Tournament capacity could not be verified. Please retry this same checkout."
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new CheckoutProblem(
    "Tournament capacity could not be verified."
  );
}

function requireSuccess(reply: ScriptReply): void {
  if (!reply.ok) {
    throw new CheckoutProblem(
      reply.message ||
        reply.error ||
        "The player hold could not be verified."
    );
  }
}

function redirectTo(url: string | URL): Response {
  const response = NextResponse.redirect(url, 303);

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}

function confirmation(
  origin: string,
  sessionId: string
): Response {
  const url = new URL(
    "/register/player/confirmation",
    origin
  );

  url.searchParams.set("session_id", sessionId);

  return redirectTo(url);
}

function verifySession(
  session: Stripe.Checkout.Session,
  holdId: string,
  attemptId: string,
  fingerprint?: string
): void {
  const metadata = session.metadata || {};
  const count = Number(metadata.playerCount);

  if (
    session.mode !== "payment" ||
    metadata.paymentType ||
    metadata.capacityHoldId !== holdId ||
    metadata.registrationAttemptId !== attemptId ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 4 ||
    session.amount_total !== count * PRICE_PER_PLAYER ||
    session.currency !== "usd"
  ) {
    throw new CheckoutProblem(
      "The checkout does not match this player reservation. Contact the organizer before paying.",
      409,
      false
    );
  }

  if (
    fingerprint &&
    metadata.registrationFingerprint !== fingerprint
  ) {
    throw new CheckoutProblem(
      "An existing checkout has different registration details. Use or cancel that original checkout; do not start a second payment.",
      409,
      false
    );
  }
}

async function findExistingSession(
  stripe: Stripe,
  holdId: string,
  attemptId: string,
  holdExpiry: number,
  deadline: number
): Promise<Stripe.Checkout.Session | undefined> {
  let startingAfter: string | undefined;

  /*
   * Recover a checkout when Stripe created it but its response
   * or the subsequent Google Sheets update was lost.
   */
  for (let pageNumber = 0; pageNumber < 5; pageNumber++) {
    const page = await stripe.checkout.sessions.list(
      {
        created: {
          gte: Math.floor(holdExpiry / 1000) - 36 * 60,
        },
        limit: 100,
        ...(startingAfter
          ? { starting_after: startingAfter }
          : {}),
      },
      requestOptions(deadline)
    );

    const match = page.data.find(
      (session) =>
        session.metadata?.capacityHoldId === holdId &&
        session.metadata?.registrationAttemptId === attemptId
    );

    if (match) {
      return match;
    }

    if (!page.has_more) {
      return undefined;
    }

    startingAfter = page.data[page.data.length - 1]?.id;

    if (!startingAfter) {
      break;
    }
  }

  throw new CheckoutProblem(
    "An earlier checkout could not be ruled out. Contact the organizer before starting another payment.",
    503,
    false
  );
}

export async function POST(request: Request) {
  const deadline = Date.now() + 55000;
  let form: FormData | undefined;

  try {
    const key = secretKey();

    const stripe = new Stripe(key, {
      maxNetworkRetries: 0,
      timeout: 8000,
    });

    const origin = new URL(request.url).origin;

    form = await request.formData();

    const submittedForm = form;

    const field = (
      name: string,
      required = false,
      maxLength = 500
    ): string => {
      const raw = submittedForm.get(name);

      if (raw !== null && typeof raw !== "string") {
        throw new CheckoutProblem(
          "Invalid registration field: " + name,
          400,
          false
        );
      }

      const value = (raw || "").trim();

      if (
        (required && !value) ||
        value.length > maxLength
      ) {
        throw new CheckoutProblem(
          "Please check the registration field: " + name,
          400,
          false
        );
      }

      return value;
    };

    const registrationType = field(
      "registrationType",
      true,
      20
    ) as RegistrationType;

    if (
      !Object.prototype.hasOwnProperty.call(
        playerCounts,
        registrationType
      )
    ) {
      throw new CheckoutProblem(
        "Invalid registration type.",
        400,
        false
      );
    }

    const playerCount = playerCounts[registrationType];

    const registrationAttemptId =
      field("registrationAttemptId", false, 100) ||
      randomUUID();

    if (
      !/^[A-Za-z0-9_-]{16,100}$/.test(
        registrationAttemptId
      )
    ) {
      throw new CheckoutProblem(
        "Refresh the registration form before continuing.",
        400,
        false
      );
    }

    form.set(
      "registrationAttemptId",
      registrationAttemptId
    );

    const holdId = holdIdFor(registrationAttemptId);

    const waitlistId = field(
      "waitlistId",
      false,
      100
    );

    const offerToken = field(
      "offerToken",
      false,
      500
    );

    if (
      Boolean(waitlistId) !== Boolean(offerToken)
    ) {
      throw new CheckoutProblem(
        "The private waitlist registration link is incomplete.",
        400,
        false
      );
    }

    for (const name of [
      "rulesAcknowledgment",
      "photoRelease",
      "refundPolicyAcknowledgment",
    ]) {
      if (form.get(name) !== "on") {
        throw new CheckoutProblem(
          "Required acknowledgments must be accepted.",
          400,
          false
        );
      }
    }

    /*
     * These values remain identical on every retry of
     * this registration attempt.
     */
    const metadata: Record<string, string> = {
      registrationType,
      playerCount: String(playerCount),
      teamName: field("teamName"),
      needsPairing: playerCount < 4 ? "Yes" : "No",
      emergencyContactName: field(
        "emergencyContactName",
        true
      ),
      emergencyContactPhone: field(
        "emergencyContactPhone",
        true,
        100
      ),
      rulesAcknowledgment: "Yes",
      photoRelease: "Yes",
      refundPolicyAcknowledgment: "Yes",
      refundDeadline: REFUND_DEADLINE,
      processingFeeNonRefundable: "Yes",
      withdrawalToken: signedToken(
        key,
        "player-withdrawal-v2:" +
          registrationAttemptId
      ),
      capacityHoldId: holdId,
      registrationAttemptId,
    };

    if (waitlistId) {
      metadata.waitlistId = waitlistId;
    }

    for (let n = 1; n <= playerCount; n++) {
      metadata[`p${n}FirstName`] = field(
        `player${n}FirstName`,
        true,
        200
      );

      metadata[`p${n}LastName`] = field(
        `player${n}LastName`,
        true,
        200
      );

      metadata[`p${n}Email`] = field(
        `player${n}Email`,
        true,
        320
      );

      metadata[`p${n}Phone`] = field(
        `player${n}Phone`,
        true,
        100
      );

      metadata[`p${n}Handicap`] = field(
        `player${n}Handicap`
      );

      metadata[`p${n}Ghin`] = field(
        `player${n}Ghin`
      );

      metadata[`p${n}ShirtSize`] = field(
        `player${n}ShirtSize`,
        true,
        20
      );

      metadata[`p${n}Tee`] = field(
        `player${n}TeeSelection`,
        true,
        20
      );

      if (
        !/^\S+@\S+\.\S+$/.test(
          metadata[`p${n}Email`]
        )
      ) {
        throw new CheckoutProblem(
          `Please check Player ${n}'s email address.`,
          400,
          false
        );
      }
    }

    metadata.registrationFingerprint = digest(
      JSON.stringify(metadata)
    );

    const reservation = await scriptCall(
      {
        action: "reserveCapacity",
        playerCount,
        registrationAttemptId,
        waitlistId,
        offerToken,
        holdProtocol: "player-hold-v2",
      },
      deadline
    );

    if (!reservation.ok) {
      if (reservation.alreadyRegistered) {
        const hold = await scriptCall(
          {
            action: "getPlayerCapacityHold",
            holdId,
            registrationAttemptId,
          },
          deadline
        );

        requireSuccess(hold);

        if (hold.stripeSessionId) {
          const session =
            await stripe.checkout.sessions.retrieve(
              hold.stripeSessionId,
              {},
              requestOptions(deadline)
            );

          verifySession(
            session,
            holdId,
            registrationAttemptId,
            metadata.registrationFingerprint
          );

          if (
            session.status === "complete" ||
            session.payment_status === "paid"
          ) {
            return confirmation(
              origin,
              session.id
            );
          }
        }
      }

      throw new CheckoutProblem(
        reservation.message ||
          reservation.error ||
          "These player spots are not available.",
        409,
        false,
        {
          registrationFull:
            reservation.full || false,
          remaining:
            reservation.remaining ?? 0,
        }
      );
    }

    if (
      reservation.holdId !== holdId ||
      reservation.holdProtocol !==
        "player-hold-v2"
    ) {
      throw new CheckoutProblem(
        "The registration service version needs organizer attention.",
        503,
        false
      );
    }

    const holdExpiry = Date.parse(
      reservation.expiresAt || ""
    );

    if (
      !Number.isFinite(holdExpiry) ||
      holdExpiry <= Date.now()
    ) {
      throw new CheckoutProblem(
        "The reservation deadline is invalid or has passed.",
        409,
        false
      );
    }

    let session:
      | Stripe.Checkout.Session
      | undefined;

    if (reservation.stripeSessionId) {
      session =
        await stripe.checkout.sessions.retrieve(
          reservation.stripeSessionId,
          {},
          requestOptions(deadline)
        );
    } else if (reservation.reused) {
      session = await findExistingSession(
        stripe,
        holdId,
        registrationAttemptId,
        holdExpiry,
        deadline
      );
    }

    if (!session) {
      /*
       * Fixed deadline: never recompute the expiration
       * from the current retry time.
       *
       * Stripe checkout ends two minutes before the
       * Apps Script player hold.
       */
      const expiresAt =
        Math.floor(holdExpiry / 1000) - 120;

      if (
        expiresAt <
        Math.floor(Date.now() / 1000) +
          30 * 60 +
          15
      ) {
        throw new CheckoutProblem(
          "This attempt no longer has enough time to open a new checkout. Contact the organizer or wait for its temporary hold to expire.",
          409,
          false
        );
      }

      const cancelUrl = new URL(
        "/api/player-registration",
        origin
      );

      cancelUrl.searchParams.set(
        "action",
        "cancel"
      );

      cancelUrl.searchParams.set(
        "registrationAttemptId",
        registrationAttemptId
      );

      cancelUrl.searchParams.set(
        "token",
        signedToken(
          key,
          "player-cancel-v2:" + holdId
        )
      );

      if (waitlistId && offerToken) {
        cancelUrl.searchParams.set(
          "waitlistId",
          waitlistId
        );

        cancelUrl.searchParams.set(
          "offerToken",
          offerToken
        );
      }

      const labels = [
        "",
        "Individual Registration",
        "Pair Registration",
        "Threesome Registration",
        "Foursome Registration",
      ];

      session =
        await stripe.checkout.sessions.create(
          {
            mode: "payment",

            payment_method_types: ["card"],

            client_reference_id: holdId,

            customer_email: metadata.p1Email,

            line_items: [
              {
                price_data: {
                  currency: "usd",
                  product_data: {
                    name:
                      "CSM Chad Miller Memorial Golf Tournament",
                    description:
                      labels[playerCount],
                  },
                  unit_amount: PRICE_PER_PLAYER,
                },
                quantity: playerCount,
              },
            ],

            metadata,

            payment_intent_data: {
              metadata,
            },

            success_url:
              `${origin}/register/player/confirmation?session_id={CHECKOUT_SESSION_ID}`,

            cancel_url: cancelUrl.toString(),

            expires_at: expiresAt,
          },
          requestOptions(
            deadline,
            `player-registration-v2:${registrationAttemptId}`
          )
        );
    }

    verifySession(
      session,
      holdId,
      registrationAttemptId,
      metadata.registrationFingerprint
    );

    if (
      session.status === "complete" ||
      session.payment_status === "paid"
    ) {
      return confirmation(
        origin,
        session.id
      );
    }

    if (session.status === "expired") {
      requireSuccess(
        await scriptCall(
          {
            action: "releaseCapacity",
            holdId,
          },
          deadline
        )
      );

      throw new CheckoutProblem(
        "That checkout has expired. Open a fresh registration form.",
        409,
        false
      );
    }

    if (
      session.status !== "open" ||
      !session.url ||
      session.expires_at * 1000 >= holdExpiry
    ) {
      throw new CheckoutProblem(
        "The checkout could not be safely opened. Please retry this same checkout."
      );
    }

    requireSuccess(
      await scriptCall(
        {
          action: "attachPlayerCheckout",
          holdId,
          registrationAttemptId,
          stripeSessionId: session.id,
        },
        deadline
      )
    );

    return redirectTo(session.url);
  } catch (error) {
    /*
     * A timeout does not prove Stripe failed.
     * Keep the hold and recover the checkout on retry.
     *
     * Never release a potentially payable checkout
     * from this catch block.
     */
    return problemResponse(
      request,
      error,
      form
    );
  }
}

/*
 * New checkouts return here when a golfer clicks
 * Stripe's back/cancel link.
 *
 * Stripe must confirm expiration BEFORE the
 * corresponding player hold is released.
 */
export async function GET(request: Request) {
  const deadline = Date.now() + 55000;

  try {
    const key = secretKey();

    const stripe = new Stripe(key, {
      maxNetworkRetries: 0,
      timeout: 8000,
    });

    const url = new URL(request.url);

    const attemptId =
      url.searchParams.get(
        "registrationAttemptId"
      ) || "";

    const token =
      url.searchParams.get("token") || "";

    if (
      url.searchParams.get("action") !== "cancel" ||
      !/^[A-Za-z0-9_-]{16,100}$/.test(attemptId)
    ) {
      throw new CheckoutProblem(
        "Invalid checkout cancellation link.",
        403,
        false
      );
    }

    const holdId = holdIdFor(attemptId);

    const expected = signedToken(
      key,
      "player-cancel-v2:" + holdId
    );

    if (
      !/^[a-f0-9]{64}$/.test(token) ||
      !timingSafeEqual(
        Buffer.from(token),
        Buffer.from(expected)
      )
    ) {
      throw new CheckoutProblem(
        "Invalid checkout cancellation link.",
        403,
        false
      );
    }

    const hold = await scriptCall(
      {
        action: "getPlayerCapacityHold",
        holdId,
        registrationAttemptId: attemptId,
      },
      deadline
    );

    requireSuccess(hold);

    const expiry = Date.parse(
      hold.expiresAt || ""
    );

    if (!Number.isFinite(expiry)) {
      throw new CheckoutProblem(
        "The reservation deadline could not be verified."
      );
    }

    let session = hold.stripeSessionId
      ? await stripe.checkout.sessions.retrieve(
          hold.stripeSessionId,
          {},
          requestOptions(deadline)
        )
      : await findExistingSession(
          stripe,
          holdId,
          attemptId,
          expiry,
          deadline
        );

    if (!session) {
      throw new CheckoutProblem(
        "No checkout could be verified. The hold has not been released; contact the organizer.",
        503,
        false
      );
    }

    verifySession(
      session,
      holdId,
      attemptId
    );

    if (
      session.status === "complete" ||
      session.payment_status === "paid"
    ) {
      return confirmation(
        url.origin,
        session.id
      );
    }

    if (session.status === "open") {
      try {
        session =
          await stripe.checkout.sessions.expire(
            session.id,
            {},
            requestOptions(deadline)
          );
      } catch {
        /*
         * Payment may have completed at the same
         * moment as the cancellation request.
         */
        session =
          await stripe.checkout.sessions.retrieve(
            session.id,
            {},
            requestOptions(deadline)
          );
      }

      verifySession(
        session,
        holdId,
        attemptId
      );
    }

    if (
      session.status === "complete" ||
      session.payment_status === "paid"
    ) {
      return confirmation(
        url.origin,
        session.id
      );
    }

    if (session.status !== "expired") {
      throw new CheckoutProblem(
        "Cancellation could not be confirmed. Please contact the organizer; do not pay again.",
        503,
        false
      );
    }

    requireSuccess(
      await scriptCall(
        {
          action: "releaseCapacity",
          holdId,
        },
        deadline
      )
    );

    const returnUrl = new URL(
      "/register/player",
      url.origin
    );

    const waitlistId =
      url.searchParams.get("waitlistId");

    const offerToken =
      url.searchParams.get("offerToken");

    if (waitlistId && offerToken) {
      returnUrl.searchParams.set(
        "waitlistId",
        waitlistId
      );

      returnUrl.searchParams.set(
        "offerToken",
        offerToken
      );
    }

    return redirectTo(returnUrl);
  } catch (error) {
    return problemResponse(
      request,
      error
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function problemResponse(
  request: Request,
  error: unknown,
  form?: FormData
): Response {
  const problem =
    error instanceof CheckoutProblem
      ? error
      : new CheckoutProblem(
          "We could not finish opening checkout. Retry this same registration rather than starting another payment."
        );

  /*
   * Do not log golfer details, form contents,
   * payment keys, or private tokens.
   */
  console.warn(
    "Player checkout request did not complete:",
    {
      status: problem.status,
      errorType:
        error instanceof Error
          ? error.name
          : "Unknown",
    }
  );

  if (
    !request.headers
      .get("accept")
      ?.includes("text/html")
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: problem.message,
        ...problem.details,
      },
      {
        status: problem.status,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  let retryForm = "";

  if (form && problem.retry) {
    const inputs: string[] = [];

    form.forEach((value, name) => {
      if (
        typeof value === "string" &&
        value.length <= 1000 &&
        name.length <= 100
      ) {
        inputs.push(
          `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`
        );
      }
    });

    retryForm =
      `<form method="POST" action="/api/player-registration">` +
      inputs.join("") +
      `<button type="submit">Retry this checkout</button>` +
      `</form>`;
  }

  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Player checkout</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 680px;
      margin: 60px auto;
      padding: 24px;
      line-height: 1.6;
    }
    button {
      padding: 14px 22px;
      font-size: 18px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Player checkout needs attention</h1>
  <p>${escapeHtml(problem.message)}</p>
  ${retryForm}
  <p>Do not submit another payment if you already received a payment confirmation.</p>
  <p>For assistance, contact the tournament organizer.</p>
</body>
</html>`,
    {
      status: problem.status,
      headers: {
        "Content-Type":
          "text/html; charset=utf-8",
        "Cache-Control":
          "no-store",
        "Referrer-Policy":
          "no-referrer",
        "X-Content-Type-Options":
          "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      },
    }
  );
}

// END OF app/api/player-registration/route.ts