import Link from "next/link";
import Stripe from "stripe";
import Container from "@/components/ui/Container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// September 25, 2026 at 11:59:59 PM Eastern.
// Eastern Time is UTC-4 on this date.
const REFUND_DEADLINE_UTC =
  Date.UTC(2026, 8, 26, 3, 59, 59);

type ManagePageProps = {
  searchParams: Promise<{
    session_id?: string;
    token?: string;
    updated?: string;
  }>;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function getProcessingFeeShare(
  totalProcessingFee: number,
  playerCount: number,
  playerNumber: number
) {
  const baseFee =
    Math.floor(totalProcessingFee / playerCount);

  const remainder =
    totalProcessingFee % playerCount;

  return (
    baseFee +
    (playerNumber <= remainder ? 1 : 0)
  );
}

function activeRefund(refund: Stripe.Refund) {
  const status =
    String(refund.status || "").toLowerCase();

  return (
    status !== "failed" &&
    status !== "canceled"
  );
}

function ErrorPage({
  message,
}: {
  message: string;
}) {
  return (
    <main className="bg-slate-50 py-20">
      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-600">
            Registration Management
          </p>

          <h1 className="mt-4 text-4xl font-bold text-[var(--brand-navy)]">
            We could not open this registration.
          </h1>

          <p className="mt-6 leading-7 text-slate-600">
            {message}
          </p>

          <Link
            href="/contact"
            className="mt-8 inline-block rounded-full bg-[var(--brand-navy)] px-7 py-3 font-semibold text-white"
          >
            Contact Tournament Organizers
          </Link>
        </div>
      </Container>
    </main>
  );
}

export default async function ManagePlayerRegistrationPage({
  searchParams,
}: ManagePageProps) {
  const params = await searchParams;

  const sessionId =
    params.session_id?.trim() || "";

  const token =
    params.token?.trim() || "";

  const updated =
    params.updated === "1";

  if (!sessionId || !token) {
    return (
      <ErrorPage message="This registration-management link is incomplete or invalid." />
    );
  }

  if (!stripeSecretKey) {
    return (
      <ErrorPage message="Registration management is temporarily unavailable. Please contact the tournament organizers." />
    );
  }

  try {
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

    const metadata =
      session.metadata || {};

    if (
      !metadata.withdrawalToken ||
      metadata.withdrawalToken !== token
    ) {
      return (
        <ErrorPage message="This registration-management link is invalid." />
      );
    }

    const playerCount =
      Number(metadata.playerCount || "0");

    if (
      !Number.isInteger(playerCount) ||
      playerCount < 1 ||
      playerCount > 4
    ) {
      return (
        <ErrorPage message="The player information for this registration could not be loaded." />
      );
    }

    const paymentIntent =
      session.payment_intent;

    if (
      !paymentIntent ||
      typeof paymentIntent === "string"
    ) {
      return (
        <ErrorPage message="The payment information for this registration could not be loaded." />
      );
    }

    const latestCharge =
      paymentIntent.latest_charge;

    if (
      !latestCharge ||
      typeof latestCharge === "string"
    ) {
      return (
        <ErrorPage message="The payment information for this registration could not be loaded." />
      );
    }

    const balanceTransaction =
      latestCharge.balance_transaction;

    if (
      !balanceTransaction ||
      typeof balanceTransaction === "string"
    ) {
      return (
        <ErrorPage message="The payment-processing information for this registration could not be loaded." />
      );
    }

    const totalPaid =
      Number(session.amount_total || 0);

    if (
      totalPaid <= 0 ||
      totalPaid % playerCount !== 0
    ) {
      return (
        <ErrorPage message="The original registration amount could not be verified." />
      );
    }

    const grossPerPlayer =
      totalPaid / playerCount;

    const totalProcessingFee =
      Number(balanceTransaction.fee || 0);

    const refunds =
      await stripe.refunds.list({
        payment_intent:
          paymentIntent.id,
        limit: 100,
      });

    const manualRefundPresent =
      refunds.data.some(
        (refund) =>
          activeRefund(refund) &&
          refund.metadata?.source !==
            "player_withdrawal"
      );

    const deadlinePassed =
      Date.now() >
      REFUND_DEADLINE_UTC;

    const players =
      Array.from(
        { length: playerCount },
        (_, index) => {
          const playerNumber =
            index + 1;

          const firstName =
            metadata[
              `p${playerNumber}FirstName`
            ] || "";

          const lastName =
            metadata[
              `p${playerNumber}LastName`
            ] || "";

          const playerName =
            `${firstName} ${lastName}`.trim();

          const existingRefund =
            refunds.data.find(
              (refund) =>
                activeRefund(refund) &&
                refund.metadata?.source ===
                  "player_withdrawal" &&
                refund.metadata
                  ?.checkoutSessionId ===
                  session.id &&
                Number(
                  refund.metadata
                    ?.playerNumber || "0"
                ) === playerNumber
            );

          const processingFeeShare =
            getProcessingFeeShare(
              totalProcessingFee,
              playerCount,
              playerNumber
            );

          const refundAmount =
            grossPerPlayer -
            processingFeeShare;

          return {
            playerNumber,
            playerName:
              playerName ||
              `Player ${playerNumber}`,
            refunded:
              Boolean(existingRefund),
            refundId:
              existingRefund?.id || "",
            refundStatus:
              existingRefund?.status || "",
            processingFeeShare,
            refundAmount,
          };
        }
      );

    const refundablePlayers =
      players.filter(
        (player) =>
          !player.refunded
      );

    return (
      <>
        <section className="bg-[var(--brand-navy)] py-16 text-white">
          <Container>
            <div className="mx-auto max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                Player Registration
              </p>

              <h1 className="mt-4 text-4xl font-bold md:text-5xl">
                Manage Your Registration
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                Review the golfers on this registration and withdraw eligible players below.
              </p>
            </div>
          </Container>
        </section>

        <main className="bg-slate-50 py-16">
          <Container>
            <div className="mx-auto max-w-4xl">
              {updated && (
                <div className="mb-8 rounded-3xl border border-green-200 bg-green-50 p-6">
                  <p className="font-semibold text-green-800">
                    Your withdrawal request was processed successfully.
                  </p>

                  <p className="mt-2 leading-7 text-green-700">
                    The selected golfer or golfers have been removed from the active tournament field and the applicable refund has been submitted to the original payment method.
                  </p>
                </div>
              )}

              <div className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                  Registration Details
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  Registered Golfers
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  Self-service refunds are available through
                  {" "}
                  <strong>
                    September 25, 2026 at 11:59 PM ET
                  </strong>.
                  The original payment-processing fee is non-refundable.
                </p>

                <div className="mt-8 space-y-5">
                  {players.map(
                    (player) => (
                      <div
                        key={
                          player.playerNumber
                        }
                        className="rounded-2xl border border-slate-200 p-6"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-lg font-bold text-[var(--brand-navy)]">
                              {
                                player.playerName
                              }
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Player{" "}
                              {
                                player.playerNumber
                              }
                            </p>
                          </div>

                          <div className="md:text-right">
                            {player.refunded ? (
                              <>
                                <p className="font-semibold text-green-700">
                                  Withdrawn / Refunded
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  Refund status:{" "}
                                  {
                                    player.refundStatus
                                  }
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-[var(--brand-navy)]">
                                  Refund available
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  Estimated refund:{" "}
                                  {formatCurrency(
                                    player.refundAmount
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Processing fee retained:{" "}
                                  {formatCurrency(
                                    player.processingFeeShare
                                  )}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {manualRefundPresent && (
                <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-8">
                  <h2 className="text-2xl font-bold text-amber-900">
                    Manual refund detected
                  </h2>

                  <p className="mt-4 leading-7 text-amber-800">
                    A refund has already been processed manually for this transaction. Additional self-service refunds are disabled so that the same registration cannot accidentally be refunded twice.
                  </p>

                  <Link
                    href="/contact"
                    className="mt-6 inline-block rounded-full bg-[var(--brand-navy)] px-7 py-3 font-semibold text-white"
                  >
                    Contact Tournament Organizers
                  </Link>
                </div>
              )}

              {!manualRefundPresent &&
                deadlinePassed && (
                  <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-8">
                    <h2 className="text-2xl font-bold text-amber-900">
                      Refund period closed
                    </h2>

                    <p className="mt-4 leading-7 text-amber-800">
                      The self-service refund deadline of September 25, 2026 at 11:59 PM ET has passed. Registration fees are now non-refundable except at the discretion of the tournament organizers.
                    </p>

                    <Link
                      href="/contact"
                      className="mt-6 inline-block rounded-full bg-[var(--brand-navy)] px-7 py-3 font-semibold text-white"
                    >
                      Contact Tournament Organizers
                    </Link>
                  </div>
                )}

              {!manualRefundPresent &&
                !deadlinePassed &&
                refundablePlayers.length >
                  0 && (
                  <form
                    action="/api/player-withdrawal"
                    method="POST"
                    className="mt-8 rounded-3xl bg-white p-8 shadow-sm md:p-10"
                  >
                    <input
                      type="hidden"
                      name="sessionId"
                      value={session.id}
                    />

                    <input
                      type="hidden"
                      name="token"
                      value={token}
                    />

                    <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                      Withdraw Player
                    </h2>

                    <p className="mt-4 leading-7 text-slate-600">
                      Select the golfer or golfers you want to remove from this registration.
                    </p>

                    <div className="mt-7 space-y-4">
                      {refundablePlayers.map(
                        (player) => (
                          <label
                            key={
                              player.playerNumber
                            }
                            className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-5"
                          >
                            <input
                              type="checkbox"
                              name="playerNumber"
                              value={
                                player.playerNumber
                              }
                              className="mt-1 h-5 w-5"
                            />

                            <span>
                              <span className="block font-semibold text-[var(--brand-navy)]">
                                {
                                  player.playerName
                                }
                              </span>

                              <span className="mt-1 block text-sm text-slate-500">
                                Refund:{" "}
                                {formatCurrency(
                                  player.refundAmount
                                )}
                                {" "}
                                after retaining the original processing-fee share of{" "}
                                {formatCurrency(
                                  player.processingFeeShare
                                )}
                              </span>
                            </span>
                          </label>
                        )
                      )}
                    </div>

                    <div className="mt-8 rounded-2xl bg-red-50 p-6">
                      <p className="font-semibold text-red-800">
                        This action cannot be undone automatically.
                      </p>

                      <p className="mt-2 leading-7 text-red-700">
                        Submitting this form will remove the selected golfer or golfers from the tournament field and submit their refund to the original payment method.
                      </p>
                    </div>

                    <label className="mt-6 flex items-start gap-3">
                      <input
                        required
                        type="checkbox"
                        name="withdrawalConfirmation"
                        className="mt-1 h-5 w-5"
                      />

                      <span className="leading-7 text-slate-600">
                        I understand that the selected golfer or golfers will be withdrawn and that the original payment-processing fee is non-refundable.
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="mt-8 rounded-full bg-red-700 px-8 py-4 font-semibold text-white transition hover:opacity-90"
                    >
                      Withdraw Selected Player(s) & Request Refund
                    </button>
                  </form>
                )}

              {!manualRefundPresent &&
                refundablePlayers.length ===
                  0 && (
                  <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm">
                    <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                      No active golfers remain on this registration.
                    </h2>

                    <p className="mt-4 text-slate-600">
                      All golfers associated with this transaction have already been withdrawn.
                    </p>
                  </div>
                )}
            </div>
          </Container>
        </main>
      </>
    );
  } catch (error) {
    console.error(
      "Registration management page error:",
      error
    );

    return (
      <ErrorPage message="We could not load this registration. Please contact the tournament organizers for assistance." />
    );
  }
}