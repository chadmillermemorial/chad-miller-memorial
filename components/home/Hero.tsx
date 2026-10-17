import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { tournament } from "@/lib/tournament";

export default function Hero() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[var(--brand-navy)] text-white">
        <Image
          src="/images/home/hyland-2026-957.webp"
          alt="The fairways, pines, and pond at Hyland Golf Course during our 2026 inaugural tournament"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,25,37,0.94)_0%,rgba(12,25,37,0.78)_48%,rgba(12,25,37,0.28)_100%)]" />
        <Container>
          <div className="flex min-h-[620px] flex-col justify-center py-16 md:min-h-[680px] md:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8ce4dc]">
              2026 Inaugural · {tournament.date}
            </p>
            <p className="mt-5 max-w-xl text-sm font-semibold uppercase tracking-[0.15em] text-white/85 md:text-base">
              CSM Chad Miller Memorial Golf Tournament
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
              Honoring Chad.
              <span className="mt-2 block text-[#8ce4dc]">Continuing His Legacy.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-100 md:text-xl">
              <strong className="block text-xl font-semibold text-white md:text-2xl">Our first outing was an absolute success.</strong>
              <span className="mt-3 block">Together, we honored Chad through golf, fellowship, and community in support of {tournament.beneficiary}.</span>
            </p>
            <div className="mt-9 flex max-w-3xl flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/tournament" className="rounded-full bg-[#197570] px-6 py-4 text-center font-semibold text-white transition hover:bg-[#125d59]">
                Celebrate the Inaugural
              </Link>
              <Link href="/sponsors" className="rounded-full border border-white/60 bg-black/15 px-6 py-4 text-center font-semibold text-white transition hover:bg-white hover:text-[var(--brand-navy)]">
                A Special Thank You to Our Sponsors
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section aria-label="Our 2026 host" className="border-b-4 border-[var(--brand-teal)] bg-[var(--brand-navy)] py-6 text-center text-white">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8ce4dc]">Our 2026 host</p>
          <p className="mt-2 text-2xl font-bold md:text-3xl">{tournament.venue.name}</p>
          <p className="mt-1 text-sm text-slate-300">{tournament.venue.city}, {tournament.venue.state}</p>
        </Container>
      </section>

      <section className="bg-[#f5f3ed] py-14 md:py-20">
        <Container>
          <div className="grid items-center gap-9 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)]">With heartfelt gratitude</p>
              <h2 className="mt-4 text-4xl font-bold leading-tight text-[var(--brand-navy)] md:text-5xl">You made this day possible.</h2>
              <p className="mt-5 text-xl font-semibold leading-8 text-[var(--brand-blue)]">From The Honor Foundation and Chad’s family: thank you.</p>
              <p className="mt-5 text-lg leading-8 text-slate-700">To Hyland Golf Course, Limitless, Embers, our Grey Sponsors and Hole Sponsors, our donors and volunteers, and most importantly, every player who joined us: your generosity and presence made this day so meaningful.</p>
              <p className="mt-4 leading-7 text-slate-700">You brought Chad’s legacy to life through fellowship, service, and remembrance. We are grateful to everyone who helped carry it forward.</p>
              <Link href="/photos" className="mt-7 inline-flex items-center rounded-full bg-[var(--brand-blue)] px-6 py-3 font-semibold text-white hover:opacity-90">View Tournament Photos →</Link>
            </div>
            <figure>
              <Image src="/images/home/hyland-2026-108.webp" alt="Players and supporters gathered outside Hyland’s clubhouse for the opening of the 2026 inaugural tournament" width={1280} height={723} sizes="(min-width: 1024px) 550px, 100vw" className="h-auto w-full rounded-2xl shadow-lg" />
              <figcaption className="mt-4 text-sm leading-6 text-slate-600">A community gathered to honor Chad at Hyland. Photos 108 and 957 by Cedar Lane Photography.</figcaption>
            </figure>
          </div>
        </Container>
      </section>
    </>
  );
}
