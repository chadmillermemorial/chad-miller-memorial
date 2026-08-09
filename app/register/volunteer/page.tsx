import Link from "next/link";
import Container from "@/components/ui/Container";

const volunteerRoles = [
  {
    title: "Registration & Check-In",
    description:
      "Welcome players, confirm registration details, distribute materials, and help the morning start smoothly.",
  },
  {
    title: "Silent Auction Support",
    description:
      "Assist with item setup, bidding questions, winner coordination, and auction closeout.",
  },
  {
    title: "On-Course Support",
    description:
      "Support contest holes, sponsor locations, player flow, and other needs around the course.",
  },
  {
    title: "General Event Support",
    description:
      "Help wherever needed with setup, hospitality, logistics, lunch, awards, and event closeout.",
  },
];

export default function VolunteerPage() {
  return (
    <>
      <section className="bg-[var(--brand-navy)] py-24 text-white md:py-32">
        <Container>
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
              Volunteer
            </p>

            <h1 className="mt-5 text-5xl font-bold leading-tight md:text-7xl">
              Help make the day possible.
            </h1>

            <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300">
              Volunteers are essential to creating a welcoming, organized, and
              meaningful tournament experience for players, sponsors, families,
              and guests.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
              Volunteer Opportunities
            </p>

            <h2 className="mt-4 text-4xl font-bold text-[var(--brand-navy)] md:text-5xl">
              Choose how you would like to help.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Volunteers arrive at 6:00 AM, with assignments ranging from
              registration and silent-auction support to on-course operations
              and general event assistance.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {volunteerRoles.map((role, index) => (
              <article
                key={role.title}
                className={`rounded-3xl p-8 shadow-lg ${
                  index === 0
                    ? "bg-[var(--brand-navy)] text-white"
                    : index === 1
                      ? "bg-[var(--sand)] text-[var(--brand-navy)]"
                      : index === 2
                        ? "bg-[var(--brand-sky)] text-[var(--brand-navy)]"
                        : "bg-slate-50 text-[var(--brand-navy)]"
                }`}
              >
                <h3 className="text-3xl font-bold">{role.title}</h3>

                <p
                  className={`mt-5 leading-7 ${
                    index === 0 ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {role.description}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
                Volunteer Day
              </p>

              <h2 className="mt-4 text-4xl font-bold text-[var(--brand-navy)]">
                What to expect.
              </h2>

              <ul className="mt-8 space-y-4 text-lg text-slate-600">
                <li>6:00 AM volunteer arrival</li>
                <li>Assignment briefing and event setup</li>
                <li>Breakfast provided</li>
                <li>Volunteer T-shirt</li>
                <li>Lunch provided</li>
                <li>Support throughout tournament operations</li>
                <li>Participation in the tribute and awards program</li>
              </ul>
            </div>

            <div className="rounded-3xl bg-white p-10 shadow-xl">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Ready to Volunteer?
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                Complete the volunteer registration form so the tournament team
                can collect your contact information, shirt size, and preferred
                assignment.
              </p>

              <Link
                href="https://docs.google.com/forms/d/e/1FAIpQLSf4qgGI7pUX40Utb8ITEJszs9LTs7VA5ChFbnVv05SXEeArnQ/viewform?usp=publish-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex rounded-full bg-[var(--brand-blue)] px-7 py-3.5 font-semibold text-white transition hover:opacity-90"
              >
                Complete Volunteer Registration
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}