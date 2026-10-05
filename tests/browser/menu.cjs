'use strict';
// Your menu: saving plate and cocktail costings, menu engineering, opening, CSV, clearing. Run alone with: npm test -- menu
const assert = require('node:assert/strict');
const fs = require('node:fs');

module.exports = async ({ base, check, calm, AXE }) => {
  // Same recipe (plate cost $6.20) at four prices; with these sales the four land in four quadrants:
  // weighted average margin (15.80*150 + 9.80*150 + 23.80*50 + 5.80*50) / 400 = $13.30, popular = 17.5% or more
  const DISHES = [['Short rib', '22', '150', 'Star'], ['Pasta', '16', '150', 'Plowhorse'], ['Salmon', '30', '50', 'Puzzle'], ['Salad', '12', '50', 'Dog']];
  const savePlate = async (page, name, price) => {
    await page.fill('#plate-price', price);
    await page.fill('#plate-dish', name);
    await page.locator('#plate-save').click();
  };
  const rows = (page, kind) => page.locator(`#menu-groups [data-kind="${kind}"] tbody tr`);

  await check('menu: save dishes, see costs and margins, sort them into stars, plowhorses, puzzles and dogs (#54)', async () => {
    const { page, ctx, errors } = await calm({ width: 1280, height: 900 }, { acceptDownloads: true });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#tab-plate').click();
    // nothing stored until asked; a name is needed
    assert.equal(await page.evaluate(() => localStorage.getItem('tmhs-menu')), null);
    assert.equal(await page.locator('#menu-view').isVisible(), false);
    await page.locator('#plate-save').click();
    assert.equal(await page.locator('#plate-save-status').textContent(), 'Name the dish first.');
    for (const [name, price] of DISHES) await savePlate(page, name, price);
    assert.equal(await page.locator('#plate-save-status').textContent(), 'Saved Salad in your menu.');
    assert.equal(await rows(page, 'plate').count(), 4);
    const first = await rows(page, 'plate').first().locator('th, td').allTextContents();
    assert.deepEqual(first.slice(0, 5), ['Short rib', '$6.20', '$22.00', '28.2%', '$15.80']);
    assert.match(await page.locator('[data-kind="plate"] .menu-matrix-holder').textContent(), /Add how many of each dish sold last month/);
    // sales counts sort them
    for (const [name, , sold] of DISHES) await page.fill(`[aria-label="${name}: sold last month"]`, sold);
    const classes = await rows(page, 'plate').locator('[data-class]').allTextContents();
    assert.deepEqual(classes, DISHES.map((d) => d[3]));
    assert.match(await page.locator('[data-kind="plate"] .menu-note').textContent(), /Average margin \$13\.30 a dish; popular means at least 17\.5% of the 400 sold/);
    assert.equal(await page.locator('.quad-star li').textContent(), 'Short rib');
    assert.equal(await page.locator('.quad-dog li').textContent(), 'Salad');
    // saving the same name again updates it and keeps its sales count
    await savePlate(page, 'short rib', '24');
    assert.equal(await page.locator('#plate-save-status').textContent(), 'Updated short rib in your menu.');
    assert.equal(await rows(page, 'plate').count(), 4);
    assert.equal(await page.locator('[aria-label="short rib: sold last month"]').inputValue(), '150');
    // drinks are a separate group, judged on their own
    await page.locator('#tab-cocktail').click();
    await page.fill('#cocktail-dish', 'Margarita');
    await page.locator('#cocktail-save').click();
    assert.equal(await rows(page, 'cocktail').count(), 1);
    assert.match(await page.locator('[data-kind="cocktail"] .menu-matrix-holder').textContent(), /each drink sold/);
    // kept across visits
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await rows(page, 'plate').count(), 4);
    assert.equal(await page.locator('[aria-label="Salmon: sold last month"]').inputValue(), '50');
    // open a saved dish in its calculator
    await page.locator('[aria-label="Open Pasta in the calculator"]').click();
    assert.equal(await page.locator('#tab-plate').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#plate-price').inputValue(), '16.00');
    assert.equal(await page.locator('#plate-dish').inputValue(), 'Pasta');
    // CSV out, clear (two clicks), CSV back in
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#menu-export').click()]);
    const csv = fs.readFileSync(await download.path(), 'utf8');
    assert.match(csv, /^kind,name,cost,price,suggested,sold,state\n/);
    assert.match(csv, /plate,Salmon,6\.2,30,0,50,rows=/);
    await page.locator('#menu-clear').click();
    assert.equal(await rows(page, 'plate').count(), 4);
    await page.locator('#menu-clear').click();
    assert.equal(await page.locator('#menu-view').isVisible(), false);
    assert.equal(await page.evaluate(() => localStorage.getItem('tmhs-menu')), null);
    await page.locator('#menu-file').setInputFiles({ name: 'm.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await page.waitForFunction(() => /^Imported 5 items/.test(document.getElementById('menu-status').textContent));
    assert.deepEqual(await rows(page, 'plate').locator('[data-class]').allTextContents(), ['Star', 'Plowhorse', 'Puzzle', 'Dog']);
    // remove one: the rest are re-sorted and focus stays in the table
    await page.locator('[aria-label="Remove Salad"]').click();
    assert.equal(await rows(page, 'plate').count(), 3);
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('row-del')), true);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check('menu: accessible and fits a phone with dishes saved; another page opens a dish on the home page (#54)', async () => {
    const saved = JSON.stringify([
      { kind: 'plate', name: 'Short rib', cost: 6.2, price: 22, suggested: false, sold: 150, state: 'rows=Protein_4.2*Starch_0.6&target=30&price=22' },
      { kind: 'plate', name: 'Pasta', cost: 3.1, price: 16, suggested: false, sold: 90, state: 'rows=Pasta_3.1&target=30&price=16' },
      { kind: 'cocktail', name: 'Margarita', cost: 3.71, price: 14, suggested: false, sold: 0, state: 'rows=Tequila_30_750_2&target=20&price=14&extra=0.4' },
    ]);
    const { page, ctx, errors } = await calm({ width: 375, height: 800 }, { colorScheme: 'dark' });
    await ctx.addInitScript((m) => localStorage.setItem('tmhs-menu', m), saved);
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await rows(page, 'plate').count(), 2);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'the menu scrolls the page sideways');
    await page.evaluate(AXE);
    const res = await page.evaluate(() => axe.run('#menu', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
    assert.deepEqual(res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`), []);
    // the pour cost page shows the same menu; opening a dish goes to the home page's plate tool
    await page.goto(`${base}tools/pour-cost-calculator/`, { waitUntil: 'networkidle' });
    assert.equal(await rows(page, 'plate').count(), 2);
    await page.locator('[aria-label="Open Pasta in the calculator"]').click();
    await page.waitForURL(/\?tool=plate&rows=Pasta_3\.1/);
    assert.equal(new URL(page.url()).pathname, '/');
    assert.equal(await page.locator('#tab-plate').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#plate-out-cost').textContent(), '$3.10');
    assert.deepEqual(errors, []);
    await ctx.close();
  });
};
