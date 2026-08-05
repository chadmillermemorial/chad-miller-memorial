import Link from "next/link";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { tournament } from "@/lib/tournament";

const options = [
  {
    title: "Player Registration",
    description:
      "Register as an individual player or submit a complete foursome.",
    href: tournament.registration.playerLink,
    button: "Player Registration",
    style: "bg-[var(--brand-navy)] text-white",
    textStyle: "text-slate-300",
  },
  {
    title: "Volunteer",
    description:
      "Help with check-in, on-course support, event operations, or general assistance.",
    href: tournament.registration.volunteerLink,
    button: "Volunteer",
    style: "bg-[var(--sand)] text-[var(--brand-navy)]",
    textStyle: "text-slate-600",
  },
  {
    title: "Donate",
    description:
      "Support the tournament and The Honor Foundation even if you cannot attend.",
    href: tournament.registration.donationLink,
    button: "Donate",
    style: "bg-[var(--brand-sky)] text-[var(--brand-navy)]",
    textStyle: "text-slate-600",
  },
];

export default function RegisterPage() {
  return (
    <>
      <section className="bg-[var(--brand-navy)] py-24 text-white md:py-32">
        <Container>
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
              Join Us
            </p>

            <h1 className="mt-5 text-5xl font-bold leading-tight md:text-7xl">
              Join us in honoring Chad.
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-300">
              Play in the tournament, volunteer your time, or support the
              mission through a donation.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Choose Your Role"
            title="How would you like to participate?"
          >
            <p>
              Select the option that best fits how you would like to support
              the {tournament.name}.
            </p>
          </SectionHeading>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {options.map((option) => (
              <article
                key={option.title}
                className={`flex flex-col rounded-3xl p-9 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl ${option.style}`}
              >
                <h2 className="text-3xl font-bold">{option.title}</h2>

                <p className={`mt-5 flex-1 leading-7 ${option.textStyle}`}>
                  {option.description}
                </p>

                <Link
                  href={option.href}
                  className="mt-8 inline-flex w-fit rounded-full bg-[var(--brand-blue)] px-7 py-3.5 font-semibold text-white transition hover:opacity-90"
                >
                  {option.button}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <SectionHeading
              eyebrow="Player Registration"
              title="What is included."
            >
              <ul className="space-y-3">
                <li>18 holes of golf</li>
                <li>Golf cart</li>
                <li>Practice range access</li>
                <li>Lunch</li>
                <li>Player gift</li>
                <li>Awards reception</li>
              </ul>
            </SectionHeading>

            <div className="rounded-3xl bg-white p-9 shadow-lg">
              <h2 className="text-2xl font-bold text-[var(--brand-navy)]">
                Registration Links Coming Soon
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                Player, volunteer, and donation links will be added once the
                final forms and payment process are ready.
              </p>

              <Link
                href={`mailto:${tournament.contactEmail}`}
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