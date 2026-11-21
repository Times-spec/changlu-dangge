import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const executablePath=[process.env.CHROME,chromium.executablePath(),'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(f=>f&&fs.existsSync(f));
const integrated=process.argv.includes('--integrated');
const args=['--enable-webgl','--ignore-gpu-blocklist'];
if(integrated)args.push('--force_low_power_gpu');
const adapter=integrated&&process.env.CHANGLU_DXGI_LUID;
if(adapter){
  if(!/^-?\d+,\d+$/.test(adapter))throw Error('Expected a DXGI adapter LUID in high,low format');
  args.push('--use-gl=angle','--use-angle=d3d11','--use-adapter-luid='+adapter);
}
const browser=await chromium.launch({executablePath,args});
try {
  const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
  if(integrated)await page.addInitScript(()=>{
    const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,settings,...rest){
      if(type==='webgl2')settings={...settings,powerPreference:'low-power'};
      return getContext.call(this,type,settings,...rest);
    };
  });
  await page.goto(pathToFileURL(path.resolve('dist/山河织路-离线单文件.html')).href);
  await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:150000});
  const device=await page.evaluate(()=>{
    if(window.__error)throw Error(window.__error);
    const app=window.__changlu;app.start();app.automaticLetters(false);
    window.renderedFrames=0;
    const draw=app.paper.render.bind(app.paper);
    app.paper.render=(...args)=>{draw(...args);window.renderedFrames++;};
    const gl=app.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
    return {renderer:gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL||gl.RENDERER),browser:navigator.userAgent,viewport:[innerWidth,innerHeight],devicePixelRatio};
  });
  const samples=[];
  for(const position of [.128,.342,.572,.751,.977]){
    await page.evaluate(p=>__changlu.setProgress(p),position);
    await page.waitForTimeout(2200);
    const result=await page.evaluate(()=>new Promise(resolve=>{
      const start=performance.now(),firstPaint=window.renderedFrames;let prev=start;const intervals=[];
      function measure(now){
        if(now>prev)intervals.push(now-prev);
        prev=now;
        if(now-start<5500){requestAnimationFrame(measure);return;}
        const ms=now-start;intervals.sort((a,b)=>a-b);
        const q=n=>Number(intervals[Math.floor((intervals.length-1)*n)].toFixed(1));
        resolve({frames:window.renderedFrames-firstPaint,callbacks:intervals.length,mode:__changlu.state.mode,chapter:__changlu.state.chapter,seconds:Number((ms/1000).toFixed(2)),fps:Math.round((window.renderedFrames-firstPaint)*1000/ms),medianMs:q(.5),p95Ms:q(.95),renderPixelRatio:__changlu.renderer.getPixelRatio()});
      }
      requestAnimationFrame(measure);
    }));
    if(result.frames<1||result.mode!=='travel'||result.chapter!==samples.length)throw Error('Invalid live route sample '+JSON.stringify(result));
    samples.push({position,...result});
  }
  const report={device,samples,requestedPower:integrated?'low-power':'default'};
  fs.mkdirSync('qa/family',{recursive:true});fs.writeFileSync(integrated?'qa/family/performance-low-power.json':'qa/family/performance.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
