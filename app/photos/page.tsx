import type {Metadata} from 'next';
import Container from '@/components/ui/Container';
import GalleryHeader from '@/components/gallery/GalleryHeader';
import PhotoGallery from '@/components/gallery/PhotoGallery';
import photos from '@/data/photos-2026.json';
export const metadata:Metadata={title:'2026 Inaugural Photos | CSM Chad Miller Memorial',description:'Browse photos from the inaugural CSM Chad Miller Memorial Golf Tournament at Hyland Golf Course. Celebrating our players, sponsors, volunteers and community.'};
export default function PhotosPage(){return <main className="bg-slate-50"><Container><GalleryHeader year={2026}/><PhotoGallery photos={photos}/></Container></main>;}
