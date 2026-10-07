/**
 * Builds the branded client page for portal.fluentcpa.com.
 *
 * The questionnaire's look and behaviour live in ONE file, Index.html, in
 * the Apps Script project. This copies it, fills in the Apps Script web
 * app's /exec address, and writes index.html here. The page then runs on
 * portal.fluentcpa.com and talks to Apps Script in the background — no
 * Google address bar, no "created by an Apps Script user" banner, no
 * Google Sites box.
 *
 *   node build.js            (uses the address saved in api-url.txt)
 *
 * Re-run it, then commit and push this folder, whenever Index.html changes.
 * It refuses rather than guessing: a /dev address, a missing placeholder,
 * or anything left unfilled stops the build.
 */
const fs = require('fs');
const path = require('path');

const SRC = process.env.INDEX_SRC || path.join(__dirname, '..', 'fluent-portal', 'Index.html');
const OUT = path.join(__dirname, 'index.html');

function fail(msg) { console.error('BUILD REFUSED: ' + msg); process.exit(1); }

const api = (process.argv[2] || (fs.existsSync(path.join(__dirname, 'api-url.txt'))
  ? fs.readFileSync(path.join(__dirname, 'api-url.txt'), 'utf8') : '')).trim();
if (!api) fail('no web app address. Put the /exec URL in api-url.txt.');
if (/\/dev$/.test(api)) fail('that is the /dev address, which only editors can open. Use the /exec one.');
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(api)) {
  fail('"' + api + '" does not look like an Apps Script web app address (https://script.google.com/macros/s/.../exec).');
}
if (!fs.existsSync(SRC)) fail('cannot find ' + SRC);

let html = fs.readFileSync(SRC, 'utf8');
const need = { "'<?= apiUrl ?>'": "'" + api + "'", "'<?= urlToken ?>'": "''" };
for (const [k, v] of Object.entries(need)) {
  const n = html.split(k).length - 1;
  if (n !== 1) fail('expected exactly one ' + k + ' in Index.html, found ' + n + '. Index.html changed shape — check it.');
  html = html.replace(k, v);
}
if (html.indexOf('<?') !== -1) fail('Index.html still has an unfilled <? ... ?> placeholder.');

fs.writeFileSync(OUT, html);
if (!fs.existsSync(path.join(__dirname, 'CNAME'))) fs.writeFileSync(path.join(__dirname, 'CNAME'), 'portal.fluentcpa.com\n');
console.log('Built index.html (' + Math.round(html.length / 1024) + ' KB) -> ' + api);
