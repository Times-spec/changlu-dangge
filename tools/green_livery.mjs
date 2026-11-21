import sharp from 'sharp';
import {EXTTextureWebP} from '@gltf-transform/extensions';

// Transfer two level brush lines to the coach's original UV islands. The
// locomotive, doors, glass, lettering and metalwork retain their source paint.
export async function straightenCoachPaint(doc){
  const coach=doc.getRoot().listMeshes().find(mesh=>mesh.getName()==='node_0.001');
  if(!coach)throw Error('Missing passenger coach');
  const primitive=coach.listPrimitives()[0],indices=primitive.getIndices().getArray();
  const position=primitive.getAttribute('POSITION').getArray(),uv=primitive.getAttribute('TEXCOORD_0').getArray();
  const texture=primitive.getMaterial().getBaseColorTexture();
  const {data,info:{width,height}}=await sharp(texture.getImage()).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const source=Buffer.from(data);
  const pixels=new Map(),bins=[[],[],[],[]],binSize=.05;
  const yellow=(r,g,b)=>r>48&&g>48&&r>b*1.46&&g>b*1.48&&r<g*1.57;
  for(let tri=0;tri<indices.length;tri+=3){
    const ids=indices.subarray(tri,tri+3);
    const vertex=Array.from(ids,i=>({x:uv[i*2]*width-.5,y:uv[i*2+1]*height-.5,
      side:position[i*3],h:position[i*3+1],z:-position[i*3+2]}));
    const [a,b,c]=vertex;
    if(vertex.every(v=>v.h<1.29)||vertex.every(v=>v.h>2.54)||vertex.every(v=>Math.abs(v.side)<1.12))continue;
    const det=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    if(Math.abs(det)<1e-7)continue;
    const xs=vertex.map(v=>v.x),ys=vertex.map(v=>v.y);
    for(let y=Math.max(0,Math.ceil(Math.min(...ys)));y<=Math.min(height-1,Math.max(...ys));y++){
      for(let x=Math.max(0,Math.ceil(Math.min(...xs)));x<=Math.min(width-1,Math.max(...xs));x++){
        const u=((x-a.x)*(c.y-a.y)-(y-a.y)*(c.x-a.x))/det,v=((b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x))/det;
        if(u<0||v<0||u+v>1)continue;
        const h=a.h+(b.h-a.h)*u+(c.h-a.h)*v,centre=h<1.9?1.485:2.34;
        const side=a.side+(b.side-a.side)*u+(c.side-a.side)*v;
        if(Math.abs(h-centre)>.17||Math.abs(side)<1.15)continue;
        const z=a.z+(b.z-a.z)*u+(c.z-a.z)*v;
        const row=bins[(side>0?2:0)+(h<1.9?0:1)],bin=Math.floor(z/binSize);
        const sample=row[bin]??={gold:[0,0,0],green:[0,0,0],ng:0,ny:0};
        const pixel=y*width+x,offset=pixel*3,[r,g,blue]=source.subarray(offset,offset+3);
        let key;
        if(yellow(r,g,blue)){key='gold';sample.ny++;}
        else if(g>r*1.09 && g>blue*1.05 && g<155){key='green';sample.ng++;}
        if(key){sample[key][0]+=r;sample[key][1]+=g;sample[key][2]+=blue;}
        pixels.set(pixel,{d:Math.abs(h-centre),row,bin});
      }
    }
  }
  for(const [pixel,{d,row,bin}] of pixels){
    const near=row.slice(Math.max(0,bin-2),bin+3).filter(Boolean);
    const ny=near.reduce((n,s)=>n+s.ny,0),ng=near.reduce((n,s)=>n+s.ng,0);
    if(ny<5||ng<3)continue;
    const i=pixel*3,[r,g,b]=source.subarray(i,i+3);
    const line=Math.max(0,Math.min(1,(.046-d)/.010));
    if(!line&&!yellow(r,g,b))continue;
    for(let k=0;k<3;k++){
      const green=near.reduce((n,s)=>n+s.green[k],0)/ng;
      const gold=near.reduce((n,s)=>n+s.gold[k],0)/ny;
      data[i+k]=Math.round(green+(gold-green)*line);
    }
  }
  doc.createExtension(EXTTextureWebP).setRequired(true);
  texture.setImage(await sharp(data,{raw:{width,height,channels:3}}).webp({lossless:true}).toBuffer()).setMimeType('image/webp');
}
