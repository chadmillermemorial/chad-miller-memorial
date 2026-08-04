import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--brand-navy)] px-6 py-28 text-white md:py-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(42,165,161,0.3),transparent_35%),linear-gradient(to_bottom_right,rgba(23,107,135,0.35),transparent_45%)]" />

      <div className="mx-auto max-w-6xl">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--brand-teal)]">
            {siteConfig.location.city}, {siteConfig.location.state}
          </p>

          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            {siteConfig.name}
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
  );
}