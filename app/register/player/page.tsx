"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";

const shirtSizes = ["S", "M", "L", "XL", "2XL", "3XL"];

type RegistrationType =
  | "individual"
  | "pair"
  | "threesome"
  | "foursome";

const registrationOptions = [
  {
    type: "individual" as RegistrationType,
    title: "Individual",
    players: 1,
    price: 75,
    description: "Register one golfer.",
  },
  {
    type: "pair" as RegistrationType,
    title: "Pair",
    players: 2,
    price: 150,
    description: "Register two golfers together.",
  },
  {
    type: "threesome" as RegistrationType,
    title: "Threesome",
    players: 3,
    price: 225,
    description: "Register three golfers together.",
  },
  {
    type: "foursome" as RegistrationType,
    title: "Foursome",
    players: 4,
    price: 300,
    description: "Register all four golfers together.",
  },
];

function PlayerFields({
  playerNumber,
}: {
  playerNumber: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
        Player {playerNumber}
        {playerNumber === 1 ? " / Primary Contact" : ""}
      </h2>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <label className="block">
          <span className="font-semibold">First Name *</span>
          <input
            required
            name={`player${playerNumber}FirstName`}
            type="text"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="font-semibold">Last Name *</span>
          <input
            required
            name={`player${playerNumber}LastName`}
            type="text"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="font-semibold">Email *</span>
          <input
            required
            name={`player${playerNumber}Email`}
            type="email"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="font-semibold">Phone *</span>
          <input
            required
            name={`player${playerNumber}Phone`}
            type="tel"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="font-semibold">Handicap</span>
          <input
            name={`player${playerNumber}Handicap`}
            type="text"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="font-semibold">GHIN Number</span>
          <input
            name={`player${playerNumber}Ghin`}
            type="text"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="font-semibold">
            Men&apos;s Unisex T-Shirt Size *
          </span>

          <select
            required
            name={`player${playerNumber}ShirtSize`}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Select size</option>

            {shirtSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-semibold">Tee Selection *</span>

          <select
            required
            name={`player${playerNumber}TeeSelection`}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Select tee</option>
            <option value="mens">Men&apos;s Tee</option>
            <option value="womens">Women&apos;s Tee</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default function PlayerRegistrationPage() {
  const [registrationType, setRegistrationType] =
    useState<RegistrationType>("individual");

  const [remainingSpots, setRemainingSpots] =
    useState<number | null>(null);

  const [capacityError, setCapacityError] =
    useState(false);

  useEffect(() => {
    async function loadCapacity() {
      try {
        const response = await fetch("/api/player-capacity", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!result.ok) {
          throw new Error("Capacity unavailable.");
        }

        setRemainingSpots(result.remaining);
      } catch (error) {
        console.error("Unable to load capacity:", error);
        setCapacityError(true);
      }
    }

    loadCapacity();
  }, []);

  const selectedOption = registrationOptions.find(
    (option) => option.type === registrationType
  )!;

  const playerCount = selectedOption.players;
  const registrationTotal = selectedOption.price;

  const registrationFull = remainingSpots === 0;

  function optionUnavailable(players: number) {
    return (
      remainingSpots !== null &&
      players > remainingSpots
    );
  }

  return (
    <>
      <section className="bg-[var(--brand-navy)] py-20 text-white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <Image
              src="/images/logo/logo.png"
              alt="SGM Chad Miller Memorial logo"
              width={260}
              height={260}
              className="mx-auto w-full max-w-[220px]"
            />

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                Player Registration
              </p>

              <h1 className="mt-5 text-5xl font-bold md:text-6xl">
                Register to Play
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Register one, two, three, or four golfers for the Sergeant
                Major Chad Miller Memorial Golf Tournament.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20">
        <Container>
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 rounded-3xl bg-white p-8 text-center shadow-sm">
              {remainingSpots === null && !capacityError && (
                <p className="text-lg font-semibold text-slate-600">
                  Checking tournament availability...
                </p>
              )}

              {remainingSpots !== null && remainingSpots > 0 && (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                    Tournament Availability
                  </p>

                  <p className="mt-3 text-4xl font-bold text-[var(--brand-navy)]">
                    {remainingSpots}{" "}
                    {remainingSpots === 1 ? "spot" : "spots"} remaining
                  </p>

                  <p className="mt-2 text-slate-500">
                    Maximum field: 128 golfers
                  </p>
                </>
              )}

              {registrationFull && (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-600">
                    Registration Full
                  </p>

                  <p className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                    The 128-player field is full.
                  </p>

                  <p className="mt-3 text-slate-600">
                    Join the waitlist below and we&apos;ll contact you if
                    enough space becomes available.
                  </p>
                </>
              )}

              {capacityError && (
                <p className="text-slate-600">
                  Live availability could not be displayed. Final availability
                  will be confirmed before checkout.
                </p>
              )}
            </div>

            {registrationFull ? (
              <form
                action="/api/waitlist-registration"
                method="POST"
                className="rounded-3xl bg-white p-8 shadow-lg md:p-10"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                  Tournament Waitlist
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                  Join the Waitlist
                </h2>

                <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                  Tell us how many golfers you would like to register. If enough
                  spots become available, we&apos;ll contact you with a limited
                  registration window.
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <label className="block">
                    <span className="font-semibold">First Name *</span>

                    <input
                      required
                      name="firstName"
                      type="text"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold">Last Name *</span>

                    <input
                      required
                      name="lastName"
                      type="text"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold">Email *</span>

                    <input
                      required
                      name="email"
                      type="email"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold">Phone *</span>

                    <input
                      required
                      name="phone"
                      type="tel"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="font-semibold">
                      Number of Golfers Requested *
                    </span>

                    <select
                      required
                      name="playersRequested"
                      defaultValue=""
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    >
                      <option value="" disabled>
                        Select number of golfers
                      </option>
                      <option value="1">1 golfer</option>
                      <option value="2">2 golfers</option>
                      <option value="3">3 golfers</option>
                      <option value="4">4 golfers</option>
                    </select>
                  </label>
                </div>

                <div className="mt-8 rounded-2xl bg-[var(--brand-sky)] p-6">
                  <p className="font-semibold text-[var(--brand-navy)]">
                    No payment is required to join the waitlist.
                  </p>

                  <p className="mt-2 leading-7 text-slate-600">
                    Joining the waitlist does not reserve a tournament spot.
                    Registration is only confirmed after you receive an offer
                    and complete payment.
                  </p>
                </div>

                <button
                  type="submit"
                  className="mt-8 w-full rounded-full bg-[var(--brand-navy)] px-8 py-4 font-semibold text-white transition hover:opacity-90 md:w-auto"
                >
                  Join Tournament Waitlist
                </button>
              </form>
            ) : (
              <form
                action="/api/player-registration"
                method="POST"
              >
                <input
                  type="hidden"
                  name="registrationType"
                  value={registrationType}
                />

                <input
                  type="hidden"
                  name="playerCount"
                  value={playerCount}
                />

                <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                    Registration Type
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                    How many golfers are you registering?
                  </h2>

                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    {registrationOptions.map((option) => {
                      const unavailable =
                        optionUnavailable(option.players);

                      return (
                        <button
                          key={option.type}
                          type="button"
                          disabled={unavailable}
                          onClick={() =>
                            setRegistrationType(option.type)
                          }
                          className={`rounded-3xl border-2 p-7 text-left transition ${
                            unavailable
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-50"
                              : registrationType === option.type
                              ? "border-[var(--brand-blue)] bg-[var(--brand-sky)]"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <p className="text-2xl font-bold text-[var(--brand-navy)]">
                            {option.title}
                          </p>

                          <p className="mt-2 text-slate-600">
                            {option.description}
                          </p>

                          <p className="mt-5 text-3xl font-bold text-[var(--brand-blue)]">
                            ${option.price}
                          </p>

                          {unavailable && (
                            <p className="mt-3 text-sm font-semibold text-red-600">
                              Not enough spots remaining
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 rounded-3xl bg-[var(--brand-sky)] p-8">
                  <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                    Tournament Registration
                  </h2>

                  <p className="mt-4 leading-7 text-slate-600">
                    Each $75 player registration includes 18 holes of golf,
                    golf cart, practice range access, breakfast, lunch,
                    player gift, tournament contests, and the post-round
                    tribute and awards program.
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-[var(--brand-blue)]/20 pt-6">
                    <span className="font-semibold text-[var(--brand-navy)]">
                      Registration Total
                    </span>

                    <span className="text-3xl font-bold text-[var(--brand-blue)]">
                      ${registrationTotal}
                    </span>
                  </div>
                </div>

                <div className="mt-8 space-y-8">
                  {Array.from(
                    { length: playerCount },
                    (_, index) => (
                      <PlayerFields
                        key={index + 1}
                        playerNumber={index + 1}
                      />
                    )
                  )}
                </div>

                {playerCount < 4 && (
                  <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                      Pairing
                    </h2>

                    <p className="mt-4 leading-7 text-slate-600">
                      Your registered group will stay together. We will pair
                      you with other registered golfers as needed to complete
                      a foursome.
                    </p>
                  </div>
                )}

                {playerCount > 1 && (
                  <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                      Team Information
                    </h2>

                    <label className="mt-6 block">
                      <span className="font-semibold">
                        Team Name
                      </span>

                      <input
                        name="teamName"
                        type="text"
                        placeholder="Optional"
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                      />
                    </label>
                  </div>
                )}

                <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                    Emergency Contact
                  </h2>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="font-semibold">
                        Contact Name *
                      </span>

                      <input
                        required
                        name="emergencyContactName"
                        type="text"
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                      />
                    </label>

                    <label className="block">
                      <span className="font-semibold">
                        Contact Phone *
                      </span>

                      <input
                        required
                        name="emergencyContactPhone"
                        type="tel"
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                    Acknowledgments
                  </h2>

                  <label className="mt-6 flex items-start gap-3">
                    <input
                      required
                      name="rulesAcknowledgment"
                      type="checkbox"
                      className="mt-1 h-5 w-5"
                    />

                    <span className="leading-7 text-slate-600">
                      I acknowledge the tournament rules, dress code, and
                      weather policy.
                    </span>
                  </label>

                  <label className="mt-5 flex items-start gap-3">
                    <input
                      required
                      name="photoRelease"
                      type="checkbox"
                      className="mt-1 h-5 w-5"
                    />

                    <span className="leading-7 text-slate-600">
                      I authorize photographs and video taken during the event
                      to be used for tournament communications, promotion, and
                      future event materials.
                    </span>
                  </label>

                  <label className="mt-5 flex items-start gap-3">
                    <input
                      required
                      name="refundPolicyAcknowledgment"
                      type="checkbox"
                      className="mt-1 h-5 w-5"
                    />

                    <span className="leading-7 text-slate-600">
                      I acknowledge that player registrations may be cancelled
                      for a refund through September 25, 2026 at 11:59 PM ET.
                      Refunds will be returned to the original payment method
                      less the non-refundable payment processing fee
                      attributable to the registration. After the refund
                      deadline, registration fees are non-refundable except at
                      the discretion of the tournament organizers.
                    </span>
                  </label>
                </div>

                <div className="mt-10 rounded-3xl bg-[var(--brand-navy)] p-8 text-white md:p-10">
                  <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">
                        Secure Checkout
                      </p>

                      <h2 className="mt-3 text-3xl font-bold">
                        Registration Total: ${registrationTotal}
                      </h2>

                      <p className="mt-4 max-w-xl leading-7 text-slate-300">
                        Your spots will be held for 30 minutes while you
                        complete secure payment.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={optionUnavailable(playerCount)}
                      className="shrink-0 rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Continue to Secure Payment — ${registrationTotal}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}