import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { tournament } from "@/lib/tournament";

export default function TournamentPage() {
  return (
    <>
      <section className="relative min-h-[650px] overflow-hidden">
        <Image
          src="/images/hero/hyland-hero.jpg"
          alt={`${tournament.venue.name} in ${tournament.venue.city}, ${tournament.venue.state}`}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

        <Container>
          <div className="relative flex min-h-[650px] items-end pb-20">
            <div className="max-w-3xl text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
                {tournament.date} • {tournament.venue.name}
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-tight md:text-7xl">
                Golf with purpose.
                <br />
                Play in Chad’s honor.
              </h1>

              <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-200">
                A four-person scramble in Southern Pines supporting{" "}
                {tournament.beneficiary}.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href={tournament.registration.playerLink}
                  className="rounded-full bg-[var(--brand-teal)] px-8 py-4 text-center font-semibold text-white transition hover:opacity-90"
                >
                  Register to Play
                </Link>

                <Link
                  href="/sponsors"
                  className="rounded-full border border-white/50 px-8 py-4 text-center font-semibold text-white transition hover:bg-white hover:text-[var(--brand-navy)]"
                >
                  Become a Sponsor
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Tournament Overview"
            title="A memorable day in the Sandhills."
          >
            <p>
              Players, sponsors, volunteers, and supporters will come together
              for golf, fellowship, and a shared commitment to continuing
              Chad’s legacy.
            </p>
          </SectionHeading>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <article className="rounded-3xl bg-[var(--brand-navy)] p-9 text-white shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-teal)]">
                The Tournament
              </p>

              <h2 className="mt-4 text-3xl font-bold">
                Competitive golf with a welcoming spirit.
              </h2>

              <ul className="mt-8 space-y-3 text-slate-300">
                <li>{tournament.format}</li>
                <li>18 holes with cart</li>
                <li>Shotgun start</li>
                <li>Team and individual competitions</li>
              </ul>
            </article>

            <article className="rounded-3xl bg-[var(--sand)] p-9 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--golf-green)]">
                The Venue
              </p>

              <h2 className="mt-4 text-3xl font-bold text-[var(--brand-navy)]">
                {tournament.venue.name}
              </h2>

              <ul className="mt-8 space-y-3 text-slate-600">
                <li>
                  {tournament.venue.city}, {tournament.venue.state}
                </li>
                <li>Classic Sandhills golf setting</li>
                <li>Practice range opens at 7:00 AM</li>
                <li>Longleaf pines and rolling terrain</li>
              </ul>
            </article>

            <article className="rounded-3xl bg-[var(--brand-sky)] p-9 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                The Mission
              </p>

              <h2 className="mt-4 text-3xl font-bold text-[var(--brand-navy)]">
                Continue Chad’s impact.
              </h2>

              <ul className="mt-8 space-y-3 text-slate-600">
                <li>Honor Command Sergeant Major Chad Miller</li>
                <li>Support {tournament.beneficiary}</li>
                <li>Strengthen community connections</li>
                <li>Celebrate service and fellowship</li>
              </ul>
            </article>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--brand-navy)] py-24 text-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">
                Why We Play
              </p>

              <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                More than a round of golf.
              </h2>
            </div>

            <p className="text-xl leading-9 text-slate-300">
              This tournament brings together the people and communities Chad
              cared about most. Every team, sponsor, volunteer, and supporter
              helps transform remembrance into continued service and lasting
              impact.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-24">
        <Container>
          <SectionHeading
            eyebrow="Event Schedule"
            title="A full day of golf, fellowship, and tribute."
          >
            <p>
              Volunteers begin setup at 6:00 AM, with player registration and
              breakfast beginning at 7:00 AM.
            </p>
          </SectionHeading>

          <div className="relative mt-16 max-w-4xl">
            <div className="absolute bottom-5 left-[7px] top-5 w-px bg-slate-300 md:left-[159px]" />

            <div className="space-y-8">
              {tournament.schedule.map((item) => (
                <div
                  key={`${item.time}-${item.event}`}
                  className="relative grid gap-3 pl-10 md:grid-cols-[130px_1fr] md:pl-0"
                >
                  <div className="absolute left-0 top-2 h-4 w-4 rounded-full border-4 border-white bg-[var(--brand-teal)] shadow md:left-[152px]" />

                  <p className="font-semibold text-[var(--brand-blue)]">
                    {item.time}
                  </p>

                  <div className="rounded-2xl bg-white p-6 shadow-sm md:ml-12">
                    <p className="text-xl font-bold text-[var(--brand-navy)]">
                      {item.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Food and Fellowship"
            title="Local food throughout the day."
          >
            <p>
              Breakfast and lunch are included with player registration.
            </p>
          </SectionHeading>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <article className="rounded-3xl bg-[var(--sand)] p-9 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--golf-green)]">
                Breakfast
              </p>

              <h2 className="mt-4 text-3xl font-bold text-[var(--brand-navy)]">
                Provided by{" "}
                <Link
                  href={tournament.food.breakfast.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-blue)] underline decoration-2 underline-offset-4 hover:opacity-75"
                >
                  {tournament.food.breakfast.provider}
                </Link>
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                {tournament.food.breakfast.description}
              </p>
            </article>

            <article className="rounded-3xl bg-[var(--brand-sky)] p-9 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Lunch
              </p>

              <h2 className="mt-4 text-3xl font-bold text-[var(--brand-navy)]">
                Provided by{" "}
                <Link
                  href={tournament.food.lunch.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-blue)] underline decoration-2 underline-offset-4 hover:opacity-75"
                >
                  {tournament.food.lunch.provider}
                </Link>
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                {tournament.food.lunch.description}
              </p>
            </article>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <article className="rounded-3xl bg-white p-9 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Dress Code
              </p>

              <h2 className="mt-4 text-3xl font-bold text-[var(--brand-navy)]">
                {tournament.dressCode.title}
              </h2>

              <p className="mt-6 leading-8 text-slate-600">
                {tournament.dressCode.description}
              </p>
            </article>

            <article className="rounded-3xl bg-white p-9 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Weather
              </p>

              <h2 className="mt-4 text-3xl font-bold text-[var(--brand-navy)]">
                {tournament.rainPolicy.title}
              </h2>

              <div className="mt-6 space-y-4 text-slate-600">
                {tournament.rainPolicy.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-7">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <div className="overflow-hidden rounded-3xl bg-[var(--golf-green)] text-white shadow-xl">
            <div className="grid lg:grid-cols-2">
              <div className="relative min-h-[380px]">
                <Image
                  src="/images/hero/hyland-hero.jpg"
                  alt={`Golf course at ${tournament.venue.name}`}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col justify-center p-10 md:p-14">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">
                  The Course
                </p>

                <h2 className="mt-4 text-4xl font-bold">
                  Hosted at {tournament.venue.name}.
                </h2>

                <p className="mt-6 text-lg leading-8 text-white/80">
                  Located in {tournament.venue.city}, Hyland provides a classic
                  Sandhills setting for a tournament centered on competition,
                  fellowship, and purpose.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--brand-sky)] py-24 text-center">
        <Container>
          <h2 className="mx-auto max-w-3xl text-4xl font-bold text-[var(--brand-navy)] md:text-5xl">
            Join us on {tournament.date}.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Play, sponsor, volunteer, or support the mission behind the
            tournament.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={tournament.registration.playerLink}
              className="rounded-full bg-[var(--brand-blue)] px-8 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Register to Play
            </Link>

            <Link
              href="/sponsors"
              className="rounded-full border border-[var(--brand-blue)] px-8 py-4 font-semibold text-[var(--brand-blue)] transition hover:bg-[var(--brand-blue)] hover:text-white"
            >
              View Sponsorships
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}