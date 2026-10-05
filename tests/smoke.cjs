'use strict';
/**
 * Smoke, keyboard and accessibility checks.
 * Run: npm ci && npm test
 * Staged build: npm run test:build
 * Uses the system Chrome (channel "chrome"); no browser download needed.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// Serves the source tree by default; set SITE_DIR=_site to test the staged build.
const ROOT = process.env.SITE_DIR ? path.resolve(process.env.SITE_DIR) : path.resolve(__dirname, '..');
const TOOL_SLUGS = fs.readdirSync(path.join(ROOT, 'tools')).filter((s) => fs.existsSync(path.join(ROOT, 'tools', s, 'index.html')));
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };

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

const results = [];
async function check(name, fn) {
  try { await fn(); results.push(['PASS', name]); }
  catch (e) { results.push(['FAIL', `${name}: ${process.env.VERBOSE ? e.message : e.message.split('\n')[0]}`]); } // VERBOSE=1 for the full message
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
      await ctx.addInitScript((t) => { try { localStorage.setItem('tmhs-theme', t); } catch { /* storage blocked */ } }, theme);
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
    // the switch may run inside a view transition, so wait for it to land
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', null, { timeout: 3000 });
    assert.equal(await btn.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.querySelector('meta[name="theme-color"]').content), '#0A1226');
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
    assert.equal(await page.locator('#calc-food-in').inputValue(), '32%');
    await ctx.close();
  });

  await check('prime cost takes P&L dollar amounts and decimal percentages (#35)', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    // dollars from the P&L, typed before the sales figure changes, stay dollars
    await page.locator('#calc-food-in').fill('$31,240');
    await page.locator('#calc-labor-in').fill('33980');
    await page.locator('#calc-other-in').fill('12.5%');
    await page.locator('#calc-other-in').blur();
    assert.equal(await page.locator('#calc-food-in').inputValue(), '$31,240');
    assert.equal(await page.locator('#calc-labor-in').inputValue(), '$33,980');
    assert.equal(await page.locator('#calc-other-in').inputValue(), '12.5%');
    assert.equal(await page.locator('#calc-food-alt').textContent(), '31.2% of sales');
    assert.equal(await page.locator('#calc-other-alt').textContent(), '$12,500 a month');
    assert.equal(await page.locator('#out-prime-pct').textContent(), '65.2%');
    assert.equal(await page.locator('#out-band').textContent(), 'Watch closely');
    // the slider follows to the nearest whole point and announces the exact share
    assert.equal(await page.locator('#calc-food').inputValue(), '31');
    assert.equal(await page.locator('#calc-food').getAttribute('aria-valuetext'), '31.2% of sales');
    // a new sales figure re-reads the dollar lines as shares of it
    await page.locator('#calc-revenue').fill('130,000');
    assert.equal(await page.locator('#calc-food-alt').textContent(), '24% of sales');
    assert.equal(await page.locator('#out-prime-pct').textContent(), '50.1%');
    assert.match(await page.locator('#wi-gap').textContent(), /Already there/);
    // dragging a slider makes that line a percentage again
    await page.locator('#calc-food').fill('30');
    assert.equal(await page.locator('#calc-food-in').inputValue(), '30%');
    // shared links keep dollar lines as dollars
    const link = await page.evaluate(() => window.TMHSTools.shareUrl());
    assert.match(link, /food=30&labor_usd=33980&other=12\.5/);
    const second = await ctx.newPage();
    await second.goto(link, { waitUntil: 'networkidle' });
    assert.equal(await second.locator('#calc-labor-in').inputValue(), '$33,980');
    assert.equal(await second.locator('#out-prime-pct').textContent(), '56.1%');
    // the message builder spells out both
    await second.locator('#inq-calc').check();
    assert.match(await second.locator('#inq-preview').textContent(), /labor 26\.1% \(\$33,980\)/);
    // nothing usable typed: the field goes back to the value in use
    await page.locator('#calc-labor-in').fill('abc');
    await page.locator('#calc-labor-in').blur();
    assert.equal(await page.locator('#calc-labor-in').inputValue(), '$33,980');
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  // Header: one visible call to action per layout, shadow after scrolling
  await check('header shows one call to action on desktop and moves it into the menu on mobile', async () => {
    let { page, ctx } = await open({ width: 1280, height: 900 });
    assert.equal(await page.locator('.header-cta').isVisible(), true);
    assert.equal(await page.locator('.nav-cta').isVisible(), false);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForFunction(() => document.querySelector('.site-header').classList.contains('is-scrolled'));
    await ctx.close();
    ({ page, ctx } = await open({ width: 390, height: 844 }));
    assert.equal(await page.locator('.header-cta').isVisible(), false);
    await page.locator('.nav-toggle').click();
    assert.equal(await page.locator('.nav-cta').isVisible(), true);
    await ctx.close();
  });

  await check('without JavaScript the mobile nav links are reachable and dead controls are hidden', async () => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(base);
    assert.equal(await page.locator('#nav a[href="#services"]').isVisible(), true);
    assert.equal(await page.locator('.nav-toggle').isVisible(), false);
    assert.equal(await page.locator('#theme-toggle').isVisible(), false);
    await ctx.close();
  });

  await check('structured data is valid JSON-LD for the business', async () => {
    const { page, ctx } = await open({ width: 1280, height: 900 });
    const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    assert.equal(data['@type'], 'ProfessionalService');
    assert.equal(data.name, 'TM Hospitality Strategies');
    assert.ok(Array.isArray(data.sameAs) && data.sameAs.length >= 2);
    await ctx.close();
  });

  await check('calculator keeps the caret in place while formatting and resets to the example', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    const input = page.locator('#calc-revenue');
    await input.click();
    await input.evaluate((el) => el.setSelectionRange(1, 1)); // "1|00,000"
    await page.keyboard.type('5');
    assert.equal(await input.inputValue(), '1,500,000');
    assert.equal(await input.evaluate((el) => el.selectionStart), 3); // caret stays after the typed 5
    await page.locator('#calc-food').fill('45');
    await page.locator('#calc-reset').click();
    assert.equal(await input.inputValue(), '100,000');
    assert.equal(await page.locator('#calc-food').inputValue(), '31');
    assert.equal(await page.locator('#out-prime-pct').textContent(), '63%');
    await ctx.close();
  });

  await check('shorthand sales, decimal commas and caps show the value actually used', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    // "120k" and "1.5m" can be typed key by key, update live and are tidied on leaving the field
    const input = page.locator('#calc-revenue');
    await input.fill('');
    await input.pressSequentially('120k');
    assert.equal(await input.inputValue(), '120k');
    assert.equal(await page.locator('#out-prime-usd').textContent(), '$75,600');
    await page.keyboard.press('Tab');
    assert.equal(await input.inputValue(), '120,000');
    await input.fill('');
    await input.pressSequentially('1.5m');
    await page.keyboard.press('Tab');
    assert.equal(await input.inputValue(), '1,500,000');
    // dots grouping thousands are thousands, not cents (#34)
    await input.fill('120.000');
    assert.equal(await page.locator('#out-prime-usd').textContent(), '$75,600');
    await page.keyboard.press('Tab');
    assert.equal(await input.inputValue(), '120,000');
    // a negative amount is explained and left as typed, not silently made positive
    await input.fill('-5000');
    assert.match(await page.locator('#calc-revenue-issue').textContent(), /negative/);
    assert.equal(await input.getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('#out-prime-usd').textContent(), '$0');
    await page.keyboard.press('Tab');
    assert.equal(await input.inputValue(), '-5000');
    await input.fill('100,000');
    assert.equal(await page.locator('#calc-revenue-issue').textContent(), '');
    assert.equal(await input.getAttribute('aria-invalid'), null);
    // a decimal comma is a decimal point, and an over-cap amount shows the capped value it is costed at
    await page.locator('#tab-plate').click();
    const cost = page.locator('#plate-rows [data-k="cost"]').first();
    await cost.fill('4,20');
    assert.equal(await page.locator('#plate-out-cost').textContent(), '$6.20');
    await page.keyboard.press('Tab');
    assert.equal(await cost.inputValue(), '4.20');
    await cost.fill('6000');
    await page.keyboard.press('Tab');
    assert.equal(await cost.inputValue(), '1000.00');
    assert.equal(await page.locator('#plate-out-cost').textContent(), '$1,002.00');
    // the shared link reopens exactly what is on screen
    const link = await page.evaluate(() => window.TMHSTools.shareUrl());
    await page.goto(link, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#plate-rows [data-k="cost"]').first().inputValue(), '1000.00');
    assert.equal(await page.locator('#plate-out-cost').textContent(), '$1,002.00');
    await ctx.close();
  });

  await check('content stays visible if main.js fails to load', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.route('**/js/main.js', (route) => route.abort());
    await page.goto(base);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const hidden = await page.$$eval('[data-reveal]', (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length);
    assert.equal(hidden, 0, `${hidden} sections stayed hidden`);
    await ctx.close();
  });

  await check('mobile menu moves focus into the links and closes on an outside click', async () => {
    const { page, ctx } = await open({ width: 390, height: 844 });
    await page.locator('.nav-toggle').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '#about');
    await page.mouse.click(200, 700);
    assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
    await ctx.close();
  });

  await check('calculator explains when costs reach 100% of sales', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#calc-food').fill('50');
    await page.locator('#calc-labor').fill('45');
    await page.locator('#calc-other').fill('10');
    await page.waitForTimeout(600);
    assert.equal(await page.locator('#out-left-usd').textContent(), '$0');
    assert.match(await page.locator('#out-summary').textContent(), /add up to 105% of sales, so nothing is left/);
    await ctx.close();
  });

  // WCAG 1.4.10 reflow (400% zoom = 320px, 200% = 640px) and 1.4.12 text spacing
  const SPACING = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';
  for (const [w, h, spacing] of [[320, 700, false], [640, 900, false], [320, 700, true], [1280, 900, true]]) {
    await check(`reflow at ${w}px${spacing ? ' with WCAG text spacing' : ''}: nothing scrolls sideways or is cut off`, async () => {
      // text spacing is applied the way a user extension would, so the site's CSP does not apply to it
      const { page, ctx } = await open({ width: w, height: h }, { bypassCSP: true });
      if (spacing) await page.addStyleTag({ content: SPACING });
      await page.waitForTimeout(150);
      const r = await page.evaluate(() => ({
        over: document.documentElement.scrollWidth - innerWidth,
        offscreen: [...document.querySelectorAll('main *, header *, footer *')]
          .filter((el) => { const rc = el.getBoundingClientRect(); return rc.width && rc.right > innerWidth + 1 && !el.closest('.marquee, .scene, .nav'); })
          .slice(0, 5).map((el) => el.tagName + '.' + el.className),
      }));
      assert.equal(r.over, 0, 'page scrolls horizontally');
      assert.deepEqual(r.offscreen, []);
      await ctx.close();
    });
  }

  await check('sliders announce their value as a percent of sales', async () => {
    const { page, ctx } = await open({ width: 1280, height: 900 });
    assert.equal(await page.locator('#calc-labor').getAttribute('aria-valuetext'), '32% of sales');
    await page.locator('#calc-labor').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#calc-labor').getAttribute('aria-valuetext'), '31% of sales');
    await ctx.close();
  });

  await check('web app manifest is linked from every page, valid, and its icons exist at their stated sizes (#44)', async () => {
    const pngSize = (file) => { const b = fs.readFileSync(file); return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`; };
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
    assert.equal(manifest.display, 'standalone');
    assert.ok(manifest.icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512'));
    for (const icon of manifest.icons) assert.equal(pngSize(path.join(ROOT, icon.src)), icon.sizes, icon.src);
    for (const s of manifest.shortcuts) assert.ok(fs.existsSync(path.join(ROOT, s.url, 'index.html')), s.url);
    for (const page of ['', ...TOOL_SLUGS.map((s) => `tools/${s}/`)]) {
      const html = fs.readFileSync(path.join(ROOT, page, 'index.html'), 'utf8');
      const href = /<link rel="manifest" href="([^"]+)">/.exec(html);
      assert.ok(href, `${page || 'home'}: no manifest link`);
      assert.ok(fs.existsSync(path.join(ROOT, page, href[1])), `${page || 'home'}: manifest link does not resolve`);
    }
    // only the published build registers the service worker
    assert.equal(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('name="tmhs-sw"'), Boolean(process.env.SITE_DIR));
  });

  if (process.env.SITE_DIR) {
    await check('published build works offline once visited, including shared links (#44)', async () => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.evaluate(() => navigator.serviceWorker.ready);
      await ctx.setOffline(true);
      await page.goto(`${base}tools/pour-cost-calculator/?tool=cocktail&rows=Gin_30_750_2&target=25&price=12`, { waitUntil: 'load' });
      assert.equal(await page.locator('#cocktail-rows .row').count(), 1);
      assert.equal(await page.locator('#cocktail-out-price').textContent(), '$11.06'); // ($2.37 gin + $0.40 garnish) at 25%
      await page.goto(base + 'tools/prime-cost-calculator/', { waitUntil: 'load' });
      assert.equal(await page.locator('#out-prime-pct').textContent(), '63%');
      assert.equal(await page.evaluate(() => document.fonts.check('600 16px Fraunces')), true);
      await page.goto(base, { waitUntil: 'load' });
      assert.equal(await page.locator('#tab-prime').isVisible(), true);
      assert.deepEqual(errors, []);
      await ctx.close();
    });
  }

  // The published build carries a hash-based CSP; nothing on the page may violate it
  if (process.env.SITE_DIR) {
    await check('published build has a Content-Security-Policy with no violations', async () => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await ctx.addInitScript(() => {
        window.__csp = [];
        document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
      });
      const page = await ctx.newPage();
      await page.goto(base, { waitUntil: 'networkidle' });
      assert.ok(await page.locator('meta[http-equiv="Content-Security-Policy"]').count(), 'CSP meta missing');
      // exercise the interactive parts
      await page.locator('#theme-toggle').click();
      await page.locator('#calc-food').fill('40');
      await page.locator('#tab-cocktail').click();
      await page.locator('#cocktail-add').click();
      await page.locator('#talk-numbers').click();
      await page.locator('.topics label').first().click();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      assert.deepEqual(await page.evaluate(() => window.__csp), []);
      await page.goto(base + '404.html', { waitUntil: 'networkidle' });
      assert.deepEqual(await page.evaluate(() => window.__csp), []);
      for (const slug of ['prime-cost-calculator', 'plate-cost-calculator', 'pour-cost-calculator']) {
        await page.goto(`${base}tools/${slug}/`, { waitUntil: 'networkidle' });
        assert.ok(await page.locator('meta[http-equiv="Content-Security-Policy"]').count(), `CSP meta missing on ${slug}`);
        await page.locator('#theme-toggle').click();
        await page.locator('#copy-link').click();
        await page.waitForTimeout(300);
        assert.deepEqual(await page.evaluate(() => window.__csp), [], slug);
      }
      await ctx.close();
    });
  }

  // Operator toolkit: tabs, plate and cocktail costing, shared links
  const STUB_CLIPBOARD = () => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { window.__copied = t; } } });
  const calm = async (viewport, extra = {}) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', ...extra });
    await ctx.addInitScript(STUB_CLIPBOARD);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    return { ctx, page, errors };
  };

  await check('toolkit tabs follow the ARIA tabs keyboard pattern', async () => {
    const { page, ctx } = await calm({ width: 1280, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#tab-prime').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-plate');
    assert.equal(await page.locator('#tab-plate').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#tab-prime').getAttribute('tabindex'), '-1');
    assert.equal(await page.locator('#plate').isVisible(), true);
    assert.equal(await page.locator('#calc').isVisible(), false);
    await page.keyboard.press('End');
    assert.equal(await page.locator('#cocktail').isVisible(), true);
    await page.keyboard.press('ArrowRight'); // wraps to the first tab
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-prime');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-cocktail');
    await ctx.close();
  });

  await check('plate and cocktail maths (pure functions)', async () => {
    const { page, ctx } = await open({ width: 1280, height: 900 });
    const r = await page.evaluate(() => ({
      perOz: TMHSCalc.costPerOz(30, 750), pour: TMHSCalc.pourCost(30, 750, 2), noBottle: TMHSCalc.costPerOz(30, 0),
      price: TMHSCalc.priceAtTarget(6.2, 30), noTarget: TMHSCalc.priceAtTarget(6.2, 0),
      pct: TMHSCalc.costPct(6.2, 22), noPrice: TMHSCalc.costPct(6.2, 0),
      amount: TMHSCalc.parseAmount('$1,234.567'), capped: TMHSCalc.parseAmount('900', 20),
      vs: [[20, 20], [22, 20], [23.5, 20]].map(([a, t]) => TMHSCalc.vsTarget(a, t).key),
      wi: TMHSCalc.whatIf(200000, 75), under: TMHSCalc.whatIf(100000, 55),
    }));
    assert.ok(Math.abs(r.perOz - 1.18294) < 1e-4); assert.ok(Math.abs(r.pour - 2.36588) < 1e-4); assert.equal(r.noBottle, 0);
    assert.ok(Math.abs(r.price - 20.6667) < 1e-3); assert.equal(r.noTarget, 0);
    assert.ok(Math.abs(r.pct - 28.1818) < 1e-3); assert.equal(r.noPrice, 0);
    assert.equal(r.amount, 1234.57); assert.equal(r.capped, 20);
    // shorthand sales and decimal commas are read as meant, not digit by digit
    const p = await page.evaluate(() => ({
      money: ['$120k', '1.5M', '120 K', '100,000', '2.5k'].map(TMHSCalc.parseMoney),
      amounts: ['4,20', '12,5', '1,234', '1,234.56', '1.234,56', '.5'].map((s) => TMHSCalc.parseAmount(s)),
    }));
    assert.deepEqual(p.money, [120000, 1500000, 120000, 100000, 2500]);
    assert.deepEqual(p.amounts, [4.2, 12.5, 1234, 1234.56, 1234.56, 0.5]);
    assert.deepEqual(r.vs, ['strong', 'watch', 'attention']);
    assert.deepEqual(r.wi, { pointMonthly: 2000, pointYearly: 24000, gapPts: 15, gapYearly: 360000 });
    assert.equal(r.under.gapPts, 0);
    await ctx.close();
  });

  await check('prime cost shows the cost breakdown and what-if savings', async () => {
    const { page, ctx } = await calm({ width: 1280, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#wi-gap').textContent(), '+$36,000 a year');
    await page.fill('#calc-revenue', '200000');
    await page.locator('#calc-food').fill('40');
    await page.locator('#calc-labor').fill('35');
    assert.equal(await page.locator('#wi-point').textContent(), '$2,000 a month');
    assert.equal(await page.locator('#wi-gap').textContent(), '+$360,000 a year');
    assert.equal(await page.locator('#split-left').textContent(), '13%');
    assert.equal(await page.locator('.calc-out').first().getAttribute('data-band'), 'attention');
    await page.locator('#calc-food').fill('25');
    await page.locator('#calc-labor').fill('30');
    assert.equal(await page.locator('#wi-gap').textContent(), 'Already there');
    await ctx.close();
  });

  await check('plate cost prices the example and rows can be added to the cap and removed', async () => {
    const { page, ctx } = await calm({ width: 1280, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#tab-plate').click();
    assert.equal(await page.locator('#plate-out-price').textContent(), '$20.67');
    assert.equal(await page.locator('#plate-out-pct').textContent(), '28.2%');
    assert.equal(await page.locator('#plate-band').textContent(), 'At or under target');
    // a new row takes focus; typing a cost updates the totals
    await page.locator('#plate-add').click();
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Ingredient 5 name');
    await page.keyboard.type('Bread');
    await page.locator('#plate-rows [data-k="cost"]').nth(4).fill('0.80');
    assert.equal(await page.locator('#plate-out-cost').textContent(), '$7.00');
    assert.equal(await page.locator('#plate-band').textContent(), 'Slightly over target');
    // removing a row moves focus to the next remove button
    await page.locator('#plate-rows .row-del').first().click();
    assert.equal(await page.locator('#plate-rows .row').count(), 4);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Remove Starch');
    for (let i = 0; i < 10; i++) if (await page.locator('#plate-add').isEnabled()) await page.locator('#plate-add').click();
    assert.equal(await page.locator('#plate-rows .row').count(), 12);
    assert.equal(await page.locator('#plate-add').isDisabled(), true);
    assert.match(await page.locator('#plate-add-note').textContent(), /maximum of 12/);
    // without a price, profit is shown at the suggested price and no band is claimed
    await page.fill('#plate-price', '');
    assert.equal(await page.locator('#plate-out-pct').textContent(), 'Add your price');
    assert.equal(await page.locator('#plate-band').isVisible(), false);
    await page.locator('#plate-reset').click();
    assert.equal(await page.locator('#plate-rows .row').count(), 4);
    assert.equal(await page.locator('#plate-out-price').textContent(), '$20.67');
    await ctx.close();
  });

  await check('month tracker saves, charts, exports, imports, removes and clears months (#37)', async () => {
    const { page, ctx, errors } = await calm({ width: 1280, height: 900 }, { acceptDownloads: true });
    await page.goto(base, { waitUntil: 'networkidle' });
    const rows = page.locator('#tracker-rows tr');
    const save = async (month) => { await page.fill('#tracker-month', month); await page.locator('#tracker-save').click(); };
    // nothing saved, nothing stored, until asked
    assert.equal(await page.locator('#tracker-view').isVisible(), false);
    assert.equal(await page.locator('#tracker-empty').isVisible(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem('tmhs-prime-months')), null);
    await save('2026-07');
    assert.equal(await page.locator('#tracker-status').textContent(), 'Saved July 2026: prime cost 63%.');
    await page.locator('#calc-food-in').fill('33%');
    await save('2026-08');
    assert.match(await page.locator('#tracker-summary').textContent(), /Latest: August 2026, prime cost 65% \(watch closely\)\. Up 2 points from July 2026\./);
    await page.locator('#calc-food-in').fill('29.5%');
    await save('2026-09');
    await save('2026-09');
    assert.match(await page.locator('#tracker-status').textContent(), /^Updated September 2026: prime cost 61\.5%/);
    assert.match(await page.locator('#tracker-summary').textContent(), /Down 3\.5 points from August 2026\. Three-month average 63\.2%\./);
    assert.equal(await rows.count(), 3);
    assert.equal(await rows.first().locator('th').textContent(), 'Sep 2026'); // newest first
    assert.equal(await page.locator('#tracker-chart .dot').count(), 3);
    assert.equal(await page.locator('#tracker-chart .val').textContent(), '61.5%');
    // kept in this browser across visits
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await rows.count(), 3);
    // the message builder can carry the trend
    await page.locator('#inq-calc').check();
    assert.match(await page.locator('#inq-preview').textContent(), /Saved months: Jul 2026 63%, Aug 2026 65%, Sep 2026 61\.5%/);
    // CSV out
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#tracker-export').click()]);
    assert.equal(download.suggestedFilename(), 'prime-cost-by-month.csv');
    const csv = fs.readFileSync(await download.path(), 'utf8').trim().split('\n');
    assert.equal(csv[0], 'month,sales,food_pct,labor_pct,other_pct,prime_pct');
    assert.equal(csv[3], '2026-09,100000,29.5,32,12,61.5');
    // remove one: focus stays in the table
    await page.locator('button[aria-label="Remove August 2026"]').click();
    assert.equal(await rows.count(), 2);
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('row-del')), true);
    // CSV in: merged by month; junk rows are skipped
    await page.locator('#tracker-file').setInputFiles({ name: 'm.csv', mimeType: 'text/csv', buffer: Buffer.from(csv.join('\n') + '\n2026-13,1,1,1,1,2\nnope\n') });
    await page.waitForFunction(() => /^Imported/.test(document.getElementById('tracker-status').textContent)); // the file is read asynchronously
    assert.equal(await page.locator('#tracker-status').textContent(), 'Imported 3 months.');
    assert.equal(await rows.count(), 3);
    await page.locator('#tracker-file').setInputFiles({ name: 'x.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2\n') });
    await page.waitForFunction(() => /no months/.test(document.getElementById('tracker-status').textContent));
    // accessible with data in it
    await page.evaluate(AXE);
    const res = await page.evaluate(() => axe.run('#tracker', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
    assert.deepEqual(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`), []);
    // clearing takes two clicks
    await page.locator('#tracker-clear').click();
    assert.equal(await rows.count(), 3);
    await page.locator('#tracker-clear').click();
    assert.equal(await page.locator('#tracker-view').isVisible(), false);
    assert.equal(await page.evaluate(() => localStorage.getItem('tmhs-prime-months')), null);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check('month tracker: axe 0 violations with saved months in the dark theme, and works when storage is blocked', async () => {
    const months = JSON.stringify([{ month: '2026-08', sales: 90000, food: 32, labor: 33, other: 12 }, { month: '2026-09', sales: 95000, food: 31, labor: 31.5, other: 12 }]);
    const { page, ctx, errors } = await calm({ width: 375, height: 800 }, { colorScheme: 'dark' });
    await ctx.addInitScript((m) => localStorage.setItem('tmhs-prime-months', m), months);
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#tracker-rows tr').count(), 2);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'tracker scrolls the page sideways');
    await page.evaluate(AXE);
    const res = await page.evaluate(() => axe.run('#tracker', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
    assert.deepEqual(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`), []);
    await ctx.close();
    // storage blocked: saving still works for the visit and says so
    const blocked = await calm({ width: 1280, height: 900 });
    await blocked.ctx.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
    await blocked.page.goto(base, { waitUntil: 'networkidle' });
    await blocked.page.fill('#tracker-month', '2026-09');
    await blocked.page.locator('#tracker-save').click();
    assert.match(await blocked.page.locator('#tracker-status').textContent(), /blocking storage/);
    assert.equal(await blocked.page.locator('#tracker-rows tr').count(), 1);
    assert.deepEqual([...errors, ...blocked.errors], []);
    await blocked.ctx.close();
  });

  await check('print or save as PDF shows only the tool in use, with a dated link back (#43)', async () => {
    const { page, ctx, errors } = await calm({ width: 1280, height: 900 });
    await page.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#tab-plate').click();
    await page.locator('#print-numbers').click();
    assert.equal(await page.evaluate(() => window.__printed), 1);
    assert.match(await page.locator('#calculator').getAttribute('data-print-stamp'), /^TM Hospitality Strategies, \w+ \d+, \d{4}\. These numbers: http.*\?tool=plate&rows=/);
    await page.emulateMedia({ media: 'print' });
    for (const [sel, shown] of [['#calc-title', true], ['#plate', true], ['#plate-out-price', true], ['#calc', false], ['#about', false], ['#contact', false],
      ['.site-header', false], ['.site-footer', false], ['#tool-tabs', false], ['.tools-bar', false], ['.tool-pages', false]]) {
      assert.equal(await page.locator(sel).first().isVisible(), shown, `${sel} ${shown ? 'hidden' : 'shown'} in print`);
    }
    // once printing is done the page is back to normal
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('print-tool')), false);
    assert.equal(await page.locator('#about').isVisible(), true, 'a plain print still shows the whole page');
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check('embed mode: calculator only, credited, not indexed, accessible, themeable (#42)', async () => {
    for (const slug of TOOL_SLUGS) {
      const { page, ctx, errors } = await calm({ width: 360, height: 800 });
      await page.goto(`${base}tools/${slug}/?embed=1`, { waitUntil: 'networkidle' });
      for (const [sel, shown] of [['.site-header', false], ['.site-footer', false], ['#how-title', false], ['.crumbs', false], ['#tool-title', true], ['.embed-credit', true]]) {
        assert.equal(await page.locator(sel).isVisible(), shown, `${slug}: ${sel} should be ${shown ? 'shown' : 'hidden'}`);
      }
      const credit = page.locator('.embed-credit a');
      assert.equal(await credit.getAttribute('href'), `https://tmhsdigital.github.io/Github-Pages-Demo-1/tools/${slug}/`);
      assert.equal(await credit.getAttribute('target'), '_blank');
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex');
      assert.equal(await page.locator('#talk-numbers').getAttribute('target'), '_blank');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: sideways scroll`);
      await page.evaluate(AXE);
      const res = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
      assert.deepEqual(res.violations.map((v) => `${slug} ${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`), []);
      assert.deepEqual(errors, []);
      await ctx.close();
    }
    // ?theme= sets the theme for the embed without saving it; the normal page shows no credit
    const { page, ctx } = await calm({ width: 1280, height: 900 }, { colorScheme: 'light' });
    await page.goto(`${base}tools/plate-cost-calculator/?embed=1&theme=dark`, { waitUntil: 'networkidle' });
    assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
    assert.equal(await page.evaluate(() => localStorage.getItem('tmhs-theme')), null);
    // edits keep the page embedded across a reload
    await page.fill('#plate-price', '19');
    await page.goto(`${base}tools/plate-cost-calculator/?embed=1&tool=plate&rows=Fish_5&target=30`, { waitUntil: 'networkidle' });
    await page.fill('#plate-price', '19');
    await page.waitForFunction(() => location.search.includes('price=19'));
    assert.match(page.url(), /embed=1/);
    await page.goto(`${base}tools/plate-cost-calculator/`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.embed-credit').isVisible(), false);
    assert.equal(await page.locator('meta[name="robots"]').count(), 0);
    await ctx.close();
  });

  await check('embedded in another page, the calculator reports its height and the snippet copies (#42)', async () => {
    const { page, ctx, errors } = await calm({ width: 1280, height: 900 });
    await page.goto(`${base}tools/prime-cost-calculator/`, { waitUntil: 'networkidle' });
    // the snippet on the page is what a partner pastes; it targets the live site, so point it here to try it
    await page.locator('.embed-box summary').click();
    await page.locator('[data-copy="embed-code"]').click();
    const snippet = await page.evaluate(() => window.__copied);
    assert.match(snippet, /^<iframe src="https:\/\/tmhsdigital\.github\.io\/Github-Pages-Demo-1\/tools\/prime-cost-calculator\/\?embed=1"/);
    const local = snippet.replace('https://tmhsdigital.github.io/Github-Pages-Demo-1/', base).replace('"https://tmhsdigital.github.io"', JSON.stringify(base.replace(/\/$/, '')));
    const host = await ctx.newPage();
    await host.goto(base + 'robots.txt'); // any same-origin page will do as the host
    await host.setContent(`<!doctype html><title>Host</title><h1>A partner site</h1>${local}`);
    await host.waitForFunction(() => parseFloat(document.querySelector('iframe').style.height) > 0, null, { timeout: 15000 });
    const h = await host.evaluate(() => parseFloat(document.querySelector('iframe').style.height));
    assert.ok(h > 600 && h < 2500, `unexpected embed height ${h}`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check('the tracker offers a spreadsheet template that exists (#43)', async () => {
    for (const page of ['', 'tools/prime-cost-calculator/']) {
      const html = fs.readFileSync(path.join(ROOT, page, 'index.html'), 'utf8');
      const href = /<a href="([^"]*prime-cost-tracker\.xlsx)" download>/.exec(html);
      assert.ok(href, `${page || 'home'}: no template link`);
      const file = fs.readFileSync(path.join(ROOT, page, href[1]));
      assert.equal(file.subarray(0, 2).toString(), 'PK', 'template is not an xlsx (zip) file');
    }
  });

  await check('a shared link opens the cocktail tool with its numbers', async () => {
    const { page, ctx, errors } = await calm({ width: 1280, height: 900 });
    await page.goto(base + '?tool=cocktail&rows=Gin_30_750_2*Bad_x_y_z&target=25&price=12&extra=0#calculator', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#tab-cocktail').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#cocktail').isVisible(), true);
    assert.equal(await page.locator('#cocktail-rows .row').count(), 2);
    assert.equal(await page.locator('#cocktail-rows .r-out').first().textContent(), '$2.37');
    assert.equal(await page.locator('#cocktail-out-price').textContent(), '$9.46');
    assert.equal(await page.locator('#cocktail-out-pct').textContent(), '19.7%');
    assert.equal(await page.locator('#cocktail-target-out').textContent(), '25%');
    // nonsense values are ignored rather than breaking the page
    await page.goto(base + '?tool=nope&sales=abc', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#tab-prime').getAttribute('aria-selected'), 'true');
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check('after a shared link, the address bar follows edits so a reload keeps them (#36)', async () => {
    const { page, ctx, errors } = await calm({ width: 1280, height: 900 });
    await page.goto(base + '?tool=plate&rows=Fish_5&target=30#calculator', { waitUntil: 'networkidle' });
    await page.fill('#plate-price', '19');
    await page.locator('#plate-rows [data-k="name"]').first().fill('Halibut');
    await page.waitForFunction(() => location.search.includes('price=19'));
    assert.match(page.url(), /\?tool=plate&rows=Halibut_5&target=30&price=19#calculator$/);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#plate-price').inputValue(), '19.00');
    assert.equal(await page.locator('#plate-rows [data-k="name"]').first().inputValue(), 'Halibut');
    // switching tools follows too
    await page.locator('#tab-prime').click();
    await page.waitForFunction(() => location.search.startsWith('?tool=prime'));
    // a plain visit keeps a clean address
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#calc-food').fill('40');
    await page.waitForTimeout(500);
    assert.equal(new URL(page.url()).search, '');
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check('copy link round-trips the current tool and numbers', async () => {
    const { page, ctx } = await calm({ width: 1280, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#tab-plate').click();
    await page.fill('#plate-price', '25');
    await page.locator('#plate-rows [data-k="name"]').first().fill('Short rib');
    await page.locator('#copy-link').click();
    await page.waitForFunction(() => window.__copied);
    const link = await page.evaluate(() => window.__copied);
    await page.waitForFunction(() => document.getElementById('share-status').textContent);
    assert.match(link, /\?tool=plate&rows=Short\+rib_4\.2\*/);
    assert.match(link, /#calculator$/);
    assert.match(await page.locator('#share-status').textContent(), /Link copied/);
    const second = await ctx.newPage();
    await second.goto(link, { waitUntil: 'networkidle' });
    assert.equal(await second.locator('#plate-price').inputValue(), '25.00');
    assert.equal(await second.locator('#plate-rows [data-k="name"]').first().inputValue(), 'Short rib');
    await ctx.close();
  });

  // Contact: inquiry builder and quick-contact bar
  await check('talk through these numbers brings the results into a copyable message', async () => {
    const { page, ctx } = await calm({ width: 1280, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#talk-numbers').click();
    assert.equal(await page.locator('#inq-calc').isChecked(), true);
    await page.locator('.topics label', { hasText: 'Costs' }).click();
    await page.locator('.topics label', { hasText: 'Menu' }).click();
    await page.selectOption('#inq-venue', 'Independent restaurant');
    await page.fill('#inq-note', 'Two sites, opening a third.');
    const text = await page.locator('#inq-preview').textContent();
    assert.match(text, /I run an independent restaurant and would like help with costs and margins and menu and pricing\./);
    assert.match(text, /Two sites, opening a third\./);
    assert.match(text, /My numbers from your prime cost calculator:\nMonthly sales: \$100,000/);
    assert.match(text, /Prime cost: 63% \(on target\)/);
    assert.match(text, /Link: http.*\?tool=prime&sales=100000/);
    await page.locator('#inq-copy').click();
    await page.waitForFunction(() => window.__copied);
    assert.equal(await page.evaluate(() => window.__copied), text);
    await page.waitForFunction(() => document.getElementById('inq-status').textContent);
    assert.match(await page.locator('#inq-status').textContent(), /Paste it into a LinkedIn message/);
    assert.equal(await page.locator('#inq-email').isVisible(), false);
    await ctx.close();
  });

  // The address is set in the source; the minified build folds the empty constant away, so this runs on source only
  if (!process.env.SITE_DIR) {
    await check('setting CONTACT_EMAIL turns on the email links', async () => {
      const { page, ctx } = await calm({ width: 1280, height: 900 });
      await page.route('**/js/inquiry.js', async (route) => {
        const body = (await (await route.fetch()).text()).replace(/CONTACT_EMAIL\s*=\s*(''|"")/, 'CONTACT_EMAIL="hello@example.com"');
        route.fulfill({ body, contentType: 'text/javascript' });
      });
      await page.goto(base, { waitUntil: 'networkidle' });
      assert.match(await page.locator('#email-cta').getAttribute('href'), /^mailto:hello@example\.com\?subject=/);
      assert.equal(await page.locator('#email-cta').getAttribute('target'), null);
      assert.equal(await page.locator('#inq-email').isVisible(), true);
      await page.locator('.topics label', { hasText: 'Operations' }).click();
      const href = await page.locator('#inq-email').getAttribute('href');
      assert.match(href, /^mailto:hello@example\.com\?subject=Hospitality%20strategy%20inquiry&body=/);
      assert.match(decodeURIComponent(href), /would like help with operations and systems/);
      await ctx.close();
    });
  }

  await check('mobile quick-contact bar shows between the hero and the contact section', async () => {
    const { page, ctx } = await calm({ width: 375, height: 800 });
    await page.goto(base, { waitUntil: 'networkidle' });
    const shown = () => page.locator('#sticky-cta').evaluate((el) => getComputedStyle(el).visibility === 'visible');
    assert.equal(await shown(), false);
    await page.evaluate(() => document.getElementById('services').scrollIntoView());
    await page.waitForTimeout(200);
    assert.equal(await shown(), true);
    await page.locator('#tab-plate').dispatchEvent('click');
    await page.locator('#plate-price').focus(); // out of the way while typing
    await page.waitForTimeout(100);
    assert.equal(await shown(), false);
    await page.locator('#plate-price').blur();
    await page.evaluate(() => document.getElementById('contact').scrollIntoView());
    await page.waitForTimeout(200);
    assert.equal(await shown(), false);
    await ctx.close();
    const desk = await calm({ width: 1280, height: 900 });
    await desk.page.goto(base, { waitUntil: 'networkidle' });
    await desk.page.evaluate(() => document.getElementById('services').scrollIntoView());
    assert.equal(await desk.page.locator('#sticky-cta').isVisible(), false);
    await desk.ctx.close();
  });

  await check('without JavaScript only the prime cost calculator shows', async () => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base);
    assert.equal(await page.locator('#calc').isVisible(), true);
    assert.equal(await page.locator('#out-prime-pct').textContent(), '63%');
    for (const sel of ['#tool-tabs', '#plate', '#cocktail', '.tools-bar', '#composer', '#sticky-cta']) {
      assert.equal(await page.locator(sel).isVisible(), false, `${sel} is visible`);
    }
    assert.equal(await page.locator('#email-cta').isVisible(), true);
    await ctx.close();
  });

  for (const [w, h, theme] of [[1280, 900, 'light'], [1280, 900, 'dark'], [375, 800, 'light'], [375, 800, 'dark']]) {
    await check(`axe WCAG A/AA: 0 violations on the plate and cocktail tools and filled message at ${w}px, ${theme} theme`, async () => {
      const { page, ctx } = await calm({ width: w, height: h });
      await ctx.addInitScript((t) => { try { localStorage.setItem('tmhs-theme', t); } catch { /* storage blocked */ } }, theme);
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.evaluate(AXE);
      const scan = () => page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] })
        .then((r) => r.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)));
      await page.locator('#tab-plate').click();
      await page.locator('#plate-add').click();
      assert.deepEqual(await scan(), []);
      await page.locator('#tab-cocktail').click();
      await page.locator('#talk-numbers').click();
      await page.locator('.topics label').first().click();
      assert.deepEqual(await scan(), []);
      await ctx.close();
    });
  }

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

  // Calculator pages (tools/<slug>/): one tool each, held to the same bar as the home page
  const TOOL_PAGES = [
    { slug: 'prime-cost-calculator', tool: 'prime', out: '#out-prime-pct', value: '63%' },
    { slug: 'plate-cost-calculator', tool: 'plate', out: '#plate-out-price', value: '$20.67' },
    { slug: 'pour-cost-calculator', tool: 'cocktail', out: '#cocktail-out-price', value: '$18.56' },
  ];
  for (const t of TOOL_PAGES) {
    const url = `${base}tools/${t.slug}/`;
    await check(`${t.slug}: tool works, headings, metadata, no errors or sideways scroll at 375 and 1280px`, async () => {
      for (const width of [375, 1280]) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        const errors = [];
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
        await page.goto(url, { waitUntil: 'networkidle' });
        assert.equal(await page.locator(t.out).textContent(), t.value);
        assert.equal(await page.locator('[role="tablist"]').count(), 0);
        const levels = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]));
        assert.equal(levels.filter((l) => l === 1).length, 1);
        levels.reduce((prev, l) => { assert.ok(l - prev <= 1, `heading jumps h${prev} -> h${l}`); return l; }, 1);
        assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), `https://tmhsdigital.github.io/Github-Pages-Demo-1/tools/${t.slug}/`);
        const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((s) => JSON.parse(s));
        assert.deepEqual(ld.map((d) => d['@type']), ['WebApplication', 'BreadcrumbList']);
        const crumbs = ld[1].itemListElement;
        assert.equal(crumbs.at(-1).item, `https://tmhsdigital.github.io/Github-Pages-Demo-1/tools/${t.slug}/`);
        assert.deepEqual(crumbs.map((c) => c.position), crumbs.map((_, i) => i + 1));
        // its own social card, which exists
        const card = await page.locator('meta[property="og:image"]').getAttribute('content');
        assert.equal(card, `https://tmhsdigital.github.io/Github-Pages-Demo-1/assets/images/og-${t.slug}.png`);
        assert.ok(fs.existsSync(path.join(ROOT, 'assets', 'images', `og-${t.slug}.png`)), 'social card missing');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'page scrolls sideways');
        assert.deepEqual(errors, []);
        await ctx.close();
      }
    });

    for (const theme of ['light', 'dark']) {
      await check(`${t.slug}: axe WCAG A/AA 0 violations, ${theme} theme`, async () => {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        await ctx.addInitScript((th) => { try { localStorage.setItem('tmhs-theme', th); } catch { /* storage blocked */ } }, theme);
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.evaluate(AXE);
        const res = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
        assert.deepEqual(res.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`), []);
        await ctx.close();
      });
    }
  }

  await check('a tool page link round-trips its numbers, and talking them through opens the home message builder', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(`${base}tools/plate-cost-calculator/`, { waitUntil: 'networkidle' });
    await page.locator('#plate-rows [data-k="cost"]').first().fill('5.00');
    assert.equal(await page.locator('#plate-out-cost').textContent(), '$7.00');
    const link = await page.evaluate(() => window.TMHSTools.shareUrl());
    assert.match(link, /\/tools\/plate-cost-calculator\/\?tool=plate&rows=Protein_5\*/);
    await page.goto(link, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#plate-out-cost').textContent(), '$7.00');
    // "Talk through these numbers" goes to the home page's builder with the numbers included
    await page.locator('#talk-numbers').click();
    await page.waitForURL(/#contact$/);
    assert.equal(new URL(page.url()).pathname, '/');
    assert.equal(await page.locator('#tab-plate').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#inq-calc').isChecked(), true);
    const text = await page.locator('#inq-preview').textContent();
    assert.match(text, /My numbers from your plate cost calculator:/);
    assert.match(text, /Cost per plate: \$7\.00/);
    await ctx.close();
  });

  await check('tool pages without JavaScript: recipe tools explain themselves, prime cost shows its example', async () => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${base}tools/pour-cost-calculator/`);
    assert.equal(await page.locator('#cocktail').isVisible(), false);
    assert.equal(await page.locator('.nojs-note').isVisible(), true);
    assert.equal(await page.locator('.tools-bar').isVisible(), false);
    assert.equal(await page.locator('.explainer h2').isVisible(), true);
    await page.goto(`${base}tools/prime-cost-calculator/`);
    assert.equal(await page.locator('#calc').isVisible(), true);
    assert.equal(await page.locator('#out-prime-pct').textContent(), '63%');
    await ctx.close();
  });

  await check('home page links to each calculator page and the sitemap lists them', async () => {
    const { ctx, page } = await open({ width: 1280, height: 900 });
    const hrefs = await page.locator('.tool-pages a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    assert.deepEqual(hrefs, TOOL_PAGES.map((t) => `tools/${t.slug}/`));
    const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    for (const t of TOOL_PAGES) assert.ok(sitemap.includes(`/tools/${t.slug}/</loc>`), `${t.slug} missing from sitemap`);
    // the published sitemap dates each page from git; the source carries none to go stale
    const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
    for (const e of entries) {
      if (process.env.SITE_DIR) assert.match(e, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/, `no lastmod in ${e.trim()}`);
      else assert.doesNotMatch(e, /<lastmod>/, 'source sitemap.xml has a hand-written lastmod');
    }
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
