import { readFile, writeFile, mkdir, cp, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { transform } from 'esbuild';
import { parseHTML } from 'linkedom';
const site=JSON.parse(await readFile('src/site.json','utf8'));
const assetBase=process.env.ASSET_BASE || site.assetBase;
const base=new URL(assetBase);
if(!['https:','http:'].includes(base.protocol)) throw Error('Invalid asset base');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,16);
const resolve=html=>html.replace(/\{\{([\w.]+)\}\}/g,(_,key)=>{
 const value=key.split('.').reduce((o,k)=>o?.[k],site);
 if(value===undefined) throw Error(`Unknown content token: ${key}`);
 return esc(value);
});
let media={}; try {media=JSON.parse(await readFile('src/media.json','utf8'));} catch {}
const sections=[];
for(const name of site.sections) {
 let html=resolve(await readFile(`src/sections/${name}.html`,'utf8'));
 const {document}=parseHTML(`<div id="section-root">${html}</div>`);
 for(const img of document.querySelectorAll('img')) {
   const info=media[img.getAttribute('src')];
   if(!info) throw Error(`Image not optimised: ${img.getAttribute('src')}`);
   const variant=info.variants.find(v=>v.width>=960)||info.variants.at(-1);
   img.setAttribute('src',new URL(variant.path,base).href);
   img.setAttribute('srcset',info.variants.map(v=>`${new URL(v.path,base).href} ${v.width}w`).join(', '));
   img.setAttribute('sizes',name==='hero'?'100vw':name==='crew'?'(max-width:600px) 44vw, (max-width:900px) 44vw, 260px':'(max-width:600px) 100vw, (max-width:900px) 90vw, 1160px');
   img.setAttribute('width',String(info.width)); img.setAttribute('height',String(info.height));
 }
 sections.push(document.querySelector('#section-root').innerHTML);
}
const css=(await transform((await readFile('src/report.css','utf8')).replaceAll('__ASSET_BASE__',assetBase),{loader:'css',minify:true,target:'es2020'})).code;
const js=(await transform(await readFile('src/report.js','utf8'),{loader:'js',minify:true,format:'esm',target:'es2020'})).code;
const fallback=(await transform((await readFile('src/report.js','utf8')).replace('export function','function'),{minify:true,format:'iife',target:'es2020'})).code;
const image= [...parseHTML(`<div>${sections[0]}</div>`).document.querySelectorAll('img')][0].getAttribute('src');
const schema={ '@context':'https://schema.org', '@type':'Article', '@id':site.canonical+'#article', headline:'Artemis II Mission Report', description:site.description, mainEntityOfPage:site.canonical, image:[image], dateModified:site.reviewedDate, author:{'@type':'Organization',name:'Astromaniac Magazine',url:'https://www.astromaniacmagazine.com/about'}, publisher:{'@type':'Organization',name:'Astromaniac Magazine',url:'https://www.astromaniacmagazine.com/'}, inLanguage:'en-GB', citation:Object.values(site.sources) };
const content=sections.join('\n');
const version=hash(content+css+js+JSON.stringify(schema));
const article=`<article id="am-artemis" data-version="${version}" lang="en-GB">${content}<script type="application/ld+json" data-am-schema>${JSON.stringify(schema).replaceAll('<','\\u003c')}</script></article>`;
const cssPath=`assets/report-${hash(css)}.css`,jsPath=`assets/report-${hash(js)}.js`;
const output=path.resolve('dist');
if(path.dirname(output)!==process.cwd() || (await lstat(output).catch(()=>null))?.isSymbolicLink()) throw Error('Unsafe output directory');
await rm(output,{recursive:true,force:true});
await mkdir('dist/assets',{recursive:true});
await cp('public','dist',{recursive:true});
await writeFile(`dist/${cssPath}`,css); await writeFile(`dist/${jsPath}`,js);
const payload={version,html:article,css:new URL(cssPath,base).href,js:new URL(jsPath,base).href,title:site.title,description:site.description};
await writeFile(`dist/assets/content-${version}.json`,JSON.stringify(payload));
await writeFile('dist/release.json',JSON.stringify({version,payload:new URL(`assets/content-${version}.json`,base).href}));
const head=`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(site.title)}</title><meta name="description" content="${esc(site.description)}"><link rel="canonical" href="${site.canonical}"><meta name="robots" content="noindex,follow"><meta property="og:type" content="article"><meta property="og:title" content="${esc(site.title)}"><meta property="og:description" content="${esc(site.description)}"><meta property="og:url" content="${site.canonical}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#080a0e"><link rel="stylesheet" href="${new URL(cssPath,base)}">`;
await writeFile('dist/index.html',`<!doctype html><html lang="en-GB"><head>${head}<style>html,body{margin:0;background:#080a0e}html{color-scheme:dark}</style></head><body><main>${article}</main><script type="module" src="${new URL(jsPath,base)}"></script></body></html>`);
// The Squarespace install includes a complete static report and working fallback controls.
// Subsequent GitHub releases enhance that snapshot in the browser; see docs/DEPLOYMENT.md.
await writeFile('dist/squarespace.html',`<!-- Replace the OLD Artemis code blocks with this ONE block. Do not append it. -->\n<style data-am-style>${css}</style>\n${article}\n<script>${fallback}</script>\n<script defer src="${new URL('embed.js',base)}" data-am-embed></script>\n`);
const embed=(await transform(await readFile('src/embed.js','utf8'),{minify:true,target:'es2020',format:'iife'})).code;
await writeFile('dist/embed.js',embed);
await writeFile('dist/install-preview.html',`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><style>body{margin:0}</style><title>Squarespace installation preview</title></head><body><main>${await readFile('dist/squarespace.html','utf8')}</main></body></html>`);
await writeFile('dist/.nojekyll','');
await writeFile('dist/robots.txt','User-agent: *\nAllow: /\n');
const report={version,sectionCount:sections.length,htmlBytes:Buffer.byteLength(article),cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js),htmlGzipBytes:gzipSync(article).length,cssGzipBytes:gzipSync(css).length,jsGzipBytes:gzipSync(js).length,images:Object.keys(media).length};
await writeFile('dist/build-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
