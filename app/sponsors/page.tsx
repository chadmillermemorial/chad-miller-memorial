import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import sponsors from "@/data/sponsors-2026.json";
import { tournament } from "@/lib/tournament";

// The completed event uses the confirmed 2026 recognition roster, independently
// of enrollment payment/materials approval flags in the live dashboard.
export default function SponsorsPage() {
  return (
    <main>
      <section className="bg-[var(--brand-navy)] py-16 text-white md:py-20">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8ce4dc]">2026 Inaugural · Our community made it possible</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">A special thank you to our sponsors.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">From The Honor Foundation and Chad’s family: thank you for helping make our first outing an absolute success. Your support brought our community together to honor Chad and continue his legacy.</p>
        </Container>
      </section>

      <section className="bg-slate-50 py-12 md:py-16" aria-label="2026 sponsor recognition banner">
        <Container>
          <Image src="/images/gallery/sponsors-2026.webp" alt="The complete 2026 Grey Sponsor and Hole Sponsor recognition banner" width={1800} height={1013} priority sizes="(min-width: 1152px) 1104px, 100vw" className="h-auto w-full rounded-2xl border border-slate-200 bg-white shadow-sm" />
        </Container>
      </section>

      {([
        {id:"grey",title:"Grey Sponsors & Fundraising Partners",description:"Thank you for investing in this inaugural gathering and helping us carry Chad’s legacy forward.",items:sponsors.grey},
        {id:"hole",title:"Hole Sponsors",description:"Your support helped make a day of golf, remembrance, and fellowship possible.",items:sponsors.hole},
      ]).map(group=>(
        <section key={group.id} aria-labelledby={`${group.id}-heading`} className="border-b border-slate-200 bg-white py-12 md:py-16">
          <Container>
            <h2 id={`${group.id}-heading`} className="text-3xl font-bold text-[var(--brand-navy)] md:text-4xl">{group.title}</h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-600">{group.description}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map(sponsor=>(
                <article key={sponsor.name} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-xl font-bold leading-7 text-[var(--brand-navy)]">{sponsor.name}</h3>
                  <a href={sponsor.website} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${sponsor.name}`} className="mt-5 inline-flex self-start font-semibold text-[var(--brand-blue)] underline underline-offset-4">Visit website ↗</a>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ))}

      <section className="bg-[#f5f3ed] py-12 md:py-16">
        <Container>
          <h2 className="text-3xl font-bold text-[var(--brand-navy)]">Our host and food partners</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-600">Special thanks to Hyland Golf Course for hosting us, Limitless for breakfast, and Embers for lunch. You helped make everyone feel welcome and brought us together throughout the day.</p>
          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-4 font-semibold text-[var(--brand-blue)]">
            <a href="https://www.hylandgolfclub.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Hyland Golf Course ↗</a>
            <a href={tournament.food.breakfast.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Limitless ↗</a>
            <a href={tournament.food.lunch.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Embers ↗</a>
          </div>
          <p className="mt-8 max-w-3xl leading-7 text-slate-700">To our prize and auction donors, volunteers, and every player who joined us: thank you. Your generosity, time, and presence helped make this tribute to Chad so meaningful.</p>
        </Container>
      </section>

      <section className="bg-slate-50 py-16"><Container>
        <h2 className="text-3xl font-bold text-[var(--brand-navy)]">Looking ahead to 2027</h2>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">2026 paid sponsorship enrollment is closed. Our next tournament is October 8, 2027, at Kings Grant in Fayetteville, NC. We welcome sponsorship inquiries; packages and pricing will be announced when ready.</p>
        <Link href="/2027?type=sponsor#interest" className="mt-8 inline-flex rounded-full bg-[var(--brand-blue)] px-7 py-3 text-center font-semibold text-white">2027 Sponsorship Inquiry</Link>
      </Container></section>
    </main>
  );
}
