import Image from 'next/image';
import Link from 'next/link';
export default function GalleryHeader({year}: {year:2026|2027}) {
 return <>
  <header className="pt-10 md:pt-14">
   <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">Chad’s legacy. Our community.</p>
   <h1 className="mt-3 text-4xl font-bold md:text-6xl">Tournament photos</h1>
   <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{year===2026?'A day of remembrance, fellowship, and golf. Thank you from The Honor Foundation and Chad’s family to everyone who made our inaugural outing an absolute success.':'The next chapter of golf, fellowship, and remembrance. Join us in carrying Chad’s legacy forward at our 2027 First Annual tournament.'}</p>
  </header>
  {year===2026 ? <figure className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
   <a href="/images/gallery/sponsors-2026.webp" target="_blank" rel="noopener noreferrer" aria-label="Open the complete 2026 sponsor recognition banner">
    <Image src="/images/gallery/sponsors-2026.webp" alt="2026 tournament sponsor recognition banner, honoring our Grey Sponsors and fundraising partners and Hole Sponsors" width={1800} height={1013} unoptimized priority className="h-auto w-full" />
   </a>
   <figcaption className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">Our 2026 sponsors made this day possible. Special thanks also to Hyland Golf Course, Limitless, Embers, our donors and volunteers, and most importantly our players. <Link href="/sponsors" className="font-semibold text-[var(--brand-blue)] underline">Meet our sponsors and visit their websites.</Link></figcaption>
  </figure> : <section aria-labelledby="sponsors-2027-heading" className="mt-8 rounded-2xl border-2 border-dashed border-[var(--brand-blue)] bg-white px-6 py-10 text-center md:px-10 md:py-14">
   <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)]">Our 2027 sponsors</p>
   <h2 id="sponsors-2027-heading" className="mt-4 text-3xl font-bold text-[var(--brand-navy)] md:text-4xl">To be determined</h2>
   <p className="mt-4 text-2xl font-semibold text-[var(--brand-blue)]">This could be you.</p>
   <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">Help make the next chapter possible. Sign up for information about sponsoring our 2027 tournament at Kings Grant. Packages and pricing will be announced when ready.</p>
   <Link href="/2027?type=sponsor#interest" className="mt-7 inline-flex rounded-full bg-[var(--brand-blue)] px-6 py-3 font-semibold text-white hover:opacity-90">Sign up for 2027 sponsorship information</Link>
  </section>}
  <nav aria-label="Photo collections" className="mt-9 flex gap-3 border-b border-slate-200 pb-5">
   {[2026,2027].map(value=><Link key={value} href={value===2026?'/photos':'/photos/2027'} aria-current={year===value?'page':undefined} className={`rounded-full px-5 py-3 text-center text-sm font-semibold sm:text-base ${year===value?'bg-[var(--brand-navy)] text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{value} {value===2026?'Inaugural':'First Annual'}</Link>)}
  </nav>
 </>;
}
