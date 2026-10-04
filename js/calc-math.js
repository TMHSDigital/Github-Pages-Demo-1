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

  // Whole dollars, for monthly sales. Accepts shorthand: "$120k" is 120,000 and "1.5M" is 1,500,000.
  const SUFFIX = { k: 1e3, m: 1e6 };
  const parseMoney = (text) => {
    const raw = String(text).trim().toLowerCase();
    const suffix = /\d\s*([km])\b/.exec(raw);
    const n = parseFloat(toDecimal(raw));
    if (!Number.isFinite(n)) return 0;
    const dollars = suffix ? Math.round(n * SUFFIX[suffix[1]]) : Math.floor(n); // plain amounts ignore cents
    return Math.min(dollars, MAX_SALES);
  };

  // Dollars and cents (or ounces), for ingredient costs, prices and pours
  const parseAmount = (text, max = 100000) => {
    const n = parseFloat(toDecimal(text));
    return Number.isFinite(n) ? Math.min(Math.round(n * 100) / 100, max) : 0;
  };

  const primeCostPct = (food, labor) => food + labor;
  const leftoverPct = (food, labor, other) => Math.max(0, 100 - food - labor - other);

  // under 60 strong, 60 to <65 on target, 65 to <70 watch, 70+ needs attention
  const STRONG_BELOW = 60;
  const band = (pct) => {
    if (pct < STRONG_BELOW) return { key: 'strong', label: 'Strong' };
    if (pct < 65) return { key: 'target', label: 'On target' };
    if (pct < 70) return { key: 'watch', label: 'Watch closely' };
    return { key: 'attention', label: 'Needs attention' };
  };

  // What one point of prime cost is worth, and what reaching the strong band would free up
  const whatIf = (sales, pct) => ({
    pointMonthly: sales / 100,
    pointYearly: (sales / 100) * 12,
    gapPts: Math.max(0, pct - STRONG_BELOW),
    gapYearly: (Math.max(0, pct - STRONG_BELOW) * sales * 12) / 100,
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

  const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const usd2 = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct1 = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US') + '%';

  return { parseMoney, parseAmount, primeCostPct, leftoverPct, band, whatIf, costPerOz, pourCost, priceAtTarget, costPct, vsTarget, usd, usd2, pct1, STRONG_BELOW };
})();

window.TMHSCalc = TMHSCalc;

// Registry the toolkit tabs, share link and inquiry builder use to talk to each tool:
// each tool registers { label, get(), set(state), summary() }.
window.TMHSTools = { tools: {}, active: 'prime' };
