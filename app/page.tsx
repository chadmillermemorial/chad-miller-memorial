import Link from "next/link";
import Hero from "@/components/home/Hero";
import AboutPreview from "@/components/home/AboutPreview";
import TournamentPreview from "@/components/home/TournamentPreview";
import Container from "@/components/ui/Container";

export default function Home() {
  return (
    <main>
      <Hero />
      <AboutPreview />
      <TournamentPreview />

      <section className="bg-[var(--brand-navy)] py-24 text-center text-white">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">
            With heartfelt gratitude
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            From The Honor Foundation and Chad’s family: thank you.
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-300">
            Our inaugural outing was an absolute success because of this community. Special thanks to Hyland Golf Course, Limitless, Embers, our Grey Sponsors and Hole Sponsors, our donors and volunteers, and most importantly, every player who came out to honor Chad. You helped bring his legacy to life through fellowship, service, and remembrance.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-full bg-[var(--brand-teal)] px-8 py-4 font-semibold text-white hover:-translate-y-1 hover:opacity-90"
            >
              What’s Next in 2027
            </Link>

            <Link
              href="/photos"
              className="rounded-full border border-white/40 px-8 py-4 font-semibold text-white hover:-translate-y-1 hover:bg-white hover:text-[var(--brand-navy)]"
            >
              View Tournament Photos
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}