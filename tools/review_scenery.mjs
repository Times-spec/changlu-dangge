import {chromium} from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(projectRoot,'qa/scenery-study/current');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:[process.env.CHROME,chromium.executablePath(),'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p=>p&&fs.existsSync(p)),args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1008,height:630},deviceScaleFactor:1});const manifest=[],errors=[];
page.on('pageerror',err=>errors.push(err.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const still=async(id,act)=>{await page.screenshot({path:path.join(out,id+'.jpg'),quality:92});manifest.push({act,id})};
const views=[
  ['rural',.10,[['cooperative',[-3.9,2.1,49],[9,1.8,5]],['fields',[6.8,1,20],[-5,1.8,7]]]],
  ['town',.315,[['market',[-4.98,2.8,-35],[11,.5,4]],['bicycle',[-.85,1,-51.5],[3,1,6]]]],
  ['city',.545,[['umbrella',[9.48,1.25,23.9],[-4,.6,5]],['facade',[9,24,-9],[-20,-2,32]],['train',[-11,15.35,-5],[0,.65,11]]]],
  ['rail',.79,[['boat',[-24,1.5,9.4],[-8,4,11]],['bridge',[-6.83,31.47,0],[-35,4,15]]]],
  ['future',.96,[['greenhouse',[127,8,-48],[7,4,16]],['rocket',[102,39,-80],[-54,-15,100]]]]
];
async function bookFrames(label){
  for(const [name,t] of [['text',1.5],['cover',4.9],['hinge',6.5],['spread',7.8],['enter',9.85],['full',10.98]]){
    await page.evaluate(t=>{const a=__changlu;a.state.introTime=t;a.step(0);a.render()},t);
    await still(label+'-'+name,'opening');
  }
}
async function look(eye,target,fov){
  await page.evaluate(({eye,target,fov})=>{
    const a=__changlu,c=a.camera;c.position.fromArray(eye);c.lookAt(...target);c.fov=fov;
    c.updateProjectionMatrix();c.updateMatrixWorld();a.sky.group.position.copy(c.position);a.render();
  },{eye,target,fov});
}
try{
  await page.goto(pathToFileURL(path.join(projectRoot,'dist/山河织路-离线单文件.html')).href);
  await page.waitForFunction(()=>window.__ready||window.__error||Number(getComputedStyle(document.querySelector('.book-binding')).opacity)>.99,null,{timeout:180000});
  await still('loading','opening');
  await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
  await page.evaluate(()=>{if(window.__error)throw Error(window.__error);__changlu.freeze()});
  await page.locator('#loading').waitFor({state:'hidden'});
  await bookFrames('wide');
  await page.setViewportSize({width:390,height:844});await bookFrames('phone');
  await page.setViewportSize({width:1008,height:630});
  await page.evaluate(()=>{const a=__changlu;a.start();a.automaticLetters(false);a.settle(24)});
  await still('first-travel','opening');
  await page.evaluate(()=>{const a=__changlu;a.overview();a.step(.1);a.render()});
  await page.locator('#overview').evaluate(el=>Promise.all(el.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getTiming().iterations)).map(a=>a.finished.catch(()=>{}))));
  await still('map','overview');
  await page.evaluate(()=>__changlu.exitOverview(true));
  await page.addStyleTag({content:'#app > :not(#world),#world > :not(canvas){display:none!important}'});
  const seen=new Set();
  for(const [act,p,shots] of views){
    const {centre,figures}=await page.evaluate(({act,p})=>{
      const a=__changlu,z=a.zones[act];a.state.mouse.set(0,0);a.state.look.set(0,0);
      a.setProgress(p);a.step(act==='city'?9:.01);a.settle(24);
      return {centre:z.spec.center,figures:z.group.children.filter(o=>o.name.startsWith('Figure /')).map(o=>{
        const sprite=o.children.find(n=>n.isSprite);
        if(!sprite)throw Error('Missing flat figure '+o.name);
        return [sprite.material.map.name,o.getWorldPosition(a.camera.position.clone()).toArray(),sprite.scale.y];
      })};
    },{act,p});
    await still(act+'-journey',act);
    for(const [name,xyz,offset] of shots){
      const target=[xyz[0],xyz[1],centre+xyz[2]];
      await look(target.map((n,i)=>n+offset[i]),target,name==='train'?43:42);
      await still(act+'-'+name,act);
    }
    for(const [name,point,h] of figures){
      if(seen.has(name))throw Error('Repeated figure: '+name);
      seen.add(name);
      const target=[point[0],point[1]+h*.54,point[2]];
      const offset=name==='actor-grower'?[.06,.24,3.3]:act==='future'?[5,2.8,7]:act==='rural'||act==='town'?[2.2,.18,3.2]:act==='rail'?[-2,.65,3.5]:[-1.5,.22,3.1];
      await look(target.map((n,i)=>n+offset[i]),target,39);
      await still(act+'-person-'+name,act);
    }
  }
  if(errors.length)throw Error(errors.join(' / '));
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({manifest,errors},null,2));
  console.log('Reviewed',manifest.length,'views and',seen.size,'distinct character illustrations.');
}finally{await browser.close()}
