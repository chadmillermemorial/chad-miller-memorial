import Link from "next/link";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const sponsorships = [
  {
    name: "Title Sponsor",
    price: "Contact Us",
    description:
      "Premier tournament recognition with the highest level of visibility throughout the event.",
    benefits: [
      "Top billing across tournament materials",
      "Featured logo placement",
      "Recognition during opening and awards ceremonies",
      "Premium on-course presence",
      "Player entries included",
    ],
  },
  {
    name: "Presenting Sponsor",
    price: "Contact Us",
    description:
      "High-visibility support with prominent recognition before, during, and after the tournament.",
    benefits: [
      "Prominent logo placement",
      "Recognition during tournament programming",
      "On-course signage",
      "Digital and social recognition",
      "Player entries included",
    ],
  },
  {
    name: "Hole Sponsor",
    price: "Contact Us",
    description:
      "Showcase your organization while supporting the mission behind the tournament.",
    benefits: [
      "Custom hole signage",
      "Recognition on the sponsor page",
      "Tournament-day visibility",
      "Opportunity to engage players",
    ],
  },
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

            <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-300">
              Sponsorship helps create a first-class event while supporting The
              Honor Foundation Fort Bragg Chapters and the Special Operations
              community.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Become a Sponsor"
            title="Partner with a purpose-driven event."
          >
            <p>
              Sponsors receive meaningful recognition while helping us honor
              Sergeant Major Chad Miller through fellowship, service, and
              community.
            </p>
          </SectionHeading>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {sponsorships.map((sponsorship, index) => (
              <article
                key={sponsorship.name}
                className={`rounded-3xl p-9 shadow-lg ${
                  index === 0
                    ? "bg-[var(--brand-navy)] text-white"
                    : index === 1
                      ? "bg-[var(--sand)] text-[var(--brand-navy)]"
                      : "bg-[var(--brand-sky)] text-[var(--brand-navy)]"
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-teal)]">
                  {sponsorship.name}
                </p>

                <p className="mt-4 text-2xl font-bold">{sponsorship.price}</p>

                <p
                  className={`mt-5 leading-7 ${
                    index === 0 ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {sponsorship.description}
                </p>

                <ul
                  className={`mt-8 space-y-3 ${
                    index === 0 ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {sponsorship.benefits.map((benefit) => (
                    <li key={benefit}>• {benefit}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Why Sponsor?"
                title="Visibility with meaning."
              >
                <p>
                  Sponsorship places your organization in front of players,
                  supporters, community leaders, veterans, and members of the
                  Special Operations community while aligning your brand with a
                  meaningful mission.
                </p>
              </SectionHeading>
            </div>

            <div className="rounded-3xl bg-white p-9 shadow-lg">
              <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                Interested in Sponsoring?
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                We will work with you to find the right level of recognition
                and participation for your organization.
              </p>

              <Link
                href="/contact"
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