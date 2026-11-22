import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {letters} from '../src/letters.js';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(projectRoot,'qa/family');fs.mkdirSync(out,{recursive:true});
const exe=[process.env.CHROME,chromium.executablePath(),'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(v=>v&&fs.existsSync(v));
const browser=await chromium.launch({executablePath:exe,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:810},deviceScaleFactor:1}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const frame=async(name)=>{await page.evaluate(()=>__changlu.render());await page.waitForTimeout(780);await page.screenshot({path:path.join(out,name+'.jpg'),quality:92});};
const steps=async(sec)=>page.evaluate(n=>{for(let i=0;i<Math.ceil(n*30);i++)__changlu.step(1/30);__changlu.render()},sec);
const visitorWish='愿月面的第一穗稻平安抽绿。';
try{
  await page.goto(pathToFileURL(path.resolve(projectRoot,'dist/山河织路-离线单文件.html')).href);
  await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
  assert.equal(await page.evaluate(()=>window.__error),null);
  await page.locator('#loading').waitFor({state:'hidden'});await page.evaluate(()=>__changlu.freeze());await frame('cover');await page.click('#skipIntro');
  await page.click('#overviewBtn');await steps(.1);await frame('overview');await page.click('#ovBack');
  await page.click('#homeBtn');await page.click('#openFolio');await steps(1.2);await frame('opening');await page.click('#skipIntro');
  await page.click('#infoBtn');await page.selectOption('#travelSpeed','1.8');await page.check('#skipRead');await page.click('#infoClose');
  const people=await page.evaluate(()=>Object.values(__changlu.zones).map(z=>z.group.children.filter(o=>o.name.startsWith('Figure /')).map(o=>o.children.find(c=>c.isSprite).material.map.name)));
  const counts=people.map(p=>p.length);assert(counts.every(n=>n>0));assert.equal(new Set(people.flat()).size,people.flat().length);
  for(const [idx,t] of [.128,.342,.572,.812,1].entries()){
    await page.evaluate(t=>{const a=__changlu;a.automaticLetters(false);a.setProgress(t===1?.977:t);a.step(.01);a.settle(24);a.step(.01)},t);
    await page.click('#detailBtn');assert.equal(await page.locator('#detailYear').innerText(),['1983 · 田埂晨','1996 · 街市暮','2008 · 城夜雨','2023 · 山河速','2049 · 星河远'][idx]);
    const photo=page.locator('#detailPanel .detail-paint');
    const inspect=()=>photo.evaluate(async el=>{
      const match=getComputedStyle(el).backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
      if(!match)throw Error('Missing scene detail photograph');
      const img=new Image();img.src=match[1];await img.decode();
      if(img.naturalWidth<300)throw Error('Scene detail image is too small');
      return img.src.slice(-110);
    });
    const firstImage=await inspect();await frame('detail-'+idx);
    const first=await page.locator('#detailStory').innerText();await page.click('#detailNext');
    assert.notEqual(await page.locator('#detailStory').innerText(),first);assert.notEqual(await inspect(),firstImage);
    if(idx===2)await frame('carriage');
    await frame('detail-'+idx+'-second');
    await page.keyboard.press('Escape');
    await frame('route-'+idx);
    await page.evaluate(t=>{const a=__changlu;a.setProgress(t);a.settle(30);a.automaticLetters(true);a.step(.05);},t);await steps(1.6);
    assert.equal(await page.locator('#ticketLayer').getAttribute('data-kind'),letters[idx].kind);
    await frame('front-'+idx);const front=await page.locator('#ticketFront').innerText();
    if(idx===2){assert(front.includes('21:47'));assert(!front.includes('****'));assert.equal(await page.locator('#railTicketFace svg g[transform]').count(),0);}
    if(idx===3)assert(front.includes('报销凭证'));
    if(idx!==2){
      const r=await page.locator('#ticketFront [data-grip], #actionProp:not([hidden])').boundingBox();assert(r);
      const x=r.x+r.width/2,y=r.y+r.height/2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+(idx?37:1),y-(idx?0:37),{steps:4});await page.mouse.up();
    }else await page.keyboard.press('r');
    assert.equal(await page.locator('#ticketLayer').getAttribute('data-side'),'back');
    if(idx<4){await page.click('#keepLetter');await frame('back-'+idx);await page.click('#cardClose');}
    else{await page.fill('#wishInput',visitorWish);await frame('back-4');await page.click('#skipFinale');}
  }
  assert.equal(await page.locator('#earthWish').innerText(),visitorWish);await frame('earth');await page.click('#closeEarth');await page.waitForFunction(()=>__changlu.state.mode==='codex');
  await page.click('#bookmarks button:last-child');assert.equal(await page.locator('.home-line').count(),5);await frame('record');
  await page.click('#bookmarks button:nth-child(4)');await page.click('#folioEnter');await page.waitForFunction(()=>__changlu.state.mode==='travel');
  await steps(.1);assert.equal(await page.evaluate(()=>__changlu.state.chapter),3);
  await page.setViewportSize({width:390,height:844});await steps(.1);await frame('phone-route');
  await page.click('#memoryBtn');await page.click('.folio-object');await frame('phone-book');
  const storage=await page.evaluate(()=>JSON.parse(localStorage.getItem('shanhe.yisui.v1')));assert.equal(storage.wish,visitorWish);assert.equal(storage.quotes.length,4);assert.equal(storage.speed,1.8);assert.equal(storage.skipRead,true);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({people:counts,hotspots:10,actions:5,wish:storage.wish,kept:storage.quotes,errors},null,2));
  console.log('PASS five actions, ten details, archive jump, reading preferences, family letter, handwritten ending and portrait');
}finally{await browser.close();}

