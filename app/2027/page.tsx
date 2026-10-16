import type { Metadata } from 'next';
import Container from '@/components/ui/Container';
import NextTournament from '@/components/NextTournament';
import Inquiry2027Form from '@/components/forms/Inquiry2027Form';
import { inquiry2027Ready } from '@/lib/year-2027-service';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '2027 Interest & Sponsorship Inquiries', alternates: { canonical: '/2027' } };
export default async function Interest2027Page({ searchParams }: { searchParams: Promise<{type?:string}> }) {
 const initialType = (await searchParams).type === 'sponsor' ? 'sponsor' : 'player';
 const ready = await inquiry2027Ready();
 return <main className="bg-slate-50 py-16"><Container><NextTournament /><div id="interest" className="mt-10 scroll-mt-24"><Inquiry2027Form key={initialType} ready={ready} initialType={initialType} /></div></Container></main>;
}
