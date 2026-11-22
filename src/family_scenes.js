import * as THREE from 'three';

import acts from './story.json' with { type:'json' };
const points=[
  [[-3.3,2.7,49],[7.1,1,20]], [[-4.98,3.8,-35],[-.85,1.1,-51.5]],
  [[9.48,1.65,23.9],[1.2,15.5,-5]], [[-25,2,9.4],[-6.83,31.47,0]], [[127,8,-42],[102,25,-80]]
];
const actions=['展开折角','撕下副券','在票边剪口','刷证进站','扫描登船牌'];
const gestures=['向上展开纸角','向右撕下副券','按下检票钳','把身份证移过感应区','让登船牌穿过扫描光带'];
export const scenes=acts.map((a,i)=>({
  points:points[i],reach:[42,42,42,105,110][i],action:actions[i],drag:gestures[i],
  spots:a.details.map(d=>d.name),stories:a.details.map(d=>d.story),
}));
export function vesselMark(rocket){
  const c=document.createElement('canvas');c.width=180;c.height=700;
  const g=c.getContext('2d');g.textAlign='center';g.fillStyle='#973c32';
  g.beginPath();g.moveTo(30,97);g.quadraticCurveTo(80,70,146,20);g.lineTo(97,95);g.lineTo(69,86);g.closePath();g.fill();
  g.fillStyle='#263f50';g.font='600 103px "Microsoft YaHei",sans-serif';
  [...'星河号'].forEach((s,i)=>g.fillText(s,90,235+i*122));
  g.font='bold 23px sans-serif';g.fillText('XINGHE',90,558);g.fillRect(22,588,136,4);g.fillText('SH · 001',90,634);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.22,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  for(const bearing of [.28,Math.PI+.28]){
    const geo=new THREE.CylinderGeometry(2.633,2.633,9.9,20,1,true,bearing-.43,.86);
    const m=new THREE.Mesh(geo,mat);m.name='星河号 · 船体标识';m.position.y=27.0;m.userData.noNormal=true;rocket.add(m);
  }
}
// Airborne particles scatter a little light inside the streetlamp's beam; the
// silhouette fades at both ends rather than producing a hard polygonal cone.
export function streetLightAir(group){
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{shade:{value:new THREE.Color('#f8bf72')}},
    vertexShader:'varying vec2 st;void main(){st=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 st;uniform vec3 shade;void main(){float f=sin(st.y*3.14159);gl_FragColor=vec4(shade,.035*f*f);}'});
  const geometry=new THREE.ConeGeometry(1.55,6,16,1,true);
  for(const [x,z] of [[9.4,18],[-7.55,6.1]]){
    const cone=new THREE.Mesh(geometry,material);cone.position.set(x,3.85,z);cone.name='Rain in streetlight';cone.userData.noNormal=cone.userData.optionalLight=true;group.add(cone);
  }
}


