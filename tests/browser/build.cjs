'use strict';
// Web app manifest, and on the published build: offline support and the Content-Security-Policy. Run alone with: npm test -- build
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ browser, base, check, ROOT, TOOL_SLUGS }) => {
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
    await check('published build: pages work offline once visited, and a first visit fetches nothing else (#44, #46)', async () => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const fetched = [];
      ctx.on('request', (r) => fetched.push(new URL(r.url()).pathname)); // includes the service worker's own requests
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      // kept: wait until the worker holds a copy of the page it was told about
      const kept = (path) => page.waitForFunction((p) => caches.keys().then((ks) => Promise.all(ks.map((k) => caches.open(k).then((c) => c.match(new URL(p, location.href).href))))).then((hits) => hits.some(Boolean)), path, { timeout: 15000 });
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.evaluate(() => navigator.serviceWorker.ready);
      await kept('./');
      // the first visit downloaded nothing the home page doesn't use: no other pages, no install icons, no unused CSS
      for (const p of fetched) assert.doesNotMatch(p, /\/tools\/|icon-512|icon-maskable|site\.min\.css/, `first visit fetched ${p}`);
      await page.goto(`${base}tools/pour-cost-calculator/`, { waitUntil: 'networkidle' });
      await kept('tools/pour-cost-calculator/');
      await ctx.setOffline(true);
      // a shared link to a visited page opens offline with its numbers
      await page.goto(`${base}tools/pour-cost-calculator/?tool=cocktail&rows=Gin_30_750_2&target=25&price=12`, { waitUntil: 'load' });
      assert.equal(await page.locator('#cocktail-rows .row').count(), 1);
      assert.equal(await page.locator('#cocktail-out-price').textContent(), '$11.06'); // ($2.37 gin + $0.40 garnish) at 25%
      assert.equal(await page.evaluate(() => document.fonts.check('600 16px Fraunces')), true);
      await page.goto(base, { waitUntil: 'load' });
      assert.equal(await page.locator('#tab-prime').isVisible(), true);
      assert.equal(await page.locator('#out-prime-pct').textContent(), '63%');
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
};
