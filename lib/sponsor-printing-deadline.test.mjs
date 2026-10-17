import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url);
function loadPage(filename,cache=new Map()) {
 if(cache.has(filename))return cache.get(filename).exports;
 const loadedModule={exports:{}};cache.set(filename,loadedModule);
 const compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 function localRequire(id){
  if(!id.startsWith('@/')&&!id.startsWith('.'))return require(id);
  const base=id.startsWith('@/')?path.resolve(id.slice(2)):path.resolve(path.dirname(filename),id);
  if(base.endsWith('.json'))return JSON.parse(fs.readFileSync(base,'utf8'));
  const resolved=[base,base+'.tsx',base+'.ts'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  if(!resolved)throw Error('Cannot resolve '+id);
  return loadPage(resolved,cache);
 }
 new Function('require','module','exports',compiled)(localRequire,loadedModule,loadedModule.exports);
 return loadedModule.exports;
}
const render=()=>renderToStaticMarkup(React.createElement(loadPage(path.resolve('app/sponsors/page.tsx')).default));
const grey=['Mister Sparky of the Sandhills','Watchtower','Sandhills Community College','ReLaunch Advisors','Double Eagle Indoor Golf & Lounge','Furniture in the Pines','DAHR'];
const holes=['Bahls HVAC Service and Repair LLC','Buffalo Wild Wings','GFY Logistics','Alpha Health','Task Force Dagger Special Operations Foundation','Polar Skin','Computers 4 People','Spartan Blades'];

test('the initial public page recognizes all confirmed 2026 Grey and Hole sponsors without waiting for a live feed',()=>{
 const html=render().replaceAll('&amp;','&');
 for(const name of [...grey,...holes])assert.ok(html.includes(name),name+' missing from initial public recognition');
 assert.match(html,/Grey Sponsors/);assert.match(html,/Hole Sponsors/);
 for(const name of ['Hyland Golf Course','Limitless','Embers'])assert.ok(html.includes(name));
});

test('2026 recognition keeps 2027 enrollment inquiry-only with safe business links',()=>{
 const html=render();
 assert.match(html,/2027 Sponsorship Inquiry/);
 assert.match(html,/paid sponsorship enrollment.*closed/is);
 assert.match(html,/href="\/2027\?type=sponsor#interest"/);
 assert.doesNotMatch(html,/<form|Continue to Secure|javascript:/);
 for(const tag of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g))assert.match(tag[0],/rel="noopener noreferrer"/);
});


test('the 2027 photo collection invites future sponsors without showing the 2026 banner',()=>{
 const Header=loadPage(path.resolve('components/gallery/GalleryHeader.tsx')).default;
 const html=renderToStaticMarkup(React.createElement(Header,{year:2027}));
 assert.doesNotMatch(html,/sponsors-2026\.webp|Our 2026 sponsors made this day possible/);
 assert.match(html,/to be determined/i);
 assert.match(html,/could be you/i);
 assert.match(html,/href="\/2027\?type=sponsor#interest"/);
});

test('the 2026 photo collection retains the actual inaugural sponsor banner',()=>{
 const Header=loadPage(path.resolve('components/gallery/GalleryHeader.tsx')).default;
 const html=renderToStaticMarkup(React.createElement(Header,{year:2026}));
 assert.match(html,/sponsors-2026\.webp/);
 assert.match(html,/Our 2026 sponsors made this day possible/);
 assert.doesNotMatch(html,/could be you/i);
});
