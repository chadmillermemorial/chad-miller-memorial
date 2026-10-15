import Link from "next/link";
import Container from "@/components/ui/Container";
import NextTournament from "@/components/NextTournament";
export default function EnrollmentClosed() {
 return <main className="bg-slate-50 py-20"><Container>
  <div className="mb-12 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">2026 Inaugural · Event Completed</p>
   <h1 className="mt-5 text-4xl font-bold text-[var(--brand-navy)] md:text-6xl">Thank you for being part of it.</h1>
   <p className="mt-6 text-lg leading-8 text-slate-600">The October 9, 2026 tournament at Hyland Golf Course has concluded. Player registration, the waitlist, volunteer enrollment, and paid sponsorships are closed.</p>
   <p className="mt-4 leading-7 text-slate-600">Existing participants and sponsors can still contact the team about their 2026 records.</p>
   <Link href="/contact" className="mt-6 inline-block font-semibold text-[var(--brand-blue)] underline">Contact the tournament team</Link>
  </div><NextTournament />
 </Container></main>;
}
