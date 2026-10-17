export const PHOTOS_PER_PAGE = 24;
export type GalleryPhoto = { number: number; filename: string; archive: string; offset: number; length: number; width: number; height: number };
export function galleryPage<T>(photos: T[], page: number): T[] {
  const bounded = Math.max(0, Math.min(Number.isFinite(page) ? Math.floor(page) : 0, Math.max(0, Math.ceil(photos.length / PHOTOS_PER_PAGE) - 1)));
  return photos.slice(bounded * PHOTOS_PER_PAGE, (bounded + 1) * PHOTOS_PER_PAGE);
}
export function photoBytes(bytes: Uint8Array, photo: Pick<GalleryPhoto, 'offset'|'length'>, status: number, contentRange: string|null): Uint8Array {
  let result: Uint8Array;
  if (status === 206) {
    const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(contentRange || '');
    if (!match || Number(match[1]) !== photo.offset || Number(match[2]) !== photo.offset + photo.length - 1 || bytes.length !== photo.length) throw new Error('The photo download was incomplete. Please try again.');
    result = bytes;
  } else if (status === 200 && bytes.length >= photo.offset + photo.length) {
    result = bytes.slice(photo.offset, photo.offset + photo.length);
  } else throw new Error('The photo could not be loaded. Please try again.');
  if (result[0] !== 255 || result[1] !== 216 || result[result.length-2] !== 255 || result[result.length-1] !== 217) throw new Error('The photo download was incomplete. Please try again.');
  return result;
}

export type GalleryViewerState = {selected:number|null;url:string;error:string};
type ViewerAction = {type:'select';selected:number|null}|{type:'loaded';selected:number;url:string;error:string};
// Selection owns its Blob URL. Closing/changing invalidates it synchronously,
// before effect cleanup revokes it; late responses cannot replace another photo.
export function galleryViewer(state:GalleryViewerState,action:ViewerAction):GalleryViewerState {
  if(action.type==='select')return {selected:action.selected,url:'',error:''};
  if(action.selected!==state.selected)return state;
  return {selected:state.selected,url:action.url,error:action.error};
}
