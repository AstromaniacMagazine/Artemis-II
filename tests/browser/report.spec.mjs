import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
test('layout, initial media budget and console errors',async({page})=>{
 const errors=[],media=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(/\.(mp4|mp3|wav|webm)(\?|$)/.test(request.url()))media.push(request.url());});
 await page.goto('/');
 await expect(page.locator('#am-artemis')).toHaveAttribute('data-ready','true');
 await expect(page.getByRole('heading',{level:1})).toHaveText('Artemis IIMission Report');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 expect(media).toEqual([]);expect(errors).toEqual([]);
 await page.screenshot({path:`test-results/${test.info().project.name}-opening.png`});
});
test('navigation opens, jumps to the right section and closes',async({page})=>{
 await page.goto('/');
 await page.locator('[data-section-menu] summary').click();
 await page.getByRole('navigation',{name:'Report sections'}).getByRole('link',{name:'Inside Orion'}).click();
 await expect(page).toHaveURL(/#am2-orion-integrity$/);
 await expect(page.locator('[data-section-menu]')).not.toHaveAttribute('open','');
 await expect(page.locator('#am2-orion-integrity')).toBeFocused();
});
test('all tab groups support selection and keyboard navigation',async({page})=>{
 await page.goto('/');
 for(const group of await page.locator('[data-tabs]').all()){
  const tabs=group.getByRole('tab');
  for(let index=0;index<await tabs.count();index++){
   await tabs.nth(index).click();
   await expect(tabs.nth(index)).toHaveAttribute('aria-selected','true');
   await expect(group.getByRole('tabpanel')).toHaveCount(1);
  }
  await tabs.last().press('Home');await expect(tabs.first()).toBeFocused();
  await tabs.first().press('ArrowRight');await expect(tabs.nth(1)).toBeFocused();
 }
});
test('audio opens once, changes recording and closes accessibly',async({page})=>{
 await page.route(/\.(mp3|wav)(\?|$)/,route=>route.abort());
 await page.goto('/');
 const links=page.locator('[data-audio]');
 await links.first().click();
 await expect(page.locator('[data-player]')).toBeVisible();
 await expect(page.locator('audio')).toHaveAttribute('src',await links.first().getAttribute('href'));
 await links.nth(1).click();
 await expect(page.locator('audio')).toHaveCount(1);
 await expect(page.locator('audio')).toHaveAttribute('src',await links.nth(1).getAttribute('href'));
 await page.getByRole('button',{name:'Close audio player'}).click();
 await expect(page.locator('[data-player]')).toBeHidden();await expect(links.nth(1)).toBeFocused();
});
test('video is requested only on play and exposes an error fallback',async({page})=>{
 let requests=0;await page.route(/\.mp4(\?|$)/,route=>{requests++;return route.abort();});
 await page.goto('/');expect(requests).toBe(0);
 await page.getByRole('button',{name:'Play the NASA trailer'}).click();
 await expect.poll(()=>requests).toBeGreaterThan(0);
 await expect(page.locator('#am2-around-moon video')).toHaveAttribute('controls','');
 await expect(page.locator('#am2-around-moon [role="status"]')).not.toBeEmpty();
});
test('every native disclosure opens and closes',async({page})=>{
 await page.goto('/');
 for(const detail of await page.locator('details.am-detail').all()){
  await detail.locator('summary').click();await expect(detail).toHaveAttribute('open','');
  await detail.locator('summary').click();await expect(detail).not.toHaveAttribute('open','');
 }
});
test('WCAG automated audit, including expanded navigation',async({page})=>{
 await page.goto('/');
 const scan=()=>new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect((await scan()).violations).toEqual([]);
 await page.locator('[data-section-menu] summary').click();
 expect((await scan()).violations).toEqual([]);
});
test('no-JavaScript readers get all panels and facts',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto('http://127.0.0.1:4173/');
 await expect(page.getByText('695,081 mi',{exact:true})).toBeVisible();
 await expect(page.locator('[data-panel]:visible')).toHaveCount(14);
 await context.close();
});
test('320 px and reduced motion do not clip content',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 for(const section of await page.locator('section[id]').all()){
  await section.scrollIntoViewIfNeeded();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 }
});
test('failed release request preserves the installed report and controls',async({page})=>{
 await page.route('**/release.json?*',route=>route.abort());await page.goto('/install-preview.html');
 await expect(page.getByText('695,081 mi',{exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Heat shield',exact:true}).click();
 await expect(page.locator('#orion-panel-3')).toBeVisible();
});
test('a new release replaces the snapshot and initialises exactly once',async({page})=>{
 const release=JSON.parse(await readFile('dist/release.json','utf8'));
 const payload=JSON.parse(await readFile(`dist/assets/content-${release.version}.json`,'utf8'));
 const newer='test-updated-release';payload.version=newer;payload.html=payload.html.replace(`data-version="${release.version}"`,`data-version="${newer}"`);
 await page.route('**/release.json?*',route=>route.fulfill({json:{version:newer,payload:'http://127.0.0.1:4173/assets/test-release.json'}}));
 await page.route('**/assets/test-release.json',route=>route.fulfill({json:payload}));
 await page.goto('/install-preview.html');
 await expect(page.locator('#am-artemis')).toHaveAttribute('data-version',newer);
 await expect(page.locator('#am-artemis')).toHaveCount(1);
 await expect(page.locator('#am-artemis')).toHaveAttribute('data-ready','true');
 await page.getByRole('tab',{name:'Artemis III',exact:true}).click();
 await expect(page.locator('#timeline-panel-2')).toBeVisible();
});
