'use strict';
// Message builder, email links and the quick-contact bar. Run alone with: npm test -- contact
const assert = require('node:assert/strict');

module.exports = async ({ base, check, calm }) => {
  // Contact: inquiry builder and quick-contact bar
  await check('talk through these numbers brings the results into a copyable message', async () => {
    const { page, ctx } = await calm({ width: 1280, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('#talk-numbers').click();
    assert.equal(await page.locator('#inq-calc').isChecked(), true);
    await page.locator('.topics label', { hasText: 'Costs' }).click();
    await page.locator('.topics label', { hasText: 'Menu' }).click();
    await page.selectOption('#inq-venue', 'Independent restaurant');
    await page.fill('#inq-note', 'Two sites, opening a third.');
    const text = await page.locator('#inq-preview').textContent();
    assert.match(text, /I run an independent restaurant and would like help with costs and margins and menu and pricing\./);
    assert.match(text, /Two sites, opening a third\./);
    assert.match(text, /My numbers from your prime cost calculator:\nMonthly sales: \$100,000/);
    assert.match(text, /Prime cost: 63% \(on target\)/);
    assert.match(text, /Link: http.*\?tool=prime&sales=100000/);
    await page.locator('#inq-copy').click();
    await page.waitForFunction(() => window.__copied);
    assert.equal(await page.evaluate(() => window.__copied), text);
    await page.waitForFunction(() => document.getElementById('inq-status').textContent);
    assert.match(await page.locator('#inq-status').textContent(), /Paste it into a LinkedIn message/);
    assert.equal(await page.locator('#inq-email').isVisible(), false);
    await ctx.close();
  });

  // The address is set in the source; the minified build folds the empty constant away, so this runs on source only
  if (!process.env.SITE_DIR) {
    await check('setting CONTACT_EMAIL turns on the email links', async () => {
      const { page, ctx } = await calm({ width: 1280, height: 900 });
      await page.route('**/js/inquiry.js', async (route) => {
        const body = (await (await route.fetch()).text()).replace(/CONTACT_EMAIL\s*=\s*(''|"")/, 'CONTACT_EMAIL="hello@example.com"');
        route.fulfill({ body, contentType: 'text/javascript' });
      });
      await page.goto(base, { waitUntil: 'networkidle' });
      assert.match(await page.locator('#email-cta').getAttribute('href'), /^mailto:hello@example\.com\?subject=/);
      assert.equal(await page.locator('#email-cta').getAttribute('target'), null);
      assert.equal(await page.locator('#inq-email').isVisible(), true);
      await page.locator('.topics label', { hasText: 'Operations' }).click();
      const href = await page.locator('#inq-email').getAttribute('href');
      assert.match(href, /^mailto:hello@example\.com\?subject=Hospitality%20strategy%20inquiry&body=/);
      assert.match(decodeURIComponent(href), /would like help with operations and systems/);
      // with numbers included, the email carries the share link rather than every line (#52)
      await page.check('#inq-calc');
      const withNumbers = decodeURIComponent(await page.locator('#inq-email').getAttribute('href'));
      assert.match(withNumbers, /My numbers from your prime cost calculator: http.*\?tool=prime&sales=100000/);
      assert.doesNotMatch(withNumbers, /Monthly sales:/);
      assert.match(await page.locator('#inq-preview').textContent(), /Monthly sales: \$100,000/); // the copied message keeps them
      // a worst case stays under the limit, and past it the button gives way to a copy hint
      const rows = Array.from({ length: 12 }, (_, i) => `House infused aged rum blend number ${String(i).padStart(2, '0')}_32_750_1.5`).join('*');
      await page.goto(`${base}?tool=cocktail&rows=${encodeURIComponent(rows)}&target=20&price=16&extra=0.5#contact`, { waitUntil: 'networkidle' });
      await page.check('#inq-calc');
      await page.fill('#inq-note', 'We are opening a second bar in the spring and want to get pricing right across the cocktail list before then.');
      const long = await page.locator('#inq-email').getAttribute('href');
      assert.ok(long.length <= 1900, `mailto is ${long.length} characters`);
      await page.fill('#inq-note', 'Queremos revisar los precios de los cócteles y la carta de vinos antes de la apertura. '.repeat(7).slice(0, 600)); // accented text encodes to 6 characters a letter
      assert.equal(await page.locator('#inq-email').isVisible(), false);
      assert.match(await page.locator('#inq-hint').textContent(), /too long to open in a mail app\. Copy it and paste it into an email to hello@example\.com/);
      await page.fill('#inq-note', 'Short note.');
      assert.equal(await page.locator('#inq-email').isVisible(), true);
      await ctx.close();
    });
  }

  await check('mobile quick-contact bar shows between the hero and the contact section', async () => {
    const { page, ctx } = await calm({ width: 375, height: 800 });
    await page.goto(base, { waitUntil: 'networkidle' });
    const shown = () => page.locator('#sticky-cta').evaluate((el) => getComputedStyle(el).visibility === 'visible');
    assert.equal(await shown(), false);
    await page.evaluate(() => document.getElementById('services').scrollIntoView());
    await page.waitForTimeout(200);
    assert.equal(await shown(), true);
    await page.locator('#tab-plate').dispatchEvent('click');
    await page.locator('#plate-price').focus(); // out of the way while typing
    await page.waitForTimeout(100);
    assert.equal(await shown(), false);
    await page.locator('#plate-price').blur();
    await page.evaluate(() => document.getElementById('contact').scrollIntoView());
    await page.waitForTimeout(200);
    assert.equal(await shown(), false);
    await ctx.close();
    const desk = await calm({ width: 1280, height: 900 });
    await desk.page.goto(base, { waitUntil: 'networkidle' });
    await desk.page.evaluate(() => document.getElementById('services').scrollIntoView());
    assert.equal(await desk.page.locator('#sticky-cta').isVisible(), false);
    await desk.ctx.close();
  });
};
