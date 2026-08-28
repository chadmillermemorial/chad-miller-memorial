import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import Container from "@/components/ui/Container";
import {
  getAdminEnvironment,
  isAdminCookieHeaderAuthenticated,
} from "@/lib/admin-auth";
import { toAdminCheckoutRecord } from "@/lib/admin-records";
import {
  buildFullPaymentRefundPreview,
  buildPlayerRefundPreview,
  getAdminRefundSourceForPaymentType,
} from "@/lib/admin-refund-preview";

export const dynamic = "force-dynamic";

type RefundPageProps = {
  searchParams: Promise<{
    session_id?: string;
    success?: string;
    error?: string;
  }>;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function AdminRefundPage({
  searchParams,
}: RefundPageProps) {
  const params = await searchParams;
  const requestHeaders = await headers();

  let sessionSecret = "";

  try {
    sessionSecret = getAdminEnvironment({
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET:
        process.env.ADMIN_SESSION_SECRET,
    }).sessionSecret;
  } catch {
    redirect("/admin?error=config");
  }

  if (
    !isAdminCookieHeaderAuthenticated(
      requestHeaders.get("cookie"),
      sessionSecret
    )
  ) {
    redirect("/admin");
  }

  const sessionId =
    params.session_id?.trim() || "";

  if (!sessionId) {
    return (
      <main className="bg-slate-50 py-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-[var(--brand-navy)]">
              Refund record not selected
            </h1>
            <Link
              href="/admin"
              className="mt-6 inline-block rounded-full bg-[var(--brand-navy)] px-6 py-3 font-semibold text-white"
            >
              Return to Admin
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  try {
    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error(
        "Stripe is not configured."
      );
    }

    const stripe =
      new Stripe(stripeSecretKey);

    const session =
      await stripe.checkout.sessions.retrieve(
        sessionId,
        {
          expand: [
            "payment_intent.latest_charge.balance_transaction",
          ],
        }
      );

    const record =
      toAdminCheckoutRecord(session);

    if (!record) {
      throw new Error(
        "This Checkout Session is not a recognized paid tournament transaction."
      );
    }

    const paymentIntent =
      session.payment_intent;

    if (
      !paymentIntent ||
      typeof paymentIntent === "string"
    ) {
      throw new Error(
        "Stripe payment information could not be loaded."
      );
    }

    const latestCharge =
      paymentIntent.latest_charge;

    if (
      !latestCharge ||
      typeof latestCharge === "string"
    ) {
      throw new Error(
        "Stripe charge information could not be loaded."
      );
    }

    const balanceTransaction =
      latestCharge.balance_transaction;

    if (
      !balanceTransaction ||
      typeof balanceTransaction === "string"
    ) {
      throw new Error(
        "Stripe processing-fee information could not be loaded."
      );
    }

    const grossAmountCents =
      Number(session.amount_total || 0);

    const processingFeeCents =
      Number(balanceTransaction.fee || 0);

    const refunds =
      await stripe.refunds.list({
        payment_intent: paymentIntent.id,
        limit: 100,
      });

    const playerPreview =
      record.type === "player"
        ? buildPlayerRefundPreview({
            checkoutSessionId: session.id,
            grossAmountCents,
            processingFeeCents,
            playerCount: Number(
              session.metadata?.playerCount ||
                "0"
            ),
            metadata: session.metadata || {},
            refunds: refunds.data,
          })
        : null;

    const fullPreview =
      record.type !== "player"
        ? buildFullPaymentRefundPreview({
            checkoutSessionId: session.id,
            grossAmountCents,
            processingFeeCents,
            expectedSource:
              getAdminRefundSourceForPaymentType(
                record.type
              ) as
                | "admin_donation_refund"
                | "admin_sponsor_refund",
            refunds: refunds.data,
          })
        : null;

    const historicalFullRefund =
      fullPreview?.fullyRefundedOutsideAdmin ||
      false;

    const blocked =
      playerPreview?.blockedByUnknownRefund ||
      fullPreview?.blockedByUnknownRefund ||
      false;

    return (
      <>
        <section className="bg-[var(--brand-navy)] py-14 text-white">
          <Container>
            <div className="mx-auto max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                Admin Refund Review
              </p>

              <h1 className="mt-4 text-4xl font-bold md:text-5xl">
                {record.title}
              </h1>

              <p className="mt-4 break-all text-sm text-slate-300">
                {session.id}
              </p>
            </div>
          </Container>
        </section>

        <main className="bg-slate-50 py-16">
          <Container>
            <div className="mx-auto max-w-4xl">
              <Link
                href="/admin"
                className="font-semibold text-[var(--brand-blue)]"
              >
                ← Back to Admin Search
              </Link>

              {params.success === "1" && (
                <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6 font-semibold text-green-800">
                  The refund was processed and the tournament record synchronization completed.
                </div>
              )}

              {params.error && (
                <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 font-semibold text-red-700">
                  The refund could not be completed. No additional refund should be attempted until the transaction is reviewed below.
                </div>
              )}

              <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm md:p-10">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Payment Type
                    </p>
                    <p className="mt-2 text-xl font-bold text-[var(--brand-navy)]">
                      {record.type === "sponsorship"
                        ? "Sponsor"
                        : record.type === "donation"
                          ? "Donation"
                          : "Player Registration"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Original Payment
                    </p>
                    <p className="mt-2 text-xl font-bold text-[var(--brand-navy)]">
                      {formatCurrency(
                        grossAmountCents
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      Stripe Fee
                    </p>
                    <p className="mt-2 text-xl font-bold text-[var(--brand-navy)]">
                      {formatCurrency(
                        processingFeeCents
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {historicalFullRefund && fullPreview && (
                <div className="mt-8 rounded-3xl border border-green-200 bg-green-50 p-8">
                  <h2 className="text-2xl font-bold text-green-900">
                    Already fully refunded in Stripe
                  </h2>
                  <p className="mt-3 leading-7 text-green-800">
                    Stripe shows {formatCurrency(fullPreview.activeRefundedAmountCents)} already returned through a refund created outside this admin system. No additional refund can be issued for this payment.
                  </p>
                </div>
              )}

              {blocked && !historicalFullRefund && (
                <div className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-8">
                  <h2 className="text-2xl font-bold text-amber-900">
                    Refund blocked for review
                  </h2>
                  <p className="mt-3 leading-7 text-amber-800">
                    Stripe contains an active refund that cannot be safely matched to the expected tournament record. The admin system will not issue another refund while this transaction is ambiguous.
                  </p>
                </div>
              )}

              {fullPreview && (
                <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm md:p-10">
                  <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                    Refund Preview
                  </h2>

                  <div className="mt-7 grid gap-5 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">
                        Original payment
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        {formatCurrency(
                          fullPreview.grossAmountCents
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">
                        {historicalFullRefund
                          ? "Original Stripe fee"
                          : "Stripe fee retained"}
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        {formatCurrency(
                          fullPreview.processingFeeCents
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm text-slate-500">
                        {historicalFullRefund
                          ? "Already refunded"
                          : "Customer refund"}
                      </p>
                      <p className="mt-2 text-xl font-bold text-green-700">
                        {formatCurrency(
                          historicalFullRefund
                            ? fullPreview.activeRefundedAmountCents
                            : fullPreview.refundAmountCents
                        )}
                      </p>
                    </div>
                  </div>

                  {fullPreview.alreadyRefunded ? (
                    <div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-5 font-semibold text-green-800">
                      This transaction already has the matching admin refund: {fullPreview.existingRefundId}
                    </div>
                  ) : historicalFullRefund ? (
                    <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 font-semibold text-slate-700">
                      Historical refund detected. No refund action is available for this transaction.
                    </div>
                  ) : (
                    !blocked && (
                      <form
                        action="/api/admin/refund"
                        method="POST"
                        className="mt-8"
                      >
                        <input
                          type="hidden"
                          name="sessionId"
                          value={session.id}
                        />

                        <label className="flex items-start gap-3 rounded-2xl bg-red-50 p-5">
                          <input
                            required
                            type="checkbox"
                            name="confirmation"
                            className="mt-1 h-5 w-5"
                          />
                          <span className="leading-7 text-red-800">
                            I confirm that I want to refund {formatCurrency(fullPreview.refundAmountCents)} to the original payment method. The Stripe fee of {formatCurrency(fullPreview.processingFeeCents)} will be retained.
                          </span>
                        </label>

                        <button
                          type="submit"
                          className="mt-6 rounded-full bg-red-700 px-8 py-4 font-semibold text-white"
                        >
                          Issue Refund
                        </button>
                      </form>
                    )
                  )}
                </div>
              )}

              {playerPreview && (
                <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm md:p-10">
                  <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                    Player Refund Preview
                  </h2>

                  <p className="mt-4 leading-7 text-slate-600">
                    The admin override is not limited by the public refund deadline. Each golfer still loses their proportional share of the original Stripe processing fee.
                  </p>

                  <form
                    action="/api/admin/refund"
                    method="POST"
                    className="mt-7"
                  >
                    <input
                      type="hidden"
                      name="sessionId"
                      value={session.id}
                    />

                    <div className="space-y-4">
                      {playerPreview.players.map(
                        (player) => (
                          <label
                            key={player.playerNumber}
                            className={`flex items-start gap-4 rounded-2xl border p-5 ${
                              player.refunded
                                ? "border-green-200 bg-green-50"
                                : "border-slate-200"
                            }`}
                          >
                            {!player.refunded && !blocked && (
                              <input
                                type="checkbox"
                                name="playerNumber"
                                value={player.playerNumber}
                                className="mt-1 h-5 w-5"
                              />
                            )}

                            <span className="flex-1">
                              <span className="block font-bold text-[var(--brand-navy)]">
                                {player.playerName}
                              </span>
                              <span className="mt-1 block text-sm text-slate-600">
                                Gross {formatCurrency(player.grossAmountCents)} − Stripe fee {formatCurrency(player.processingFeeCents)} = refund {formatCurrency(player.refundAmountCents)}
                              </span>
                              {player.refunded && (
                                <span className="mt-2 block text-sm font-semibold text-green-700">
                                  Already withdrawn/refunded • {player.existingRefundId}
                                </span>
                              )}
                            </span>
                          </label>
                        )
                      )}
                    </div>

                    {!blocked &&
                      playerPreview.players.some(
                        (player) => !player.refunded
                      ) && (
                        <>
                          <label className="mt-7 flex items-start gap-3 rounded-2xl bg-red-50 p-5">
                            <input
                              required
                              type="checkbox"
                              name="confirmation"
                              className="mt-1 h-5 w-5"
                            />
                            <span className="leading-7 text-red-800">
                              I confirm that the selected golfer or golfers should be withdrawn and refunded to the original payment method after their Stripe fee share is retained.
                            </span>
                          </label>

                          <button
                            type="submit"
                            className="mt-6 rounded-full bg-red-700 px-8 py-4 font-semibold text-white"
                          >
                            Refund Selected Player(s)
                          </button>
                        </>
                      )}
                  </form>
                </div>
              )}
            </div>
          </Container>
        </main>
      </>
    );
  } catch (error) {
    console.error(
      "Admin refund preview error:",
      error
    );

    return (
      <main className="bg-slate-50 py-20">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-[var(--brand-navy)]">
              Refund preview unavailable
            </h1>
            <p className="mt-4 leading-7 text-slate-600">
              {error instanceof Error
                ? error.message
                : "The Stripe transaction could not be reviewed safely."}
            </p>
            <Link
              href="/admin"
              className="mt-6 inline-block rounded-full bg-[var(--brand-navy)] px-6 py-3 font-semibold text-white"
            >
              Return to Admin
            </Link>
          </div>
        </Container>
      </main>
    );
  }
}
