"use client";

import Image from "next/image";
import { useState } from "react";
import Container from "@/components/ui/Container";

const presetAmounts = [50, 100, 250, 500];

type RegisteredPlayerStatus = "" | "Yes" | "No";

export default function DonatePage() {
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  const [registeredPlayer, setRegisteredPlayer] =
    useState<RegisteredPlayerStatus>("");

  const [anonymous, setAnonymous] = useState(false);

  const [publicRecognition, setPublicRecognition] =
    useState(false);

  const donationAmount = useCustomAmount
    ? Math.max(Number(customAmount) || 0, 1)
    : amount;

  const recognitionEligible =
    registeredPlayer === "No" && !anonymous;

  return (
    <>
      <section className="bg-[var(--brand-navy)] py-20 text-white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <Image
              src="/images/logo/logo.png"
              alt="CSM Chad Miller Memorial logo"
              width={260}
              height={260}
              className="mx-auto w-full max-w-[220px]"
            />

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                Donate
              </p>

              <h1 className="mt-5 text-5xl font-bold md:text-6xl">
                Support the Memorial
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Your contribution helps support the Command Sergeant Major
                Chad Miller Memorial Golf Tournament and its mission of
                benefiting The Honor Foundation.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20">
        <Container>
          <div className="mx-auto mb-10 max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
              Ways to Give
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
              Choose how you would like to support the tournament
            </h2>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <a
                href="#monetary-donation"
                className="rounded-3xl border-2 border-[var(--brand-blue)] bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="text-2xl font-bold text-[var(--brand-navy)]">
                  Monetary Donation
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  Make a secure financial contribution through Stripe.
                </p>
              </a>

              <a
                href="/register/donate/in-kind"
                className="rounded-3xl border-2 border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand-blue)] hover:shadow-md"
              >
                <h3 className="text-2xl font-bold text-[var(--brand-navy)]">
                  In-Kind Donation
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  Offer an item, service, experience, prize, supply, or another
                  non-cash contribution for review.
                </p>
              </a>
            </div>
          </div>

          <form
            id="monetary-donation"
            action="/api/donation-checkout"
            method="POST"
            className="mx-auto max-w-4xl scroll-mt-24"
          >
            <input
              type="hidden"
              name="donationAmount"
              value={donationAmount}
            />

            <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                Contribution Amount
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                Choose your donation
              </h2>

              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(preset);
                      setUseCustomAmount(false);
                    }}
                    className={`rounded-2xl border-2 px-5 py-6 text-2xl font-bold transition ${
                      !useCustomAmount && amount === preset
                        ? "border-[var(--brand-blue)] bg-[var(--brand-sky)] text-[var(--brand-navy)]"
                        : "border-slate-200 bg-white text-[var(--brand-navy)] hover:border-slate-300"
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setUseCustomAmount(true)}
                className={`mt-4 w-full rounded-2xl border-2 p-5 text-left transition ${
                  useCustomAmount
                    ? "border-[var(--brand-blue)] bg-[var(--brand-sky)]"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="font-bold text-[var(--brand-navy)]">
                  Custom Amount
                </span>
              </button>

              {useCustomAmount && (
                <div className="mt-4 flex items-center rounded-xl border border-slate-300 bg-white px-4">
                  <span className="font-semibold text-slate-500">$</span>

                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={(event) =>
                      setCustomAmount(event.target.value)
                    }
                    placeholder="Enter amount"
                    className="w-full px-3 py-3 outline-none"
                  />
                </div>
              )}
            </div>

            <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm md:p-10">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Donor Information
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                We collect contact information for tournament records and
                donation administration. Public recognition is optional.
              </p>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="font-semibold">Name *</span>

                  <input
                    required
                    name="donorName"
                    type="text"
                    autoComplete="name"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">Email *</span>

                  <input
                    required
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">Phone *</span>

                  <input
                    required
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">
                    Are you registered to play in the tournament? *
                  </span>

                  <select
                    required
                    name="registeredPlayer"
                    value={registeredPlayer}
                    onChange={(event) => {
                      const value =
                        event.target.value as RegisteredPlayerStatus;

                      setRegisteredPlayer(value);

                      if (value !== "No") {
                        setPublicRecognition(false);
                      }
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  >
                    <option value="">
                      Select an option
                    </option>

                    <option value="No">
                      No
                    </option>

                    <option value="Yes">
                      Yes
                    </option>
                  </select>
                </label>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-8">
                <h3 className="text-xl font-bold text-[var(--brand-navy)]">
                  Public Recognition
                </h3>

                <p className="mt-2 leading-7 text-slate-600">
                  Non-player donors may choose to be recognized as community
                  supporters of the tournament. Recognition is completely
                  optional.
                </p>

                <label className="mt-6 flex items-start gap-3">
                  <input
                    name="anonymous"
                    type="checkbox"
                    checked={anonymous}
                    onChange={(event) => {
                      const nextAnonymous =
                        event.target.checked;

                      setAnonymous(nextAnonymous);

                      if (nextAnonymous) {
                        setPublicRecognition(false);
                      }
                    }}
                    className="mt-1 h-5 w-5"
                  />

                  <span>
                    <span className="font-semibold">
                      Make my donation anonymous
                    </span>

                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      We will still retain your information privately for
                      tournament records, but your name will not be publicly
                      recognized.
                    </span>
                  </span>
                </label>

                <label
                  className={`mt-6 flex items-start gap-3 ${
                    !recognitionEligible
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  <input
                    name="publicRecognition"
                    type="checkbox"
                    checked={publicRecognition}
                    disabled={!recognitionEligible}
                    onChange={(event) =>
                      setPublicRecognition(
                        event.target.checked
                      )
                    }
                    className="mt-1 h-5 w-5"
                  />

                  <span>
                    <span className="font-semibold">
                      Recognize me publicly as a tournament supporter
                    </span>

                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      Eligible non-player donors may be included in the
                      tournament&apos;s Community Donors &amp; Silent Auction
                      Supporters recognition.
                    </span>
                  </span>
                </label>

                {registeredPlayer === "Yes" && !anonymous && (
                  <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-600">
                    Community donor recognition is reserved for supporters
                    who are not registered to play in the tournament.
                  </p>
                )}

                {anonymous && (
                  <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-600">
                    Anonymous donations are not displayed in public
                    tournament recognition.
                  </p>
                )}

                {publicRecognition && (
                  <label className="mt-6 block">
                    <span className="font-semibold">
                      Public Recognition Name
                    </span>

                    <input
                      name="publicRecognitionName"
                      type="text"
                      placeholder="Optional — leave blank to use your donor name"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <span className="mt-2 block text-sm leading-6 text-slate-500">
                      You may use your individual name, family name, business,
                      or organization name.
                    </span>
                  </label>
                )}
              </div>

              <label className="mt-8 block">
                <span className="font-semibold">
                  Message / Notes
                </span>

                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Optional"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
            </div>

            <div className="mt-10 rounded-3xl bg-[var(--brand-navy)] p-8 text-white md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">
                    Secure Checkout
                  </p>

                  <h2 className="mt-3 text-3xl font-bold">
                    Donation Total: $
                    {donationAmount.toLocaleString()}
                  </h2>

                  <p className="mt-4 max-w-xl leading-7 text-slate-300">
                    Your contribution will be recorded after secure payment
                    is successfully completed.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={donationAmount < 1}
                  className="shrink-0 rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to Secure Payment — $
                  {donationAmount.toLocaleString()}
                </button>
              </div>
            </div>
          </form>
        </Container>
      </section>
    </>
  );
}
