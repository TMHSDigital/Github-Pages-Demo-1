'use strict';
// Theme toggle and following the system theme. Run alone with: npm test -- theme
const assert = require('node:assert/strict');

module.exports = async ({ browser, base, check }) => {
  // Theme toggle
  await check('theme toggle switches, persists and updates aria-pressed', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    const btn = page.locator('#theme-toggle');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
    assert.equal(await btn.getAttribute('aria-pressed'), 'false');
    await btn.click();
    // the switch may run inside a view transition, so wait for it to land
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', null, { timeout: 3000 });
    assert.equal(await btn.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.querySelector('meta[name="theme-color"]').content), '#0A1226');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    assert.equal(await page.evaluate(() => localStorage.getItem('tmhs-theme')), 'dark');
    await ctx.close();
  });

  await check('follows the system theme until a choice is saved', async () => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    await ctx.close();
  });
};
