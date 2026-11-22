const ease=t=>{const u=Math.min(1,Math.max(0,t));return u*u*(3-2*u);};

export function printFirstPage(picture,canvas){
  picture.width=canvas.width;picture.height=canvas.height;
  picture.getContext('2d',{alpha:false}).drawImage(canvas,0,0);
}

export function openBook(intro,reduced,refreshPicture,onOpen){
  const binding=intro.querySelector('.book-binding'),cover=intro.querySelector('.book-cover');
  const leaf=intro.querySelector('.story-leaf'),plate=intro.querySelector('#bookWindow');
  const next=intro.querySelector('#openFolio');
  let stage='cover',clock=0,width=0,height=0,w,h,artW,swipeY=null,wheelAt=0,wheelSum=0,wheelUsed=false;
  function phase(name,label){
    stage=intro.dataset.phase=name;clock=0;
    next.textContent=label||'';next.hidden=!label;
  }
  function advance(){
    if(stage==='cover'){onOpen();phase('opening');}
    else if(stage==='background'){onOpen();phase('turning');}
  }
  function click(e){if(!e.target.closest('#skipIntro'))advance();}
  function key(e){
    if(intro.hidden||e.target.closest?.('#skipIntro')||e.repeat||!['Enter',' ','ArrowDown','PageDown'].includes(e.key))return;
    e.preventDefault();advance();
  }
  function wheel(e){
    const now=performance.now();
    if(now-wheelAt>280){wheelSum=0;wheelUsed=false;}
    wheelAt=now;wheelSum=Math.max(0,wheelSum+e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?height:1));
    if(wheelSum>=22&&!wheelUsed){wheelUsed=true;advance();}
    e.preventDefault();
  }
  function down(e){swipeY=e.touches[0].clientY;}
  function up(e){if(swipeY!==null && swipeY-e.changedTouches[0].clientY>35){e.preventDefault();advance();}swipeY=null;}
  const events={click,wheel,touchstart:down,touchend:up};
  window.addEventListener('keydown',key);
  for(const [name,fn] of Object.entries(events))intro.addEventListener(name,fn,{passive:false});
  phase('cover','轻点旧册，翻开故事');
  return {
    update(dt){
      clock+=dt;
      if(width!==intro.clientWidth||height!==intro.clientHeight){
        width=intro.clientWidth;height=intro.clientHeight;
        const portrait=width<height;
        w=Math.min(width*.457,height*(height<430&&!portrait?.82:.65),440);
        const readingHeight=portrait?height*(width<360?.72:width<390?.65:.56):0;
        h=Math.min(height*.74,Math.max(w*1.28,readingHeight));
        artW=Math.min(w*.87,h*.68*width/height);
        binding.style.setProperty('--w',w+'px');binding.style.setProperty('--h',h+'px');
        plate.style.width=artW+'px';plate.style.height=artW*height/width+'px';refreshPicture();
      }
      const turnTime=reduced?.12:1.05;
      if(stage==='opening'&&clock>=turnTime)phase('background','轻点翻至第一幕 →');
      if(stage==='turning'&&clock>=turnTime)phase('spread');
      if(stage==='spread'&&clock>=2.0)phase('enter');
      const open=stage==='cover'?0:stage==='opening'?ease(clock/turnTime):1;
      const turn=stage==='turning'?ease(clock/turnTime):['spread','enter'].includes(stage)?1:0;
      const zoom=stage==='enter'?ease(clock/(reduced?.18:1.8)):0;
      const compact=width<height?1.43:1;
      binding.style.setProperty('--h',(h+(Math.min(w*1.42,h)-h)*(1-open))+'px');
      const scale=(1+(compact-1)*(1-open))*Math.exp(Math.log(width/artW)*zoom);
      binding.style.transform='translateX('+((zoom-(1-open))*w*.5*scale)+'px) scale('+scale+')';
      cover.style.transform='perspective('+w*5+'px) rotateY('+(-180*open)+'deg)';
      cover.style.zIndex=open<1?'3':'1';
      leaf.style.transform='perspective('+w*5+'px) rotateY('+(-180*turn)+'deg)';
      return zoom>=1;
    },
    dispose(){window.removeEventListener('keydown',key);for(const [name,fn] of Object.entries(events))intro.removeEventListener(name,fn);plate.firstElementChild.width=plate.firstElementChild.height=1;delete intro.dataset.phase;}
  };
}
