import Link from "next/link";
import Container from "@/components/ui/Container";

const options = [
  {
    title: "Register to Play",
    description:
      "Register yourself or your complete foursome for the tournament.",
    href: "/register/player",
    button: "Register Your Team",
    style: "bg-[var(--brand-navy)] text-white",
    textStyle: "text-slate-300",
  },
  {
    title: "Volunteer",
    description:
      "Help with registration, hospitality, silent auction, course operations, and honoring Chad's legacy.",
    href: "/register/volunteer",
    button: "Learn About Volunteering",
    style: "bg-[var(--sand)] text-[var(--brand-navy)]",
    textStyle: "text-slate-600",
  },
  {
    title: "Become a Sponsor",
    description:
      "Support the tournament while showcasing your organization throughout the event.",
    href: "/sponsors",
    button: "View Sponsorship Opportunities",
    style: "bg-[var(--brand-sky)] text-[var(--brand-navy)]",
    textStyle: "text-slate-600",
  },
  {
    title: "Donate",
    description:
      "Unable to attend? You can still support the tournament and its mission.",
    href: "/register/donate",
    button: "Make a Donation",
    style: "bg-slate-50 text-[var(--brand-navy)]",
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

            <h1 className="mt-5 text-5xl font-bold md:text-7xl">
              Choose how you'd like to participate.
            </h1>

            <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300">
              Every golfer, volunteer, sponsor, and donor plays a role in
              honoring Sergeant Major Chad Miller while supporting The Honor
              Foundation.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-white py-24">
        <Container>
          <div className="grid gap-8 md:grid-cols-2">
            {options.map((option) => (
              <article
                key={option.title}
                className={`flex min-h-[320px] flex-col rounded-3xl p-10 shadow-lg ${option.style}`}
              >
                <h2 className="text-4xl font-bold">{option.title}</h2>

                <p className={`mt-6 flex-1 text-lg leading-8 ${option.textStyle}`}>
                  {option.description}
                </p>

                <Link
                  href={option.href}
                  className="mt-8 inline-flex w-fit rounded-full bg-[var(--brand-blue)] px-7 py-3.5 font-semibold text-white transition hover:-translate-y-1 hover:opacity-90"
                >
                  {option.button}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}