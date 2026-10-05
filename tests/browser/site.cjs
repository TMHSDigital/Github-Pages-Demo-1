'use strict';
// The home page as a whole: layout, keyboard, menu, FAQ, focus, headings, axe, header, no-JS, reflow, marquee, 404. Run alone with: npm test -- site
const assert = require('node:assert/strict');

module.exports = async ({ browser, base, check, open, AXE }) => {
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
};
