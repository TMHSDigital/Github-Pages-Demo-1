'use strict';
// Prime cost calculator. Run alone with: npm test -- prime
const assert = require('node:assert/strict');

module.exports = async ({ browser, base, check, open, calm }) => {
  // Calculator
  await check('calculator math and bands (pure functions)', async () => {
    const { page, ctx } = await open({ width: 1280, height: 900 });
    const r = await page.evaluate(() => ({
      pct: TMHSCalc.primeCostPct(31, 32), left: TMHSCalc.leftoverPct(31, 32, 12), money: TMHSCalc.parseMoney('$1,234,567.89'),
      capped: TMHSCalc.parseMoney('99999999999'), bad: TMHSCalc.parseMoney('abc'),
      bands: [59, 60, 64, 65, 69, 70].map((n) => TMHSCalc.band(n).key),
    }));
    assert.equal(r.pct, 63); assert.equal(r.left, 25); assert.equal(r.money, 1234567); assert.equal(r.capped, 10000000); assert.equal(r.bad, 0);
    assert.deepEqual(r.bands, ['strong', 'target', 'target', 'watch', 'watch', 'attention']);
    await ctx.close();
  });

  await check('calculator updates the readout, band and live summary', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.fill('#calc-revenue', '200000');
    await page.locator('#calc-food').fill('40');
    await page.locator('#calc-labor').fill('35');
    await page.locator('#calc-other').fill('10');
    assert.equal(await page.locator('#out-prime-pct').textContent(), '75%');
    assert.equal(await page.locator('#out-prime-usd').textContent(), '$150,000');
    assert.equal(await page.locator('#out-left-usd').textContent(), '$30,000');
    assert.equal(await page.locator('#out-band').textContent(), 'Needs attention');
    await page.waitForTimeout(600);
    assert.match(await page.locator('#out-summary').textContent(), /Prime cost is 75%, needs attention\./);
    assert.equal(await page.locator('#calc-revenue').inputValue(), '200,000');
    await page.fill('#calc-revenue', '');
    await page.waitForTimeout(600);
    assert.match(await page.locator('#out-summary').textContent(), /Enter your monthly sales/);
    await ctx.close();
  });

  await check('calculator is keyboard operable (slider arrow keys)', async () => {
    const { page, ctx } = await open({ width: 1280, height: 900 });
    await page.locator('#calc-food').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#calc-food').inputValue(), '32');
    assert.equal(await page.locator('#calc-food-in').inputValue(), '32%');
    await ctx.close();
  });

  await check('prime cost takes P&L dollar amounts and decimal percentages (#35)', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    // dollars from the P&L, typed before the sales figure changes, stay dollars
    await page.locator('#calc-food-in').fill('$31,240');
    await page.locator('#calc-labor-in').fill('33980');
    await page.locator('#calc-other-in').fill('12.5%');
    await page.locator('#calc-other-in').blur();
    assert.equal(await page.locator('#calc-food-in').inputValue(), '$31,240');
    assert.equal(await page.locator('#calc-labor-in').inputValue(), '$33,980');
    assert.equal(await page.locator('#calc-other-in').inputValue(), '12.5%');
    assert.equal(await page.locator('#calc-food-alt').textContent(), '31.2% of sales');
    assert.equal(await page.locator('#calc-other-alt').textContent(), '$12,500 a month');
    assert.equal(await page.locator('#out-prime-pct').textContent(), '65.2%');
    assert.equal(await page.locator('#out-band').textContent(), 'Watch closely');
    // the slider follows to the nearest whole point and announces the exact share
    assert.equal(await page.locator('#calc-food').inputValue(), '31');
    assert.equal(await page.locator('#calc-food').getAttribute('aria-valuetext'), '31.2% of sales');
    // a new sales figure re-reads the dollar lines as shares of it
    await page.locator('#calc-revenue').fill('130,000');
    assert.equal(await page.locator('#calc-food-alt').textContent(), '24% of sales');
    assert.equal(await page.locator('#out-prime-pct').textContent(), '50.1%');
    assert.match(await page.locator('#wi-gap').textContent(), /Already there/);
    // dragging a slider makes that line a percentage again
    await page.locator('#calc-food').fill('30');
    assert.equal(await page.locator('#calc-food-in').inputValue(), '30%');
    // shared links keep dollar lines as dollars
    const link = await page.evaluate(() => window.TMHSTools.shareUrl());
    assert.match(link, /food=30&labor_usd=33980&other=12\.5/);
    const second = await ctx.newPage();
    await second.goto(link, { waitUntil: 'networkidle' });
    assert.equal(await second.locator('#calc-labor-in').inputValue(), '$33,980');
    assert.equal(await second.locator('#out-prime-pct').textContent(), '56.1%');
    // the message builder spells out both
    await second.locator('#inq-calc').check();
    assert.match(await second.locator('#inq-preview').textContent(), /labor 26\.1% \(\$33,980\)/);
    // nothing usable typed: the field goes back to the value in use
    await page.locator('#calc-labor-in').fill('abc');
    await page.locator('#calc-labor-in').blur();
    assert.equal(await page.locator('#calc-labor-in').inputValue(), '$33,980');
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  await check('calculator keeps the caret in place while formatting and resets to the example', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    const input = page.locator('#calc-revenue');
    await input.click();
    await input.evaluate((el) => el.setSelectionRange(1, 1)); // "1|00,000"
    await page.keyboard.type('5');
    assert.equal(await input.inputValue(), '1,500,000');
    assert.equal(await input.evaluate((el) => el.selectionStart), 3); // caret stays after the typed 5
    await page.locator('#calc-food').fill('45');
    await page.locator('#calc-reset').click();
    assert.equal(await input.inputValue(), '100,000');
    assert.equal(await page.locator('#calc-food').inputValue(), '31');
    assert.equal(await page.locator('#out-prime-pct').textContent(), '63%');
    await ctx.close();
  });

  await check('shorthand sales, decimal commas and caps show the value actually used', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    // "120k" and "1.5m" can be typed key by key, update live and are tidied on leaving the field
    const input = page.locator('#calc-revenue');
    await input.fill('');
    await input.pressSequentially('120k');
    assert.equal(await input.inputValue(), '120k');
    assert.equal(await page.locator('#out-prime-usd').textContent(), '$75,600');
    await page.keyboard.press('Tab');
    assert.equal(await input.inputValue(), '120,000');
    await input.fill('');
    await input.pressSequentially('1.5m');
    await page.keyboard.press('Tab');
    assert.equal(await input.inputValue(), '1,500,000');
    // dots grouping thousands are thousands, not cents (#34)
    await input.fill('120.000');
    assert.equal(await page.locator('#out-prime-usd').textContent(), '$75,600');
    await page.keyboard.press('Tab');
    assert.equal(await input.inputValue(), '120,000');
    // a negative amount is explained and left as typed, not silently made positive
    await input.fill('-5000');
    assert.match(await page.locator('#calc-revenue-issue').textContent(), /negative/);
    assert.equal(await input.getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('#out-prime-usd').textContent(), '$0');
    await page.keyboard.press('Tab');
    assert.equal(await input.inputValue(), '-5000');
    await input.fill('100,000');
    assert.equal(await page.locator('#calc-revenue-issue').textContent(), '');
    assert.equal(await input.getAttribute('aria-invalid'), null);
    // a decimal comma is a decimal point, and an over-cap amount shows the capped value it is costed at
    await page.locator('#tab-plate').click();
    const cost = page.locator('#plate-rows [data-k="cost"]').first();
    await cost.fill('4,20');
    assert.equal(await page.locator('#plate-out-cost').textContent(), '$6.20');
    await page.keyboard.press('Tab');
    assert.equal(await cost.inputValue(), '4.20');
    await cost.fill('6000');
    await page.keyboard.press('Tab');
    assert.equal(await cost.inputValue(), '1000.00');
    assert.equal(await page.locator('#plate-out-cost').textContent(), '$1,002.00');
    // the shared link reopens exactly what is on screen
    const link = await page.evaluate(() => window.TMHSTools.shareUrl());
    await page.goto(link, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#plate-rows [data-k="cost"]').first().inputValue(), '1000.00');
    assert.equal(await page.locator('#plate-out-cost').textContent(), '$1,002.00');
    await ctx.close();
  });

  await check('calculator explains when costs reach 100% of sales', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#calc-food').fill('50');
    await page.locator('#calc-labor').fill('45');
    await page.locator('#calc-other').fill('10');
    await page.waitForTimeout(600);
    assert.equal(await page.locator('#out-left-usd').textContent(), '$0');
    assert.match(await page.locator('#out-summary').textContent(), /add up to 105% of sales, so nothing is left/);
    await ctx.close();
  });

  await check('sliders announce their value as a percent of sales', async () => {
    const { page, ctx } = await open({ width: 1280, height: 900 });
    assert.equal(await page.locator('#calc-labor').getAttribute('aria-valuetext'), '32% of sales');
    await page.locator('#calc-labor').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#calc-labor').getAttribute('aria-valuetext'), '31% of sales');
    await ctx.close();
  });

  await check('prime cost shows the cost breakdown and what-if savings', async () => {
    const { page, ctx } = await calm({ width: 1280, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('#wi-gap').textContent(), '+$36,000 a year');
    await page.fill('#calc-revenue', '200000');
    await page.locator('#calc-food').fill('40');
    await page.locator('#calc-labor').fill('35');
    assert.equal(await page.locator('#wi-point').textContent(), '$2,000 a month');
    assert.equal(await page.locator('#wi-gap').textContent(), '+$360,000 a year');
    assert.equal(await page.locator('#split-left').textContent(), '13%');
    assert.equal(await page.locator('.calc-out').first().getAttribute('data-band'), 'attention');
    await page.locator('#calc-food').fill('25');
    await page.locator('#calc-labor').fill('30');
    assert.equal(await page.locator('#wi-gap').textContent(), 'Already there');
    await ctx.close();
  });
};
