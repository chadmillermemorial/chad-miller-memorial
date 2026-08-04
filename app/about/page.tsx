import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-[var(--brand-navy)] px-6 py-28 text-white md:py-36">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(42,165,161,0.3),transparent_35%),linear-gradient(to_bottom_right,rgba(23,107,135,0.35),transparent_45%)]" />

        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--brand-teal)]">
              Southern Pines, North Carolina
            </p>

            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              Sergeant Major Chad Miller Memorial Golf Tournament
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">
              A day of golf, remembrance, and community in support of The Honor
              Foundation Fort Bragg Chapters and the Joint Special Operations
              community.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="rounded-full bg-[var(--brand-teal)] px-7 py-3.5 text-center font-semibold text-white transition hover:opacity-90"
              >
                Register to Play
              </Link>

              <Link
                href="/sponsors"
                className="rounded-full border border-white/30 px-7 py-3.5 text-center font-semibold text-white transition hover:bg-white hover:text-[var(--brand-navy)]"
              >
                Become a Sponsor
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">
              Honoring Chad’s Legacy
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-[var(--brand-navy)] md:text-5xl">
              Leadership, service, and a lasting commitment to others.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              The tournament brings together friends, teammates, sponsors, and
              supporters to celebrate Chad’s life and continue the impact he
              made throughout the Special Operations community.
            </p>

            <Link
              href="/about"
              className="mt-8 inline-flex font-semibold text-[var(--brand-blue)] hover:underline"
            >
              Read Chad’s story →
            </Link>
          </div>

          <div className="rounded-3xl bg-[var(--sand)] p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--golf-green)]">
              Tournament Venue
            </p>

            <h3 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
              Hyland Golf Club
            </h3>

            <p className="mt-4 leading-7 text-slate-600">
              Southern Pines, North Carolina
            </p>

            <p className="mt-6 leading-7 text-slate-600">
              Join us in the Sandhills for golf, fellowship, remembrance, and
              support of a meaningful mission.
            </p>

            <Link
              href="/tournament"
              className="mt-8 inline-flex rounded-full bg-[var(--golf-green)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              View Tournament Details
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}