import acts from './story.json' with { type:'json' };
import { letters } from './letters.js';
import { objectTicket } from './object_tickets.js';
import { railwayTicket } from './rail_ticket.js';
import { ASSET } from './assets.js';
import { printFirstPage } from './opening.js';

const ids=['rural','town','city','rail','future'],marks=['壹','贰','叁','肆','伍','终'];
const get=id=>document.getElementById(id);
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function element(tag,text,cls){
  const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;
}
function control(text,click,cls){const el=element('button',text,cls);el.type='button';el.onclick=click;return el;}
export function createCodex({audio,dialogue,visited,seen,kept,completed,wish,unmute,close,scene,enter,again,map}){
  const root=get('codex'),left=get('folioImage'),image=left.querySelector('img'),plate=left.querySelector('canvas');
  const right=get('folioContent'),nav=get('bookmarks'),sheets=root.querySelector('.turn-sheets');
  let page=0,busy=false,earth=null,start=null;
  function available(i){return i===5?completed():visited.has(i);}
  function turn(count=1,reverse=false){
    sheets.replaceChildren();
    if(reduced())return;
    for(let i=0;i<count;i++){
      const leaf=document.createElement('i');
      if(reverse)leaf.classList.add('reverse');
      sheets.append(leaf);audio.pageTurn(i*.14);
      leaf.animate([{transform:'perspective(1200px) rotateY(0deg)',opacity:.96},{opacity:.96,offset:.65},{transform:'perspective(1200px) rotateY('+(reverse?179:-179)+'deg)',opacity:0}],{duration:count===1?520:720,delay:i*140,fill:'backwards',easing:'ease-in-out'}).finished.then(()=>leaf.remove());
    }
  }
  function change(to,animate=true){
    if(busy||!available(to))return;
    const old=page;dialogue.stop();page=to;
    if(animate&&page!==old)turn(1,page<old);
    render();
    if(!root.contains(document.activeElement))nav.children[page].focus({preventScroll:true});
  }
  function next(by){let n=page+by;while(n>=0&&n<=5&&!available(n))n+=by;return n>=0&&n<=5?n:null;}
  function render(){
    const end=page===5,a=acts[page],l=letters[page];
    root.dataset.page=page;right.replaceChildren();right.parentElement.scrollTop=0;root.querySelector('.codex-spread').scrollTop=0;
    nav.replaceChildren(...marks.map((n,i)=>{const b=control(n,()=>change(i));b.disabled=!available(i);b.setAttribute('aria-label',i===5?'终章':'第'+n+'幕');b.setAttribute('aria-current',i===page?'page':'false');return b;}));
    get('folioPrev').disabled=next(-1)===null;get('folioNext').disabled=next(1)===null;
    get('folioYear').textContent=end?'一九八三 — 二〇四九':a.heading;
    get('folioTitle').textContent=end?'终 · 地球与留字':marks[page]+' · '+a.title;
    get('folioEnter').hidden=end;left.disabled=end;image.hidden=false;plate.hidden=true;
    if(end){
      image.src=earth||ASSET('/assets/painted/folio-earth.webp');image.alt='从轨道回望地球';
      right.append(element('h3','五件旧物 · 五句留字'));
      for(const [i,l] of letters.entries()){const p=element('p',l.excerpt,'home-line');p.prepend(element('small',acts[i].label.slice(0,4)+' · '+l.sender+(kept.has(i)?' · 已留住':'')));right.append(p);}
      if(wish())right.append(element('blockquote',wish()));
      right.append(control('再走一程',again,'ink-button'),control('五岛展卷',map,'ink-button'));return;
    }
    image.src=ASSET('/assets/painted/folio-'+ids[page]+'.webp');image.alt=a.title+'开场实景';
    left.setAttribute('aria-label','重返'+a.title);get('folioEnter').textContent='重返'+a.title+' ↗';
    const ticket=control('',()=>{const back=ticket.classList.toggle('flipped');ticket.setAttribute('aria-pressed',back);audio.pageTurn();},'folio-object '+l.kind);
    ticket.setAttribute('aria-label',a.object+'，轻点翻面');ticket.setAttribute('aria-pressed','false');
    const front=element('span','','object-front');front.innerHTML=(l.rail?railwayTicket(l.rail,page===3):objectTicket(l.kind)).replace(/id="([^"]+)"/g,'id="folio-$1"').replace(/url\(#([^)]+)\)/g,'url(#folio-$1)');
    ticket.append(front,element('span',a.quote,'object-back'));
    right.append(ticket,element('small','轻点旧物翻面','flip-tip'),element('h3',a.object),element('p',a.story),element('blockquote',a.quote));
    const details=element('div','','detail-tags');
    a.details.forEach((d,j)=>{const tag=element('details','');const label=element('summary',d.name+(seen.has(page+'-'+j)?' · 已读':''));tag.append(label,element('p',d.story));tag.ontoggle=()=>{if(tag.open){seen.add(page+'-'+j);label.textContent=d.name+' · 已读';root.dispatchEvent(new Event('read-detail'));}};details.append(tag);});
    right.append(details);
    const transcript=element('details','','transcript');transcript.append(element('summary','沿途对白 · 文本与配音'),element('small',a.cast,'cast-line'));
    for(const [who,words] of a.dialogue){const p=element('p',words);p.prepend(element('b',who+'　'));transcript.append(p);}
    const listen=control('听本幕对白',()=>{if(dialogue.active?.complete){dialogue.stop();return;}audio.init();unmute?.();dialogue.play(page,true,()=>listen.textContent='听本幕对白');listen.textContent='停止播放';},'ink-button');
    transcript.append(listen);right.append(transcript);
  }
  async function zoom(frame,rect,into){
    const copy=document.createElement('canvas');printFirstPage(copy,frame);copy.className='folio-zoom';document.body.append(copy);
    const full={left:'0px',top:'0px',width:innerWidth+'px',height:innerHeight+'px'},small={left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'};
    try{await copy.animate(into?[small,full]:[full,small],{duration:reduced()?100:1100,easing:'cubic-bezier(.45,0,.23,1)',fill:'both'}).finished;}
    finally{copy.remove();}
  }
  async function revisit(){
    if(busy||page===5)return;
    busy=true;dialogue.stop();
    try{const frame=scene(page);printFirstPage(plate,frame);image.hidden=true;plate.hidden=false;await zoom(plate,left.getBoundingClientRect(),true);hide();enter(page);}
    finally{busy=false;}
  }
  function hide(){dialogue.stop();root.hidden=true;}
  function open(i){root.hidden=false;page=i;render();get('closeCodex').focus({preventScroll:true});}
  async function rewind(frame,finish){
    if(busy)return;busy=true;
    try{
      const snap=document.createElement('canvas');printFirstPage(snap,frame);earth=snap.toDataURL('image/jpeg',.85);
      try{localStorage.setItem('shanhe.yisui.earth',earth);}catch{}
      open(5);root.classList.add('rewinding');
      await zoom(snap,left.getBoundingClientRect(),false);
      turn(5,true);await new Promise(r=>setTimeout(r,reduced()?80:1240));page=0;render();finish();
    }finally{root.classList.remove('rewinding');busy=false;}
  }
  try{earth=localStorage.getItem('shanhe.yisui.earth');}catch{}
  left.onclick=get('folioEnter').onclick=revisit;
  get('closeCodex').onclick=()=>{if(!busy){hide();close();}};
  get('folioPrev').onclick=()=>change(next(-1));get('folioNext').onclick=()=>change(next(1));
  root.onkeydown=e=>{
    if(e.key==='Escape'){e.preventDefault();get('closeCodex').click();}
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const n=next(e.key==='ArrowLeft'?-1:1);if(n!==null)change(n);}
    if(e.key==='Tab'){
      const focus=[...root.querySelectorAll('button:not(:disabled),summary,[tabindex="0"]')].filter(b=>b.getClientRects().length);
      if(e.shiftKey&&document.activeElement===focus[0]){e.preventDefault();focus.at(-1)?.focus();}
      if(!e.shiftKey&&document.activeElement===focus.at(-1)){e.preventDefault();focus[0]?.focus();}
    }
  };
  root.addEventListener('touchstart',e=>{start=[e.touches[0].clientX,e.touches[0].clientY];},{passive:true});
  root.addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start[0],dy=e.changedTouches[0].clientY-start[1];start=null;if(Math.abs(dx)>52&&Math.abs(dx)>1.5*Math.abs(dy)){const n=next(dx<0?1:-1);if(n!==null)change(n);}},{passive:true});
  return {open,hide,rewind};
}

