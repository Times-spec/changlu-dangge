"""Lay out live scenery inspections at matching sizes for visual review."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[1] / "qa/scenery-study"
folder=root/"current"
records=json.loads((folder/"manifest.json").read_text())["manifest"]
font=ImageFont.truetype("C:/Windows/Fonts/msyh.ttc",15)
for act in ("rural","town","city","rail","future"):
    views=[r["id"] for r in records if r["act"]==act]
    sheet=Image.new("RGB",(386*3,261*((len(views)+2)//3)),"#ebe4d7")
    draw=ImageDraw.Draw(sheet)
    for i,name in enumerate(views):
        with Image.open(folder/(name+".jpg")) as im:
            im.thumbnail((380,235));x=i%3*386+3;y=i//3*261+2
            sheet.paste(im,(x,y));draw.text((x,y+235),name,fill="#222520",font=font)
    sheet.save(folder/(act+"-sheet.jpg"),quality=90)

