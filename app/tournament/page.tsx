import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import NextTournament from "@/components/NextTournament";
import { tournament } from "@/lib/tournament";
export default function TournamentPage() {
 return <main>
 <section className="relative min-h-[520px] overflow-hidden">
  <Image src="/images/hero/hyland-hero.jpg" alt="Hyland Golf Course, our 2026 inaugural tournament host" fill priority sizes="100vw" className="object-cover" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20" />
  <Container><div className="relative flex min-h-[520px] items-end py-20"><div className="max-w-3xl text-white">
  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">2026 Inaugural · {tournament.date} · Event Completed</p>
  <h1 className="mt-5 text-5xl font-bold md:text-7xl">An incredible beginning.</h1>
  <p className="mt-6 text-xl leading-9 text-slate-200">A day of golf, fellowship, and remembrance at {tournament.venue.name}, honoring Chad and supporting {tournament.beneficiary}.</p>
  </div></div></Container>
 </section>
 <section className="py-20"><Container><div className="mb-12 max-w-3xl">
 <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">A message from The Honor Foundation and Chad’s family</p>
 <h2 className="mt-4 text-4xl font-bold text-[var(--brand-navy)]">You made the first outing an absolute success.</h2>
 <p className="mt-6 text-lg leading-8 text-slate-600">Thank you to Hyland Golf Course for hosting us, Limitless and Embers for bringing everyone together over great food, and our Grey Sponsors, Hole Sponsors, donors, and volunteers for their generous support.</p>
 <p className="mt-5 text-lg leading-8 text-slate-600">Most importantly, thank you to our players. Your presence, camaraderie, and commitment to remembering Chad made this day so meaningful to his family and our community.</p>
 <p className="mt-5 text-lg leading-8 text-slate-600">2026 registration and the waitlist are now closed. We look forward to gathering again in 2027.</p>
 <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
 <Link href="/sponsors" className="font-semibold text-[var(--brand-blue)] underline">Meet our 2026 supporters</Link>
 <Link href="/photos" className="font-semibold text-[var(--brand-blue)] underline">See our 2026 Tournament Photos</Link>
 </div>
 </div><NextTournament /></Container></section>
 </main>;
}
