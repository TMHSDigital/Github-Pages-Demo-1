'use strict';
// Actual food cost calculator. Run alone with: npm test -- foodcost
const assert = require('node:assert/strict');

module.exports = async ({ base, check, calm }) => {
  await check('actual food cost: inventory to food cost, gap to theoretical, miscounts, links and message (#53)', async () => {
    const { page, ctx, errors } = await calm({ width: 1280, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#tab-foodcost').click();
    const text = (id) => page.locator('#fc-' + id).textContent();
    assert.deepEqual([await text('out-pct'), await text('out-cogs'), await text('out-month'), await text('out-year')], ['31.8%', '$31,800', '$2,800', '$33,600']);
    assert.equal(await text('band'), 'Well over theoretical: +2.8 points');
    assert.equal(await page.locator('#foodcost .calc-out').getAttribute('data-band'), 'attention');
    await page.waitForFunction(() => /2\.8 points over your 29% theoretical, about \$2,800 a month/.test(document.getElementById('fc-summary').textContent));
    // closer to theoretical
    await page.fill('#fc-close', '19,600');
    assert.equal(await text('out-pct'), '30.1%');
    assert.equal(await text('band'), 'Worth a look: +1.1 points');
    await page.fill('#fc-theory', '31');
    assert.equal(await text('band'), 'Close to theoretical: 0.9 points under');
    assert.equal(await text('out-month'), 'None');
    // no theoretical: actual only
    await page.fill('#fc-theory', '');
    assert.equal(await page.locator('#fc-band').isVisible(), false);
    assert.equal(await text('out-month'), '–');
    // a miscount is called out, not shown as a negative cost
    await page.fill('#fc-close', '60,000');
    assert.equal(await text('out-pct'), 'Check counts');
    assert.match(await text('close-issue'), /Check the counts/);
    assert.equal(await page.locator('#fc-close').getAttribute('aria-invalid'), 'true');
    // shared links and the message builder
    await page.fill('#fc-close', '17,900');
    await page.fill('#fc-theory', '29');
    const link = await page.evaluate(() => window.TMHSTools.shareUrl());
    assert.match(link, /\?tool=foodcost&open=18500&purchases=31200&close=17900&sales=100000&theory=29/);
    const second = await ctx.newPage();
    await second.goto(link, { waitUntil: 'networkidle' });
    assert.equal(await second.locator('#tab-foodcost').getAttribute('aria-selected'), 'true');
    assert.equal(await second.locator('#fc-out-pct').textContent(), '31.8%');
    await second.locator('#inq-calc').check();
    assert.match(await second.locator('#inq-preview').textContent(), /My numbers from your actual food cost calculator:[\s\S]*Against 29% theoretical: 2\.8 points over, about \$33,600 a year/);
    await page.locator('#fc-reset').click();
    assert.equal(await text('out-pct'), '31.8%');
    assert.deepEqual(errors, []);
    await ctx.close();
  });
};
