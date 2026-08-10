"use client";

import Image from "next/image";
import { useState } from "react";
import Container from "@/components/ui/Container";

const presetAmounts = [50, 100, 250, 500];

export default function DonatePage() {
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  const donationAmount = useCustomAmount
    ? Math.max(Number(customAmount) || 0, 1)
    : amount;

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
                Donate
              </p>

              <h1 className="mt-5 text-5xl font-bold md:text-6xl">
                Support the Memorial
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Your contribution helps support the Sergeant Major Chad Miller
                Memorial Golf Tournament and its mission of benefiting The
                Honor Foundation.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20">
        <Container>
          <form
            action="/api/donation-checkout"
            method="POST"
            className="mx-auto max-w-4xl"
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

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="font-semibold">Name *</span>

                  <input
                    required
                    name="donorName"
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
              </div>

              <label className="mt-8 flex items-start gap-3">
                <input
                  name="anonymous"
                  type="checkbox"
                  className="mt-1 h-5 w-5"
                />

                <span>
                  <span className="font-semibold">
                    Make my donation anonymous
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    We will still retain your information for tournament
                    records, but your name will not be publicly recognized.
                  </span>
                </span>
              </label>

              <label className="mt-8 block">
                <span className="font-semibold">Message / Notes</span>

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
                    Donation Total: ${donationAmount.toLocaleString()}
                  </h2>

                  <p className="mt-4 max-w-xl leading-7 text-slate-300">
                    Your contribution will be recorded after secure payment is
                    successfully completed.
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