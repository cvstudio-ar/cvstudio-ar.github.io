"""Export/import shared site configuration and media; never exports admin sessions.

Export: python transfer.py export --endpoint HTTPS_FUNCTION_URL --out satvico-backup
Import: set TARGET_SUPABASE_URL, TARGET_SUPABASE_SERVICE_KEY and
        SATVICO_ADMIN_PASSWORD in your environment, then:
        python transfer.py import --bundle satvico-backup
Apply satvico-sync.sql and deploy the Edge Function in the new project first.
"""
import argparse
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import urllib.parse
import urllib.request

BUCKET = 'satvico-public-media'


def request(url, data=None, method=None, headers=None):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    with urllib.request.urlopen(req, timeout=180) as response:
        return response.read()


def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from strings(child)


def remap(value, mapping):
    if isinstance(value, str):
        return mapping.get(value, value)
    if isinstance(value, dict):
        return {key: remap(child, mapping) for key, child in value.items()}
    if isinstance(value, list):
        return [remap(child, mapping) for child in value]
    return value


def export(endpoint, output):
    endpoint_url = urllib.parse.urlparse(endpoint)
    if endpoint_url.scheme != 'https':
        raise ValueError('Use an HTTPS endpoint.')
    settings = json.loads(request(endpoint))['settings']
    output.mkdir(parents=True, exist_ok=False)
    (output / 'media').mkdir()
    marker = '/storage/v1/object/public/' + BUCKET + '/'
    manifest = []
    for index, url in enumerate(sorted(set(strings(settings)))):
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != 'https' or parsed.netloc != endpoint_url.netloc or not parsed.path.startswith(marker):
            continue
        raw = request(url)
        ext = Path(parsed.path).suffix
        name = f'{index:04d}{ext}'
        (output / 'media' / name).write_bytes(raw)
        manifest.append({'url': url, 'file': name, 'sha256': hashlib.sha256(raw).hexdigest()})
    (output / 'settings.json').write_text(json.dumps(settings, ensure_ascii=False, indent=2))
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    print(f'Exported configuration and {len(manifest)} uploaded files. Copy the static site folder separately.')


def restore(bundle):
    base = os.environ['TARGET_SUPABASE_URL'].rstrip('/')
    secret = os.environ['TARGET_SUPABASE_SERVICE_KEY']
    password = os.environ['SATVICO_ADMIN_PASSWORD']
    if len(password) < 12:
        raise ValueError('Use a new client password with at least 12 characters.')
    if urllib.parse.urlparse(base).scheme != 'https':
        raise ValueError('Use an HTTPS target project URL.')
    headers = {'apikey': secret, 'Authorization': 'Bearer ' + secret}
    manifest = json.loads((bundle / 'manifest.json').read_text())
    mapping = {}
    for item in manifest:
        if Path(item['file']).name != item['file']:
            raise ValueError('Invalid media file path.')
        raw = (bundle / 'media' / item['file']).read_bytes()
        if hashlib.sha256(raw).hexdigest() != item['sha256']:
            raise ValueError('Media checksum mismatch.')
        path = 'migracion/' + item['sha256'] + Path(item['file']).suffix
        mime = mimetypes.guess_type(item['file'])[0] or 'application/octet-stream'
        request(base + '/storage/v1/object/' + BUCKET + '/' + path, raw, 'POST',
                {**headers, 'Content-Type': mime, 'x-upsert': 'true'})
        mapping[item['url']] = base + '/storage/v1/object/public/' + BUCKET + '/' + path
    settings = remap(json.loads((bundle / 'settings.json').read_text()), mapping)
    request(base + '/rest/v1/satvico_sync_settings?id=eq.1',
            json.dumps({'settings': settings, 'revision': 1}).encode(), 'PATCH',
            {**headers, 'Content-Type': 'application/json'})
    credential = {'username': 'Satvico', 'password_hash': hashlib.sha256(password.encode()).hexdigest()}
    request(base + '/rest/v1/satvico_sync_credentials?on_conflict=username',
            json.dumps(credential).encode(), 'POST',
            {**headers, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates'})
    print('Imported configuration and media. Update sync-config.js and allowed origins, then verify both devices.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    exp = commands.add_parser('export')
    exp.add_argument('--endpoint', required=True)
    exp.add_argument('--out', type=Path, required=True)
    imp = commands.add_parser('import')
    imp.add_argument('--bundle', type=Path, required=True)
    args = parser.parse_args()
    if args.command == 'export':
        export(args.endpoint, args.out)
    else:
        restore(args.bundle)
