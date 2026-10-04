'use strict';
/**
 * Keeps the calculator pages (tools/<slug>/index.html) in step with the home page.
 * The icon sprite, header, footer and each tool's markup live once, in index.html,
 * between <!-- sync:NAME --> and <!-- /sync:NAME --> markers. This copies every block a
 * tool page asks for (by having the same markers), adjusted for the page's location:
 * links and images point back up to the site root, and a tool panel loses the tab wiring.
 * Everything outside the markers (title, metadata, explainer copy) is edited in the page.
 *
 * Run: node scripts/sync-tool-pages.cjs           (rewrite the pages)
 *      node scripts/sync-tool-pages.cjs --check   (fail if a page is out of date; used in CI)
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TOOLS = path.join(ROOT, 'tools');
const check = process.argv.includes('--check');

const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const BLOCK = /<!-- sync:([\w-]+) -->\n([\s\S]*?)[ \t]*<!-- \/sync:\1 -->/g;

const blocks = {};
for (const [, name, body] of read(path.join(ROOT, 'index.html')).matchAll(BLOCK)) blocks[name] = body;

// A page two levels down (tools/<slug>/) reaches the root through ../../
const relocate = (html, up) => html
  .replace(/(<a class="(?:brand|foot-brand)"[^>]*?href=")#top"/g, `$1${up}"`) // logos go home
  .replace(/(<a\b[^>]*?\bhref=")(?!#top"|https?:|mailto:|\/|\.\.\/)/g, `$1${up}`)
  .replace(/(<img\b[^>]*?\bsrc=")(?!https?:|data:|\/|\.\.\/)/g, `$1${up}`);

const forPage = (name, body, up) => {
  let out = relocate(body, up);
  // A tool on its own page is not a tab panel
  if (name.startsWith('tool-')) out = out.replace(/(<div class="calc[^"]*" id="[\w-]+") role="tabpanel" aria-labelledby="tab-[\w-]+"( hidden)?>/, '$1>');
  return out;
};

let stale = 0;
for (const slug of fs.readdirSync(TOOLS)) {
  const file = path.join(TOOLS, slug, 'index.html');
  if (!fs.existsSync(file)) continue;
  const before = read(file);
  const up = '../'.repeat(path.relative(ROOT, path.dirname(file)).split(path.sep).length);
  const after = before.replace(BLOCK, (all, name) => {
    if (!(name in blocks)) throw new Error(`${path.relative(ROOT, file)}: index.html has no sync:${name} block`);
    const indent = /^[ \t]*/.exec(all.slice(all.indexOf('\n') + 1))[0];
    return `<!-- sync:${name} -->\n${forPage(name, blocks[name], up)}${indent}<!-- /sync:${name} -->`;
  });
  if (after === before) continue;
  stale++;
  if (check) console.log(`out of date: ${path.relative(ROOT, file)}`);
  else { fs.writeFileSync(file, after); console.log(`updated ${path.relative(ROOT, file)}`); }
}

if (check && stale) {
  console.log('\nRun `node scripts/sync-tool-pages.cjs` and commit the result.');
  process.exit(1);
}
if (!stale) console.log('tool pages are in sync');
