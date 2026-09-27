import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
const { document } = parseHTML(await readFile('.cache/live-before.html', 'utf8'));
await mkdir('legacy', { recursive: true });
for (const block of document.querySelectorAll('.sqs-code-container')) {
  const root = block.querySelector('section[id], [class="am2-nav"]');
  if (root) {
    await writeFile(`legacy/${root.id || 'navigation'}.html`, block.innerHTML);
    console.log(root.id, block.querySelectorAll('style').length, root.querySelectorAll('img').length);
  }
}
const info = [...document.querySelectorAll('section[id]')].map(section => ({
  id: section.id,
  images: [...section.querySelectorAll('img')].map(el=>({ src: el.getAttribute('data-src') || el.getAttribute('src'), alt: el.getAttribute('alt') })),
  videos: [...section.querySelectorAll('video')].map(el=>({ poster: el.getAttribute('poster'), src: [...el.querySelectorAll('source')].map(s=>s.getAttribute('data-src')||s.getAttribute('src')) })),
  audio: [...section.querySelectorAll('audio')].map(el=>({src:el.getAttribute('data-src')||el.getAttribute('src'),label:el.parentElement.querySelector('button')?.getAttribute('aria-label')})),
  cards: [...section.querySelectorAll('button[data-body], button[data-copy]')].map(el=>Object.fromEntries([...el.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name.slice(5),a.value])))
}));
await writeFile('.cache/legacy-inventory.json', JSON.stringify(info, null, 2));
console.log(JSON.stringify(info.map(s=>({id:s.id,media:s.videos,cardCount:s.cards.length})),null,2));
