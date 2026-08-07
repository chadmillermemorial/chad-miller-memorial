import Link from "next/link";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { tournament } from "@/lib/tournament";

export default function MissionPage() {
  return (
    <>
      <section className="bg-[var(--brand-navy)] py-24 text-white md:py-32">
        <Container>
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
              Our Mission
            </p>

            <h1 className="mt-5 text-5xl font-bold leading-tight md:text-7xl">
              Continuing Chad’s commitment to others.
            </h1>

            <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300">
              The tournament honors Sergeant Major Chad Miller by supporting
              the community and transition programs he worked to strengthen.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Chad and The Honor Foundation"
            title="A mission he helped bring closer to Fort Bragg."
          >
            <p>
              Chad played an instrumental role in establishing The Honor
              Foundation’s Fayetteville Chapter. At the time, the Fort Bragg
              Campus operated solely from Pinehurst. His efforts helped expand
              the program’s reach so it could serve the Special Operations
              community through both Pinehurst and Fayetteville.
            </p>
          </SectionHeading>
        </Container>
      </section>

      <section className="bg-slate-50 py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            <article className="rounded-3xl bg-[var(--brand-navy)] p-9 text-white shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-teal)]">
                Transition
              </p>

              <h2 className="mt-4 text-3xl font-bold">
                More than finding the next job.
              </h2>

              <p className="mt-6 leading-8 text-slate-300">
                The Honor Foundation helps Special Operations personnel
                understand how to translate their experience, leadership, and
                capabilities into successful civilian and corporate careers.
              </p>
            </article>

            <article className="rounded-3xl bg-[var(--sand)] p-9 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--golf-green)]">
                Community
              </p>

              <h2 className="mt-4 text-3xl font-bold text-[var(--brand-navy)]">
                A new tribe and renewed purpose.
              </h2>

              <p className="mt-6 leading-8 text-slate-600">
                Fellows build relationships locally and nationally, reconnect
                with a strong community, and identify purpose beyond military
                service—not merely a next step.
              </p>
            </article>

            <article className="rounded-3xl bg-[var(--brand-sky)] p-9 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-blue)]">
                Network
              </p>

              <h2 className="mt-4 text-3xl font-bold text-[var(--brand-navy)]">
                Relationships that continue after graduation.
              </h2>

              <p className="mt-6 leading-8 text-slate-600">
                The Honor Foundation provides access to mentors, business
                leaders, alumni, and professional networks that help Fellows
                thrive throughout their transition and beyond.
              </p>
            </article>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <SectionHeading
              eyebrow="Where Proceeds Go"
              title="Supporting Fellows, programs, and lasting connections."
            >
              <p>
                Proceeds from the {tournament.name} help support each Fellows
                Cohort as participants prepare for their transition from
                military service.
              </p>

              <p className="mt-5">
                Funding also supports networking events that bring people
                together, expand professional relationships, strengthen
                camaraderie, and create enduring friendships within the Special
                Operations community.
              </p>
            </SectionHeading>

            <div className="rounded-3xl bg-[var(--brand-navy)] p-10 text-white shadow-xl">
              <h2 className="text-3xl font-bold">
                Every contribution extends the mission.
              </h2>

              <p className="mt-6 leading-8 text-slate-300">
                Playing, sponsoring, volunteering, and donating all help
                continue the work Chad believed in and expand opportunities for
                future Fellows.
              </p>

              <Link
                href="/register"
                className="mt-8 inline-flex rounded-full bg-[var(--brand-teal)] px-7 py-3.5 font-semibold text-white transition hover:opacity-90"
              >
                Support the Mission
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}