"use client";

import Image from "next/image";
import { useState } from "react";
import Container from "@/components/ui/Container";

type SponsorLevel = "hole" | "grey" | "blue";

const sponsorLevels = [
  {
    id: "hole" as SponsorLevel,
    name: "Hole Sponsor",
    amount: 500,
    description: "Support the tournament with dedicated on-course visibility.",
    benefits: [
      "Dedicated sponsor sign at one tournament hole",
      "Company name or logo on the tournament website",
      "Recognition as a tournament sponsor",
    ],
  },
  {
    id: "grey" as SponsorLevel,
    name: "Grey Sponsor",
    amount: 1000,
    description:
      "Expanded visibility throughout the tournament and event areas.",
    benefits: [
      "Everything included with Hole Sponsorship",
      "Larger placement on main tournament sponsor signage",
      "Logo visibility in the registration and lunch areas",
      "Recognition in tournament communications",
    ],
  },
  {
    id: "blue" as SponsorLevel,
    name: "Blue Sponsor",
    amount: 2000,
    description:
      "Premier event-level partnership with our highest level of recognition.",
    benefits: [
      "Everything included with Grey Sponsorship",
      "Premier logo placement on major event signage",
      "Company banner placement at the tournament",
      "Prominent recognition during the tribute and awards program",
      "Premier website placement",
      "Opportunity to be associated with a major tournament feature",
    ],
  },
];

export default function SponsorsPage() {
  const [sponsorLevel, setSponsorLevel] =
    useState<SponsorLevel>("hole");

  const selectedLevel = sponsorLevels.find(
    (level) => level.id === sponsorLevel
  )!;

  const [blueAmount, setBlueAmount] = useState("2000");

  const amount =
    sponsorLevel === "blue"
      ? Math.max(Number(blueAmount) || 2000, 2000)
      : selectedLevel.amount;

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
                Sponsorship
              </p>

              <h1 className="mt-5 text-5xl font-bold md:text-6xl">
                Support the Memorial
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Sponsorship helps us host the Sergeant Major Chad Miller
                Memorial Golf Tournament and support the mission of The Honor
                Foundation.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20">
        <Container>
          <form
            action="/api/sponsor-checkout"
            method="POST"
            className="mx-auto max-w-5xl"
          >
            <input
              type="hidden"
              name="sponsorLevel"
              value={sponsorLevel}
            />

            <input
              type="hidden"
              name="sponsorAmount"
              value={amount}
            />

            <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                Sponsorship Level
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
                Choose your sponsorship
              </h2>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {sponsorLevels.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setSponsorLevel(level.id)}
                    className={`flex h-full flex-col rounded-3xl border-2 p-7 text-left transition ${
                      sponsorLevel === level.id
                        ? "border-[var(--brand-blue)] bg-[var(--brand-sky)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xl font-bold text-[var(--brand-navy)]">
                      {level.name}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {level.description}
                    </p>

                    <p className="mt-5 text-3xl font-bold text-[var(--brand-blue)]">
                      {level.id === "blue"
                        ? "$2,000+"
                        : `$${level.amount.toLocaleString()}`}
                    </p>

                    <div className="mt-6 border-t border-slate-300/70 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Includes
                      </p>

                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                        {level.benefits.map((benefit) => (
                          <li key={benefit} className="flex gap-2">
                            <span
                              aria-hidden="true"
                              className="font-bold text-[var(--brand-teal)]"
                            >
                              ✓
                            </span>

                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                ))}
              </div>

              {sponsorLevel === "blue" && (
                <div className="mt-8 rounded-2xl bg-slate-50 p-6">
                  <label className="block">
                    <span className="font-semibold text-[var(--brand-navy)]">
                      Blue Sponsorship Amount
                    </span>

                    <p className="mt-1 text-sm text-slate-500">
                      Blue Sponsorship begins at $2,000. Sponsors may increase
                      their contribution to provide additional support to the
                      tournament.
                    </p>

                    <div className="mt-3 flex max-w-sm items-center rounded-xl border border-slate-300 bg-white px-4">
                      <span className="font-semibold text-slate-500">$</span>

                      <input
                        type="number"
                        min="2000"
                        step="1"
                        value={blueAmount}
                        onChange={(event) =>
                          setBlueAmount(event.target.value)
                        }
                        className="w-full px-3 py-3 outline-none"
                      />
                    </div>
                  </label>
                </div>
              )}

              <p className="mt-8 text-sm leading-6 text-slate-500">
                Major tournament-feature recognition for Blue Sponsors will be
                coordinated with the tournament team based on availability and
                sponsorship level.
              </p>
            </div>

            <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm md:p-10">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Sponsor Information
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="font-semibold">
                    Company / Organization *
                  </span>

                  <input
                    required
                    name="company"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">
                    Contact Name *
                  </span>

                  <input
                    required
                    name="contactName"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">
                    Email *
                  </span>

                  <input
                    required
                    name="email"
                    type="email"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold">
                    Phone *
                  </span>

                  <input
                    required
                    name="phone"
                    type="tel"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="font-semibold">
                    Website
                  </span>

                  <input
                    name="website"
                    type="url"
                    placeholder="https://"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="font-semibold">
                    Notes
                  </span>

                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Optional information or special requests"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>
              </div>

              <p className="mt-6 text-sm leading-6 text-slate-500">
                We will follow up separately for your company logo and any
                sponsorship materials needed for the event.
              </p>
            </div>

            <div className="mt-10 rounded-3xl bg-[var(--brand-navy)] p-8 text-white md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">
                    Secure Checkout
                  </p>

                  <h2 className="mt-3 text-3xl font-bold">
                    Sponsorship Total: ${amount.toLocaleString()}
                  </h2>

                  <p className="mt-4 max-w-xl leading-7 text-slate-300">
                    Your sponsorship will be confirmed after secure payment is
                    successfully completed.
                  </p>
                </div>

                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold text-white transition hover:opacity-90"
                >
                  Continue to Secure Payment — ${amount.toLocaleString()}
                </button>
              </div>
            </div>
          </form>
        </Container>
      </section>
    </>
  );
}