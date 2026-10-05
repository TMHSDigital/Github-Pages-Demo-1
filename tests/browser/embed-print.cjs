'use strict';
// Print or save as PDF, and embed mode. Run alone with: npm test -- embed-print
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { site: SITE } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'tools.json'), 'utf8')); // the site's address

module.exports = async ({ base, check, calm, AXE, TOOL_SLUGS }) => {
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
      assert.equal(await credit.getAttribute('href'), `${SITE}tools/${slug}/`);
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
    // ...and keeps it when the visitor's system appearance changes (#50)
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.emulateMedia({ colorScheme: 'light' });
    assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
    // without ?theme=, an embed still follows the system
    await page.goto(`${base}tools/plate-cost-calculator/?embed=1`, { waitUntil: 'networkidle' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
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
    assert.ok(snippet.startsWith(`<iframe src="${SITE}tools/prime-cost-calculator/?embed=1"`), snippet.slice(0, 80));
    const local = snippet.replace(SITE, base).replace(JSON.stringify(new URL(SITE).origin), JSON.stringify(base.replace(/\/$/, '')));
    const host = await ctx.newPage();
    await host.goto(base + 'robots.txt'); // any same-origin page will do as the host
    await host.setContent(`<!doctype html><title>Host</title><h1>A partner site</h1>${local}`);
    await host.waitForFunction(() => parseFloat(document.querySelector('iframe').style.height) > 0, null, { timeout: 15000 });
    const h = await host.evaluate(() => parseFloat(document.querySelector('iframe').style.height));
    assert.ok(h > 600 && h < 2500, `unexpected embed height ${h}`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
};
