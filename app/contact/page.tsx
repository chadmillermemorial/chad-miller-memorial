import Link from "next/link";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const tournamentEmail = "chadmillermemorial@gmail.com";

function buildMailto(subject: string, category: string) {
  const body =
    `Inquiry Category: ${category}\n\n` +
    `SGM Chad Miller Memorial Golf Tournament\n\n` +
    `Please enter your question below:\n\n`;

  return `mailto:${tournamentEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

const contactOptions = [
  {
    title: "Player Registration",
    description:
      "Questions about player registration, team entries, pairings, or tournament availability.",
    href: buildMailto(
      "Player Registration Question",
      "Player Registration"
    ),
    button: "Email About Registration",
  },
  {
    title: "Sponsorship",
    description:
      "Discuss sponsorship opportunities, recognition, signage, and tournament participation.",
    href: buildMailto(
      "Sponsorship Question",
      "Sponsorship"
    ),
    button: "Email About Sponsorship",
  },
  {
    title: "Volunteer",
    description:
      "Questions about volunteering, assignments, arrival information, or ways to help on tournament day.",
    href: buildMailto(
      "Volunteer Question",
      "Volunteer"
    ),
    button: "Email About Volunteering",
  },
  {
    title: "Donations",
    description:
      "Questions about donations, contributions, acknowledgments, or other ways to support the tournament.",
    href: buildMailto(
      "Donation Question",
      "Donation"
    ),
    button: "Email About Donations",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-[var(--brand-navy)] py-24 text-white">
        <Container>
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
              Contact
            </p>

            <h1 className="mt-5 text-5xl font-bold leading-tight md:text-7xl">
              Connect with the tournament team.
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-300">
              Reach out with questions about playing, sponsorships,
              volunteering, donations, or the event itself.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Get in Touch"
            title="How can we help?"
          >
            <p>
              Choose the topic that best matches your question. Each button
              opens an email addressed to the tournament team and identifies
              the inquiry category for faster routing.
            </p>
          </SectionHeading>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {contactOptions.map((option, index) => (
              <article
                key={option.title}
                className={`flex flex-col rounded-3xl p-9 shadow-lg ${
                  index === 0
                    ? "bg-[var(--brand-navy)] text-white"
                    : index === 1
                      ? "bg-[var(--sand)] text-[var(--brand-navy)]"
                      : index === 2
                        ? "bg-[var(--brand-sky)] text-[var(--brand-navy)]"
                        : "bg-white text-[var(--brand-navy)]"
                }`}
              >
                <h2 className="text-3xl font-bold">
                  {option.title}
                </h2>

                <p
                  className={`mt-5 flex-1 leading-7 ${
                    index === 0
                      ? "text-slate-300"
                      : "text-slate-600"
                  }`}
                >
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
          <div className="rounded-3xl bg-white p-10 shadow-lg md:p-14">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
              Tournament Email
            </p>

            <h2 className="mt-4 text-4xl font-bold text-[var(--brand-navy)]">
              chadmillermemorial@gmail.com
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              For general tournament questions, please include your name,
              organization if applicable, and the reason for your inquiry so
              the tournament team can respond efficiently.
            </p>

            <Link
              href={buildMailto(
                "General Tournament Question",
                "General Tournament Question"
              )}
              className="mt-8 inline-flex rounded-full bg-[var(--brand-blue)] px-7 py-3.5 font-semibold text-white transition hover:opacity-90"
            >
              Send a General Email
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}