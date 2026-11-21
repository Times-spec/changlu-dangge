"""Paint eight soft, lit billows into the flipbook used by the port finale."""
from pathlib import Path
import numpy as np
from PIL import Image


def billow(seed, size=160):
    rng = np.random.default_rng(seed)
    axis = np.linspace(-1, 1, size)
    x, y = np.meshgrid(axis, axis)

    def noise(freq):
        knots = rng.random((freq+1, freq+1)).astype("float32")
        return np.asarray(Image.fromarray(knots).resize((size, size), Image.Resampling.BICUBIC)) - .5

    folds = .14*noise(8) + .065*noise(18) + .029*noise(39) + .012*noise(77)
    front = np.full(x.shape, -2.)
    margin = np.full(x.shape, -2.)
    lobes = [(0., .03, .02, .62)]
    for i in range(12):
        a = i*np.pi/6+rng.uniform(-.16,.16)
        distance=rng.uniform(.34,.54)
        lobes.append((distance*np.cos(a),distance*np.sin(a),rng.uniform(-.24,.12),rng.uniform(.26,.39)))
    for _ in range(8):
        lobes.append((*rng.uniform(-.35,.35,2), rng.uniform(.13,.36), rng.uniform(.17,.35)))
    for cx,cy,cz,r in lobes:
        d = r-np.hypot(x-cx,(y-cy)*1.1)+folds
        margin = np.maximum(margin,d)
        front = np.maximum(front, np.where(d>-.035,cz+np.sqrt(np.maximum(0,d*(2*r-d))),-2))
    # Broad directional shading survives the reduction to distant screen pixels.
    height = np.where(margin>-.035, front, 0)
    gy,gx = np.gradient(height,axis,axis)
    light = (-.36*gx-.58*gy+.60)/np.sqrt(gx*gx+gy*gy+1.)
    tone = np.clip(.43+.24*light+.23*np.clip(height,0,1)-.10*y+.12*noise(23),.10,.96)
    alpha = np.clip((margin+.035)/.13,0,1)
    alpha = alpha*alpha*(3-2*alpha)
    return Image.fromarray(np.uint8(255*np.stack((tone,tone,tone,alpha),axis=-1)))


if __name__ == "__main__":
    atlas=Image.new("RGBA",(640,320))
    for i in range(8):
        atlas.paste(billow(507+i*53),((i%4)*160,(i//4)*160))
    atlas.save(Path(__file__).resolve().parents[1]/"assets/painted/launch-vapour.webp",
               quality=91,alpha_quality=96,method=6)
