import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
const html=await readFile('dist/index.html','utf8');
const {document}=parseHTML(html);
const root=document.querySelector('#am-artemis');
const site=JSON.parse(await readFile('src/site.json','utf8'));
test('one article title and all fourteen sections are in the initial HTML',()=>{
 assert.equal(document.querySelectorAll('h1').length,1);
 assert.equal(root.querySelectorAll('section[id]').length,14);
 assert.equal(document.documentElement.lang,'en-GB');
 assert(!html.includes('{{'));
 assert(root.textContent.includes('695,081 mi'));
 assert([...root.querySelectorAll('.am-stats dd')].every(el=>el.textContent.trim()!=='0 mi'));
});
test('all IDs are unique and fragment/ARIA references resolve',()=>{
 const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);
 assert.equal(ids.length,new Set(ids).size);
 for(const link of root.querySelectorAll('a[href^="#"]')) assert(ids.includes(link.getAttribute('href').slice(1)),link.outerHTML);
 for(const el of root.querySelectorAll('[aria-labelledby]')) for(const id of el.getAttribute('aria-labelledby').split(/\s+/)) assert(ids.includes(id),id);
});
test('images are responsive, sized, local and available',async()=>{
 for(const img of root.querySelectorAll('img')){
  assert(img.hasAttribute('alt'));
  assert(Number(img.getAttribute('width'))>0 && Number(img.getAttribute('height'))>0);
  assert(img.getAttribute('srcset'));
  assert(img.getAttribute('sizes'));
  const url=new URL(img.getAttribute('src'));
  const relative=url.pathname.slice(url.pathname.indexOf('/media/')+1);
  await access(`dist/${relative}`);
  if(img.getAttribute('loading')!=='eager')assert.equal(img.getAttribute('loading'),'lazy');
 }
 assert.equal(root.querySelectorAll('img[fetchpriority="high"]').length,1);
});
test('media has no autoplay, eager source or embedded third-party player',()=>{
 assert.equal(root.querySelectorAll('[autoplay],iframe,audio[src],video[src],video source[src]').length,0);
 for(const video of root.querySelectorAll('video'))assert.equal(video.getAttribute('preload'),'none');
 for(const audio of root.querySelectorAll('audio'))assert.equal(audio.getAttribute('preload'),'none');
});
test('metadata keeps the magazine URL canonical and preview unindexed',()=>{
 assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'),site.canonical);
 assert.equal(document.querySelector('meta[name="description"]').getAttribute('content'),site.description);
 assert(document.querySelector('meta[name="robots"]').getAttribute('content').includes('noindex'));
 const schema=JSON.parse(root.querySelector('[data-am-schema]').textContent);
 assert.equal(schema['@type'],'Article');
 assert.equal(schema.dateModified,site.reviewedDate);
 assert.equal(schema.mainEntityOfPage,site.canonical);
 assert(schema.citation.includes(site.sources.return));
});
test('reading and audio/video fallbacks work without JavaScript',()=>{
 for(const panel of root.querySelectorAll('[data-panel]'))assert(!panel.hasAttribute('hidden'));
 for(const audio of root.querySelectorAll('[data-audio]'))assert(audio.getAttribute('href').startsWith('https://'));
 assert.equal(root.querySelectorAll('[data-player]').length,1);
});
test('deployment payload and performance budgets',async()=>{
 const report=JSON.parse(await readFile('dist/build-report.json','utf8'));
 assert(report.jsGzipBytes<5000,`JS ${report.jsGzipBytes} exceeds 5 KB gzip`);
 assert(report.cssGzipBytes<7000,`CSS ${report.cssGzipBytes} exceeds 7 KB gzip`);
 assert(report.htmlGzipBytes<25000,`HTML ${report.htmlGzipBytes} exceeds 25 KB gzip`);
 const release=JSON.parse(await readFile('dist/release.json','utf8'));
 const payload=JSON.parse(await readFile(`dist/assets/content-${release.version}.json`,'utf8'));
 assert.equal(payload.version,root.dataset.version);
 assert(payload.html.includes('695,081 mi'));
 const install=await readFile('dist/squarespace.html','utf8');
 assert(install.includes('695,081 mi'));
 assert(!install.includes('name="robots"'));
 assert(install.includes('data-am-embed'));
});
