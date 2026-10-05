'use strict';

// Pure maths for the operator toolkit (prime, plate and cocktail cost).
// Everything runs in the browser; nothing is sent or stored.
// Prime cost bands are common rules of thumb and are flagged TODO(verify) in index.html.
const TMHSCalc = (() => {
  const MAX_SALES = 10000000;
  const ML_PER_OZ = 29.5735;

  // Normalises typed numbers to a plain decimal string: "1,234.56" and "1.234,56" both become
  // "1234.56", and a lone comma before one or two digits is a decimal comma ("4,20" is 4.20)
  const toDecimal = (text) => {
    const s = String(text).replace(/[^\d.,]/g, '');
    const comma = s.lastIndexOf(',');
    if (comma > s.lastIndexOf('.') && /^,\d{1,2}$/.test(s.slice(comma))) {
      return s.slice(0, comma).replace(/[.,]/g, '') + '.' + s.slice(comma + 1);
    }
    return s.replace(/,/g, '');
  };

  // Sales that can't be meant as typed: a minus sign or scientific notation. Returns why, or ''.
  const moneyIssue = (text) => {
    const raw = String(text).trim();
    if (/(^|[^\d\s])\s*-\s*\d/.test(raw)) return 'Sales can’t be negative. Enter the amount without a minus sign.';
    if (/\d\s*e\s*[+-]?\d/i.test(raw)) return 'Type the full amount, for example 1,000,000 or 1m.';
    return '';
  };

  // Whole dollars, for monthly sales. Accepts shorthand: "$120k" is 120,000 and "1.5M" is 1,500,000.
  // Dots grouping thousands ("120.000", "1.234.567") read as thousands, since sales has no cents.
  const SUFFIX = { k: 1e3, m: 1e6 };
  const DOT_THOUSANDS = /^\d{1,3}(\.\d{3})+$/;
  const parseMoney = (text) => {
    const raw = String(text).trim().toLowerCase();
    if (moneyIssue(raw)) return 0;
    const suffix = /\d\s*([km])\b/.exec(raw);
    const plain = toDecimal(raw);
    const n = parseFloat(!suffix && DOT_THOUSANDS.test(plain) ? plain.replace(/\./g, '') : plain);
    if (!Number.isFinite(n)) return 0;
    const dollars = suffix ? Math.round(n * SUFFIX[suffix[1]]) : Math.floor(n); // plain amounts ignore cents
    return Math.min(dollars, MAX_SALES);
  };

  // Dollars and cents (or ounces), for ingredient costs, prices and pours
  const parseAmount = (text, max = 100000) => {
    const n = parseFloat(toDecimal(text));
    return Number.isFinite(n) ? Math.min(Math.round(n * 100) / 100, max) : 0;
  };

  // A prime cost line as typed: a percentage of sales ("31.5%", "31,5", "31") or a dollar amount
  // from the P&L ("$31,240", "31.2k", or any plain number over 100). Returns { mode, value }, or
  // null when there is nothing usable to read.
  const round1 = (n) => Math.round(n * 10) / 10;
  const parseCost = (text) => {
    const raw = String(text).trim();
    if (!/\d/.test(raw) || moneyIssue(raw)) return null;
    const pct = Math.min(round1(parseAmount(raw, 1000)), 100);
    if (raw.includes('%')) return { mode: 'pct', value: pct };
    const dollars = parseMoney(raw);
    if (raw.includes('$') || /\d\s*[km]\b/i.test(raw) || dollars > 100) return { mode: 'usd', value: dollars };
    return { mode: 'pct', value: pct };
  };
  // That line as a % of sales: dollar amounts need sales to become a share
  const lineShare = (cost, sales) => (cost.mode === 'usd' ? (sales > 0 ? round1((cost.value / sales) * 100) : 0) : cost.value);

  const primeCostPct = (food, labor) => round1(food + labor);
  const leftoverPct = (food, labor, other) => Math.max(0, round1(100 - food - labor - other));

  // Prime cost bands: the one source for the calculator, tracker and copy. The page notes and
  // explainer and the spreadsheet template's Settings sheet repeat them; tests/bands.test.cjs
  // fails if any of those drift from this list. TODO(verify) the thresholds (#27).
  const BANDS = Object.freeze([
    { below: 60, key: 'strong', label: 'Strong' },
    { below: 65, key: 'target', label: 'On target' },
    { below: 70, key: 'watch', label: 'Watch closely' },
  ]);
  const ABOVE = { key: 'attention', label: 'Needs attention' };
  const STRONG_BELOW = BANDS[0].below;
  const band = (pct) => {
    const b = BANDS.find((x) => pct < x.below) || ABOVE;
    return { key: b.key, label: b.label };
  };

  // What one point of prime cost is worth, and what reaching the strong band would free up
  const whatIf = (sales, pct) => ({
    pointMonthly: sales / 100,
    pointYearly: (sales / 100) * 12,
    gapPts: Math.max(0, round1(pct - STRONG_BELOW)),
    gapYearly: (Math.max(0, round1(pct - STRONG_BELOW)) * sales * 12) / 100,
  });

  const costPerOz = (bottlePrice, bottleMl) => (bottleMl > 0 ? bottlePrice / (bottleMl / ML_PER_OZ) : 0);
  const pourCost = (bottlePrice, bottleMl, oz) => costPerOz(bottlePrice, bottleMl) * oz;
  const priceAtTarget = (cost, targetPct) => (targetPct > 0 ? cost / (targetPct / 100) : 0);
  const costPct = (cost, price) => (price > 0 ? (cost / price) * 100 : 0);

  // Your own cost % against your own target, so no outside benchmark is implied
  const vsTarget = (actualPct, targetPct) => {
    if (actualPct <= targetPct + 0.05) return { key: 'strong', label: 'At or under target' };
    if (actualPct <= targetPct + 3) return { key: 'watch', label: 'Slightly over target' };
    return { key: 'attention', label: 'Over target' };
  };

  // Break-even: the sales at which what is left after variable costs exactly covers fixed costs.
  // Variable costs at or above 100% of sales can never break even (Infinity).
  const breakEven = (fixed, variablePct) => (variablePct >= 100 ? Infinity : fixed / (1 - variablePct / 100));
  const profitAt = (sales, fixed, variablePct) => sales * (1 - variablePct / 100) - fixed;
  const WEEKS_PER_MONTH = 52 / 12;

  // Actual food cost from an inventory count: what was used is what you started with, plus what
  // came in, minus what is left. Negative usage means the counts or purchases are wrong.
  const cogs = (opening, purchases, closing) => opening + purchases - closing;
  // Actual against theoretical (recipe) food cost, in points of sales and dollars
  const variance = (actualPct, theoryPct, sales) => {
    const pts = round1(actualPct - theoryPct);
    return { pts, monthly: (pts * sales) / 100, yearly: (pts * sales * 12) / 100 };
  };
  // How far over theoretical is worth a look. TODO(verify) the thresholds with the owner (#27).
  const VARIANCE_BANDS = Object.freeze([
    { upTo: 1, key: 'strong', label: 'Close to theoretical' },
    { upTo: 2, key: 'watch', label: 'Worth a look' },
  ]);
  const varianceBand = (pts) => {
    const b = VARIANCE_BANDS.find((x) => pts <= x.upTo) || { key: 'attention', label: 'Well over theoretical' };
    return { key: b.key, label: b.label };
  };

  // Menu engineering (Kasavana and Smith): each dish's contribution margin (price minus cost)
  // against the menu's sales-weighted average margin, and its share of items sold against 70% of
  // an equal share. Dishes with no sales count are left unclassified; it needs two counted dishes.
  const menuEngineering = (items) => {
    const counted = items.filter((i) => i.sold > 0);
    const total = counted.reduce((n, i) => n + i.sold, 0);
    if (counted.length < 2) return null;
    const avgMargin = counted.reduce((n, i) => n + i.margin * i.sold, 0) / total;
    const popularBar = 0.7 / counted.length;
    const classOf = (i) => {
      if (!(i.sold > 0)) return null;
      const earns = i.margin >= avgMargin;
      const popular = i.sold / total >= popularBar;
      return earns ? (popular ? 'star' : 'puzzle') : (popular ? 'plowhorse' : 'dog');
    };
    return { avgMargin, popularBar, total, classes: items.map(classOf) };
  };

  const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const usd2 = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct1 = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US') + '%';

  return { parseMoney, moneyIssue, parseAmount, parseCost, lineShare, breakEven, profitAt, WEEKS_PER_MONTH, cogs, variance, varianceBand, VARIANCE_BANDS, menuEngineering, primeCostPct, leftoverPct, band, whatIf, costPerOz, pourCost, priceAtTarget, costPct, vsTarget, usd, usd2, pct1, STRONG_BELOW, BANDS };
})();

window.TMHSCalc = TMHSCalc;

// Registry the toolkit tabs, share link and inquiry builder use to talk to each tool:
// each tool registers { label, get(), set(state), summary() }.
window.TMHSTools = { tools: {}, active: 'prime' };
