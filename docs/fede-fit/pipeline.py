#!/usr/bin/env python3
"""Fede FIT: deterministic cards, resumable generation and guarded catalog updates."""
import argparse, hashlib, json, re, subprocess, sys
from pathlib import Path
from tempfile import TemporaryDirectory
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

def render(source, name, group, target, crop=None):
    with Image.open(source) as im:
        im=ImageOps.exif_transpose(im).convert('RGB')
        if crop is not None:
            left, top, right, bottom = crop
            if not (0 <= left < right <= im.width and 0 <= top < bottom <= im.height):
                raise ValueError(f"Recorte fuera de la fotografía: {source}")
            im = im.crop((left, top, right, bottom))
        photo=ImageOps.contain(im,(340,247),Image.Resampling.LANCZOS)
    canvas=Image.new('RGB',(340,320),'#090d0a'); canvas.paste(photo,((340-photo.width)//2,(247-photo.height)//2))
    d=ImageDraw.Draw(canvas); d.rectangle((17,251,22,290),fill='#adff00')
    f,lines=wrap(d,name.upper(),24,299)
    lineheight=max(12,min(22,f.size+1)); top=248 if len(lines)>1 else 260
    for i,line in enumerate(lines): d.text((32,top+i*lineheight),line,font=f,fill='white')
    badge=group.upper(); bf=font(18)
    while d.textlength(badge,font=bf)>278: bf=font(bf.size-1)
    bw=max(105,int(d.textlength(badge,font=bf))+20)
    d.rounded_rectangle((32,296,32+bw,317),radius=10,fill='#adff00')
    d.text((32+bw/2,306.5),badge,font=bf,fill='#090d0a',anchor='mm')
    canvas.save(target,'WEBP',quality=92,method=6)

CATALOG_FILES = ("fit-catalog-images.js", "fit-catalog-progress.json", "index.html")
PUBLIC_URL = "https://cvstudio.com.ar/fede-aguirre/editor/"
SEX_FIELDS = {"masculino": "male", "femenino": "female"}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    write_file(path, (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode())


def write_file(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(data)
    temporary.replace(path)


def load(root):
    editor = root / "fede-aguirre/editor"
    prefix, catalog = read_catalog(editor / CATALOG_FILES[0])
    progress = json.loads((editor / CATALOG_FILES[1]).read_text(encoding="utf-8"))
    pending = []
    for sex, field in SEX_FIELDS.items():
        rows = progress[field]
        if len(rows) != progress["catalogSize"] or len({row["id"] for row in rows}) != len(rows):
            raise SystemExit(f"Tamaño o IDs inconsistentes en {sex}")
        for row in rows:
            entry = catalog.get(row["id"], {}).get(sex, {})
            if entry.get("file") != row["file"]:
                raise SystemExit(f"Vinculación inconsistente: {sex}/{row['id']}")
            if row["status"] != "ready":
                pending.append({**row, "sex": sex})
    return editor, prefix, catalog, progress, pending


def key(row):
    return f"{row['sex']}/{row['id']}"


def plan(args, pending, editor):
    rows = [row for row in pending if (not args.sex or row["sex"] == args.sex)
            and (not args.group or row["group"] == args.group)]
    if args.select:
        by_key = {key(row): row for row in rows}
        selected = list(dict.fromkeys(args.select.split(",")))
        if len(selected) > args.limit or any(item not in by_key for item in selected):
            raise SystemExit("La selección excede el límite o contiene ejercicios no pendientes")
        rows = [by_key[item] for item in selected]
    html = (editor / "index.html").read_text(encoding="utf-8")
    match = re.search(r"\bconst EXERCISES\s*=\s*(?=\[)", html)
    if not match:
        raise SystemExit("No se encontró la lista de ejercicios en index.html")
    exercises, _ = json.JSONDecoder().raw_decode(html[match.end():])
    details = {item["sourceId"]: item for item in exercises}
    rows = [{**row, "reference": f"references/{row['sex']}.png", "pose": POSES.get(row["id"]),
             "englishName": details[row["id"]]["englishName"], "equipment": details[row["id"]]["equipment"]}
            for row in rows[:args.limit]]
    path = args.work / "plan.json"
    if path.exists():
        raise SystemExit(f"La tanda ya tiene un plan: {path}")
    write_json(path, rows)
    print(json.dumps(rows, ensure_ascii=False, indent=2))


def source_fingerprint(path):
    with Image.open(path) as source:
        photo = ImageOps.exif_transpose(source).convert("L")
        pixels = photo.resize((9, 8), Image.Resampling.LANCZOS).tobytes()
    bits = (pixels[y * 9 + x] > pixels[y * 9 + x + 1] for y in range(8) for x in range(8))
    return int("".join("1" if bit else "0" for bit in bits), 2)


def prepare(args, editor, progress):
    manifest = {}
    prior = {}
    crop_file = args.work / "crops.json"
    crops = json.loads(crop_file.read_text(encoding="utf-8")) if crop_file.exists() else {}
    ready_assets = {row["file"] for field in SEX_FIELDS.values() for row in progress[field]
                    if row["status"] == "ready"}
    ready_hashes = {digest((editor / "exercise-assets" / name).read_bytes()): name for name in ready_assets}
    entries = sorted(args.work.parent.glob("*/publication.json"))
    for path in entries:
        for item, entry in json.loads(path.read_text(encoding="utf-8"))["images"].items():
            prior[item] = entry["photo"]
    for row in json.loads((args.work / "plan.json").read_text(encoding="utf-8")):
        item = key(row)
        source = args.work / "sources" / (item + ".png")
        if not source.is_file():
            continue
        source_hash = digest(source.read_bytes())
        if source_hash in ready_hashes:
            print(f"Original ya habilitado: {item} / {ready_hashes[source_hash]}", file=sys.stderr)
            continue
        fingerprint = source_fingerprint(source)
        duplicate = next((other for other, value in prior.items()
                          if other != item and (fingerprint ^ int(value, 16)).bit_count() <= 4), None)
        if duplicate:
            print(f"Revisar posible duplicado: {item} / {duplicate}", file=sys.stderr)
            continue
        prior[item] = f"{fingerprint:016x}"
        card = args.work / "cards" / (item + ".webp")
        card.parent.mkdir(parents=True, exist_ok=True)
        render(source, row["name"], row["group"], card, crops.get(item))
        card_hash = digest(card.read_bytes())
        if card_hash in ready_hashes:
            print(f"Tarjeta ya habilitada: {item} / {ready_hashes[card_hash]}", file=sys.stderr)
            continue
        manifest[item] = {**row, "sha256": card_hash,
                          "sourceSha256": source_hash, "photo": prior[item]}
    write_json(args.work / "manifest.json", manifest)
    if manifest:
        preview = Image.new("RGB", (340 * 3, 320 * ((len(manifest) + 2) // 3)))
        for index, item in enumerate(manifest):
            with Image.open(args.work / "cards" / (item + ".webp")) as card:
                preview.paste(card, (340 * (index % 3), 320 * (index // 3)))
        preview.save(args.work / "preview.png")
    print(f"Tarjetas preparadas: {len(manifest)}")


def collect_cards(args, editor, pending):
    manifest = json.loads((args.work / "manifest.json").read_text(encoding="utf-8"))
    review = json.loads((args.work / "review.json").read_text(encoding="utf-8"))
    by_key = {key(row): row for row in pending}
    approved = {item: verdict for item, verdict in review.items() if verdict["approved"]}
    if not 1 <= len(approved) <= args.limit:
        raise SystemExit("La tanda requiere entre 1 y 12 fotografías verificadas")
    accepted = {}
    for item, verdict in approved.items():
        row = by_key.get(item)
        entry = manifest.get(item)
        if not row or not entry or any(entry[field] != row[field] for field in row):
            raise SystemExit(f"El catálogo cambió o el ejercicio no está preparado: {item}")
        card = args.work / "cards" / (item + ".webp")
        source = args.work / "sources" / (item + ".png")
        data = card.read_bytes()
        if (digest(data) != entry["sha256"] or verdict["sha256"] != entry["sha256"]
                or digest(source.read_bytes()) != entry["sourceSha256"]):
            raise SystemExit(f"El archivo revisado cambió: {item}")
        with Image.open(card) as image:
            if image.size != (340, 320) or image.format != "WEBP":
                raise SystemExit(f"Formato inválido: {item}")
            image.load()
        name = f"{row['id']}--{row['sex']}--auto-{entry['sha256'][:12]}.webp"
        target = editor / "exercise-assets" / name
        if target.exists():
            raise SystemExit(f"El destino ya existe: {target}")
        accepted[item] = (row, entry, data, name)
    return accepted


def apply_batch(args, editor, prefix, catalog, progress, pending):
    journal = args.work / "publication.json"
    relative_paths = [str((editor / path).relative_to(args.root)) for path in CATALOG_FILES]
    if run("git", "status", "--porcelain", "--", *relative_paths, cwd=args.root):
        raise SystemExit("Hay cambios locales en los archivos del catálogo")
    accepted = collect_cards(args, editor, pending)
    html = (editor / "index.html").read_text(encoding="utf-8")
    version = digest("".join(entry["sha256"] for _, entry, _, _ in accepted.values()).encode())[:12]
    html, count = re.subn(r"""(fit-catalog-images\.js\?v=)[^"']+""", lambda match: match[1] + version, html)
    if count != 1:
        raise SystemExit("Se esperaba una versión del catálogo en index.html")
    changes = {}
    published = {}
    for item, (row, entry, data, name) in accepted.items():
        catalog.setdefault(row["id"], {})[row["sex"]] = {
            "file": name, "label": "REFERENCIA", "provisional": False,
        }
        progress_row = next(value for value in progress[SEX_FIELDS[row["sex"]]] if value["id"] == row["id"])
        progress_row.update(file=name, status="ready")
        changes[f"exercise-assets/{name}"] = data
        published[item] = {"file": name, "sha256": entry["sha256"], "photo": entry["photo"]}
    head = run("git", "rev-parse", "HEAD", cwd=args.root)
    progress["updatedFrom"] = head
    changes[CATALOG_FILES[0]] = (prefix + json.dumps(catalog, ensure_ascii=False, indent=2) + ";\n").encode()
    changes[CATALOG_FILES[1]] = (json.dumps(progress, ensure_ascii=False, indent=2) + "\n").encode()
    changes[CATALOG_FILES[2]] = html.encode()
    previous = {}
    files = {}
    for path, data in changes.items():
        target = editor / path
        name = target.relative_to(args.root).as_posix()
        previous[name] = digest(target.read_bytes()) if target.is_file() else None
        files[name] = digest(data)
        write_file(args.work / "publication-files" / name, data)
    publication = {"version": version, "base": head, "images": published,
                   "files": files, "previous": previous}
    write_json(journal, publication)
    finish_batch(args, publication)


def finish_batch(args, publication):
    updates = []
    version = publication["version"]
    for name, expected in publication["files"].items():
        target = args.root / name
        current = digest(target.read_bytes()) if target.is_file() else None
        if current == expected:
            continue
        previous = publication.get("previous", {})
        if name not in previous or current != previous[name]:
            raise SystemExit(f"Cambió un archivo de la tanda {version}: {name}")
        data = (args.work / "publication-files" / name).read_bytes()
        if digest(data) != expected:
            raise SystemExit(f"Cambió la copia de publicación de {name}")
        updates.append((target, data))
    for target, data in updates:
        write_file(target, data)
    published = publication["images"]
    print(f"Catálogo actualizado con {len(published)} referencias. Versión {version}.")


def deploy(args):
    path = args.work / "publication.json"
    publication = json.loads(path.read_text(encoding="utf-8"))
    if run("git", "branch", "--show-current", cwd=args.root) != "main":
        raise SystemExit("El despliegue requiere main")
    files = publication["files"]
    if any(digest((args.root / name).read_bytes()) != sha for name, sha in files.items()):
        raise SystemExit("El contenido de la tanda cambió")
    if not publication.get("commit"):
        subject = f"Fede FIT: publicar {len(publication['images'])} referencias ({publication['version']})"
        head = run("git", "rev-parse", "HEAD", cwd=args.root)
        base = publication.get("base", head)
        if head == base:
            docs = ["docs/fede-fit/pipeline.py", "docs/fede-fit/README.md"] if args.include_pipeline else []
            paths = [*files, *docs]
            run("git", "add", "--", *paths, cwd=args.root)
            run("git", "commit", "--only", "-m", subject, "--", *paths, cwd=args.root)
        elif (run("git", "show", "-s", "--format=%P", "HEAD", cwd=args.root) != base
              or run("git", "show", "-s", "--format=%s", "HEAD", cwd=args.root) != subject
              or any(digest(subprocess.check_output(["git", "show", f"HEAD:{name}"], cwd=args.root)) != sha
                     for name, sha in files.items())):
            raise SystemExit("main cambió desde que se preparó la tanda")
        publication["commit"] = run("git", "rev-parse", "HEAD", cwd=args.root)
        write_json(path, publication)
    if run("git", "rev-parse", "HEAD", cwd=args.root) != publication["commit"]:
        raise SystemExit("La tanda dejó de ser el último commit de main")
    print(run("git", "push", "origin", "HEAD:refs/heads/main", cwd=args.root))
    print(f"Commit publicado: {publication['commit']}")


def verify(args):
    path = args.work / "publication.json"
    publication = json.loads(path.read_text(encoding="utf-8"))
    version = publication["version"]
    curl = ["curl.exe" if sys.platform == "win32" else "curl", "--fail", "--silent",
            "--show-error", "--location", "--max-time", "20"]
    html = subprocess.check_output([*curl, f"{PUBLIC_URL}?v={version}"])
    if f"fit-catalog-images.js?v={version}".encode() not in html:
        raise SystemExit(f"Tanda todavía no publicada: {version}")
    resources = {name.removeprefix("fede-aguirre/editor/"): sha for name, sha in publication["files"].items()
                 if name != "fede-aguirre/editor/index.html"}
    with TemporaryDirectory(dir=args.work) as directory:
        files = {name: Path(directory) / str(i) for i, name in enumerate(resources)}
        command = [*curl, "--parallel", "--parallel-max", "8", "--fail-early"]
        for name, target in files.items():
            command.extend(("--output", str(target), f"{PUBLIC_URL}{name}?v={version}"))
        subprocess.run(command, check=True)
        for name, target in files.items():
            if digest(target.read_bytes()) != resources[name]:
                raise SystemExit(f"Contenido distinto en producción: {name}")
    publication["verified"] = True
    write_json(path, publication)
    print(f"Despliegue verificado: {version}, {len(publication['images'])} imágenes")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["status", "plan", "prepare", "publish", "deploy", "verify"])
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--work", type=Path)
    parser.add_argument("--sex", choices=SEX_FIELDS)
    parser.add_argument("--group")
    parser.add_argument("--select")
    parser.add_argument("--include-pipeline", action="store_true")
    parser.add_argument("--limit", type=int, choices=range(1, 13), default=12)
    args = parser.parse_args()
    args.root = args.root.resolve()
    if args.command != "status":
        if not args.work:
            parser.error("--work es obligatorio para una tanda")
        args.work = args.work.resolve()
        private_root = args.root / "private" / "fede-fit"
        if args.work.is_relative_to(args.root) and not args.work.is_relative_to(private_root):
            parser.error("--work debe quedar en private/fede-fit o fuera del repositorio")
    if args.command == "deploy":
        deploy(args)
        return
    if args.command == "verify":
        verify(args)
        return
    if args.command == "publish" and (journal := args.work / "publication.json").exists():
        finish_batch(args, json.loads(journal.read_text(encoding="utf-8")))
        return
    editor, prefix, catalog, progress, pending = load(args.root)
    if args.command == "status":
        for sex, field in SEX_FIELDS.items():
            rows = progress[field]
            print(sex, {status: sum(row["status"] == status for row in rows)
                        for status in ("ready", "pending", "review")})
    elif args.command == "plan":
        plan(args, pending, editor)
    elif args.command == "prepare":
        prepare(args, editor, progress)
    else:
        apply_batch(args, editor, prefix, catalog, progress, pending)


if __name__ == "__main__":
    main()
