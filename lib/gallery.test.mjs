import assert from 'node:assert/strict';
import test from 'node:test';
const gallery=await import('./gallery.ts').catch(()=>({}));
// A broken byte range would show/download a neighboring photo; use real bytes.
test('extracts only the requested photo when a static host returns the whole album',()=>{
 assert.equal(typeof gallery.photoBytes,'function');
 const all=new Uint8Array([1,2,255,216,3,255,217,8]);
 assert.deepEqual([...gallery.photoBytes(all,{offset:2,length:5},200,null)],[255,216,3,255,217]);
});
test('accepts the exact HTTP partial response and rejects mismatched or truncated ranges',()=>{
 assert.equal(typeof gallery.photoBytes,'function');
 const photo=new Uint8Array([255,216,3,255,217]);
 assert.deepEqual([...gallery.photoBytes(photo,{offset:2,length:5},206,'bytes 2-6/8')],[...photo]);
 for(const [bytes,status,range] of [[photo,206,'bytes 0-4/8'],[photo.slice(0,4),206,'bytes 2-6/8'],[photo,403,null],[new Uint8Array([1,2,3,4,5]),206,'bytes 2-6/8']]) assert.throws(()=>gallery.photoBytes(bytes,{offset:2,length:5},status,range));
});
test('pages stay within the collection and the last page includes all remaining photos',()=>{
 assert.equal(typeof gallery.galleryPage,'function');
 const photos=Array.from({length:1020},(_,i)=>i);
 assert.deepEqual(gallery.galleryPage(photos,42),photos.slice(1008));
 assert.deepEqual(gallery.galleryPage(photos,999),photos.slice(1008));
 assert.deepEqual(gallery.galleryPage(photos,-1),photos.slice(0,24));
});

test('closing or changing a photo clears its revoked URL before a fresh download completes',()=>{
 assert.equal(typeof gallery.galleryViewer,'function');
 let state={selected:null,url:'',error:''};
 state=gallery.galleryViewer(state,{type:'select',selected:0});
 state=gallery.galleryViewer(state,{type:'loaded',selected:0,url:'blob:first',error:''});
 assert.equal(state.url,'blob:first');
 state=gallery.galleryViewer(state,{type:'select',selected:null});
 state=gallery.galleryViewer(state,{type:'select',selected:0});
 assert.equal(state.url,'','Reopening must show loading, never a revoked URL/download');
 state=gallery.galleryViewer(state,{type:'select',selected:1});
 state=gallery.galleryViewer(state,{type:'loaded',selected:0,url:'blob:stale',error:''});
 assert.equal(state.url,'','A response for the previous photo cannot become downloadable');
 state=gallery.galleryViewer(state,{type:'loaded',selected:1,url:'blob:fresh',error:''});
 assert.equal(state.url,'blob:fresh');
});
