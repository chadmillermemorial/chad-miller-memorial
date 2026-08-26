import Link from "next/link";
import Container from "@/components/ui/Container";

export default function RegisterPage() {
  return (
    <>
      <section className="bg-[var(--brand-navy)] py-20 text-white">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
              Join Us
            </p>

            <h1 className="mt-5 text-5xl font-bold md:text-6xl">
              Choose how you&apos;d like to participate.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Every golfer, volunteer, sponsor, and donor plays a role in
              honoring Command Sergeant Major Chad Miller while supporting The Honor
              Foundation.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20">
        <Container>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-[var(--brand-navy)] p-8 text-white shadow-lg">
              <h2 className="text-3xl font-bold">Register to Play</h2>

              <p className="mt-5 leading-7 text-slate-300">
                Register yourself or your complete foursome for the tournament.
              </p>

              <Link
                href="/register/player"
                className="mt-8 inline-flex rounded-full bg-[var(--brand-teal)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Register Your Team
              </Link>
            </div>

            <div className="rounded-3xl bg-[#eee7dc] p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Volunteer
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                Help with registration, hospitality, silent auction, course
                operations, and honoring Chad&apos;s legacy.
              </p>

              <Link
                href="/register/volunteer"
                className="mt-8 inline-flex rounded-full bg-[var(--brand-teal)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Register to Volunteer
              </Link>
            </div>

            <div className="rounded-3xl bg-[var(--brand-sky)] p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Become a Sponsor
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                Support the tournament while showcasing your organization
                throughout the event.
              </p>

              <Link
                href="/sponsors"
                className="mt-8 inline-flex rounded-full bg-[var(--brand-teal)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
              >
                View Sponsorship Opportunities
              </Link>
            </div>

            <div className="rounded-3xl bg-slate-50 p-8 shadow-lg">
              <h2 className="text-3xl font-bold text-[var(--brand-navy)]">
                Donate
              </h2>

              <p className="mt-5 leading-7 text-slate-600">
                Unable to attend? You can still support the tournament and its
                mission.
              </p>

              <Link
                href="/register/donate"
                className="mt-8 inline-flex rounded-full bg-[var(--brand-teal)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Make a Donation
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}