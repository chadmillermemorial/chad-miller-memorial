"use client";

import Image from "next/image";
import { useState } from "react";
import Container from "@/components/ui/Container";

const shirtSizes = ["S", "M", "L", "XL", "2XL", "3XL"];

type RegistrationType = "individual" | "foursome";

function PlayerFields({
  playerNumber,
  required,
}: {
  playerNumber: number;
  required: boolean;
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
            required={required}
            name={`player${playerNumber}FirstName`}
            type="text"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="font-semibold">Last Name *</span>
          <input
            required={required}
            name={`player${playerNumber}LastName`}
            type="text"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="font-semibold">Email *</span>
          <input
            required={required}
            name={`player${playerNumber}Email`}
            type="email"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="font-semibold">Phone *</span>
          <input
            required={required}
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
            required={required}
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

          <p className="mt-2 text-sm text-slate-500">
            Shirts use men&apos;s/unisex sizing.
          </p>
        </label>

        <label className="block">
          <span className="font-semibold">Tee Selection *</span>
          <select
            required={required}
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

  const playerCount = registrationType === "foursome" ? 4 : 1;
  const registrationTotal = playerCount * 75;

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
                Register individually or register your complete foursome for
                the Sergeant Major Chad Miller Memorial Golf Tournament.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20">
        <Container>
          <form
            action="/api/player-registration"
            method="POST"
            className="mx-auto max-w-5xl"
          >
            <input
              type="hidden"
              name="registrationType"
              value={registrationType}
            />

            <input
              type="hidden"
              name="registrationTotal"
              value={registrationTotal}
            />

            <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                Registration Type
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                Who are you registering?
              </h2>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRegistrationType("individual")}
                  className={`rounded-3xl border-2 p-7 text-left transition ${
                    registrationType === "individual"
                      ? "border-[var(--brand-blue)] bg-[var(--brand-sky)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-2xl font-bold text-[var(--brand-navy)]">
                    Individual
                  </p>

                  <p className="mt-2 text-slate-600">
                    Register one golfer.
                  </p>

                  <p className="mt-5 text-3xl font-bold text-[var(--brand-blue)]">
                    $75
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRegistrationType("foursome")}
                  className={`rounded-3xl border-2 p-7 text-left transition ${
                    registrationType === "foursome"
                      ? "border-[var(--brand-blue)] bg-[var(--brand-sky)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-2xl font-bold text-[var(--brand-navy)]">
                    Foursome
                  </p>

                  <p className="mt-2 text-slate-600">
                    Register all four golfers together.
                  </p>

                  <p className="mt-5 text-3xl font-bold text-[var(--brand-blue)]">
                    $300
                  </p>
                </button>
              </div>
            </div>

            <div className="mt-8 rounded-3xl bg-[var(--brand-sky)] p-8">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Tournament Registration
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Your $75 player registration includes 18 holes of golf, golf
                cart, practice range access, breakfast, lunch, player gift,
                tournament contests, and the post-round tribute and awards
                program.
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
              <PlayerFields playerNumber={1} required />

              {registrationType === "foursome" && (
                <>
                  <PlayerFields playerNumber={2} required />
                  <PlayerFields playerNumber={3} required />
                  <PlayerFields playerNumber={4} required />
                </>
              )}
            </div>

            {registrationType === "individual" && (
              <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                  Pairing
                </h2>

                <label className="mt-6 flex items-start gap-3">
                  <input
                    name="needsPairing"
                    type="checkbox"
                    defaultChecked
                    className="mt-1 h-5 w-5"
                  />

                  <span className="leading-7 text-slate-600">
                    Please pair me with other registered players to complete a
                    foursome.
                  </span>
                </label>
              </div>
            )}

            {registrationType === "foursome" && (
              <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                  Team Information
                </h2>

                <label className="mt-6 block">
                  <span className="font-semibold">Team Name</span>

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

              <p className="mt-2 text-slate-500">
                One emergency contact is required for the registration.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="font-semibold">Contact Name *</span>

                  <input
                    required
                    name="emergencyContactName"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">Contact Phone *</span>

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
                  I acknowledge the tournament rules, dress code, and weather
                  policy.
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
                  I authorize photographs and video taken during the event to
                  be used for tournament communications, promotion, and future
                  event materials.
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
                    Review all player information before continuing. Your
                    registration will not be complete until payment is
                    successfully received.
                  </p>
                </div>

                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold text-white transition hover:opacity-90"
                >
                  Continue to Secure Payment — ${registrationTotal}
                </button>
              </div>
            </div>
          </form>
        </Container>
      </section>
    </>
  );
}