// This loader is deliberately stable. Versioned assets come from release.json.
(async function(){
 const script=document.currentScript;
 const root=document.querySelector('#am-artemis');
 if(!script || !root) return;
 const base=new URL('.',script.src);
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),12000);
 let replacement;
 try {
   const get=async url=>{const response=await fetch(url,{cache:'no-cache',signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error(`HTTP ${response.status}`);return response.json();};
   const release=await get(new URL(`release.json?t=${Math.floor(Date.now()/60000)}`,base));
   if(release.version===root.dataset.version) return;
   const payloadURL=new URL(release.payload);
   if(payloadURL.origin!==base.origin || !payloadURL.pathname.startsWith(base.pathname+'assets/')) throw Error('Invalid release URL');
   const payload=await get(payloadURL);
   if(payload.version!==release.version || typeof payload.html!=='string') throw Error('Invalid release');
   for(const url of [payload.css,payload.js]) {const asset=new URL(url);if(asset.origin!==base.origin || !asset.pathname.startsWith(base.pathname+'assets/'))throw Error('Invalid asset URL');}
   const template=document.createElement('template');template.innerHTML=payload.html;
   replacement=template.content.querySelector('#am-artemis');
   if(!replacement || replacement.dataset.version!==release.version) throw Error('Missing report');
   const css=document.createElement('link');css.rel='stylesheet';css.href=payload.css;css.dataset.amStyle='';
   await new Promise((resolve,reject)=>{css.onload=resolve;css.onerror=reject;document.head.append(css);setTimeout(()=>reject(Error('Style timeout')),8000);});
   // Import first: on a failed request the installed report remains fully usable.
   const module=await import(payload.js);
   root.dispatchEvent(new Event('am:dispose'));
   root.replaceWith(replacement);
   document.querySelectorAll('[data-am-style]').forEach(style=>{if(style!==css)style.remove();});
   module.initialiseReport(replacement);
   // Keep canonical and crawl directives under Squarespace's control.
   document.title=payload.title;
   const description=document.querySelector('meta[name="description"]');
   if(description) description.content=payload.description;
   const hash=location.hash;
   if(hash) {const target=replacement.querySelector(hash);target?.scrollIntoView({block:'start'});}
 } catch(error) {
   // The complete installed snapshot is the failure path, never a blank screen.
   console.warn('Artemis report update unavailable; using installed edition.',error.message);
 } finally {clearTimeout(timeout);}
})();
