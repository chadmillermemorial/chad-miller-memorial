import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function TournamentPreview() {
  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--golf-green)]">
            Tournament Venue
          </p>

          <h2 className="mt-3 text-4xl font-bold text-[var(--brand-navy)]">
            {siteConfig.location.course}
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            {siteConfig.location.city}, {siteConfig.location.state}
          </p>

          <p className="mt-6 max-w-2xl leading-7 text-slate-600">
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
  );
}