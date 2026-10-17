import Image from 'next/image';
import Link from 'next/link';
export default function GalleryHeader({year}: {year:2026|2027}) {
 return <>
  <header className="pt-10 md:pt-14">
   <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-blue)]">Chad’s legacy. Our community.</p>
   <h1 className="mt-3 text-4xl font-bold md:text-6xl">Tournament photos</h1>
   <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">A day of remembrance, fellowship, and golf. Thank you from The Honor Foundation and Chad’s family to everyone who made our inaugural outing an absolute success.</p>
  </header>
  <figure className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
   <a href="/images/gallery/sponsors-2026.webp" target="_blank" rel="noopener noreferrer" aria-label="Open the complete 2026 sponsor recognition banner">
    <Image src="/images/gallery/sponsors-2026.webp" alt="2026 tournament sponsor recognition banner, honoring our Grey Sponsors and fundraising partners and Hole Sponsors" width={1800} height={1013} unoptimized priority className="h-auto w-full" />
   </a>
   <figcaption className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">Our 2026 sponsors made this day possible. Special thanks also to Hyland Golf Course, Limitless, Embers, our donors and volunteers, and most importantly our players. <Link href="/sponsors" className="font-semibold text-[var(--brand-blue)] underline">Meet our sponsors and visit their websites.</Link></figcaption>
  </figure>
  <nav aria-label="Photo collections" className="mt-9 flex gap-3 border-b border-slate-200 pb-5">
   {[2026,2027].map(value=><Link key={value} href={value===2026?'/photos':'/photos/2027'} aria-current={year===value?'page':undefined} className={`rounded-full px-5 py-3 text-center text-sm font-semibold sm:text-base ${year===value?'bg-[var(--brand-navy)] text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{value} {value===2026?'Inaugural':'First Annual'}</Link>)}
  </nav>
 </>;
}
