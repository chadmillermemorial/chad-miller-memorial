"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";
import Container from "@/components/ui/Container";

type SponsorLevel = "hole" | "grey" | "blue";

type ApprovedSponsor = {
  displayName: string;
  level: SponsorLevel;
  levelLabel: string;
  website: string;
  tagline: string;
  blueFeatureAssignment: string;
  logoUrl: string;
};

function getSponsorLogoProxyUrl(
  logoUrl: string
) {
  if (!logoUrl) {
    return "";
  }

  try {
    const url = new URL(logoUrl);

    if (
      url.hostname !==
      "drive.google.com"
    ) {
      return "";
    }

    const fileId =
      url.searchParams
        .get("id")
        ?.trim() || "";

    if (
      !/^[A-Za-z0-9_-]{10,}$/.test(
        fileId
      )
    ) {
      return "";
    }

    return (
      "/api/sponsor-logo?id=" +
      encodeURIComponent(fileId)
    );
  } catch {
    return "";
  }
}

const sponsorLevels = [
  {
    id: "hole" as SponsorLevel,
    name: "Hole Sponsor",
    amount: 500,
    description:
      "Honor a fallen member of the U.S. Special Operations community with dedicated memorial recognition on the course.",
    benefits: [
      "Dedicated Memorial Hole Sign honoring a fallen U.S. Special Operations service member",
      "Sponsor name or logo respectfully incorporated into the Memorial Hole Sign",
      "Company name or logo on the tournament website",
      "Recognition as a tournament sponsor",
    ],
  },
  {
    id: "grey" as SponsorLevel,
    name: "Grey Sponsor",
    amount: 1000,
    description:
      "Expanded tournament-wide recognition while supporting our Memorial Hole program.",
    benefits: [
      "Everything included with Hole Sponsorship",
      "Enhanced placement on the Main Sponsor Recognition Board",
      "Expanded visibility in major tournament gathering areas",
      "Recognition in selected tournament-wide communications",
    ],
  },
  {
    id: "blue" as SponsorLevel,
    name: "Blue Sponsor",
    amount: 2000,
    description:
      "Premier tournament partnership with priority recognition at major events, contests, and activity areas.",
    benefits: [
      "Premier placement on the Main Sponsor Recognition Board",
      "Premier website recognition",
      "Prominent recognition during the tribute and awards program",
      "Priority consideration for a major tournament event, contest, or activity area",
      "Dedicated Blue Sponsor feature signage or banner at the assigned area",
      "Recognition in selected tournament-wide communications",
    ],
  },
];

const sponsorRecognitionLevels = [
  {
    id: "blue" as SponsorLevel,
    label: "Blue Sponsors",
    description:
      "Premier tournament partners supporting the memorial at the highest sponsorship level.",
  },
  {
    id: "grey" as SponsorLevel,
    label: "Grey Sponsors",
    description:
      "Tournament partners providing expanded support and recognition throughout the event.",
  },
  {
    id: "hole" as SponsorLevel,
    label: "Hole Sponsors",
    description:
      "Sponsors helping us honor fallen members of the U.S. Special Operations community through the Memorial Hole program.",
  },
];

export default function SponsorsPage() {
  const [sponsorLevel, setSponsorLevel] =
    useState<SponsorLevel>("hole");

  const [
    approvedSponsors,
    setApprovedSponsors,
  ] =
    useState<ApprovedSponsor[]>([]);

  const selectedLevel =
    sponsorLevels.find(
      (level) =>
        level.id === sponsorLevel
    )!;

  const [
    blueAmount,
    setBlueAmount,
  ] = useState("2000");

  const amount =
    sponsorLevel === "blue"
      ? Math.max(
          Number(blueAmount) ||
            2000,
          2000
        )
      : selectedLevel.amount;

  useEffect(() => {
    let active = true;

    async function loadApprovedSponsors() {
      try {
        const response =
          await fetch(
            "/api/approved-sponsors",
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        if (
          active &&
          data?.ok === true &&
          Array.isArray(
            data.sponsors
          )
        ) {
          setApprovedSponsors(
            data.sponsors as ApprovedSponsor[]
          );
        }
      } catch (error) {
        console.error(
          "Unable to load approved sponsors:",
          error
        );
      }
    }

    loadApprovedSponsors();

    return () => {
      active = false;
    };
  }, []);

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
                Support the
                Memorial
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Sponsorship helps
                us host the
                Sergeant Major
                Chad Miller
                Memorial Golf
                Tournament, honor
                members of the
                U.S. Special
                Operations
                community, and
                support the mission
                of The Honor
                Foundation.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {approvedSponsors.length >
        0 && (
        <section className="bg-white py-20">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                  Our Sponsors
                </p>

                <h2 className="mt-3 text-4xl font-bold text-[var(--brand-navy)]">
                  Thank You to Our
                  Tournament
                  Sponsors
                </h2>

                <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-600">
                  We are grateful
                  to the
                  organizations
                  supporting the
                  SGM Chad Miller
                  Memorial Golf
                  Tournament, our
                  memorial mission,
                  and The Honor
                  Foundation.
                </p>
              </div>

              <div className="mt-12 space-y-12">
                {sponsorRecognitionLevels.map(
                  (
                    recognitionLevel
                  ) => {
                    const sponsorsAtLevel =
                      approvedSponsors.filter(
                        (
                          sponsor
                        ) =>
                          sponsor.level ===
                          recognitionLevel.id
                      );

                    if (
                      sponsorsAtLevel.length ===
                      0
                    ) {
                      return null;
                    }

                    return (
                      <div
                        key={
                          recognitionLevel.id
                        }
                      >
                        <div className="border-b border-slate-200 pb-4">
                          <h3 className="text-2xl font-bold text-[var(--brand-navy)]">
                            {
                              recognitionLevel.label
                            }
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {
                              recognitionLevel.description
                            }
                          </p>
                        </div>

                        <div
                          className={`mt-6 grid gap-5 ${
                            recognitionLevel.id ===
                            "blue"
                              ? "md:grid-cols-2"
                              : "md:grid-cols-3"
                          }`}
                        >
                          {sponsorsAtLevel.map(
                            (
                              sponsor
                            ) => {
                              const logoSrc =
                                getSponsorLogoProxyUrl(
                                  sponsor.logoUrl
                                );

                              return (
                                <article
                                  key={`${sponsor.level}-${sponsor.displayName}`}
                                  className={`flex h-full flex-col rounded-3xl border bg-white p-7 shadow-sm ${
                                    sponsor.level ===
                                    "blue"
                                      ? "border-[var(--brand-blue)]"
                                      : "border-slate-200"
                                  }`}
                                >
                                  {logoSrc && (
                                    <div className="mb-6 flex min-h-[110px] items-center justify-center rounded-2xl bg-white p-3">
                                      {sponsor.website ? (
                                        <a
                                          href={
                                            sponsor.website
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          aria-label={`Visit ${sponsor.displayName}`}
                                          className="flex h-full w-full items-center justify-center"
                                        >
                                          <img
                                            src={
                                              logoSrc
                                            }
                                            alt={`${sponsor.displayName} logo`}
                                            loading="lazy"
                                            className="max-h-24 max-w-full object-contain"
                                          />
                                        </a>
                                      ) : (
                                        <img
                                          src={
                                            logoSrc
                                          }
                                          alt={`${sponsor.displayName} logo`}
                                          loading="lazy"
                                          className="max-h-24 max-w-full object-contain"
                                        />
                                      )}
                                    </div>
                                  )}

                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)]">
                                    {
                                      sponsor.levelLabel
                                    }
                                  </p>

                                  {sponsor.website ? (
                                    <a
                                      href={
                                        sponsor.website
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-3 block text-2xl font-bold text-[var(--brand-navy)] transition hover:text-[var(--brand-blue)]"
                                    >
                                      {
                                        sponsor.displayName
                                      }
                                    </a>
                                  ) : (
                                    <h4 className="mt-3 text-2xl font-bold text-[var(--brand-navy)]">
                                      {
                                        sponsor.displayName
                                      }
                                    </h4>
                                  )}

                                  {sponsor.tagline && (
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                      {
                                        sponsor.tagline
                                      }
                                    </p>
                                  )}

                                  {sponsor.level ===
                                    "blue" &&
                                    sponsor.blueFeatureAssignment && (
                                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                          Featured
                                          Recognition
                                        </p>

                                        <p className="mt-1 font-semibold text-[var(--brand-navy)]">
                                          {
                                            sponsor.blueFeatureAssignment
                                          }
                                        </p>
                                      </div>
                                    )}
                                </article>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </Container>
        </section>
      )}

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
              value={
                sponsorLevel
              }
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
                Choose your
                sponsorship
              </h2>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {sponsorLevels.map(
                  (level) => (
                    <button
                      key={
                        level.id
                      }
                      type="button"
                      onClick={() =>
                        setSponsorLevel(
                          level.id
                        )
                      }
                      className={`flex h-full flex-col rounded-3xl border-2 p-7 text-left transition ${
                        sponsorLevel ===
                        level.id
                          ? "border-[var(--brand-blue)] bg-[var(--brand-sky)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xl font-bold text-[var(--brand-navy)]">
                        {
                          level.name
                        }
                      </p>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {
                          level.description
                        }
                      </p>

                      <p className="mt-5 text-3xl font-bold text-[var(--brand-blue)]">
                        {level.id ===
                        "blue"
                          ? "$2,000+"
                          : `$${level.amount.toLocaleString()}`}
                      </p>

                      <div className="mt-6 border-t border-slate-300/70 pt-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Includes
                        </p>

                        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                          {level.benefits.map(
                            (
                              benefit
                            ) => (
                              <li
                                key={
                                  benefit
                                }
                                className="flex gap-2"
                              >
                                <span
                                  aria-hidden="true"
                                  className="font-bold text-[var(--brand-teal)]"
                                >
                                  ✓
                                </span>

                                <span>
                                  {
                                    benefit
                                  }
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </button>
                  )
                )}
              </div>

              {sponsorLevel ===
                "hole" && (
                <div className="mt-8 rounded-2xl bg-slate-50 p-6">
                  <p className="font-semibold text-[var(--brand-navy)]">
                    About Memorial
                    Hole Sponsorship
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Each Memorial
                    Hole Sign will
                    share the story
                    of a fallen
                    member of the
                    U.S. Special
                    Operations
                    community. The
                    tournament team
                    will select and
                    prepare the
                    memorial
                    information,
                    while sponsor
                    recognition will
                    be presented
                    respectfully
                    alongside it.
                    The fallen
                    service member
                    will remain the
                    primary focus
                    of the sign.
                  </p>
                </div>
              )}

              {sponsorLevel ===
                "grey" && (
                <div className="mt-8 rounded-2xl bg-slate-50 p-6">
                  <p className="font-semibold text-[var(--brand-navy)]">
                    Expanded
                    Tournament
                    Recognition
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Grey Sponsors
                    receive
                    Memorial Hole
                    recognition
                    plus enhanced
                    placement on
                    the
                    tournament&apos;s
                    Main Sponsor
                    Recognition
                    Board and
                    recognition in
                    selected
                    tournament-wide
                    communications.
                  </p>
                </div>
              )}

              {sponsorLevel ===
                "blue" && (
                <div className="mt-8 rounded-2xl bg-slate-50 p-6">
                  <label className="block">
                    <span className="font-semibold text-[var(--brand-navy)]">
                      Blue
                      Sponsorship
                      Amount
                    </span>

                    <p className="mt-1 text-sm text-slate-500">
                      Blue
                      Sponsorship
                      begins at
                      $2,000.
                      Sponsors may
                      increase their
                      contribution
                      to provide
                      additional
                      support to the
                      tournament.
                    </p>

                    <div className="mt-3 flex max-w-sm items-center rounded-xl border border-slate-300 bg-white px-4">
                      <span className="font-semibold text-slate-500">
                        $
                      </span>

                      <input
                        type="number"
                        min="2000"
                        step="1"
                        value={
                          blueAmount
                        }
                        onChange={(
                          event
                        ) =>
                          setBlueAmount(
                            event
                              .target
                              .value
                          )
                        }
                        className="w-full px-3 py-3 outline-none"
                      />
                    </div>
                  </label>

                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <p className="font-semibold text-[var(--brand-navy)]">
                      Blue Sponsor
                      Special Events
                      & Areas
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Blue Sponsors
                      are prioritized
                      for major
                      tournament
                      events,
                      contests, and
                      activity areas
                      such as
                      Breakfast,
                      Lunch, the
                      Driving Range,
                      Putting Green,
                      Longest Drive,
                      Closest to the
                      Pin,
                      Hole-in-One
                      Contest, Silent
                      Auction, and
                      Tribute /
                      Awards
                      Program.
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      After
                      sponsorship is
                      completed, Blue
                      Sponsors may
                      rank their
                      preferred
                      opportunities
                      through their
                      private sponsor
                      materials page.
                      Assignments are
                      based on
                      availability
                      and the order
                      completed
                      sponsor
                      materials are
                      received.
                      Specific
                      assignments and
                      exclusivity are
                      not guaranteed,
                      and some major
                      areas may
                      recognize
                      multiple Blue
                      Sponsors.
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      If premium
                      feature
                      opportunities
                      are fully
                      assigned, or
                      additional
                      Memorial Hole
                      Sponsors are
                      needed, a Blue
                      Sponsor may
                      also be
                      assigned
                      Memorial Hole
                      recognition
                      while
                      maintaining
                      recognition
                      appropriate to
                      the Blue
                      Sponsorship
                      level.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm md:p-10">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Sponsor
                Information
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="font-semibold">
                    Company /
                    Organization *
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

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <p className="font-semibold text-[var(--brand-navy)]">
                  What happens
                  after payment?
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  After your
                  sponsorship
                  payment is
                  confirmed, we
                  will email your
                  primary contact a
                  unique private
                  link to submit
                  your company logo
                  and complete the
                  materials needed
                  for your
                  sponsorship
                  recognition.
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sponsor materials
                  are due by{" "}
                  <strong>
                    Friday,
                    September 11,
                    2026
                  </strong>
                  . Materials
                  received after
                  that date may not
                  be guaranteed
                  inclusion in
                  printed
                  tournament
                  materials.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-3xl bg-[var(--brand-navy)] p-8 text-white md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">
                    Secure Checkout
                  </p>

                  <h2 className="mt-3 text-3xl font-bold">
                    Sponsorship
                    Total: $
                    {amount.toLocaleString()}
                  </h2>

                  <p className="mt-4 max-w-xl leading-7 text-slate-300">
                    Your
                    sponsorship
                    will be
                    confirmed
                    after secure
                    payment is
                    successfully
                    completed.
                  </p>
                </div>

                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold text-white transition hover:opacity-90"
                >
                  Continue to
                  Secure Payment —
                  $
                  {amount.toLocaleString()}
                </button>
              </div>
            </div>
          </form>
        </Container>
      </section>
    </>
  );
}