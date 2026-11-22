import { ASSET } from './assets.js';
import a1 from '../assets/audio/dialogue/act1.json' with { type:'json' };
import a2 from '../assets/audio/dialogue/act2.json' with { type:'json' };
import a3 from '../assets/audio/dialogue/act3.json' with { type:'json' };
import a4 from '../assets/audio/dialogue/act4.json' with { type:'json' };
import a5 from '../assets/audio/dialogue/act5.json' with { type:'json' };
const tracks=[a1,a2,a3,a4,a5];

export function createDialogue(audio){
  const box=document.getElementById('captions');
  let active=null,frame=0;
  function stop(){
    cancelAnimationFrame(frame);box.hidden=true;
    const item=active;active=null;
    if(!item)return;
    audio.duck(false);
    const cleanup=()=>{item.media.pause();item.media.removeAttribute('src');item.media.load();item.node?.disconnect();item.gain?.disconnect();};
    if(item.gain){item.gain.gain.setTargetAtTime(0,audio.ctx.currentTime,.07);setTimeout(cleanup,350);}
    else cleanup();
    item.onEnd?.();
  }
  function play(index,complete=false,onEnd){
    stop();
    const cues=tracks[index],media=new Audio(ASSET('/assets/audio/dialogue/act'+(index+1)+'.mp3'));
    const item=active={media,cues,last:null,start:performance.now(),lastTick:performance.now(),lastAudioTime:0,onEnd,index,complete};
    if(audio.ctx){
      item.node=audio.ctx.createMediaElementSource(media);item.gain=audio.ctx.createGain();
      item.node.connect(item.gain);item.gain.connect(audio.voiceBus);audio.duck(true);
      media.play().catch(()=>{item.fallback=true;});
    }else item.fallback=true;
    function update(){
      if(active!==item)return;
      
      if(media.currentTime>item.lastAudioTime){item.lastTick=performance.now();item.lastAudioTime=media.currentTime;}
      if(!item.fallback&&performance.now()-item.lastTick>1400){
        item.fallback=true;item.start=performance.now()-media.currentTime*1000;media.pause();
      }
      const time=item.fallback?(performance.now()-item.start)/1000:media.currentTime;
      if(media.ended||time>=cues.at(-1)[1]+.12){stop();return;}
      const cue=cues.find(c=>c[0]<=time&&c[1]+.06>time);
      if(cue!==item.last){item.last=cue;box.hidden=!cue;if(cue){box.firstElementChild.textContent=cue[2];box.lastElementChild.textContent=cue[3];}}
      frame=requestAnimationFrame(update);
    }
    media.addEventListener('error',()=>{item.fallback=true;item.start=performance.now()-media.currentTime*1000;},{once:true});
    update();
  }
  return {play,stop,get active(){return active;},duration:i=>tracks[i].at(-1)[1]};
}

