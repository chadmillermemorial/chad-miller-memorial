import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { tournament } from "@/lib/tournament";

export default function Hero() {
  return (
    <section className="bg-[var(--brand-navy)] text-white">
      <Container>
        <div className="flex min-h-[82vh] flex-col items-center justify-center py-16 text-center">
          <Image
            src="/images/logo/logo.png"
            alt={`${tournament.name} logo`}
            width={420}
            height={420}
            priority
            className="mb-8 w-full max-w-[300px] md:max-w-[390px]"
          />

          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--brand-teal)]">
            {tournament.venue.city} • {tournament.venue.state}
          </p>

          <h1 className="mt-6 max-w-5xl text-5xl font-bold leading-tight md:text-7xl">
            Honoring Chad.
            <br />
            Continuing His Legacy.
          </h1>

          <p className="mt-8 max-w-3xl text-xl leading-9 text-slate-300">
            Join friends, teammates, families, and supporters for a day of golf
            and fellowship benefiting {tournament.beneficiary}.
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href={tournament.registration.playerLink}
              className="rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold transition hover:-translate-y-1 hover:opacity-90"
            >
              Register to Play
            </Link>

            <Link
              href="/sponsors"
              className="rounded-full border border-white/40 px-8 py-4 font-semibold transition hover:-translate-y-1 hover:bg-white hover:text-[var(--brand-navy)]"
            >
              Become a Sponsor
            </Link>
          </div>
        </div>
      </Container>

      <div className="relative h-[420px] w-full overflow-hidden md:h-[620px]">
        <Image
          src="/images/hero/hyland-hero.jpg"
          alt={`${tournament.venue.name} in ${tournament.venue.city}, ${tournament.venue.state}`}
          fill
          priority
          className="object-contain bg-[var(--brand-navy)]"
          sizes="100vw"
        />

        <div className="absolute bottom-6 left-6 rounded-full bg-black/55 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
          Hosted at {tournament.venue.name}
        </div>
      </div>
    </section>
  );
}