'use strict';
/**
 * Unit tests for the pure calculator maths in js/calc-math.js. No browser needed.
 * The file is a classic browser script, so it is run in a VM context with a stand-in window.
 *
 * Run: npm run test:unit
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'calc-math.js'), 'utf8'), context);
const C = context.window.TMHSCalc;

const table = (name, fn, cases) => {
  test(name, () => {
    for (const [input, expected] of cases) assert.equal(fn(input), expected, `${name}(${JSON.stringify(input)})`);
  });
};

table('parseMoney: plain and grouped amounts', C.parseMoney, [
  ['120000', 120000], ['120,000', 120000], ['$120,000', 120000], ['120 000', 120000],
  ['120000.75', 120000], ['', 0], ['abc', 0],
]);

table('parseMoney: shorthand', C.parseMoney, [
  ['120k', 120000], ['$120K', 120000], ['1.5m', 1500000], ['1,5m', 1500000], ['85,5k', 85500], ['2 k', 2000],
]);

table('parseMoney: dot-grouped thousands (#34)', C.parseMoney, [
  ['120.000', 120000], ['€120.000', 120000], ['1.234.567', 1234567], ['1.500', 1500],
  ['1.234.567,89', 1234567], ['120.5', 120], ['120.50', 120], ['1.5', 1],
]);

table('parseMoney: decimal comma', C.parseMoney, [
  ['12,50', 12], ['2,500', 2500], ['1.234,56', 1234],
]);

table('parseMoney: implausible input reads as nothing (#34)', C.parseMoney, [
  ['-5000', 0], ['$-5,000', 0], ['- 5000', 0], ['1e6', 0], ['2E5', 0],
]);

table('parseMoney: capped at $10M', C.parseMoney, [
  ['99999999', 10000000], ['50m', 10000000],
]);

test('moneyIssue explains implausible input and stays quiet otherwise', () => {
  for (const s of ['-5000', '$-5,000', '1e6']) assert.ok(C.moneyIssue(s), s);
  for (const s of ['', '120,000', '120k', '1.5m', '120.000', 'abc', '120-130']) assert.equal(C.moneyIssue(s), '', s);
});

table('parseAmount: cents and decimal commas', (s) => C.parseAmount(s), [
  ['4.20', 4.2], ['4,20', 4.2], ['4,5', 4.5], ['1.234,56', 1234.56], ['1,234.56', 1234.56], ['4.999', 5], ['', 0],
]);

test('parseAmount: caps', () => {
  assert.equal(C.parseAmount('250000'), 100000);
  assert.equal(C.parseAmount('25', 20), 20);
});

test('parseCost: percentages and P&L dollar amounts (#35)', () => {
  const cases = [
    ['31', 'pct', 31], ['31.5', 'pct', 31.5], ['31,5', 'pct', 31.5], ['31.5%', 'pct', 31.5], ['31.25 %', 'pct', 31.3],
    ['100', 'pct', 100], ['150%', 'pct', 100],
    ['$31,240', 'usd', 31240], ['31240', 'usd', 31240], ['31.240', 'usd', 31240], ['31.2k', 'usd', 31200], ['$90', 'usd', 90], ['101', 'usd', 101],
  ];
  for (const [input, mode, value] of cases) assert.deepEqual({ ...C.parseCost(input) }, { mode, value }, input);
  for (const input of ['', '%', '$', 'abc', '-31', '1e3']) assert.equal(C.parseCost(input), null, input);
});

test('lineShare turns a cost line into a % of sales', () => {
  assert.equal(C.lineShare({ mode: 'pct', value: 31.5 }, 100000), 31.5);
  assert.equal(C.lineShare({ mode: 'usd', value: 31240 }, 100000), 31.2);
  assert.equal(C.lineShare({ mode: 'usd', value: 31240 }, 0), 0);
});

test('derived percentages carry no floating-point noise', () => {
  assert.equal(C.primeCostPct(31.2, 32.1), 63.3);
  assert.equal(C.leftoverPct(31.2, 32.1, 12.3), 24.4);
  assert.equal(C.whatIf(100000, 63.4).gapPts, 3.4);
});

test('break-even (#38)', () => {
  assert.ok(Math.abs(C.breakEven(45000, 62) - 118421.05) < 0.01);
  assert.equal(C.breakEven(45000, 0), 45000);
  assert.equal(C.breakEven(45000, 100), Infinity);
  assert.equal(C.breakEven(45000, 120), Infinity);
  assert.equal(C.breakEven(0, 62), 0);
  assert.ok(Math.abs(C.profitAt(130000, 45000, 62) - 4400) < 1e-9);
  assert.ok(Math.abs(C.profitAt(100000, 45000, 62) + 7000) < 1e-9);
  assert.ok(Math.abs(C.breakEven(45000, 62) / C.WEEKS_PER_MONTH - 27328) < 1);
});

test('actual food cost from inventory, and variance against theoretical (#53)', () => {
  assert.equal(C.cogs(18500, 31200, 17900), 31800);
  assert.equal(C.cogs(10000, 0, 12000), -2000); // a miscount shows up as negative usage
  assert.deepEqual({ ...C.variance(31.8, 29, 100000) }, { pts: 2.8, monthly: 2800, yearly: 33600 });
  assert.deepEqual({ ...C.variance(28.5, 29, 100000) }, { pts: -0.5, monthly: -500, yearly: -6000 });
});

table('variance bands', (p) => C.varianceBand(p).key, [
  [-3, 'strong'], [0, 'strong'], [1, 'strong'], [1.1, 'watch'], [2, 'watch'], [2.1, 'attention'], [6, 'attention'],
]);

test('menu engineering classifies by margin against the weighted average and popularity against 70% of an equal share (#54)', () => {
  // four dishes, 400 sold: average margin (15*150 + 12*150 + 20*50 + 8*50) / 400 = 13.625; popular bar 0.7 / 4 = 17.5%
  const items = [
    { margin: 15, sold: 150 }, // 37.5% sold, above average margin: star
    { margin: 12, sold: 150 }, // popular, below average: plowhorse
    { margin: 20, sold: 50 }, // 12.5% sold, above average: puzzle
    { margin: 8, sold: 50 }, // dog
    { margin: 30, sold: 0 }, // no count yet: unclassified
  ];
  const r = C.menuEngineering(items);
  assert.equal(r.total, 400);
  assert.equal(r.avgMargin, 13.625);
  assert.equal(r.popularBar, 0.175);
  assert.deepEqual([...r.classes], ['star', 'plowhorse', 'puzzle', 'dog', null]);
  assert.equal(C.menuEngineering([{ margin: 10, sold: 5 }, { margin: 12, sold: 0 }]), null); // one counted dish is not a menu
});

table('band boundaries', (p) => C.band(p).key, [
  [0, 'strong'], [59.9, 'strong'], [60, 'target'], [64.9, 'target'], [65, 'watch'], [69.9, 'watch'], [70, 'attention'], [120, 'attention'],
]);

test('primeCostPct and leftoverPct', () => {
  assert.equal(C.primeCostPct(31, 32), 63);
  assert.equal(C.leftoverPct(31, 32, 12), 25);
  assert.equal(C.leftoverPct(50, 50, 10), 0);
});

test('whatIf', () => {
  assert.deepEqual({ ...C.whatIf(100000, 63) }, { pointMonthly: 1000, pointYearly: 12000, gapPts: 3, gapYearly: 36000 });
  assert.equal(C.whatIf(100000, 55).gapYearly, 0);
  assert.equal(C.whatIf(0, 70).pointMonthly, 0);
});

test('pour cost', () => {
  // $30 for 750 ml is about $1.18 an ounce
  assert.ok(Math.abs(C.costPerOz(30, 750) - 1.183) < 0.001);
  assert.ok(Math.abs(C.pourCost(30, 750, 2) - 2.366) < 0.001);
  assert.equal(C.costPerOz(30, 0), 0);
});

test('priceAtTarget and costPct', () => {
  assert.equal(C.priceAtTarget(6.2, 31), 20);
  assert.equal(C.priceAtTarget(5, 0), 0);
  assert.equal(C.costPct(6, 24), 25);
  assert.equal(C.costPct(6, 0), 0);
});

table('vsTarget', (pct) => C.vsTarget(pct, 30).key, [
  [25, 'strong'], [30, 'strong'], [30.05, 'strong'], [31, 'watch'], [33, 'watch'], [33.1, 'attention'],
]);

test('formatting', () => {
  assert.equal(C.usd(1234.5), '$1,235');
  assert.equal(C.usd2(1234.5), '$1,234.50');
  assert.equal(C.pct1(33.333), '33.3%');
});
