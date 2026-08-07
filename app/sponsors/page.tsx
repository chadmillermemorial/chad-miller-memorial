import Link from "next/link";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const sponsorships = [
  {
    name: "Legacy Sponsor",
    price: "$2,000+",
    description:
      "Premier recognition for organizations making a significant investment in Chad’s legacy and the mission of the tournament.",
    benefits: [
      "Complimentary tournament foursome",
      "Premium logo placement on the website",
      "Large logo on tournament banners",
      "Recognition during opening ceremonies",
      "Recognition during the tribute and awards program",
      "Featured social media recognition",
      "Opportunity to host an approved outdoor tent or display",
      "Promotional materials included in player welcome bags",
      "Recognition on course-wide sponsor signage",
    ],
    style: "bg-[var(--brand-navy)] text-white",
    textStyle: "text-slate-300",
  },
  {
    name: "Patriot Sponsor",
    price: "$1,000",
    description:
      "Expanded tournament-day visibility and recognition throughout the event.",
    benefits: [
      "Logo displayed on course-wide sponsor signage",
      "Logo on the tournament website",
      "Recognition during opening ceremonies",
      "Recognition during the awards program",
      "Tournament social media recognition",
      "Opportunity to provide items for player welcome bags",
      "Two invitations to the lunch social and tribute program",
    ],
    style: "bg-[var(--sand)] text-[var(--brand-navy)]",
    textStyle: "text-slate-600",
  },
  {
    name: "Hole Sponsor",
    price: "$500",
    description:
      "A strong option for businesses, organizations, families, and groups wishing to support the tournament.",
    benefits: [
      "Exclusive sponsorship of one golf hole",
      "Professionally produced sponsor sign at the hole",
      "Logo on the tournament website",
      "Recognition on the tournament sponsor board",
      "Opportunity to provide items for player welcome bags",
    ],
    style: "bg-[var(--brand-sky)] text-[var(--brand-navy)]",
    textStyle: "text-slate-600",
  },
];

const exclusiveOpportunities = [
  "Golf Cart Sponsor",
  "Driving Range Sponsor",
  "Putting Green Sponsor",
  "Beverage Cart Sponsor",
  "Player Gift Sponsor",
  "Awards Program Sponsor",
  "Silent Auction Sponsor",
  "Long Drive Sponsor",
  "Closest-to-the-Pin Sponsor",
  "Hole-in-One Sponsor",
];

export default function SponsorsPage() {
  return (
    <>
      <section className="bg-[var(--brand-navy)] py-24 text-white md:py-32">
        <Container>
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
              Sponsorship Opportunities
            </p>

            <h1 className="mt-5 text-5xl font-bold leading-tight md:text-7xl">
              Support the tournament.
              <br />
              Continue Chad’s legacy.
            </h1>

            <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300">
              Sponsorship helps create a first-class memorial event while
              supporting The Honor Foundation Fort Bragg Chapters and the
              Special Operations community.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Tournament Partners"
            title="Choose the sponsorship level that fits your organization."
          >
            <p>
              Every sponsor receives meaningful recognition while helping fund
              the tournament and expand its impact.
            </p>
          </SectionHeading>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {sponsorships.map((sponsorship) => (
              <article
                key={sponsorship.name}
                className={`flex flex-col rounded-3xl p-9 shadow-lg ${sponsorship.style}`}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-teal)]">
                  {sponsorship.name}
                </p>

                <p className="mt-4 text-4xl font-bold">{sponsorship.price}</p>

                <p className={`mt-6 leading-7 ${sponsorship.textStyle}`}>
                  {sponsorship.description}
                </p>

                <ul
                  className={`mt-8 flex-1 space-y-3 ${sponsorship.textStyle}`}
                >
                  {sponsorship.benefits.map((benefit) => (
                    <li key={benefit}>• {benefit}</li>
                  ))}
                </ul>

                <Link
                  href="mailto:chadmillermemorial@gmail.com?subject=Tournament Sponsorship"
                  className="mt-9 inline-flex w-fit rounded-full bg-[var(--brand-blue)] px-7 py-3.5 font-semibold text-white transition hover:opacity-90"
                >
                  Discuss Sponsorship
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-24">
        <Container>
          <SectionHeading
            eyebrow="Exclusive Opportunities"
            title="Sponsor a memorable part of the day."
          >
            <p>
              These opportunities provide focused recognition connected to a
              specific tournament experience. Availability and pricing will be
              confirmed with the tournament team.
            </p>
          </SectionHeading>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exclusiveOpportunities.map((opportunity) => (
              <div
                key={opportunity}
                className="rounded-2xl border border-slate-200 bg-white p-6 font-semibold text-[var(--brand-navy)] shadow-sm"
              >
                {opportunity}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[var(--brand-navy)] py-24 text-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">
                Why Sponsor?
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Visibility connected to a meaningful mission.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                Sponsors connect with golfers, veterans, community leaders,
                local businesses, and members of the Special Operations
                community while helping honor Sergeant Major Chad Miller.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-9 text-[var(--brand-navy)] shadow-xl">
              <h2 className="text-3xl font-bold">
                Build a custom partnership.
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                The tournament team can combine recognition, player entries,
                signage, hospitality, and on-site engagement into a package
                that fits your organization.
              </p>

              <Link
                href="mailto:chadmillermemorial@gmail.com?subject=Custom Sponsorship Package"
                className="mt-8 inline-flex rounded-full bg-[var(--brand-blue)] px-7 py-3.5 font-semibold text-white transition hover:opacity-90"
              >
                Contact the Tournament Team
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}