'use client';
import {useEffect,useReducer,useRef,useState} from 'react';
import Image from 'next/image';
import {galleryPage,galleryViewer,photoBytes,PHOTOS_PER_PAGE,type GalleryPhoto} from '@/lib/gallery';

export default function PhotoGallery({photos}:{photos:GalleryPhoto[]}) {
 const [page,setPage]=useState(0),[viewer,dispatch]=useReducer(galleryViewer,{selected:null,url:'',error:''}),[attempt,setAttempt]=useState(0);
 const {selected,url:photoUrl,error}=viewer;
 function selectPhoto(value:number|null){dispatch({type:'select',selected:value});}
 const dialog=useRef<HTMLDialogElement>(null),grid=useRef<HTMLDivElement>(null);
 const photo=selected===null?null:photos[selected],pageCount=Math.ceil(photos.length/PHOTOS_PER_PAGE);
 useEffect(()=>{
  if(selected!==null&&!dialog.current?.open) dialog.current?.showModal();
  if(selected===null&&dialog.current?.open) dialog.current.close();
  if(selected===null)return;
  const prior=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=prior;};
 },[selected]);
 useEffect(()=>{
  if(!photo)return;
  const controller=new AbortController();let objectUrl='';
  async function load(){
   try{
    const response=await fetch(photo!.archive,{headers:{Range:`bytes=${photo!.offset}-${photo!.offset+photo!.length-1}`},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])});
    const bytes=photoBytes(new Uint8Array(await response.arrayBuffer()),photo!,response.status,response.headers.get('content-range'));
    if(controller.signal.aborted)return;
    objectUrl=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'image/jpeg'}));dispatch({type:'loaded',selected:photo!.number-1,url:objectUrl,error:''});
   }catch{if(!controller.signal.aborted)dispatch({type:'loaded',selected:photo!.number-1,url:'',error:'This photo could not be loaded. Please try again.'});}
  }
  void load();
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[photo,attempt]);
 function changePage(value:number){setPage(value);grid.current?.scrollIntoView({block:'start'});}
 const paging=<nav aria-label="Gallery pages" className="flex flex-wrap items-center justify-center gap-4 py-6">
  <button type="button" disabled={page===0} onClick={()=>changePage(page-1)} className="rounded-full border border-slate-300 px-5 py-3 font-semibold disabled:opacity-35">Previous page</button>
  <label className="text-sm text-slate-600">Page <select aria-label="Gallery page" value={page} onChange={event=>changePage(Number(event.target.value))} className="mx-1 rounded-lg border border-slate-300 bg-white p-2 text-slate-900">{Array.from({length:pageCount},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select> of {pageCount}</label>
  <button type="button" disabled={page===pageCount-1} onClick={()=>changePage(page+1)} className="rounded-full border border-slate-300 px-5 py-3 font-semibold disabled:opacity-35">Next page</button>
 </nav>;
 return <section className="pb-10" aria-label="2026 tournament photo gallery">
  <div ref={grid} className="scroll-mt-24 pt-8">
   <h2 className="text-3xl font-bold">2026 Inaugural</h2>
   <p className="mt-3 text-slate-600">October 9, 2026 · Hyland Golf Course · {photos.length.toLocaleString()} photos</p>
   <p className="mt-3 max-w-3xl leading-7 text-slate-600">Select a photo to enlarge it or download the uploaded JPEG. Use the arrows to keep browsing. Downloads are the resized photos shared for this gallery.</p>
   <aside aria-labelledby="photography-credit-heading" className="mt-6 rounded-2xl border-l-4 border-[var(--brand-teal)] bg-[var(--brand-navy)] p-6 text-white md:p-8">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8ce4dc]">2026 tournament photography</p>
    <h3 id="photography-credit-heading" className="mt-3 text-3xl font-bold md:text-4xl"><a href="https://www.cedarlanephotography.com" target="_blank" rel="noopener noreferrer" className="underline decoration-white/50 underline-offset-8 hover:decoration-white">Cedar Lane Photography</a></h3>
    <p className="mt-4 max-w-3xl leading-7 text-slate-200">Thank you for capturing this day of remembrance, fellowship, and community. When sharing photos, please credit Cedar Lane Photography or tag <span className="font-semibold text-white">@cedarlanephoto.usa</span>.</p>
   </aside>
   {paging}
   <p role="status" aria-live="polite" className="mb-4 text-sm text-slate-500">Showing photos {page*PHOTOS_PER_PAGE+1}–{Math.min((page+1)*PHOTOS_PER_PAGE,photos.length)} of {photos.length.toLocaleString()}</p>
   <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
    {galleryPage(photos,page).map((item,tile)=><button key={item.number} type="button" aria-label={`Enlarge photo ${item.number} of ${photos.length}`} onClick={()=>selectPhoto(item.number-1)} className="group relative aspect-[3/2] overflow-hidden rounded-xl bg-slate-200 text-left focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-blue)]">
     <span aria-hidden="true" className="absolute inset-0 transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none" style={{backgroundImage:`url(/photos/2026/previews/page-${String(page+1).padStart(2,'0')}.webp)`,backgroundSize:'600% 400%',backgroundPosition:`${(tile%6)*20}% ${Math.floor(tile/6)*(100/3)}%`}} />
     <span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-xs font-medium text-white" aria-hidden="true">{String(item.number).padStart(4,'0')}</span>
    </button>)}
   </div>
   {paging}
  </div>
  <p className="mt-4 text-sm leading-6 text-slate-600">Need a photo removed? <a href="mailto:chadmillermemorial@gmail.com?subject=Tournament%20photo%20removal%20request" className="font-semibold text-[var(--brand-blue)] underline">Contact the tournament team</a> with the photo number or filename.</p>
  <dialog ref={dialog} aria-label="Enlarged tournament photo" onCancel={()=>selectPhoto(null)} onClick={event=>{if(event.target===event.currentTarget)selectPhoto(null);}} onKeyDown={event=>{if(event.key==='ArrowRight'&&selected!==null&&selected<photos.length-1){event.preventDefault();selectPhoto(selected+1);}if(event.key==='ArrowLeft'&&selected!==null&&selected>0){event.preventDefault();selectPhoto(selected-1);}}} className="fixed inset-0 m-auto max-h-[95dvh] w-[calc(100%-1rem)] max-w-6xl rounded-2xl bg-[var(--brand-navy)] p-4 text-white shadow-2xl backdrop:bg-black/85 sm:p-6">
   <div className="flex items-start justify-between gap-4">
    <div><h2 className="text-xl font-bold">Photo {photo?.number} of {photos.length.toLocaleString()}</h2><p className="mt-1 break-all text-xs text-slate-300">{photo?.filename}</p></div>
    <button type="button" autoFocus onClick={()=>selectPhoto(null)} className="rounded-full border border-white/40 px-4 py-2 font-semibold">Close ×</button>
   </div>
   <div className="my-4 flex h-[55dvh] items-center justify-center sm:h-[65dvh]" aria-busy={!!photo&&!photoUrl&&!error}>
    {photoUrl?<Image src={photoUrl} alt={`2026 inaugural tournament, photo ${photo?.number}`} width={photo?.width||1} height={photo?.height||1} unoptimized className="max-h-full max-w-full object-contain" />:error?<div role="alert" className="text-center"><p>{error}</p><button type="button" onClick={()=>{selectPhoto(selected);setAttempt(value=>value+1);}} className="mt-4 rounded-full border border-white/50 px-5 py-2">Try again</button></div>:<p role="status">Loading photo…</p>}
   </div>
   <div className="flex flex-wrap items-center justify-between gap-3">
    <button type="button" disabled={selected===null||selected===0} onClick={()=>selectPhoto(selected===null?null:selected-1)} className="rounded-full border border-white/40 px-4 py-3 text-sm font-semibold disabled:opacity-30">← Previous photo</button>
    {photoUrl&&<a href={photoUrl} download={photo?.filename} className="rounded-full bg-[var(--brand-teal)] px-5 py-3 text-sm font-semibold">Download JPEG</a>}
    <button type="button" disabled={selected===null||selected===photos.length-1} onClick={()=>selectPhoto(selected===null?null:selected+1)} className="rounded-full border border-white/40 px-4 py-3 text-sm font-semibold disabled:opacity-30">Next photo →</button>
   </div>
  </dialog>
 </section>;
}
