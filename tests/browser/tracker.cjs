'use strict';
// Prime cost month tracker and its spreadsheet template. Run alone with: npm test -- tracker
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ base, check, calm, AXE, ROOT }) => {
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

  await check('the tracker offers a spreadsheet template that exists (#43)', async () => {
    for (const page of ['', 'tools/prime-cost-calculator/']) {
      const html = fs.readFileSync(path.join(ROOT, page, 'index.html'), 'utf8');
      const href = /<a href="([^"]*prime-cost-tracker\.xlsx)" download>/.exec(html);
      assert.ok(href, `${page || 'home'}: no template link`);
      const file = fs.readFileSync(path.join(ROOT, page, href[1]));
      assert.equal(file.subarray(0, 2).toString(), 'PK', 'template is not an xlsx (zip) file');
    }
  });
};
