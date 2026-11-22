import acts from './story.json' with { type:'json' };
export const familyNote='路通向最远的星河，根留在最近的山河。';
export const endingText='六十六年四代接力，所有出发与归来，都在这颗星球上。';
const kinds=['note','ticket','train','express','boarding'];
const senders=['外婆','林穗','宁宁','宁宁','小满'];
const recipients=['林穗','周桂芳','林穗','林穗','宁宁'];
const railTickets=[null,null,{serial:'B019786',gate:'2',from:'长路里站',to:'江城站',fromRoman:'Changluli',toRoman:'Jiangcheng',service:'K1986',departure:'2008年09月01日 21:47开',seat:'06车 072号',fare:'72.0',className:'硬座',code:'CL20080901 061986072'},
{serial:'E012023',gate:'A3',from:'云岭站',to:'长路里站',fromRoman:'Yunling',toRoman:'Changluli',service:'G2023',departure:'2023年10月18日 17:46开',seat:'05车 08F号',fare:'18.0',className:'二等座',code:'YL20231018 05202308F'}];
const replies=['祝月面第一穗稻顺利抽绿','山河在脚下，星河在前方','从田埂出发，向月球报到'];
export const letters=acts.map((a,i)=>({
  kind:kinds[i],rail:railTickets[i],sender:senders[i],to:recipients[i],title:a.object,
  distance:a.label.split(' · ').slice(1).join(' · '),setting:a.intro,routeLine:a.line,cue:a.object,
  frontLabel:a.object,frontText:a.front,backLabel:'纸背留字 · '+senders[i],backText:a.quote,body:a.story,excerpt:a.quote,
  ...(i===4?{replies}:{}),
}));
