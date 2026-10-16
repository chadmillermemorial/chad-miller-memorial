import Link from "next/link";
export default function NextTournament() {
 return <section className="rounded-3xl bg-[var(--brand-navy)] p-8 text-white md:p-12">
  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-teal)]">Coming in 2027 · First Annual</p>
  <h2 className="mt-4 text-3xl font-bold md:text-5xl">Next stop: Kings Grant.</h2>
  <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">We look forward to gathering again at Kings Grant in Fayetteville, North Carolina. The date, registration details, and sponsorship pricing will be announced when ready.</p>
  <p className="mt-4 leading-7 text-slate-300">2027 player registration is not open. Sponsorships are inquiries only; no payment or player places are being reserved.</p>
  <div className="mt-8 flex flex-wrap gap-4">
   <a href="https://kingsgrantgolfcc.com/" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/40 px-6 py-3 font-semibold">Visit Kings Grant ↗</a>
   <Link href="/2027?type=sponsor#interest" className="rounded-full bg-[var(--brand-teal)] px-6 py-3 font-semibold">2027 Sponsorship Inquiry</Link>
   <Link href="/2027#interest" className="rounded-full border border-white/40 px-6 py-3 font-semibold">2027 Player Interest</Link>
  </div>
 </section>;
}
