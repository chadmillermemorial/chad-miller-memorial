import type {Metadata} from 'next';
import Container from '@/components/ui/Container';
import GalleryHeader from '@/components/gallery/GalleryHeader';
import NextTournament from '@/components/NextTournament';
export const metadata:Metadata={title:'2027 First Annual Photos | CSM Chad Miller Memorial',description:'Coming in 2027: the first annual CSM Chad Miller Memorial Golf Tournament at Kings Grant in Fayetteville, North Carolina. Sponsorship inquiries are welcome.'};
export default function Photos2027Page(){return <main className="bg-slate-50"><Container><GalleryHeader year={2027}/><section className="py-10"><p className="mb-6 text-lg leading-8 text-slate-600">Our next photo collection is coming in 2027. Join us in carrying Chad’s legacy forward.</p><NextTournament/></section></Container></main>;}
