import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
SP, OUT = sys.argv[1], sys.argv[2]
man=json.load(open(f'{SP}/shots/manifest.json'))
F='/usr/share/fonts/opentype/inter/'
font=ImageFont.truetype(F+'Inter-Regular.otf', 22); bold=ImageFont.truetype(F+'Inter-SemiBold.otf', 22)
def lock(d,x,y,col='#16a34a'):
    d.arc([x+3,y,x+15,y+14],180,360,fill=col,width=3); d.rounded_rectangle([x,y+8,x+18,y+22],radius=3,fill=col)
def frame(name, info):
    im=Image.open(f'{SP}/shots/{name}.png').convert('RGB')
    mobile = info['w'] < 600
    bar=64 if not mobile else 110
    W=im.width
    canvas=Image.new('RGB',(W, im.height+bar),'#dfe5ee'); d=ImageDraw.Draw(canvas)
    if not mobile:
        for i,c in enumerate(['#ff5f57','#febc2e','#28c840']): d.ellipse([20+i*26,24,36+i*26,40],fill=c)
        x0,x1=110,W-40
        d.rounded_rectangle([x0,13,x1,51],radius=19,fill='white',outline='#c9d2df')
        lock(d,x0+18,20)
        url=info['url']; scheme='https://'; rest=url[len(scheme):]; host=rest.split('/',1)[0]; path=rest[len(host):]
        x=x0+48
        d.text((x,20),scheme,font=font,fill='#6b7280'); x+=d.textlength(scheme,font=font)
        d.text((x,20),host,font=bold,fill='#111827'); x+=d.textlength(host,font=bold)
        d.text((x,20),path,font=font,fill='#6b7280')
    else:
        url=info['url'].replace('https://','')
        f2=ImageFont.truetype(F+'Inter-SemiBold.otf', 26)
        d.rounded_rectangle([24,30,W-24,84],radius=27,fill='white',outline='#c9d2df')
        tw=d.textlength(url,font=f2)
        if tw>W-110:
            url=url[:int(len(url)*(W-120)/tw)]+'…'; tw=d.textlength(url,font=f2)
        lock(d,int((W-tw)/2)-14,44); d.text(((W-tw)/2+14,42),url,font=f2,fill='#111827')
    canvas.paste(im,(0,bar))
    if not mobile and canvas.width>1280: canvas=canvas.resize((1280,int(canvas.height*1280/canvas.width)),Image.LANCZOS)
    if mobile and canvas.width>500: canvas=canvas.resize((canvas.width//2, canvas.height//2),Image.LANCZOS)
    r=16 if not mobile else 24; m=20
    mask=Image.new('L',canvas.size,0); ImageDraw.Draw(mask).rounded_rectangle([0,0,canvas.width-1,canvas.height-1],radius=r,fill=255)
    bg=Image.new('RGBA',(canvas.width+2*m,canvas.height+2*m),(0,0,0,0))
    sh=Image.new('RGBA',bg.size,(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle([m,m+5,m+canvas.width,m+canvas.height+5],radius=r,fill=(15,23,42,60))
    bg.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
    c=canvas.convert('RGBA'); c.putalpha(mask); bg.alpha_composite(c,(m,m))
    bg.save(f'{OUT}/{name}.png', optimize=True)
n=0
for name,info in man.items():
    if name.startswith(('x-','dbg')) or not os.path.exists(f'{SP}/shots/{name}.png'): continue
    frame(name,info); n+=1
for p in ['47-report-pdf-1','47-report-pdf-2']:
    Image.open(f'{SP}/shots/{p}.png').convert('RGB').save(f'{OUT}/{p}.png',optimize=True); n+=1
print(n)
