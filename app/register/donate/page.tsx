import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Donation2027Form from '@/components/forms/Donation2027Form';
import { donation2027Ready } from '@/lib/year-2027-service';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Donate for the 2027 Tournament',alternates:{canonical:'/register/donate'}};
export default async function DonatePage() {
 const ready=await donation2027Ready();
 return <>
  <section className="bg-[var(--brand-navy)] py-20 text-white"><Container><p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-teal)]">Looking ahead to 2027</p><h1 className="mt-5 text-5xl font-bold md:text-6xl">Help make next year possible.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Thank you for making our inaugural outing a success. New general donations support the 2027 tournament at Kings Grant.</p><p className="mt-4 leading-7 text-slate-300">Interested in sponsoring or contributing an item or service? <Link href="/2027?type=sponsor#interest" className="underline underline-offset-4">Send a 2027 sponsorship inquiry</Link>. Packages and pricing are forthcoming.</p></Container></section>
  <section className="bg-slate-50 py-16"><Container><Donation2027Form ready={ready}/></Container></section>
 </>;
}
