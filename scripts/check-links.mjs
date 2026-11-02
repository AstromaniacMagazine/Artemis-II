import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {setTimeout as delay} from 'node:timers/promises';
const site=JSON.parse(await readFile('src/site.json','utf8'));
const urls=new Map();
for(const file of await readdir('src/sections')) {
 const html=(await readFile(`src/sections/${file}`,'utf8')).replace(/\{\{([\w.]+)\}\}/g,(_,key)=>key.split('.').reduce((o,k)=>o?.[k],site));
 const {document}=parseHTML(html);
 for(const el of document.querySelectorAll('a[href], video[data-src], video[data-mobile]')) {
  for(const attr of ['href','data-src','data-mobile']) {
   const value=el.getAttribute(attr);
   if(value?.startsWith('https://')) urls.set(value,{url:value,kind:/\.(mp3|wav)(\?|$)/i.test(value)?'audio':/\.(mp4|webm)(\?|$)/i.test(value)?'video':'page'});
  }
 }
}
const queue=[...urls.values()],results=[];
async function worker(){
 while(queue.length){
  const entry=queue.shift();let last;
  for(let attempt=0;attempt<3;attempt++){
   await delay(1500);
   try{
    const response=await fetch(entry.url,{headers:{Range:'bytes=0-1023','User-Agent':'AstromaniacLinkCheck/1.0'},signal:AbortSignal.timeout(25000),redirect:'follow'});
    const type=response.headers.get('content-type')||'';
    await response.body?.cancel();
    const wrongType=entry.kind!=='page' && !type.startsWith(entry.kind+'/') && !type.includes('octet-stream');
    last={...entry,status:response.status,type,finalURL:response.url,result:response.ok&&!wrongType?'pass':[403,429,503].includes(response.status)?'unverified':'fail'};
    if(last.result==='pass'||[404,410].includes(response.status))break;
    const retry=response.headers.get('retry-after');
    const retryMs=retry ? (/^\d+$/.test(retry)?Number(retry)*1000:Date.parse(retry)-Date.now()) : 5000*(attempt+1);
    if([429,503].includes(response.status)) await delay(Math.min(60000,Math.max(1500,retryMs||5000)));
   }catch(error){last={...entry,result:'unverified',error:error.message};}
  }
  results.push(last);
  if(last.result!=='pass')console.log(`${last.result.toUpperCase()}: ${entry.url} (${last.status||last.error})`);
 }
}
// Sequential, paced requests avoid overwhelming public source hosts.
await worker();
results.sort((a,b)=>a.url.localeCompare(b.url));
await mkdir('reports',{recursive:true});
const summary={checkedAt:new Date().toISOString(),total:results.length,passed:results.filter(x=>x.result==='pass').length,failed:results.filter(x=>x.result==='fail').length,unverified:results.filter(x=>x.result==='unverified').length};
await writeFile('reports/links.json',JSON.stringify({summary,results},null,2)+'\n');
console.log(summary);
if(summary.failed || (process.env.STRICT_LINKS==='1'&&summary.unverified))process.exitCode=1;
