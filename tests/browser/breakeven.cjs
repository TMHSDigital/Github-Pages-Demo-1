'use strict';
// Break-even calculator. Run alone with: npm test -- breakeven
const assert = require('node:assert/strict');

module.exports = async ({ base, check, calm }) => {
  await check('break-even calculator: sales, per day, guests, own sales, shared links and message (#38)', async () => {
    const { page, ctx, errors } = await calm({ width: 1280, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#tab-breakeven').click();
    const text = (id) => page.locator('#be-' + id).textContent();
    assert.deepEqual([await text('out-month'), await text('out-week'), await text('out-day'), await text('out-guests')], ['$118,421', '$27,328', '$4,555', '163']);
    assert.equal(await page.locator('#be-band').isVisible(), false);
    // own sales above, then below, break-even
    await page.fill('#be-sales', '130000');
    assert.equal(await text('band'), 'Above break-even by $11,579');
    assert.equal(await page.locator('#breakeven .calc-out').getAttribute('data-band'), 'strong');
    await page.waitForFunction(() => /about \$4,400 is left/.test(document.getElementById('be-summary').textContent));
    await page.fill('#be-sales', '100k');
    assert.equal(await text('band'), 'Below break-even by $18,421');
    await page.waitForFunction(() => /fall about \$7,000 short/.test(document.getElementById('be-summary').textContent));
    // levers: variable cost, days open, no average check
    await page.locator('#be-variable').fill('70');
    assert.equal(await text('out-month'), '$150,000');
    assert.equal(await page.locator('#be-variable').getAttribute('aria-valuetext'), '70% of sales');
    await page.locator('#be-days').fill('30');
    assert.equal(await text('out-day'), '$5,000');
    await page.fill('#be-check', '');
    assert.equal(await text('out-guests'), 'Add a check');
    // a shared link carries it all
    const link = await page.evaluate(() => window.TMHSTools.shareUrl());
    assert.match(link, /\?tool=breakeven&fixed=45000&variable=70&days=30&sales=100000/);
    const second = await ctx.newPage();
    await second.goto(link, { waitUntil: 'networkidle' });
    assert.equal(await second.locator('#tab-breakeven').getAttribute('aria-selected'), 'true');
    assert.equal(await second.locator('#be-out-month').textContent(), '$150,000');
    assert.equal(await second.locator('#be-sales').inputValue(), '100,000');
    // and the message builder spells it out
    await second.locator('#inq-calc').check();
    const msg = await second.locator('#inq-preview').textContent();
    assert.match(msg, /My numbers from your break-even calculator:/);
    assert.match(msg, /Break-even sales: \$150,000 a month, \$5,000 a day over 30 days open/);
    assert.match(msg, /My sales: \$100,000 a month, below break-even by \$50,000/);
    // reset
    await page.locator('#be-reset').click();
    assert.equal(await text('out-month'), '$118,421');
    // variable costs typed to a decimal, or as P&L dollars that need sales to become a share (#51)
    await page.fill('#be-variable-in', '61.4%');
    assert.equal(await text('out-month'), '$116,580');
    assert.equal(await page.locator('#be-variable').inputValue(), '61');
    assert.equal(await page.locator('#be-variable').getAttribute('aria-valuetext'), '61.4% of sales');
    await page.fill('#be-variable-in', '$62,000');
    assert.equal(await text('out-month'), 'Add your sales');
    assert.match(await text('variable-alt'), /Enter your monthly sales/);
    assert.equal(await page.locator('#be-band').isVisible(), false);
    await page.fill('#be-sales', '100,000');
    assert.equal(await text('out-month'), '$118,421');
    assert.equal(await text('variable-alt'), '62% of your monthly sales');
    await page.locator('#be-variable-in').blur();
    assert.equal(await page.locator('#be-variable-in').inputValue(), '$62,000');
    const usdLink = await page.evaluate(() => window.TMHSTools.shareUrl());
    assert.match(usdLink, /variable_usd=62000/);
    const third = await ctx.newPage();
    await third.goto(usdLink, { waitUntil: 'networkidle' });
    assert.equal(await third.locator('#be-variable-in').inputValue(), '$62,000');
    assert.equal(await third.locator('#be-out-month').textContent(), '$118,421');
    // dragging makes it a percentage again
    await page.locator('#be-variable').fill('60');
    assert.equal(await page.locator('#be-variable-in').inputValue(), '60%');
    assert.equal(await text('variable-alt'), '');
    assert.deepEqual(errors, []);
    await ctx.close();
  });
};
