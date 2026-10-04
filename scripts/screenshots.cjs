'use strict';
/**
 * Regenerates the README screenshots in docs/screenshots/.
 * Run: npm i --no-save playwright && node scripts/screenshots.cjs
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch({ channel: 'chrome' });

  const shot = async (name, viewport, fn, opts = {}) => {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (fn) await fn(page);
    await page.screenshot({ path: path.join(OUT, name), ...opts });
    await ctx.close();
    console.log('wrote', name);
  };

  await shot('hero.png', { width: 1280, height: 760 });
  await shot('services.png', { width: 1280, height: 760 }, (p) => p.evaluate(() => { document.querySelector('#services').scrollIntoView(); window.scrollBy(0, -20); }));
  await shot('approach.png', { width: 1280, height: 600 }, (p) => p.evaluate(() => { document.querySelector('#approach').scrollIntoView(); window.scrollBy(0, 0); }));
  await shot('mobile.png', { width: 390, height: 844 });
  await shot('mobile-menu.png', { width: 390, height: 844 }, (p) => p.locator('.nav-toggle').click());

  await browser.close();
  server.close();
})();
