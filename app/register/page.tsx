import Link from "next/link";
import Container from "@/components/ui/Container";
import NextTournament from "@/components/NextTournament";
import { tournament } from "@/lib/tournament";
export default function RegisterPage() {
 return <main className="bg-slate-50 py-20"><Container>
  <div className="mb-12 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">Stay Connected</p>
  <h1 className="mt-5 text-4xl font-bold text-[var(--brand-navy)] md:text-6xl">One incredible beginning. More to come.</h1>
  <p className="mt-6 text-lg leading-8 text-slate-600">Our inaugural outing at {tournament.venue.name} on {tournament.date} was an absolute success. Thank you to everyone who made it possible.</p>
  <p className="mt-4 text-lg leading-8 text-slate-600">2026 registration and the waitlist are closed. 2027 enrollment will open when the next event is ready.</p></div>
  <NextTournament />
  <div className="mt-10 grid gap-6 md:grid-cols-2">
  <article className="rounded-3xl bg-white p-8"><h2 className="text-2xl font-bold text-[var(--brand-navy)]">Support the mission</h2><p className="mt-4 leading-7 text-slate-600">Learn about contributing to next year’s tournament.</p><Link href="/register/donate" className="mt-5 inline-block font-semibold text-[var(--brand-blue)] underline">Donation information</Link></article>
  <article className="rounded-3xl bg-white p-8"><h2 className="text-2xl font-bold text-[var(--brand-navy)]">Our 2026 community</h2><p className="mt-4 leading-7 text-slate-600">Celebrate the sponsors and supporters behind the inaugural tournament.</p><Link href="/sponsors" className="mt-5 inline-block font-semibold text-[var(--brand-blue)] underline">Thank our supporters</Link></article>
  </div>
 </Container></main>;
}
