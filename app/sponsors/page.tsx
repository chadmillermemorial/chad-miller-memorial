"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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

const recognitionLevels = [
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

function getSponsorLogoProxyUrl(logoUrl: string) {
  if (!logoUrl) return "";

  try {
    const url = new URL(logoUrl);

    if (url.hostname !== "drive.google.com") {
      return "";
    }

    const fileId =
      url.searchParams.get("id")?.trim() || "";

    return /^[A-Za-z0-9_-]{10,}$/.test(fileId)
      ? "/api/sponsor-logo?id=" +
          encodeURIComponent(fileId)
      : "";
  } catch {
    return "";
  }
}

export default function SponsorsPage() {
  const [
    approvedSponsors,
    setApprovedSponsors,
  ] = useState<ApprovedSponsor[]>([]);

  useEffect(() => {
    let active = true;

    (async () => {
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
          Array.isArray(data.sponsors)
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
    })();

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
              alt="CSM Chad Miller Memorial logo"
              width={260}
              height={260}
              className="mx-auto w-full max-w-[220px]"
            />

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                Sponsorship
              </p>

              <h1 className="mt-5 text-5xl font-bold md:text-6xl">
                Thank You, 2026 Supporters
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Your generosity helped us host
                the Command Sergeant Major Chad
                Miller Memorial Golf
                Tournament, honor members
                of the U.S. Special
                Operations community, and
                support the mission of The
                Honor Foundation.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {approvedSponsors.length > 0 && (
        <section className="bg-white py-20">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                  Our Sponsors
                </p>

                <h2 className="mt-3 text-4xl font-bold text-[var(--brand-navy)]">
                  Thank You to Our
                  Tournament Sponsors
                </h2>

                <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-600">
                  We are grateful to the
                  organizations supporting
                  the CSM Chad Miller
                  Memorial Golf Tournament,
                  our memorial mission, and
                  The Honor Foundation.
                </p>
              </div>

              <div className="mt-12 space-y-12">
                {recognitionLevels.map(
                  (recognitionLevel) => {
                    const sponsorsAtLevel =
                      approvedSponsors.filter(
                        (sponsor) =>
                          sponsor.level ===
                          recognitionLevel.id
                      );

                    if (
                      !sponsorsAtLevel.length
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
                            (sponsor) => {
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

      <section className="bg-slate-50 py-20"><Container>
        <h2 className="text-3xl font-bold text-[var(--brand-navy)]">Looking ahead to 2027</h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Thank you to our 2026 supporters. Paid sponsorship enrollment for the inaugural tournament is closed. We welcome inquiries about supporting the 2027 First Annual tournament at Kings Grant in Fayetteville, NC. Packages and pricing will be announced when ready.</p>
        <Link href="/contact#sponsorship" className="mt-8 inline-flex rounded-full bg-[var(--brand-blue)] px-7 py-3 font-semibold text-white">2027 Sponsorship Inquiry</Link>
      </Container></section>
    </>
  );
}
