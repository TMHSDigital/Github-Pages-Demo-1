'use strict';
/**
 * Regenerates the README screenshots in docs/screenshots/ and the social card.
 * Run: npm ci && node scripts/screenshots.cjs
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

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

  const shot = async (name, { viewport, theme = 'light', at, action, dir = OUT, scale = 1.5, clip }) => {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, reducedMotion: 'reduce' });
    await ctx.addInitScript((t) => { try { localStorage.setItem('tmhs-theme', t); } catch { /* storage blocked */ } }, theme);
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (at) await page.evaluate((sel) => window.scrollTo(0, document.querySelector(sel).getBoundingClientRect().top + window.scrollY - 72), at);
    if (action) await action(page);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(dir, name), clip });
    await ctx.close();
    console.log('wrote', name);
  };

  const desk = { width: 1280, height: 780 };
  await shot('hero.png', { viewport: desk });
  await shot('hero-dark.png', { viewport: desk, theme: 'dark' });
  await shot('services.png', { viewport: { width: 1280, height: 720 }, at: '#services' });
  await shot('approach.png', { viewport: { width: 1280, height: 720 }, at: '#approach' });
  await shot('calculator.png', { viewport: { width: 1280, height: 900 }, at: '#tool-tabs' });
  await shot('calculator-dark.png', { viewport: { width: 1280, height: 900 }, at: '#tool-tabs', theme: 'dark', action: (p) => p.locator('#tab-cocktail').click() });
  await shot('work.png', { viewport: { width: 1280, height: 760 }, at: '#work' });
  await shot('contact.png', {
    viewport: { width: 1280, height: 900 }, at: '#contact',
    action: async (p) => {
      await p.locator('#tab-plate').click();
      await p.locator('#talk-numbers').click();
      await p.locator('.topics label', { hasText: 'Costs' }).click();
      await p.selectOption('#inq-venue', 'Independent restaurant');
      await p.evaluate(() => window.scrollTo(0, document.querySelector('#contact').offsetTop - 72));
    },
  });
  await shot('mobile.png', { viewport: { width: 390, height: 844 }, scale: 2 });
  await shot('mobile-menu.png', { viewport: { width: 390, height: 844 }, scale: 2, action: (p) => p.locator('.nav-toggle').click() });

  // Social card (1200x630) built from the hero scene
  await shot('og-image.png', {
    viewport: { width: 1200, height: 630 }, scale: 1, theme: 'dark', dir: path.join(ROOT, 'assets', 'images'),
    action: (p) => p.evaluate(() => {
      document.querySelector('.site-header').style.display = 'none';
      document.querySelector('.proof').style.display = 'none';
      document.querySelector('main').style.cssText = 'height:630px;overflow:hidden';
      document.querySelector('.hero').style.cssText = 'height:630px;padding:0;display:flex;align-items:center';
      document.querySelector('.hero-grid').style.paddingInline = '64px';
      document.querySelector('.hero-grid').style.width = '100%';
      document.querySelector('.hero h1').style.fontSize = '3.4rem';
      document.querySelector('.hero .lead').style.display = 'none';
      document.querySelector('.trust').style.display = 'none';
      document.querySelector('.btn-row').style.display = 'none';
    }),
  });

  // A social card per calculator page (rendered from docs/tool-card.html). The stat is the
  // page's worked example, so it matches what the calculator opens on.
  // Text and the worked-example result come from the tool registry (tools/tools.json)
  const CARDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tools.json'), 'utf8')).tools
    .map((t) => ({ slug: t.slug, title: t.card.title, em: 'calculator', tag: t.card.tag, stat: t.example.value, statLabel: t.card.statLabel }));
  for (const { slug, ...text } of CARDS) {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 } });
    const page = await ctx.newPage();
    await page.goto(base + 'docs/tool-card.html?' + new URLSearchParams(text), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(ROOT, 'assets', 'images', `og-${slug}.png`) });
    await ctx.close();
    console.log(`wrote og-${slug}.png`);
  }

  // App icons for the web app manifest (rendered from docs/icon.html): "any" is the logo on a
  // white rounded tile; "maskable" fills the square and keeps the logo in the central safe zone
  for (const [name, size, maskable] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true]]) {
    const ctx = await browser.newContext({ viewport: { width: size, height: size } });
    const page = await ctx.newPage();
    await page.goto(base + 'docs/icon.html' + (maskable ? '?maskable=1' : ''), { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(ROOT, 'assets', 'images', name), omitBackground: true });
    await ctx.close();
    console.log('wrote', name);
  }

  // README banner (rendered from docs/banner.html)
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 340 }, deviceScaleFactor: 1.5 });
    const page = await ctx.newPage();
    await page.goto(base + 'docs/banner.html', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, 'banner.png') });
    await ctx.close();
    console.log('wrote banner.png');
  }

  await browser.close();
  server.close();
})();
