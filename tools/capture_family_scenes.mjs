import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const offline=pathToFileURL(path.resolve(projectRoot,'dist/山河织路-离线单文件.html')).href;
const dir=path.resolve(projectRoot,'qa/world-light','family-review');fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({executablePath:[process.env.CHROME,chromium.executablePath(),'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(v=>v&&fs.existsSync(v)),args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1120,height:630},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
await page.goto(offline);
await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:150000});
await page.evaluate(()=>{if(window.__error)throw Error(window.__error);__changlu.start();__changlu.freeze();__changlu.automaticLetters(false);});
await page.addStyleTag({content:'#app > :not(#world),#world > :not(canvas){display:none!important}'});
const info=await page.evaluate(()=>Object.fromEntries(Object.entries(__changlu.zones).map(([k,z])=>{
 const mats={},objects=[];z.group.traverse(o=>{if(o.isMesh){const m=o.material?.name||o.material?.type; mats[m]=(mats[m]||0)+1;if(o.name)objects.push(o.name);}});return [k,{mats,objects}];})));
fs.writeFileSync(path.join(dir,'assets.json'),JSON.stringify(info,null,2));
const metrics=[];
for (const [w,h,label,rows] of [[1120,630,'wide',[[.1,.128,.172],[.315,.342,.39],[.545,.572,.612],[.751,.812,.847],[.948,.977,1]]],[390,844,'phone',[[.128],[.342],[.572],[.812],[.977]]]]){
 await page.setViewportSize({width:w,height:h});await page.waitForTimeout(250);
 for (const [act,row] of rows.entries())for(const p of row){
  const stats=await page.evaluate(({p,act})=>{const a=__changlu;a.state.look.set(0,0);a.state.mouse.set(0,0);a.state.time=12;a.setProgress(p);a.step(.001);if(act===2||act===3){for(let i=0;i<26;i++)a.step(1/24)}a.settle(60);return {position:a.camera.position.toArray(),triangles:a.renderer.info.render.triangles}}, {p,act});
  await page.screenshot({path:path.join(dir,label+'-'+(act+1)+'-'+Math.round(p*1000)+'.jpg'),type:'jpeg',quality:91});metrics.push({label,act,p,...stats});
 }
}
{
 await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 mobile.on('pageerror',e=>errors.push(e.message));mobile.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await mobile.goto(offline);
 await mobile.waitForFunction(()=>window.__ready||window.__error,null,{timeout:150000});
 await mobile.evaluate(()=>{if(window.__error)throw Error(window.__error);__changlu.start();__changlu.freeze();__changlu.automaticLetters(false);});
 await mobile.addStyleTag({content:'#app > :not(#world),#world > :not(canvas){display:none!important}'});
 for(const [act,p] of [.172,.397,.545,.812,.977].entries()){
   await mobile.evaluate(p=>{const a=__changlu;a.state.time=12;a.setProgress(p);a.step(.001);for(let i=0;i<26;i++)a.step(1/24);a.settle(60);},p);
   await mobile.screenshot({path:path.join(dir,'touch-'+(act+1)+'.jpg'),type:'jpeg',quality:92});
 }
}
if(!page.isClosed())await page.close();const launch=await browser.newPage({viewport:{width:1120,height:630}});
launch.on('pageerror',e=>errors.push(e.message));
launch.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await launch.goto(offline);await launch.waitForFunction(()=>window.__ready,null,{timeout:150000});
await launch.evaluate(()=>{let a=__changlu;a.start();a.freeze();a.automaticLetters(false);a.setProgress(1);a.step(.001);a.settle(60);a.launch()});
await launch.addStyleTag({content:'#app > :not(#world),#world > :not(canvas){display:none!important}'});
for(const t of [0,1.45,2.85,3.85,4.35]){await launch.evaluate(t=>{__changlu.ending.update(t);__changlu.ending.render()},t);await launch.screenshot({path:path.join(dir,'launch-'+t+'.jpg'),quality:91,type:'jpeg'});}
const platforms=await launch.evaluate(()=>{
  const port=__changlu.zones.future.group;
  const parts=['Service_hinge_lower','Service_hinge_upper'].map(n=>port.getObjectByName(n));
  if(parts.some(p=>!p))throw Error('Missing moving service gallery');
  const at=t=>{__changlu.ending.update(t);return parts.map(p=>p.quaternion.toArray());};
  const open=at(2),closed=at(0);
  return open.map((q,i)=>2*Math.acos(Math.min(1,Math.abs(q.reduce((v,n,k)=>v+n*closed[i][k],0)))));
});
if(platforms.some(a=>a<1.1))throw Error('Service gallery did not swing clear');
fs.writeFileSync(path.join(dir,'check.json'),JSON.stringify({metrics,serviceGalleryAngles:platforms,errors},null,2));console.log(JSON.stringify({routeFrames:metrics.length,touchFrames:5,launchFrames:5,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close()}
