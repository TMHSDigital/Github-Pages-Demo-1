'use strict';
// A full keyboard walk of every page: each Tab stop has an accessible name, is visible (or shows
// its focus on the visible control it stands in for) and never jumps back up the page.
// Run alone with: npm test -- keyboard
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pages: PAGES = [] } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'tools.json'), 'utf8'));

// Saved data, so the tracker's and menu's own controls are part of the walk
const MENU = JSON.stringify([
  { kind: 'plate', name: 'Short rib', cost: 6.2, price: 22, suggested: false, sold: 150, state: 'rows=Protein_4.2&target=30&price=22' },
  { kind: 'plate', name: 'Pasta', cost: 3.1, price: 16, suggested: false, sold: 90, state: 'rows=Pasta_3.1&target=30&price=16' },
]);
const MONTHS = JSON.stringify([{ month: '2026-08', sales: 90000, food: 32, labor: 33, other: 12 }, { month: '2026-09', sales: 95000, food: 31, labor: 31.5, other: 12 }]);

module.exports = async ({ browser, base, check, TOOL_SLUGS }) => {
  for (const page of ['', ...TOOL_SLUGS.map((s) => `tools/${s}/`), ...PAGES]) {
    await check(`keyboard walk of /${page}: every stop named, visible and in reading order, at 1280 and 375px`, async () => {
      for (const width of [1280, 375]) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        await ctx.addInitScript(([m, t]) => { localStorage.setItem('tmhs-menu', m); localStorage.setItem('tmhs-prime-months', t); }, [MENU, MONTHS]);
        const p = await ctx.newPage();
        await p.goto(base + page, { waitUntil: 'networkidle' });
        const problems = [];
        let stops = 0;
        let lastY = -1;
        for (let i = 0; i < 400; i++) {
          await p.keyboard.press('Tab');
          const s = await p.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return { body: true };
            if (el.dataset.walked) return { repeat: true }; // a date field's month and year parts
            el.dataset.walked = '1';
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            const byId = (ids) => ids.split(' ').map((id) => (document.getElementById(id) || {}).textContent || '').join(' ');
            const name = (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') && byId(el.getAttribute('aria-labelledby')))
              || (el.labels && el.labels[0] && el.labels[0].textContent) || el.textContent || el.getAttribute('title')
              || (el.querySelector('img[alt]') || {}).alt || '').replace(/\s+/g, ' ').trim();
            // a visually hidden checkbox is fine when the control drawn for it shows the focus ring
            const standIn = el.nextElementSibling && getComputedStyle(el.nextElementSibling).outlineStyle !== 'none' ? el.nextElementSibling : null;
            const invisible = cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0 || r.width < 2 || r.height < 2
              || !!el.closest('[hidden],[inert],[aria-hidden="true"]');
            return { what: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${name.slice(0, 40)}"`, name, invisible: invisible && !standIn, y: r.top + window.scrollY };
          });
          if (s.body) { if (stops) break; continue; } // back at the start: the whole page is walked
          if (s.repeat) continue;
          stops++;
          if (!s.name) problems.push(`no accessible name: ${s.what}`);
          if (s.invisible) problems.push(`focus on something invisible: ${s.what}`);
          if (s.y < lastY - 400) problems.push(`focus jumps back up ${Math.round(lastY - s.y)}px to ${s.what}`);
          lastY = s.y;
        }
        assert.ok(stops > 5, `only ${stops} tab stops at ${width}px`);
        assert.deepEqual(problems.map((x) => `${width}px: ${x}`), []);
        await ctx.close();
      }
    });
  }
};
