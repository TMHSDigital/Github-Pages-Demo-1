'use strict';
/**
 * Browser checks: layout, keyboard, theme, every calculator, contact, embed, print, the
 * published build and accessibility (axe). Each area lives in tests/browser/<area>.cjs and
 * exports async ({ check, base, browser, ... }) => { ... }. Areas run in parallel, each in its
 * own browser contexts on one shared Chrome; checks within an area run in order.
 *
 * Run:   npm test                         every area, on the source
 *        npm test -- tracker breakeven    only the areas whose file name contains an argument
 *        npm run test:build               every area, on the staged build (SITE_DIR=_site)
 * Env:   VERBOSE=1         print the full failure message, not just its first line
 *        SMOKE_WORKERS=n   how many areas run at once (default 4; 1 runs them one by one)
 * Uses the system Chrome (channel "chrome"); no browser download needed.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

// Serves the source tree by default; set SITE_DIR=_site to test the staged build.
const ROOT = process.env.SITE_DIR ? path.resolve(process.env.SITE_DIR) : path.resolve(__dirname, '..');
const TOOL_SLUGS = fs.readdirSync(path.join(ROOT, 'tools')).filter((s) => fs.existsSync(path.join(ROOT, 'tools', s, 'index.html')));
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
// From the tool registry: each calculator page and the worked-example result it should open on
const TOOL_PAGES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'tools.json'), 'utf8')).tools
  .map((t) => ({ slug: t.slug, tool: t.key, out: t.example.selector, value: t.example.value }));

const AREAS_DIR = path.join(__dirname, 'browser');
const ALL = fs.readdirSync(AREAS_DIR).filter((f) => f.endsWith('.cjs')).map((f) => f.replace(/\.cjs$/, '')).sort();
const wanted = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const areas = ALL.filter((a) => !wanted.length || wanted.some((w) => a.includes(w)));
if (!areas.length) {
  console.log(`No test area matches "${wanted.join(' ')}". Areas: ${ALL.join(', ')}`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, rel);
  if (rel.endsWith('/')) file = path.join(file, 'index.html'); // directory URLs serve their index.html, as on GitHub Pages
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch({ channel: 'chrome' });

  // A fresh context on the home page, collecting console and page errors
  const open = async (viewport, extra = {}) => {
    const ctx = await browser.newContext({ viewport, ...extra });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    return { ctx, page, errors };
  };
  // A fresh context with reduced motion and a clipboard stub (copies land in window.__copied)
  const STUB_CLIPBOARD = () => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { window.__copied = t; } } });
  const calm = async (viewport, extra = {}) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', ...extra });
    await ctx.addInitScript(STUB_CLIPBOARD);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    return { ctx, page, errors };
  };

  const runArea = async (area) => {
    const results = [];
    const check = async (name, fn) => {
      try { await fn(); results.push(['PASS', name]); }
      catch (e) { results.push(['FAIL', `${name}: ${process.env.VERBOSE ? e.message : e.message.split('\n')[0]}`]); }
    };
    const started = Date.now();
    try {
      await require(path.join(AREAS_DIR, area + '.cjs'))({ browser, base, check, open, calm, AXE, ROOT, TOOL_SLUGS, TOOL_PAGES, STUB_CLIPBOARD });
    } catch (e) {
      results.push(['FAIL', `${area}: the area stopped early: ${e.message.split('\n')[0]}`]);
    }
    return { area, results, seconds: (Date.now() - started) / 1000 };
  };

  // Run areas in parallel, a few at a time; report them in a stable order
  const workers = Math.max(1, Number(process.env.SMOKE_WORKERS) || 4);
  // biggest areas first, so the slowest one does not start last and set the total time
  const size = (a) => fs.statSync(path.join(AREAS_DIR, a + '.cjs')).size;
  const queue = [...areas].sort((a, b) => size(b) - size(a));
  const done = [];
  await Promise.all(Array.from({ length: Math.min(workers, queue.length) }, async () => {
    while (queue.length) done.push(await runArea(queue.shift()));
  }));

  await browser.close();
  server.close();

  let total = 0;
  let failed = 0;
  for (const { area, results, seconds } of done.sort((a, b) => areas.indexOf(a.area) - areas.indexOf(b.area))) {
    console.log(`\n${area} (${results.length} checks, ${seconds.toFixed(1)}s)`);
    for (const [status, name] of results) {
      total++;
      if (status === 'FAIL') failed++;
      console.log(`${status}  ${name}`);
    }
  }
  console.log(`\n${total - failed}/${total} passed`);
  process.exit(failed ? 1 : 0);
})();
