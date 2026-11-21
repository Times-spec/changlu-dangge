import * as THREE from 'three';

// The illustration lives on one flat, camera-facing sprite. Its origin is at
// the soles, so windows, furniture and railings occlude it at the scene depth.
export function characterSprite(texture,height,tint='#ffffff'){
  const material=new THREE.SpriteMaterial({
    map:texture,color:tint,alphaTest:.32,depthTest:true,depthWrite:true
  });
  const sprite=new THREE.Sprite(material);
  sprite.center.set(.5,0);
  sprite.scale.set(height*texture.image.width/texture.image.height,height,1);
  sprite.userData.noNormal=true;
  return sprite;
}
