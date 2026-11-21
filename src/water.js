import * as THREE from 'three';
export function applyWater(scene) {
  const uniforms = {
    uTime: { value: 0 }, uRipple: {value:1}, uRiver:{value:0},
    uSunDir: { value: new THREE.Vector3(-0.5, 0.2, -0.55).normalize() },
    uDeep: { value: new THREE.Color('#2f5a52') },
    uShallow: { value: new THREE.Color('#7fa58f') },
    uSky: { value: new THREE.Color('#cfd9ce') },
    uSun: { value: new THREE.Color('#ffd9a0') },
    fogColor: { value: new THREE.Color('#e8ddc8') },
    fogNear: { value: 170 }, fogFar: { value: 430 }
  };
  const makeMat = (over) => {
    const u = THREE.UniformsUtils.clone(uniforms);
    for (const k in over) u[k].value = over[k];
    return new THREE.ShaderMaterial({
    uniforms: u, fog: true, side: THREE.FrontSide,
    vertexShader: `
      varying vec3 vWorld;
      #include <common>
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform float uTime, uRipple, uRiver;
      uniform vec3 uSunDir, uDeep, uShallow, uSky, uSun;
      varying vec3 vWorld;
      #include <common>
      #include <fog_pars_fragment>
      float hash(vec2 cell){return fract(sin(dot(cell,vec2(127.1,311.7)))*43758.5453);}
      float field(vec2 p){
        vec2 c=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(c),hash(c+vec2(1.,0.)),f.x),mix(hash(c+vec2(0.,1.)),hash(c+1.),f.x),f.y);
      }
      void main() {
        vec2 p = vWorld.xz;
        float swell = sin(dot(p,vec2(.26,.15))+uTime*.38);
        float w1 = sin(dot(p,vec2(1.62,.76))+swell*2.2+uTime*1.08);
        float w2 = sin(dot(p,vec2(-.53,2.26))-swell*1.4-uTime*.82);
        float w3 = sin(dot(p,vec2(3.52,1.72))+w2+uTime*1.83);
        vec3 n = normalize(vec3((w1*.044+w3*.019)*uRipple,1.,(w2*.037+swell*.03)*uRipple));
        vec3 view = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(n, view), 0.0), 3.0);
        float bed=.34+.15*sin(p.x*.14+swell)*sin(p.y*.10+.7)+.07*w1;
        vec3 col = mix(uDeep, uShallow, bed);
        col = mix(col, uSky, .08 + fres * .38);
        vec3 h = normalize(view + normalize(uSunDir));
        float spec = pow(max(dot(n, h), 0.0), 210.0) * .84;
        spec += pow(max(dot(n, h), 0.0), 30.0) * .055;
        float run=sin(p.y*2.3+sin(p.x*.26+uTime*.38)*1.7+uTime*.46);
        float drag=sin(p.x*.72+sin(p.y*.48)*2.+uTime*.32);
        float mark=smoothstep(.81,.96,run)*smoothstep(.0,.63,drag);
        mark*=1.-smoothstep(.12,1.1,fwidth(p.y*2.3));
        if(uRiver>.5){
          vec2 here=p-vec2(0.,-1260.);
          vec2 q=here*vec2(.12,.19)+vec2(-uTime*.08,0.);
          float pools=field(q*.39+field(q*.54)), current=field(q+vec2(0.,pools*2.6));
          float flicker=field(here*vec2(.28,1.05)+vec2(-uTime*.09,current*2.1));
          float fleck=smoothstep(.77,.95,flicker)*smoothstep(.46,.72,current);
          fleck*=1.-smoothstep(.18,1.4,fwidth(here.y));
          float shore=7.*sin(here.x*.026)+3.*sin(here.x*.058+.4);
          float distanceToShore=38.-abs(here.y+shore);
          float shallows=1.-smoothstep(0.,14.,distanceToShore+3.3*(current-.5));
          col=mix(uDeep*vec3(.64,.78,.84),uShallow,.085+.19*pools+.66*shallows);
          col=mix(col,uSky,.045+.20*fres);
          // Project the 13 m railway deck onto the river along the chapter sunlight.
          float deckX=here.x+31.*uSunDir.x/max(.12,uSunDir.y);
          float shadow=1.-smoothstep(4.6,8.4,abs(deckX)+current-.5);
          col*=1.-.26*shadow;
          col+=uSky*(fleck*.16+.028*mark*(1.-shallows));
          // The survey boat is at rest. Short ripples wrap its waterline.
          vec2 hull=here-vec2(-24.,9.4);
          float contact=length(hull/vec2(6.07,1.65));
          float hullShade=1.-smoothstep(.89,1.47,length((hull-vec2(.46,-.20))/vec2(6.07,1.65)));
          col=mix(col,col*vec3(.40,.57,.60),hullShade*.76);
          float arc=sin(14.*contact-uTime*1.55+.55*sin(hull.x*.72));
          float edge=smoothstep(.72,.99,arc)*smoothstep(.89,1.05,contact)*(1.-smoothstep(1.12,2.30,contact));
          col+=uSky*.105*edge*(.35+.65*current)*(1.-smoothstep(.02,.24,fwidth(contact)));
          float reflection=pow(max(0.,dot(normalize(view.xz),-normalize(uSunDir.xz))),12.);
          col+=uSun*reflection*(.055+.27*smoothstep(.63,.90,flicker))*(.3+.7*fres);
          spec*=.72;
        }else{
          col=mix(col,uShallow*1.25,mark*.63);
        }
        col+=uSun*(smoothstep(.14,.48,spec)*.44+.045*spec);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`
  }); };
  const pondMat = makeMat({ uDeep: new THREE.Color('#2f5a52'), uShallow: new THREE.Color('#8fb7a3'), uSky: new THREE.Color('#cfd9ce') });
  const riverMat=makeMat({uRiver:1,uRipple:.52});
  const paddyMat = makeMat({ uRipple:.38, uDeep: new THREE.Color('#435f43'), uShallow: new THREE.Color('#8ba06a'), uSky: new THREE.Color('#b7c9ae') });
  scene.traverse(o => {
    if (o.isMesh && o.material && o.material.name === 'Water') {
      const isPaddy = o.name.includes('Paddy') || o.name.includes('Terrace');
      o.material = isPaddy ? paddyMat : pondMat;
      o.receiveShadow = false;
    }
  });
  return { pondMat, paddyMat, riverMat };
}
