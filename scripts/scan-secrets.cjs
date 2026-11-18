'use strict';
/**
 * Conservative secret leak check for CVStudio's tracked source.
 * This does NOT replace GitHub secret scanning or secret rotation.
 * No candidate secret value is printed to logs.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const patterns = [
  ['Private key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{18,}\b/],
  ['GitHub legacy token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ['GitHub fine-grained token', /\bgithub_pat_[A-Za-z0-9_]{50,}\b/],
  ['Stripe live secret', /\bsk_live_[A-Za-z0-9]{20,}\b/],
  ['OpenAI API key', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b/],
  ['AWS access key ID', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['Cloudflare API token assignment', /\b(?:CLOUDFLARE_API_TOKEN|CF_API_TOKEN)\s*[:=]\s*["']([A-Za-z0-9_-]{25,})["']/],
];

const tracked = execFileSync('git', ['ls-files', '-z'], {maxBuffer: 32 * 1024 * 1024})
  .toString('utf8').split('\0').filter(Boolean);
const hits = [];
let scanned = 0;
for (const name of tracked) {
  const full = path.resolve(name);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
  // Static binary media should not be passed through a text secret detector.
  if (/\.(?:png|jpe?g|webp|gif|svgz|ico|pdf|woff2?|ttf|otf|mp[34]|wav|ogg|zip|7z|rar|gz|br|webm)$/i.test(name)) continue;
  if (fs.statSync(full).size > 3 * 1024 * 1024) continue;
  const buf = fs.readFileSync(full);
  if (buf.includes(0)) continue;
  const content = buf.toString('utf8');
  scanned++;
  for (const [label, expression] of patterns) {
    if (expression.test(content)) hits.push({file: name, rule: label});
  }
}
if (hits.length) {
  for (const hit of hits) console.error('Blocked possible secret: ' + hit.file + ' (' + hit.rule + ')');
  console.error('Review and rotate any exposed credential; removing a file does not remove it from Git history.');
  process.exit(1);
}
console.log('Secret leak preflight passed; text files checked: ' + scanned);
