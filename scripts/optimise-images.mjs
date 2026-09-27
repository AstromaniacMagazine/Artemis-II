import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseHTML } from 'linkedom';
import sharp from 'sharp';
await mkdir('public/media', {recursive:true});
let manifest = {};
try { manifest = JSON.parse(await readFile('src/media.json','utf8')); } catch {}
const files = await readdir('src/sections');
const urls = new Set();
for(const file of files) {
  const {document} = parseHTML(await readFile(`src/sections/${file}`,'utf8'));
  document.querySelectorAll('img[src]').forEach(img=>urls.add(img.getAttribute('src')));
}
const failures=[];
const queue=[...urls];
async function worker() {
  while(queue.length) {
    const url=queue.shift();
    if(manifest[url]) { try { await access(`public/${manifest[url].variants[0].path}`); continue; } catch {} }
    try {
      let res;
      for(let attempt=0;attempt<3;attempt++) {
        res=await fetch(url,{signal:AbortSignal.timeout(45000)});
        if(res.ok) break;
      }
      if(!res?.ok) throw Error(`HTTP ${res?.status}`);
      const buffer=Buffer.from(await res.arrayBuffer());
      const metadata=await sharp(buffer).metadata();
      const hash=createHash('sha256').update(url).digest('hex').slice(0,12);
      const widths=[...new Set([480,960,1600].map(w=>Math.min(w,metadata.width)))];
      const variants=[];
      for(const width of widths) {
        const path=`media/${hash}-${width}.webp`;
        const result=await sharp(buffer).rotate().resize({width,withoutEnlargement:true}).webp({quality:80,effort:5}).toFile(`public/${path}`);
        variants.push({path,width:result.width,height:result.height,bytes:result.size});
      }
      manifest[url]={source:url,originalBytes:buffer.length,width:metadata.width,height:metadata.height,variants};
      console.log(`Optimised ${hash}: ${Math.round(buffer.length/1024)} KB → ${Math.round(variants[0].bytes/1024)} KB (phone)`);
    } catch(error) { failures.push({url,error:error.message}); console.error(`${error.message}: ${url}`); }
  }
}
await Promise.all([worker(),worker(),worker()]);
await writeFile('src/media.json',JSON.stringify(manifest,null,2)+'\n');
await mkdir('.cache',{recursive:true});
await writeFile('.cache/image-failures.json',JSON.stringify(failures,null,2));
console.log(`${Object.keys(manifest).length} originals optimised; ${failures.length} failures.`);
if(failures.length) process.exitCode=1;
