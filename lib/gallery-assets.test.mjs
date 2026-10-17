import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {photoBytes} from './gallery.ts';
test('every one of the 1,020 gallery records retrieves a complete JPEG from its static album',()=>{
 assert.ok(fs.existsSync('data/photos-2026.json'),'The complete photo manifest has not been built');
 const photos=JSON.parse(fs.readFileSync('data/photos-2026.json','utf8'));
 assert.equal(photos.length,1020);assert.equal(new Set(photos.map(p=>p.filename)).size,1020);
 let archive='',bytes;
 for(const [index,photo] of photos.entries()){
  assert.equal(photo.number,index+1);assert.match(photo.archive,/^\/photos\/2026\/albums\/album-\d{2}\.zip$/);
  assert.ok(photo.width>0&&photo.height>0);assert.ok(Number.isInteger(photo.offset)&&photo.offset>=30);assert.ok(Number.isInteger(photo.length)&&photo.length>0);
  if(archive!==photo.archive){archive=photo.archive;bytes=new Uint8Array(fs.readFileSync('public'+archive));}
  const jpeg=photoBytes(bytes,photo,200,null);assert.equal(jpeg.length,photo.length);
 }
 for(let page=1;page<=43;page++){
  const image=fs.readFileSync(`public/photos/2026/previews/page-${String(page).padStart(2,'0')}.webp`);
  assert.ok(image.length>=12&&image.length<500000,`Preview page ${page} must be complete and below 500KB`);
  assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');
  assert.equal(image.readUInt32LE(4)+8,image.length,`Preview page ${page} is truncated`);
 }
});
