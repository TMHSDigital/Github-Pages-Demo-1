'use strict';
// Calculator pages (tools/<slug>/), their links and the sitemap. Run alone with: npm test -- tool-pages
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ browser, base, check, open, AXE, ROOT, TOOL_PAGES }) => {
  // Calculator pages (tools/<slug>/): one tool each, held to the same bar as the home page
  // From the tool registry: each page and the worked-example result it should open on
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
};
