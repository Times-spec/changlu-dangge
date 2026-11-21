"""Articulated scenery for the two passenger-service bridges on the fictional port tower."""
import math
import bpy
import blib as B
from model_craft import Batch


def parked_crane(steel):
    # Park the long boom beyond the tower so the rocket keeps a clear silhouette.
    frame=Batch()
    angle=.48
    def p(along,across,height):
        return (117+along*math.cos(angle)-across*math.sin(angle),
                88+along*math.sin(angle)+across*math.cos(angle),86.6+height)
    frame.rod(p(0,0,.85),p(0,0,1.62),1.72,"#596663",20)
    frame.box(p(-1.8,0,2.22),(7.1,2.35,.82),"#9ba49e",angle)
    for i in range(3):
        frame.box(p(-4.5+i*.50,0,2.50),(.47,2.75,1.40),"#64695f",angle)
    frame.box(p(-.75,-1.15,3.07),(2.13,1.33,1.84),"#c7c4ad",angle)
    frame.box(p(-.76,-1.83,3.31),(1.72,.065,.80),"#41616a",angle)
    def joint(u,side,upper):
        return p(.5+15*u,side*(.89-.49*u),(4.20+.35*u) if upper else (2.02+1.73*u))
    for side in (-1,1):
        frame.rod(p(.5,side*.92,2.02),p(15.5,side*.42,3.75),.16,"#afaa85")
        frame.rod(p(.5,side*.83,4.2),p(15.5,side*.36,4.55),.15,"#b5b8a4")
        for i in range(8):
            a,b=i/8,(i+1)/8
            frame.rod(joint(a,side,i%2==0),joint(b,side,i%2==1),.11,"#868f80",6)
        frame.rod(p(-4.5,side*.7,2.8),p(.1,side*.6,6.3),.12,"#88938c")
        frame.rod(p(.1,side*.6,6.3),p(10.7,side*.6,4.45),.10,"#989d88")
    frame.rod(p(15.4,-.40,4.47),p(15.4,.40,4.47),.18,"#9d9c84")
    frame.rod(p(13.4,0,3.64),p(13.4,0,1.75),.058,"#585e59")
    frame.box(p(13.4,0,1.65),(.65,.46,.41),"#bb975a",angle)
    frame.object("Crane parked outboard",steel)


def tower_storeys(steel,worklamp):
    """Model the larger masses that read from across the port."""
    frame, bulbs = Batch(), Batch()
    ivory, web, shadow = "#a49d8d", "#78685a", "#38424a"
    # Deep platform fascias flank the open centre. A recessed face sits behind
    # their projecting top and bottom chords, with daylight between the piers.
    for x,y,w,d in [(105.7,68.9,31.3,6.4),(109,94.6,36.5,7.2),(92.8,81.2,5.6,18.6)]:
        frame.box((x,y,8.55),(w,d,2.92),"#434c50")
        frame.box((x,y,10.06),(w+.55,d+.52,.43),"#a8a59a")
        frame.box((x,y,7.23),(w+.35,d+.35,.42),"#616864")
        for j in range(int(w/2)):
            xx=x-w/2+1+j*2
            frame.box((xx,y-d/2-.085,8.56),(.17,.22,2.48),web)
        for side in (-1,1):
            frame.box((x+side*w*.31,y,6.62),(1.85,d-.46,1.2),shadow)
    # The service shaft and pipe racks occupy different sides of the lattice.
    frame.box((121.55,92.15,43.6),(3.82,4.4,68.8),"#555e62")
    for z in range(12,78,3):
        frame.box((123.51,92.15,z),(.16,4.25,.11),"#898579")
    for j in range(12):
        z=10.3+j*6.18
        front=83.35+(j/11)*1.33
        back=96.2-(j/11)*1.52
        left=113.95+(j/11)*.70
        right=125.35-(j/11)*1.12
        w,d=right-left,back-front
        xx,yy=(left+right)/2,(front+back)/2
        frame.box((xx,yy,z),(w,d,.31),"#797b72")
        frame.box((xx,front+.13,z-.49),(w,.43,.79),web)
        frame.box((right-.12,yy,z-.49),(.43,d,.79),web)
        for sy in (front+.16,back-.16):
            frame.box((xx,sy,z+1.04),(w,.10,.12),"#b5a381")
            for k in range(5):
                frame.box((left+k*w/4,sy,z+.52),(.10,.10,1.02),"#9b9380")
        for k in range(5):
            frame.box((right-.15,front+k*d/4,z+.52),(.10,.10,1.02),ivory)
        frame.box((right-.15,yy,z+1.04),(.11,d,.12),"#b5a381")
        if j in (0,2,4,7,9):
            # Alternating equipment rooms leave open galleries in silhouette.
            frame.box((right-2.12,yy+.5,z+2.0),(3.43,6.3,3.7),"#636b6a")
            for slot in range(6):
                frame.box((right-.37,yy-1.62+slot*.64,z+2.23),(.12,.26,1.8),shadow)
            frame.box((left+2.4,front+1.8,z+1.37),(3.16,2.0,2.4),"#a18b70")
        frame.box((right-.60,front+1.18,z-.72),(.96,1.88,.20),"#ad9878")
        bulbs.box((right-.60,front+1.18,z-.85),(.60,1.50,.08),"#ffd8a0")
        bulbs.box((xx+1,front-.10,z-.32),(1.04,.12,.25),"#f6c080")
        if j<11:
            next_front=front+.121
            for sx,shift in [(left,.063),(right,-.102)]:
                for sy,dy in [(front,.121),(back,-.138)]:
                    frame.rod((sx,sy,z),(sx+shift,sy+dy,z+6.18),.38,ivory,8)
            end_a,end_b=(left,right) if j%2 else (right,left)
            frame.rod((end_a,front,z+.40),(end_b,next_front,z+5.67),.29,web,6)
            frame.rod((right,front if j%2 else back,z+.40),
                      (right-.10,back if j%2 else next_front,z+5.69),.25,web,6)
    # Exposed risers and collars give the open face a thickness in profile.
    for j,r in enumerate((.38,.27,.17)):
        x=121.45+j*.83
        frame.pipe([(x,83.52,10.6),(x,83.52,19.6),(x,84.58,21.2),
                    (x,84.58,60.4),(x,85.42,61.62),(x,85.42,77.8-j*6.1)],r,
                   ["#b9baa9","#817e72","#ab805d"][j],10)
        for z in range(24,69-j*6,5):
            y=84.58 if z<62 else 85.42
            frame.rod((x,y,z),(x,y,z+.20),r+.09,shadow,10)
    frame.object("Tower service floors and launch platform",steel)
    bulbs.object("Tower gallery work lights",worklamp)


def install():
    steel = B.vmat("Gantry painted steel", .58, .36)
    parked_crane(steel)
    worklamp = B.mat("Gantry work lamps", "#fff0ce", emission="#ffc87b", emis_strength=2)
    tower_storeys(steel,worklamp)
    fixed, lights = Batch(), Batch()
    for label, z in [("lower", 43.), ("upper", 57.)]:
        half = 3.6 - 1.1*(z-6.6)/80
        x, y = 117-half, 88-half*.45
        angle = math.atan2(80-y, 102-x)
        length = math.hypot(102-x, 80-y) - (2.77 if label=="lower" else 2.48)
        # Leave the bearing on the tower when the covered passage swings away.
        fixed.box((x+.52,y,z-.46),(2.42,3.15,.48),"#62716f")
        fixed.rod((x,y,z-.70),(x,y,z+2.05),.34,"#657579",16)
        for h in (-.5,1.76):
            fixed.rod((x,y,z+h),(x,y,z+h+.19),.56,"#b8a479",16)
        arm, bulbs = Batch(), Batch()
        arm.box((length*.5,0,-.08),(length,2.03,.29),"#515d60")
        arm.box((length*.50,0,1.85),(length-.45,2.08,.14),"#83928e")
        for side in (-1,1):
            sy=side*.94
            for h in (.12,1.68):
                arm.box((length*.50,sy,h),(length,.16,.19),"#c89955" if h<1 else "#b0bbb5")
            for j in range(6):
                a=.45+(length-.95)*j/6
                b=.45+(length-.95)*(j+1)/6
                arm.rod((a,sy,.19),(a,sy,1.64),.075,"#85918d",6)
                arm.rod((a,sy,.20 if j%2 else 1.56),(b,sy,1.56 if j%2 else .20),.09,"#9aaba4",6)
            arm.pipe([(1,sy*1.15,.76),(2.8,sy*1.19,.42),(length-1.25,sy*1.19,.59),
                      (length-.56,sy*1.08,.78)],.075,"#485556")
        # Pleated dark surround and a dull rubber lip at the vehicle end.
        for i in range(4):
            ax=length-.70+i*.18
            for sy in (-.94,.94):
                arm.box((ax,sy,.88),(.12,.16,1.84),"#495354")
            arm.box((ax,0,1.72),(.12,1.96,.16),"#596566")
        for u in (.27,.72):
            bulbs.box((length*u,0,1.71),(1.18,.18,.10),"#ffe2ae")
        pivot=bpy.data.objects.new("Service hinge "+label,None)
        bpy.context.scene.collection.objects.link(pivot)
        pivot.location=(x,y,z);pivot.rotation_euler.z=angle
        for obj in [arm.object("Service passage "+label,steel),bulbs.object("Passage lamps "+label,worklamp)]:
            obj.parent=pivot
        lights.box((x+.4,y-1.41,z+.03),(.92,.15,.15),"#ffe2a1")
    # Landings and switchback stairs break the empty vertical cage into storeys.
    for j in range(6):
        level=26.6+j*5
        sy=84.35 if j%2 else 88.55
        dy=4.20 if j%2 else -4.20
        for k in range(17):
            u=k/16
            fixed.box((118.65,sy+dy*u,level+5*u),(1.75,.34,.14),"#798680")
        for sx in (117.85,119.45):
            fixed.rod((sx,sy,level-.18),(sx,sy+dy,level+4.82),.12,"#59676b",6)
            fixed.rod((sx,sy,level+.96),(sx,sy+dy,level+5.96),.077,"#c19d5c",7)
            for u in (0,.5,1):
                fixed.rod((sx,sy+dy*u,level+5*u),(sx,sy+dy*u,level+5*u+.96),.055,"#a7b3a4")
        fixed.box((118.65,sy,level-.12),(2.05,1.45,.23),"#727e7a")
    fixed.object("Gantry bearings and stair landings",steel)
    lights.object("Bearing marker lamps",worklamp)
