'use strict';
// Toolkit tabs, plate and cocktail tools, shared and copied links. Run alone with: npm test -- recipe
const assert = require('node:assert/strict');

module.exports = async ({ browser, base, check, open, calm, AXE }) => {
  // Operator toolkit: tabs, plate and cocktail costing, shared links
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
    assert.equal(await page.locator('#foodcost').isVisible(), true);
    await page.keyboard.press('ArrowRight'); // wraps to the first tab
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-prime');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-foodcost');
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
};
