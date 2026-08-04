import Link from "next/link";

export default function AboutPreview() {
  return (
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
            supporters to celebrate Chad’s life and continue the impact he made
            throughout the Special Operations community.
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
            Memorial Tournament
          </p>

          <h3 className="mt-3 text-3xl font-bold text-[var(--brand-navy)]">
            Built around service, fellowship, and community.
          </h3>

          <p className="mt-6 leading-7 text-slate-600">
            This annual event honors Chad’s legacy while supporting The Honor
            Foundation Fort Bragg Chapters and those connected to the Joint
            Special Operations community.
          </p>
        </div>
      </div>
    </section>
  );
}