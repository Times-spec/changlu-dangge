import * as THREE from 'three';
import {AssetTextureLoader} from './asset_loaders.js';

import {scenePaintings} from './painted_assets.js';

export async function loadPaintings() {
  const loader = new AssetTextureLoader();
  const pairs = await Promise.all(scenePaintings.map(async name => {
    const texture = await loader.loadAsync('/assets/painted/' + name + '.webp');
    texture.colorSpace = name==='launch-vapour'?THREE.NoColorSpace:THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.name = name;
    return [name,texture];
  }));
  return Object.fromEntries(pairs);
}

const skyWash={rural:[1.10,.86,.70,.19],town:[.94,.66,.65,.13],city:[.41,.44,.61,.09],
  rail:[1.12,.80,.63,.28],future:[.83,.69,.83,.21]};
const sunGlow={rural:.66,town:.75,rail:.84,city:0,future:.38};
const skies = { rural:['day',.19],town:['market-horizon',.58],city:['avenue-horizon',.54],
  rail:['river-horizon',.35],future:['port-horizon',.51] };

export class PaintedSky {
  constructor(scene) {
    this.group = new THREE.Group();
    this.tint = new THREE.Color();
    this.sunAxis = new THREE.Vector3();
    this.group.userData.noNormal = true;
    this.mat = new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,fog:false,
      uniforms:{painting:{value:null},nextPainting:{value:null},zenith:{value:null},cloudPaper:{value:null},
        wash:{value:new THREE.Vector4()},nextWash:{value:new THREE.Vector4()},skyFrame:{value:new THREE.Vector4()},nextFrame:{value:new THREE.Vector4()},skyBlend:{value:0},
        sunBearing:{value:new THREE.Vector3()},sunColour:{value:new THREE.Color()},sunGlow:{value:0},
        mist:{value:0},land:{value:new THREE.Color('#8ca882')},mistLight:{value:new THREE.Color()}},
      vertexShader:'varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec3 direction;
        uniform sampler2D painting,nextPainting,zenith,cloudPaper;
        uniform vec4 skyFrame,nextFrame,wash,nextWash; uniform float skyBlend,mist; uniform vec3 land,mistLight;
        uniform vec3 sunBearing,sunColour; uniform float sunGlow;
        vec3 sampleSky(sampler2D plate,vec4 frame,vec4 grade,float lon,float elev,vec3 dir){
          float u=1.-abs(mod(frame.x+lon*2.,2.)-1.);
          float y=frame.y+elev*frame.z;
          // Ease into the upper sky; a clamped top row stretches into vertical stripes.
          if(y>.72)y=.72+.27*(1.-exp(-max(y-.72,0.)/.27));
          vec3 paint=texture2D(plate,vec2(u,clamp(y,.008,.993))).rgb;
          if(frame.z>1.5){
            // The river panorama ends just above the ridge. Continue upward
            // with a painted sky projected on a tangent plane above the valley.
            vec2 uv=vec2(.50,.77)+dir.xz*vec2(.19,.13);
            vec3 overhead=texture2D(cloudPaper,uv).rgb*vec3(.76,.92,1.12);
            paint=mix(paint,overhead,smoothstep(.20,.44,elev));
          }
          if(frame.w>0. && elev>.50){
            // Project the overhead painting onto a tangent plane. Longitude
            // collapses at the pole and would pinch the brushwork into a seam.
            vec2 uv=vec2(.51,.68)+dir.xz*vec2(.47,.29);
            paint=mix(paint,texture2D(zenith,uv).rgb,smoothstep(.50,1.02,elev));
          }
          if(frame.w>0.){
            float luminance=dot(paint,vec3(.2126,.7152,.0722));
            paint=mix(vec3(luminance*.66,luminance*.84,luminance),paint,.43);
          }
          float haze=grade.w*(1.-smoothstep(.02,.47,elev));
          paint=mix(paint*grade.rgb,land,haze);
          if(frame.z>1.5){
            float v=dot(paint,vec3(.25,.58,.17));
            vec3 sunset=mix(vec3(.33,.35,.43),vec3(1.0,.73,.45),clamp(v*1.18,0.,1.));
            float horizon=1.-smoothstep(.05,.85,elev);
            paint=mix(paint,sunset,.48+.36*horizon)+vec3(.09,.036,.008)*horizon;
          }
          if(frame.w>0.) paint+=vec3(.32,.14,.075)*exp(-abs(elev-.04)*6.);
          return paint;
        }
        void main(){
          vec3 d=normalize(direction);
          float lon=atan(d.x,-d.z)/6.2831853;
          float elev=asin(clamp(d.y,-1.,1.));
          vec3 paint=sampleSky(painting,skyFrame,wash,lon,elev,d);
          if(skyBlend>0.) paint=mix(paint,sampleSky(nextPainting,nextFrame,nextWash,lon,elev,d),skyBlend);
          paint=mix(land,paint,smoothstep(-.16,-.065,elev));
          float sunDot=max(dot(d,sunBearing),0.);
          float halo=pow(sunDot,19.)*.32+pow(sunDot,146.)*.80;
          paint+=sunColour*sunGlow*(halo+smoothstep(.99973,.99995,sunDot)*3.0)*smoothstep(.015,.17,d.y);
          if(mist>0. && d.y<0.){
            // Project a low bank of painted cloud below the book edges. Its brushwork
            // stays in world space as the viewer flies past it in either direction.
            vec2 ground=cameraPosition.xz+d.xz*(-22.-cameraPosition.y)/min(d.y,-.013);
            vec2 sheet=1.-abs(mod(ground*vec2(.0032,.0045)+vec2(.52,.91),2.)-1.);
            vec3 cloud=texture2D(cloudPaper,vec2(sheet.x,.39+sheet.y*.58)).rgb;
            float light=smoothstep(.24,.82,dot(cloud,vec3(.28,.57,.15)));
            float grain=fract(sin(dot(floor(ground*vec2(.8,2.6)),vec2(61.2,34.9)))*495.3);
            vec3 paper=vec3(.82,.76,.66)*(.98+.035*grain);
            vec3 bank=mix(mix(land*.86,mistLight,.20+.67*light),paper,.49);
            paint=mix(paint,bank,mist*(1.-smoothstep(-.19,-.025,elev)));
          }
          gl_FragColor=vec4(paint,1.);
        }`
    });
    const dome=new THREE.Mesh(new THREE.SphereGeometry(1400,50,26),this.mat);
    dome.renderOrder=-20;
    this.group.add(dome); scene.add(this.group);
    const {cloudPaper,mist,mistLight,land}=this.mat.uniforms;
    const bankMaterial=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,side:THREE.DoubleSide,
      uniforms:{cloudPaper,mist,mistLight,land},
      vertexShader:`varying vec2 field; varying vec2 brushUV;
        void main(){
          field=position.xy;
          vec3 local=position;
          local.z+=2.1*sin(field.x*.033+field.y*.021)+1.4*cos(field.y*.093-field.x*.013);
          brushUV=(modelMatrix*vec4(local,1.)).xz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(local,1.);
        }`,
      fragmentShader:`varying vec2 field; varying vec2 brushUV;
        uniform sampler2D cloudPaper; uniform float mist; uniform vec3 mistLight,land;
        void main(){
          vec2 sheet=1.-abs(mod(brushUV*vec2(.006,.013)+vec2(.32,.71),2.)-1.);
          vec3 paint=texture2D(cloudPaper,vec2(sheet.x,.42+.52*sheet.y)).rgb;
          float brush=smoothstep(.21,.85,dot(paint,vec3(.28,.57,.15)));
          float shore=abs(abs(field.y)-59.);
          float coverage=(1.-smoothstep(3.,64.,shore+17.*(brush-.45)))*(1.-smoothstep(143.,271.,abs(field.x)));
          float alpha=mist*coverage*(.13+.47*brush);
          gl_FragColor=vec4(mix(land,mistLight,.52+.31*brush),alpha);
        }`
    });
    this.banks=new THREE.Mesh(new THREE.PlaneGeometry(600,290,25,14),bankMaterial);
    this.banks.name='Mist along the island edges';
    this.banks.rotation.x=-Math.PI/2;this.banks.position.y=7;
    this.banks.visible=false;this.banks.userData.noNormal=true;scene.add(this.banks);
  }
  setPalette(p,next=p,blend=0) {
    if(!this.plates || !skies[p.name]) return;
    const u=this.mat.uniforms;
    u.painting.value=this.plates[skies[p.name][0]];
    u.nextPainting.value=this.plates[skies[next.name][0]];
    u.zenith.value=this.plates.night;
    u.cloudPaper.value=this.plates.day;
    for(const [key,frame] of [[p.name,u.skyFrame.value],[next.name,u.nextFrame.value]]){
      frame.set(skies[key][1],key==='rail'?.235:.135,key==='rail'?1.82:1.08,key==='future'?1:0);
    }
    u.wash.value.fromArray(skyWash[p.name]);u.nextWash.value.fromArray(skyWash[next.name]);
    u.skyBlend.value=blend;
    u.sunBearing.value.fromArray(p.sunDir).lerp(this.sunAxis.fromArray(next.sunDir),blend).normalize();
    u.sunColour.value.set(p.sun).lerp(this.tint.set(next.sun),blend);
    u.sunGlow.value=THREE.MathUtils.lerp(sunGlow[p.name],sunGlow[next.name],blend);
    u.land.value.set(p.fog).lerp(this.tint.set(next.fog),blend);
    u.mistLight.value.set(p.bot).lerp(this.tint.set(next.bot),blend);
  }
  update(camera,mist,overview,gapZ) {
    this.group.position.copy(camera.position);
    this.group.visible=!!this.plates && !overview;
    this.mat.uniforms.mist.value=mist;
    this.banks.visible=gapZ!==undefined && mist>.001;
    if(this.banks.visible) this.banks.position.z=gapZ;
  }
}

// Linear diffuse bounce under the eaves, across vertical faces and on open ground.
const bounce={
  rural:[[.091,.092,.078],[.23,.28,.30]],
  town:[[.085,.058,.061],[.22,.20,.27]],
  city:[[.012,.017,.033],[.052,.092,.18]],
  rail:[[.065,.09,.089],[.19,.29,.34]],
  future:[[.022,.032,.048],[.088,.135,.20]]
};
const canopyPaint={
  town:['#395d43','#a0b45d'],city:['#264c50','#698b73'],river:['#315f4c','#91aa69'],
  pine:['#265449','#6c986e'],silver:['#3a5d59','#99b3a2'],copper:['#72475c','#c28e76']
};

// Preserve mesh UVs, liveries and cast shadows. Let the directed key, cast shadows and local lights
// form the masses. Retain reflected colour on their unlit sides.
export function illustrate(mat, chapter) {
  if(!mat?.isMeshStandardMaterial || mat.userData.paintChapter===chapter) return;
  mat.userData.paintChapter=chapter;
  const [ground,sky]=bounce[chapter];
  const foliage=canopyPaint[mat.name.replace(/^Q leaves /,'').replace(/\.\d+$/,'')];
  const rice=mat.name==='Backlit rice blades';
  const willow=mat.name==='Willow leaf sprays';
  const towerSteel=chapter==='future'&&mat.name==='Gantry painted steel';
  const rocketShell=chapter==='future'&&mat.name==='R_Shell';
  if(towerSteel){mat.roughness=.45;mat.metalness=.56;}
  const previous=mat.onBeforeCompile.bind(mat);
  const cache=mat.customProgramCacheKey();
  mat.customProgramCacheKey=()=>cache+'-paint-'+chapter+(foliage?'-foliage':'')+(towerSteel?'-tower-steel':'')+(rocketShell?'-shell':'')+(rice?'-rice':'')+(willow?'-willow':'');
  mat.envMapIntensity=.32;
  if(mat.normalMap) mat.normalScale.multiplyScalar(.27);
  mat.onBeforeCompile=(shader,renderer)=>{
    previous(shader,renderer);
    if(chapter==='rail'){
      shader.vertexShader='varying vec3 boreWorld;\n'+shader.vertexShader.replace('#include <project_vertex>',`
        vec4 bp=vec4(transformed,1.);
        #ifdef USE_INSTANCING
        bp=instanceMatrix*bp;
        #endif
        boreWorld=(modelMatrix*bp).xyz;
        #include <project_vertex>`);
      shader.fragmentShader='varying vec3 boreWorld;\n'+shader.fragmentShader;
    }

    if(foliage){
      shader.uniforms.leafShade={value:new THREE.Color(foliage[0])};
      shader.uniforms.leafLight={value:new THREE.Color(foliage[1])};
      shader.fragmentShader='uniform vec3 leafShade, leafLight;\n'+shader.fragmentShader;
    }
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec3 pigment=max(diffuseColor.rgb,vec3(0.));
      vec3 wn=inverseTransformDirection(normal,viewMatrix);
      ${foliage?'wn*=gl_FrontFacing?1.:-1.;':''}
      // Both the key and the fill come from the scene. Direct diffuse already
      // contains the shadow-map visibility and the spot/point light attenuation.
      float skyView=smoothstep(-.86,.88,wn.y);
      vec3 ambient=mix(vec3(${ground}),vec3(${sky}),skyView);
      vec3 substrate=pigment;
      ${towerSteel?'substrate=mix(vec3(.085,.12,.145),vec3(.38,.45,.48),smoothstep(.04,.7,dot(pigment,vec3(.28,.58,.14))));':''}
      #ifdef USE_MAP
      float luma=dot(substrate,vec3(.28,.56,.16));
      substrate*=mix(1.,(floor(luma*24.+.5)/24.+.025)/(luma+.025),.27);
      #endif
      ${foliage?`float leafInk=clamp(dot(pigment,vec3(.26,.56,.18))*1.65,0.,1.);
        substrate=mix(substrate,mix(leafShade,leafLight,leafInk),.54);`:''}
      vec3 lightRatio=reflectedLight.directDiffuse/max(material.diffuseColor,vec3(.016));
      vec3 inked=substrate*(ambient+min(lightRatio,vec3(4.2))*2.22);
      inked*=.94+.06*smoothstep(.16,.52,length(lightRatio));
      vec3 sheen=totalSpecular*(.38+.45*metalnessFactor);
      outgoingLight=inked+sheen+totalEmissiveRadiance;
      ${chapter==='future'?'outgoingLight+=substrate*vec3(.083,.109,.135)*(.40+.60*skyView);':''}
      ${willow?'outgoingLight+=substrate*vec3(.32,.36,.17)*(.55+.45*skyView);':''}
      ${rice?`#if NUM_DIR_LIGHTS > 0
        float leafScatter=.25+.47*abs(dot(normal,directionalLights[0].direction));
        outgoingLight+=substrate*vec3(.94,.86,.39)*leafScatter;
        #endif`:''}
      ${rocketShell?`// A rim of reflected floodlight rounds the cold side of the white shell.
        float rim=pow(1.-max(dot(normal,normalize(vViewPosition)),0.),2.7);
        outgoingLight+=pigment*(vec3(.025,.046,.073)+vec3(.045,.084,.13)*rim);`:''}
      ${chapter==='rail'?`float along=abs(boreWorld.z+1260.);
        float bore=smoothstep(107.8,119.,along)*(1.-smoothstep(142.,146.,along))
         *smoothstep(30.75,31.6,boreWorld.y)
         *(1.-smoothstep(6.9,7.3,abs(boreWorld.x)))*(1.-smoothstep(42.5,43.2,boreWorld.y));
       outgoingLight=mix(outgoingLight,outgoingLight*vec3(.075,.104,.135)+totalEmissiveRadiance,bore);`:''}
      ${chapter==='future'&&(foliage||mat.name==='F_Foliage')?'outgoingLight*=vec3(.65,.77,.83);':''}
      #include <opaque_fragment>`);
  };
  mat.needsUpdate=true;
}
