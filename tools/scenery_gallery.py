"""Publish the current camera views and encode the detail cards from the reviewed build."""
from pathlib import Path
import json
import sys
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1] / "qa/scenery-study"
current = root / "current"
acts = dict(rural="田埂晨",town="街市暮",city="城夜雨",rail="山河速",future="星河远")
acts={"opening":"开场","overview":"展卷总览",**acts}
names=dict(journey="行进镜头", cooperative="供销合作社",fields="田埂边",market="东街副食",bicycle="自行车",umbrella="红伞",facade="大楼外立面",train="绿皮车侧面",boat="江上的船",bridge="山河大桥",greenhouse="育苗温室",rocket="星河号")
phases=dict(text="背景文字",cover="封面",hinge="翻开封面",spread="第一幅画",enter="走进画页",full="画页铺满屏幕")
records = json.loads((current / "manifest.json").read_text(encoding="utf8"))["manifest"]

def title(act,item):
    if act=="overview":return "五幕总览"
    if act=="opening":
        if item=="loading":return "初次打开"
        if item=="first-travel":return "开始漫游"
        device,phase=item.split("-")
        return ("手机" if device=="phone" else "横屏")+" · "+phases[phase]
    s=item[len(act)+1:]
    if s.startswith("person-"):return "人物 · "+s.removeprefix("person-").removeprefix("actor-")
    return names.get(s,s)

cards={act:[] for act in acts}
for frame in records:
    act, name = frame["act"], frame["id"]
    cards[act].append(dict(name=title(act, name), file="current/" + name + ".jpg"))
template="""<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>五幕局部复核 · 山河织路</title><style>
*{box-sizing:border-box}body{background:#eee9df;color:#332d25;font:16px/1.5 system-ui,'Microsoft YaHei',sans-serif;margin:0}main{max-width:1600px;margin:auto;padding:clamp(16px,3vw,54px)}h1{font-family:serif;font-weight:550;font-size:clamp(27px,4vw,43px);margin:0 0 18px}nav{display:flex;gap:12px;flex-wrap:wrap;align-items:center}select,button{font:inherit;color:inherit;padding:6px 12px;border:1px solid #bcb4a3;background:#faf7ee;border-radius:3px}label span{margin-right:6px}figure{margin:0;min-width:0}figcaption{padding:3px 1px 7px;font-size:.9rem}#grid{display:grid;grid-template-columns:minmax(0,1008px);gap:16px;margin-top:19px}img{width:100%;display:block;height:auto}figure p{margin:0;padding:3em 0;color:#776f63}@media(max-width:720px){#grid{grid-template-columns:1fr}main{padding:14px}nav{gap:6px}}
</style><main><h1>五幕局部复核</h1><nav><label><span>场景</span><select id="act"></select></label><label><span>机位</span><select id="item"></select></label><button id="prev" aria-label="上一处">←</button><button id="next" aria-label="下一处">→</button></nav><div id="grid"></div></main><script>
const cards=CARDS,acts=ACTS;
const byId=id=>document.getElementById(id),act=byId('act'),item=byId('item'),grid=byId('grid');
for(const [key,label] of Object.entries(acts))act.add(new Option(label,key));
function draw(){
  const card=cards[act.value][item.selectedIndex], fig=document.createElement('figure');
  const caption=document.createElement('figcaption'), link=document.createElement('a'), img=new Image();
  caption.textContent=acts[act.value]+' · '+card.name;
  img.src=link.href=card.file;img.alt=caption.textContent;link.target='_blank';
  link.append(img);fig.append(caption,link);grid.replaceChildren(fig);location.hash=act.value+'/'+item.selectedIndex;
}
function fill(n){item.replaceChildren();for(const c of cards[act.value])item.add(new Option(c.name));item.selectedIndex=Math.max(0,Math.min(n||0,item.length-1));draw()}
act.onchange=()=>fill(0);item.onchange=draw;for(const [button,step] of [['prev',-1],['next',1]])byId(button).onclick=()=>{item.selectedIndex=(item.selectedIndex+step+item.length)%item.length;draw()};
const [initial,offset]=location.hash.slice(1).split('/');act.value=acts[initial]?initial:'opening';fill(initial?Number(offset):0);
</script></html>"""
(root/"index.html").write_text(template.replace("CARDS",json.dumps(cards,ensure_ascii=False)).replace("ACTS",json.dumps(acts,ensure_ascii=False)),encoding="utf8")
font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc",23)
def sheet(dest,frames,cols=3,w=370,h=236):
    canvas=Image.new("RGB",(cols*w,((len(frames)+cols-1)//cols)*h),"#ede6d7")
    draw=ImageDraw.Draw(canvas)
    for i,(label,file) in enumerate(frames):
        with Image.open(file) as im:
            im.thumbnail((w-8,h-34))
            x=(i%cols)*w; y=(i//cols)*h
            canvas.paste(im,(x+(w-im.width)//2,y+2))
            draw.text((x+7,y+h-30),label,font=font,fill="#42392a")
    canvas.save(root/dest,quality=92)

people=[("人物 · "+acts[r["act"]],current/(r["id"]+".jpg")) for r in records if "-person-" in r["id"]]
sheet("人物近景.jpg",people)
sheet("开场.jpg",[(phases[key],current/("wide-"+key+".jpg")) for key in phases])
if (root/"green-before.jpg").exists():
    sheet("绿皮车侧面对照.jpg",[("修改前",root/"green-before.jpg"),("修改后",current/"city-train.jpg")],1,800,510)
if "--details" in sys.argv:
    details=dict(seed="rural-cooperative",bowl="rural-fields",showtime="town-market",milestone="town-bicycle",umbrella="city-umbrella",train="city-train",ferry="rail-boat",supper="rail-bridge",sprouts="future-greenhouse",boarding="future-rocket")
    for key,name in details.items():
        with Image.open(current/(name+".jpg")) as im:
            im.thumbnail((896,560))
            im.save(root.parents[1] / "assets/painted"/("visit-"+key+".webp"),quality=89,method=5)
print(current.name,len(records),"local views")
