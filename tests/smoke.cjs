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
    assert.match(await page.evaluate(() => document.activeElement.className), /nav-toggle/);
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
        const ring = el.closest('.money') ? getComputedStyle(el.closest('.money')) : cs; // inputs show the ring on their wrapper
        return { tag: el.tagName, text: (el.textContent || '').trim().slice(0, 20), width: ring.outlineWidth, style: ring.outlineStyle, visible: el.getClientRects().length > 0 };
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

  // axe-core WCAG 2.x A/AA at three widths, in both themes, and with reduced motion
  for (const [w, h, extra, theme] of [[375, 800, {}, 'light'], [375, 800, {}, 'dark'], [1280, 900, {}, 'light'], [1280, 900, {}, 'dark'], [1280, 900, { reducedMotion: 'reduce' }, 'light']]) {
    await check(`axe WCAG A/AA: 0 violations at ${w}px, ${theme} theme${extra.reducedMotion ? ', reduced motion' : ''}`, async () => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...extra });
      await ctx.addInitScript((t) => { try { localStorage.setItem('tmhs-theme', t); } catch (e) {} }, theme);
      const page = await ctx.newPage();
      await page.goto(base, { waitUntil: 'networkidle' });
      // scroll through so every reveal has played before scanning
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1100)); });
      await page.evaluate(AXE);
      const res = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
      assert.deepEqual(res.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`), []);
      await ctx.close();
    });
  }

  // Theme toggle
  await check('theme toggle switches, persists and updates aria-pressed', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    const btn = page.locator('#theme-toggle');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
    assert.equal(await btn.getAttribute('aria-pressed'), 'false');
    await btn.click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    assert.equal(await btn.getAttribute('aria-pressed'), 'true');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    assert.equal(await page.evaluate(() => localStorage.getItem('tmhs-theme')), 'dark');
    await ctx.close();
  });

  await check('follows the system theme until a choice is saved', async () => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    await ctx.close();
  });

  // Content stays visible without JS and with reduced motion
  await check('content is visible with JavaScript disabled', async () => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base);
    assert.equal(await page.locator('#services h2').isVisible(), true);
    const opacity = await page.locator('#services .tile').first().evaluate((el) => getComputedStyle(el).opacity);
    assert.equal(opacity, '1');
    await ctx.close();
  });

  // Calculator
  await check('calculator math and bands (pure functions)', async () => {
    const { page, ctx } = await open({ width: 1280, height: 900 });
    const r = await page.evaluate(() => ({
      pct: TMHSCalc.primeCostPct(31, 32), left: TMHSCalc.leftoverPct(31, 32, 12), money: TMHSCalc.parseMoney('$1,234,567.89'),
      capped: TMHSCalc.parseMoney('99999999999'), bad: TMHSCalc.parseMoney('abc'),
      bands: [59, 60, 64, 65, 69, 70].map((n) => TMHSCalc.band(n).key),
    }));
    assert.equal(r.pct, 63); assert.equal(r.left, 25); assert.equal(r.money, 1234567); assert.equal(r.capped, 10000000); assert.equal(r.bad, 0);
    assert.deepEqual(r.bands, ['strong', 'target', 'target', 'watch', 'watch', 'attention']);
    await ctx.close();
  });

  await check('calculator updates the readout, band and live summary', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.fill('#calc-revenue', '200000');
    await page.locator('#calc-food').fill('40');
    await page.locator('#calc-labor').fill('35');
    await page.locator('#calc-other').fill('10');
    assert.equal(await page.locator('#out-prime-pct').textContent(), '75%');
    assert.equal(await page.locator('#out-prime-usd').textContent(), '$150,000');
    assert.equal(await page.locator('#out-left-usd').textContent(), '$30,000');
    assert.equal(await page.locator('#out-band').textContent(), 'Needs attention');
    await page.waitForTimeout(600);
    assert.match(await page.locator('#out-summary').textContent(), /Prime cost is 75%, needs attention\./);
    assert.equal(await page.locator('#calc-revenue').inputValue(), '200,000');
    await page.fill('#calc-revenue', '');
    await page.waitForTimeout(600);
    assert.match(await page.locator('#out-summary').textContent(), /Enter your monthly sales/);
    await ctx.close();
  });

  await check('calculator is keyboard operable (slider arrow keys)', async () => {
    const { page, ctx } = await open({ width: 1280, height: 900 });
    await page.locator('#calc-food').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#calc-food').inputValue(), '32');
    assert.equal(await page.locator('#calc-food-out').textContent(), '32%');
    await ctx.close();
  });

  // Marquee pause control
  await check('marquee can be paused and resumed', async () => {
    const { page, ctx } = await open({ width: 1280, height: 900 });
    const btn = page.locator('#marquee-toggle');
    await btn.click();
    assert.equal(await btn.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#marquee').evaluate((el) => el.classList.contains('is-paused')), true);
    assert.equal(await page.locator('.marquee-track').evaluate((el) => getComputedStyle(el).animationPlayState), 'paused');
    await btn.click();
    assert.equal(await btn.getAttribute('aria-pressed'), 'false');
    await ctx.close();
  });

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
