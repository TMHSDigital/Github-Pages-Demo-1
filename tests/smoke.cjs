'use strict';
/**
 * Smoke, keyboard and accessibility checks.
 * Run: npm i --no-save playwright axe-core && node tests/smoke.cjs
 * Uses the system Chrome (channel "chrome"); no browser download needed.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const results = [];
async function check(name, fn) {
  try { await fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', `${name}: ${e.message.split('\n')[0]}`]); }
}

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch({ channel: 'chrome' });

  const open = async (viewport, extra = {}) => {
    const ctx = await browser.newContext({ viewport, ...extra });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    return { ctx, page, errors };
  };

  // Layout and console
  for (const [w, h] of [[375, 800], [768, 900], [1280, 900]]) {
    await check(`no horizontal overflow and no console errors at ${w}px`, async () => {
      const { ctx, page, errors } = await open({ width: w, height: h });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, 'page scrolls horizontally');
      assert.deepEqual(errors, []);
      await ctx.close();
    });
  }

  // Keyboard: skip link is the first tab stop and works
  await check('skip link is first tab stop and moves focus to main', async () => {
    const { ctx, page } = await open({ width: 1280, height: 900 });
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => location.hash), '#main');
    await ctx.close();
  });

  // Mobile menu: toggle, Escape, focus return, link click closes
  await check('mobile menu opens, closes on Escape and returns focus', async () => {
    const { ctx, page } = await open({ width: 375, height: 800 });
    const toggle = page.locator('.nav-toggle');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await toggle.focus();
    await page.keyboard.press('Enter');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('#nav').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('#nav').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.className), 'nav-toggle');
    await ctx.close();
  });

  await check('mobile menu link closes the menu and scrolls to section', async () => {
    const { ctx, page } = await open({ width: 375, height: 800 });
    await page.locator('.nav-toggle').click();
    await page.locator('#nav a[href="#services"]').click();
    assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => location.hash), '#services');
    await ctx.close();
  });

  // FAQ is keyboard operable
  await check('FAQ items toggle with the keyboard', async () => {
    const { ctx, page } = await open({ width: 1280, height: 900 });
    const first = page.locator('#faq details').first();
    await first.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await first.evaluate((d) => d.open), true);
    await page.keyboard.press('Space');
    assert.equal(await first.evaluate((d) => d.open), false);
    await ctx.close();
  });

  // Every interactive element has a visible focus indicator
  await check('focusable elements show a focus outline', async () => {
    const { ctx, page } = await open({ width: 1280, height: 900 });
    const bad = [];
    const count = await page.evaluate(() => document.querySelectorAll('a[href], button, summary').length);
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        const cs = getComputedStyle(el);
        return { tag: el.tagName, text: (el.textContent || '').trim().slice(0, 20), width: cs.outlineWidth, style: cs.outlineStyle, visible: el.getClientRects().length > 0 };
      });
      if (info.tag !== 'BODY' && info.visible && (info.style === 'none' || parseFloat(info.width) < 2)) bad.push(`${info.tag} "${info.text}"`);
    }
    assert.equal(bad.length, 0, 'no outline on: ' + bad.join(', '));
    await ctx.close();
  });

  // Heading outline and landmarks
  await check('one h1, no skipped heading levels, one main landmark', async () => {
    const { ctx, page } = await open({ width: 1280, height: 900 });
    const levels = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]));
    assert.equal(levels.filter((l) => l === 1).length, 1);
    levels.reduce((prev, l) => { assert.ok(l - prev <= 1, `heading jumps h${prev} -> h${l}`); return l; }, 1);
    assert.equal(await page.locator('main').count(), 1);
    await ctx.close();
  });

  // axe-core WCAG 2.x A/AA at three widths and with reduced motion
  for (const [w, h, extra] of [[375, 800, {}], [1280, 900, {}], [1280, 900, { reducedMotion: 'reduce' }]]) {
    await check(`axe WCAG A/AA: 0 violations at ${w}px${extra.reducedMotion ? ' (reduced motion)' : ''}`, async () => {
      const { ctx, page } = await open({ width: w, height: h }, extra);
      await page.evaluate(AXE);
      const res = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
      assert.deepEqual(res.violations.map((v) => `${v.id} (${v.nodes.length})`), []);
      await ctx.close();
    });
  }

  // 404 page renders styled from a nested path (uses <base>); served here from a rewrite
  await check('404 page has noindex and a link home', async () => {
    const { ctx, page } = await open({ width: 1280, height: 900 });
    await page.goto(base + '404.html');
    assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex');
    assert.ok(await page.locator('a[href="./"]').count());
    await ctx.close();
  });

  await browser.close();
  server.close();

  let failed = 0;
  for (const [status, name] of results) { if (status === 'FAIL') failed++; console.log(`${status}  ${name}`); }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
