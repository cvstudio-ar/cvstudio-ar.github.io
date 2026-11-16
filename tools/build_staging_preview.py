#!/usr/bin/env python3
"""Build a read-only marketing preview from explicitly public CVStudio homepage resources."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import html
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "staging/cloudflare/public"
PUBLIC_DIRS = ("css/", "assets/images/", "assets/icons/", "assets/branding/", "assets/favicons/", "assets/fonts/")
PUBLIC_FILES = {"favicon.ico", "site.webmanifest"}
ALLOWED_SUFFIXES = {".css", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".woff", ".woff2", ".ico", ".webmanifest"}
MAX_FILE = 8 * 1024 * 1024
MAX_TOTAL = 50 * 1024 * 1024

def normalized(raw):
    val = html.unescape(raw.strip())
    parsed = urlsplit(val)
    if parsed.scheme or parsed.netloc or val.startswith(("//", "data:", "#")):
        return None
    path = unquote(parsed.path).lstrip("/")
    if ".." in Path(path).parts:
        return None
    if path not in PUBLIC_FILES and not path.startswith(PUBLIC_DIRS):
        return None
    src = ROOT / path
    if src.suffix.lower() not in ALLOWED_SUFFIXES or not src.is_file() or src.is_symlink():
        return None
    return path

def refs(text):
    for value in re.findall(r"""(?:src|href)\s*=\s*["']([^"']+)["']""", text, re.I):
        yield value
    for value in re.findall(r"""url\(\s*["']?([^)"']+)["']?\s*\)""", text, re.I):
        yield value

def build():
    raw = (ROOT / "index.html").read_text(encoding="utf-8")
    # Preview is intentionally read-only: remove tracking, APIs, account flows,
    # scripts, inline handlers, external form submissions and navigable links.
    cleaned = re.sub(r"<script\b[^>]*>.*?</script\s*>", "", raw, flags=re.I | re.S)
    cleaned = re.sub(r"<iframe\b[^>]*>.*?</iframe\s*>", "", cleaned, flags=re.I | re.S)
    cleaned = re.sub(r"<form\b[^>]*>", '<div class="preview-inert-form">', cleaned, flags=re.I)
    cleaned = re.sub(r"</form\s*>", "</div>", cleaned, flags=re.I)
    cleaned = re.sub(r"\s+on[a-z]+\s*=\s*(?:\"[^\"]*\"|'[^']*')", "", cleaned, flags=re.I)
    cleaned = re.sub(r'\s+(?:action|formaction)\s*=\s*(?:"[^"]*"|\'[^\']*\')', "", cleaned, flags=re.I)
    cleaned = re.sub(r'(<a\b[^>]*?)\s+href\s*=\s*(?:"[^"]*"|\'[^\']*\')', r'\1 href="#"', cleaned, flags=re.I)
    cleaned = re.sub(r'(<button\b)(?![^>]*\bdisabled\b)', r'\1 disabled', cleaned, flags=re.I)
    cleaned = re.sub(r'<meta\b[^>]*name=["\'](?:robots|googlebot)["\'][^>]*>', "", cleaned, flags=re.I)
    cleaned = re.sub(r'<link\b[^>]*rel=["\'](?:canonical|alternate|preconnect|dns-prefetch)["\'][^>]*>', "", cleaned, flags=re.I)
    insert = '''<meta name="robots" content="noindex,nofollow,noarchive">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; img-src 'self' data: https:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; base-uri 'none'">
<style>.cvstudio-staging-banner{position:fixed;z-index:2147483647;bottom:0;left:0;right:0;text-align:center;background:#12233e;color:white;font:600 13px system-ui;padding:9px;box-shadow:0 -2px 14px #0005}body{padding-bottom:36px!important}</style>'''
    cleaned = cleaned.replace("</head>", insert + "\n</head>", 1)
    cleaned = cleaned.replace("</body>", '<div class="cvstudio-staging-banner">VISTA PREVIA DE CVSTUDIO · SOLO DISEÑO · SIN FORMULARIOS NI PAGOS</div>\n</body>', 1)
    DEST.mkdir(parents=True, exist_ok=True)
    (DEST / "index.html").write_text(cleaned, encoding="utf-8")
    queue = list(refs(cleaned))
    # Process stylesheets before optional imagery to preserve the layout under the size budget.
    queue.sort(key=lambda item: 1 if urlsplit(item).path.lower().endswith('.css') else 0)
    done = set()
    total = 0
    skipped = []
    while queue:
        raw_ref = queue.pop()
        name = normalized(raw_ref)
        if not name or name in done:
            continue
        src = ROOT / name
        size = src.stat().st_size
        if size > MAX_FILE or total + size > MAX_TOTAL:
            skipped.append(name)
            continue
        dst = DEST / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)
        done.add(name)
        total += size
        if name.endswith(".css"):
            css = src.read_text(encoding="utf-8")
            # CSS relative image URLs resolve against the CSS directory.
            for ref in refs(css):
                if ref.startswith(("./", "../")):
                    p = Path(name).parent / ref.split("?")[0]
                    if ".." not in p.parts:
                        queue.append(str(p))
                else:
                    queue.append(ref)
    assert not (DEST / "js").exists()
    assert not (DEST / "config").exists()
    assert not (DEST / "supabase").exists()
    assert not (DEST / "centro-operaciones-prueba").exists()
    print(f"Read-only preview assembled with {len(done)} assets, {total} bytes; skipped {len(skipped)} oversized/budgeted assets; no JS or backend source.")

if __name__ == "__main__":
    build()
