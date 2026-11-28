#!/usr/bin/env python3
"""Fede FIT: deterministic cards, resumable generation and guarded catalog updates."""
import argparse, hashlib, io, json, os, re, subprocess, sys
from pathlib import Path
from urllib.request import urlopen
from PIL import Image, ImageDraw, ImageFont, ImageOps

POSES = {
 'meadows-row': 'One-arm Meadows row: staggered stance perpendicular to a landmine barbell, one hand grips the thick free sleeve just beyond the plates in an overhand grip, the other forearm rests on the front thigh. Hinge forward; pull with one arm only. Show the anchored opposite end.',
 'renegade-row': 'High plank on toes, feet wide, one hand supported on a hex dumbbell on the floor, the other hand rows a second hex dumbbell toward the ribs. Straight body, hips square, no bench.',
 'band-row': 'Seated on the floor with legs extended, elastic resistance band looped securely around both feet, both hands pull the band toward waist, elbows back; no cables or weights.',
 'reverse-grip-barbell-row': 'Bent-over free straight barbell row, both palms face forward/up in a clearly SUPINATED underhand grip, elbows close, straight back hinged forward. Front three-quarter angle makes palms visible.',
 'reverse-hyperextension': 'Face down on a horizontal elevated bench, pelvis supported on edge, both legs extend together behind her horizontally; grip the bench with hands. Torso supported, legs move, not a back extension.',
 'reverse-snow-angels': 'Lying face down flat on a mat, no weights, legs on floor, arms hovering just above floor out to sides during a sweeping snow angel movement. High camera angle, full body visible.',
 'reverse-grip-lat-pulldown': 'Seated lat pulldown with thigh pads, straight cable bar held with both palms facing her, narrow shoulder-width UNDERHAND supinated grip. Bar drawn to upper chest; front three-quarter view shows palms. Not a pull-up.',
 'seal-row': 'Face down, whole torso supported on an elevated perfectly HORIZONTAL flat bench, two separate dumbbells hanging under shoulders and pulled toward ribs. No barbell, no incline bench.',
 'shrugs': 'Standing upright, holding a free straight barbell across front of thighs with both arms straight, shoulders raised toward ears. No dumbbells and no Smith rails.',
 'smith-machine-bent-over-row': 'Standing hinged forward, knees slightly bent, both hands pulling a straight bar toward waist. Bar is visibly attached to vertical guide rails of a Smith machine; not a free barbell.',
 'smith-machine-shrug': 'Standing upright with arms straight, shoulders elevated, both hands gripping the Smith machine straight bar in front of thighs. Bar ends visibly attached to vertical guide rails.',
 'superman': 'Lying face down on a mat, both arms straight overhead, both legs extended, arms and legs gently lifted from mat together. Side three-quarter view. No weights or equipment.',
 'superman-pulldown': 'Lying face down on a mat, chest slightly raised, both legs extended and gently raised; elbows bent and drawn down toward ribs like a lat pulldown, empty hands. No weights or cable.',
 'suspension-row': 'Holding two TRX suspension strap handles anchored overhead, body leaning backward in a straight line from shoulders to heels, feet on floor, elbows bent pulling chest toward handles. Both straps visible.',
 'table-inverted-row': 'Under a sturdy table, gripping its edge with both hands, heels on floor, straight body, pulling chest upward toward table edge. Table clearly visible, no gym bar or TRX.',
 'towel-row': 'Seated on floor, legs extended, a long towel looped around both feet, hands hold towel ends and pull toward ribs, resisting with feet. No resistance band, no cable machine.',
 'upright-row': 'Standing upright with free straight barbell in both hands, overhand grip, pulling bar vertically toward lower chest, elbows leading to sides. No dumbbells or cable.',
 'wide-grip-pull-up': 'Unassisted pull-up on fixed straight horizontal overhead bar, hands in wide overhand grip, elbows bent, chin near or above bar, feet clear of floor. No pulldown machine.'
}

def run(*args,cwd=None):
    return subprocess.check_output(args,cwd=cwd,text=True).strip()

def read_catalog(path):
    text=path.read_text(encoding='utf-8'); start=text.index('{'); end=text.rindex('}')
    return text[:start],json.loads(text[start:end+1])

def font(size):
    for p in ['/usr/share/fonts/truetype/liberation/LiberationSansNarrow-Bold.ttf','/usr/share/fonts/truetype/liberation2/LiberationSansNarrow-Bold.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf','C:/Windows/Fonts/arialbd.ttf']:
        if Path(p).is_file(): return ImageFont.truetype(p,size)
    return ImageFont.load_default(size=size)

def wrap(draw,text,size,width):
    f=font(size); words=text.split(); lines=[]; line=''
    for word in words:
        candidate=(line+' '+word).strip()
        if line and draw.textlength(candidate,font=f)>width: lines.append(line); line=word
        else: line=candidate
    if line: lines.append(line)
    if len(lines)>2 or any(draw.textlength(l,font=f)>width for l in lines):
        return wrap(draw,text,size-1,width) if size>10 else (f,[text])
    return f,lines

def render(source, name, group, target):
    with Image.open(source) as im:
        im=ImageOps.exif_transpose(im).convert('RGB')
        # No stretching, no cropped hands or equipment. Fill empty side margins dark.
        photo=ImageOps.contain(im,(340,247),Image.Resampling.LANCZOS)
    canvas=Image.new('RGB',(340,320),'#090d0a'); canvas.paste(photo,((340-photo.width)//2,(247-photo.height)//2))
    d=ImageDraw.Draw(canvas); d.rectangle((17,251,22,290),fill='#adff00')
    f,lines=wrap(d,name.upper(),24,299)
    lineheight=max(12,min(23,f.size+1)); top=250 if len(lines)>1 else 261
    for i,line in enumerate(lines): d.text((32,top+i*lineheight),line,font=f,fill='white')
    badge=group.upper(); bf=font(18)
    while d.textlength(badge,font=bf)>278: bf=font(bf.size-1)
    bw=max(105,int(d.textlength(badge,font=bf))+20)
    d.rounded_rectangle((32,296,32+bw,317),radius=10,fill='#adff00')
    d.text((32+bw/2,306.5),badge,font=bf,fill='#090d0a',anchor='mm')
    canvas.save(target,'WEBP',quality=92,method=6)

def load(root,sex,group):
    editor=root/'fede-aguirre/editor'; progress=json.loads((editor/'fit-catalog-progress.json').read_text(encoding='utf-8'))
    key='female' if sex=='femenino' else 'male'; rows=[r for r in progress[key] if r['group']==group]
    if not rows: raise SystemExit('Categoría no encontrada')
    prefix,cat=read_catalog(editor/'fit-catalog-images.js')
    return editor,progress,rows,prefix,cat

def prompt_for(row,sex):
    person='an adult athletic woman' if sex=='femenino' else 'an adult athletic man'
    pose=POSES.get(row['id'])
    if not pose: raise ValueError('Falta descripción técnica para '+row['id'])
    return ('One photorealistic exercise demonstration photograph, '+person+', wearing black training clothes with a small white FA logo, dark gym with subtle lime lighting. '+pose+' Show whole pose and relevant equipment, centered, no other people. No words, graphics, numbers, diagrams, collage or borders. Horizontal composition.')

def generate(row,sex,source,model):
    from runwayml import RunwayML
    if not os.environ.get('RUNWAYML_API_SECRET'): raise SystemExit('Falta RUNWAYML_API_SECRET en el entorno; no se inició ninguna generación.')
    client=RunwayML(max_retries=0)
    task=client.text_to_image.create(model=model,ratio='1360:768',prompt_text=prompt_for(row,sex)).wait_for_task_output(timeout=600)
    url=task.output[0]
    if not url.startswith('https://'): raise ValueError('URL inválida')
    with urlopen(url,timeout=60) as response: raw=response.read(15_000_001)
    if len(raw)>15_000_000: raise ValueError('Archivo demasiado grande')
    with Image.open(io.BytesIO(raw)) as im: im.verify()
    source.write_bytes(raw)

def prepare(args,rows):
    args.work.mkdir(parents=True,exist_ok=True); cards=args.work/'cards'; cards.mkdir(exist_ok=True)
    sources=args.work/'sources'; sources.mkdir(exist_ok=True)
    manifest_path=args.work/'manifest.json'; old=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    if any(m['sex']!=args.sex or m['group']!=args.group for m in old.values()): raise SystemExit('Usar una carpeta de trabajo distinta por modelo y categoría.')
    queue=[r for r in rows if r['status']!='ready' and r['id'] not in old and (args.command=='generate' or (sources/(r['id']+'.png')).exists())][:args.limit]
    for row in queue:
        id=row['id']; src=sources/(id+'.png')
        if not src.exists():
            if args.command!='generate': continue
            if id not in POSES: print('Sin descripción:',id); continue
            try: generate(row,args.sex,src,args.model)
            except Exception as e: print(f'No generada {id}: {type(e).__name__}',file=sys.stderr); continue
        out=cards/(id+'.webp'); render(src,row['name'],row['group'],out)
        old[id]={'sex':args.sex,'group':row['group'],'name':row['name'],'previous_file':row['file'],'previous_status':row['status'],'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
        manifest_path.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    selected=[id for id,entry in old.items() if entry['sex']==args.sex and entry['group']==args.group and (cards/(id+'.webp')).exists()]
    if selected:
        sheet=Image.new('RGB',(4*340,((len(selected)+3)//4)*320),'#090d0a')
        for i,id in enumerate(selected):
            with Image.open(cards/(id+'.webp')) as im: sheet.paste(im,(i%4*340,i//4*320))
        sheet.save(args.work/'preview.png')
    print('Candidatas preparadas:',', '.join(selected)); print('No se modificó el catálogo ni la web.')

def publish(args,editor,progress,rows,prefix,cat):
    if not args.approve: raise SystemExit('Indicar IDs revisados con --approve. No se publican automáticamente posturas no verificadas.')
    if run('git','status','--porcelain',cwd=args.root): raise SystemExit('Repositorio con cambios locales: no se modifica.')
    if args.push and run('git','branch','--show-current',cwd=args.root)!='main': raise SystemExit('La publicación requiere main')
    ids=list(dict.fromkeys(args.approve.split(','))); manifest=json.loads((args.work/'manifest.json').read_text()); staged=[]
    for id in ids:
        row=next((r for r in rows if r['id']==id),None); m=manifest.get(id); f=args.work/'cards'/(id+'.webp')
        if not row or not m or not f.is_file() or row['status']=='ready': raise SystemExit('No pendiente o no preparado: '+id)
        if m['sex']!=args.sex or m['group']!=args.group or m['previous_file']!=row['file'] or m['previous_status']!=row['status']: raise SystemExit('Catálogo cambió: '+id)
        previous=cat.get(id,{}).get(args.sex)
        if (previous or {}).get('file')!=row['file']: raise SystemExit('Vinculación inconsistente: '+id)
        data=f.read_bytes(); digest=hashlib.sha256(data).hexdigest()
        if digest!=m['sha256']: raise SystemExit('Hash cambiado: '+id)
        with Image.open(f) as im:
            if im.size!=(340,320) or im.format!='WEBP': raise SystemExit('Formato inválido: '+id)
            im.verify()
        name=f'{id}--{args.sex}--auto-{digest[:12]}.webp'; dest=editor/'exercise-assets'/name
        if dest.exists() and dest.read_bytes()!=data: raise SystemExit('Colisión de archivo: '+id)
        staged.append((row,id,name,dest,data))
    index=editor/'index.html'; html=index.read_text(encoding='utf-8')
    version=hashlib.sha256(''.join(x[2] for x in staged).encode()).hexdigest()[:12]
    updated,n=re.subn(r'(fit-catalog-images\.js\?v=)[^"\']+',lambda m:m[1]+version,html,count=1)
    if n!=1: raise SystemExit('No se encontró la versión del catálogo')
    files=[]
    for row,id,name,dest,data in staged:
        dest.write_bytes(data); files.append(dest); row.update(status='ready',file=name); cat.setdefault(id,{})[args.sex]={'file':name,'label':'REFERENCIA','provisional':False}
    progress['updatedFrom']=run('git','rev-parse','HEAD',cwd=args.root)
    for f,content in [(editor/'fit-catalog-images.js',prefix+json.dumps(cat,ensure_ascii=False,indent=2)+';\n'),(editor/'fit-catalog-progress.json',json.dumps(progress,ensure_ascii=False,indent=2)+'\n'),(index,updated)]: f.write_text(content,encoding='utf-8'); files.append(f)
    run('git','add','--',*[str(f.relative_to(args.root)) for f in files],cwd=args.root)
    run('git','commit','-m',f'Fede FIT: {len(ids)} referencias {args.group} {args.sex}',cwd=args.root)
    if args.push: print(run('git','push','origin','main',cwd=args.root))
    print('Commit:',run('git','rev-parse','HEAD',cwd=args.root)); print('Habilitadas:',sum(r['status']=='ready' for r in rows),'/',len(rows)); print('Verificar despliegue público por separado.')

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('command',choices=['plan','prepare','generate','publish']); ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2]); ap.add_argument('--work',type=Path); ap.add_argument('--sex',choices=['masculino','femenino'],default='femenino'); ap.add_argument('--group',default='ESPALDA'); ap.add_argument('--limit',type=int,choices=range(1,13),default=12); ap.add_argument('--model',choices=['gen4_image'],default='gen4_image'); ap.add_argument('--approve'); ap.add_argument('--push',action='store_true'); args=ap.parse_args(); args.root=args.root.resolve(); args.work=(args.work or Path.home()/'fede-fit-candidates'/args.sex/re.sub(r'[^a-zA-Z0-9]+','-',args.group.lower())).resolve()
    if args.command!='plan' and args.work.is_relative_to(args.root): raise SystemExit('La carpeta de trabajo debe estar fuera del repositorio.')
    editor,progress,rows,prefix,cat=load(args.root,args.sex,args.group)
    if args.command=='plan':
        for row in rows:
            if row['status']!='ready': print(row['id'],row['name'],row['status'],sep=' | ')
        print('Listas:',sum(r['status']=='ready' for r in rows),'/',len(rows)); return
    if args.command in ('prepare','generate'): prepare(args,rows)
    else: publish(args,editor,progress,rows,prefix,cat)

if __name__=='__main__': main()
