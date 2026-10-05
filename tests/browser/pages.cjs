'use strict';
// Pages other than the calculators (tools.json "pages", such as privacy/). Run alone with: npm test -- pages
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { site: SITE, pages: PAGES = [] } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'tools.json'), 'utf8'));

module.exports = async ({ browser, base, check, AXE }) => {
  for (const page of PAGES) {
    await check(`${page}: loads cleanly, sound headings, canonical, no sideways scroll at 320px, axe in both themes`, async () => {
      for (const [width, theme] of [[320, 'light'], [1280, 'dark']]) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
        const p = await ctx.newPage();
        const errors = [];
        p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
        p.on('pageerror', (e) => errors.push(e.message));
        p.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
        await p.goto(base + page, { waitUntil: 'networkidle' });
        const levels = await p.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]));
        assert.equal(levels.filter((l) => l === 1).length, 1, 'one h1');
        levels.reduce((prev, l) => { assert.ok(l - prev <= 1, `heading jumps h${prev} -> h${l}`); return l; }, 1);
        assert.equal(await p.locator('link[rel=canonical]').getAttribute('href'), SITE + page);
        assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page scrolls sideways');
        if (process.env.SITE_DIR) assert.ok(await p.locator('meta[http-equiv="Content-Security-Policy"]').count(), 'CSP meta missing');
        await p.evaluate(AXE);
        const res = await p.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
        assert.deepEqual(res.violations.map((v) => `${width}px ${theme} ${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`), []);
        assert.deepEqual(errors, []);
        await ctx.close();
      }
    });
  }

  await check('the footer on every page links to the privacy page', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    for (const from of ['', 'tools/plate-cost-calculator/', 'privacy/']) {
      await p.goto(base + from, { waitUntil: 'load' });
      await p.locator('.site-footer a', { hasText: 'Privacy' }).click();
      await p.waitForURL(/\/privacy\/$/);
      assert.equal(await p.locator('h1').textContent(), 'Privacy');
    }
    await ctx.close();
  });
};
