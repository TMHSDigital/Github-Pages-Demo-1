'use strict';
/**
 * The prime cost bands live once, in BANDS in js/calc-math.js. The calculator note, the prime
 * cost explainer and the downloadable spreadsheet repeat them for people to read; these tests
 * fail if any copy drifts from that list (#49). No browser and no dependencies needed.
 *
 * Run: npm run test:unit
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'calc-math.js'), 'utf8'), context);
const { BANDS, band } = context.window.TMHSCalc;
const [strong, target, watch] = BANDS.map((b) => b.below);

// Read one file out of a zip (an .xlsx is a zip of XML files) via its central directory
const unzip = (buf, name) => {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < buf.readUInt16LE(eocd + 10); i++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const skip = buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    if (buf.toString('utf8', p + 46, p + 46 + nameLen) === name) {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + size);
      return (method === 8 ? zlib.inflateRawSync(data) : data).toString('utf8');
    }
    p += 46 + nameLen + skip;
  }
  throw new Error(`${name} not found in the zip`);
};

test('band() follows BANDS at every edge', () => {
  assert.deepEqual([strong - 0.1, strong, target - 0.1, target, watch - 0.1, watch].map((p) => band(p).key),
    ['strong', 'target', 'target', 'watch', 'watch', 'attention']);
});

test('the spreadsheet template\'s Settings sheet matches BANDS', () => {
  const xlsx = fs.readFileSync(path.join(ROOT, 'assets', 'downloads', 'prime-cost-tracker.xlsx'));
  const rid = /<sheet [^>]*name="Settings"[^>]*r:id="([^"]+)"/.exec(unzip(xlsx, 'xl/workbook.xml'))[1];
  const target = new RegExp(`Id="${rid}"[^>]*Target="/?(?:xl/)?([^"]+)"|Target="/?(?:xl/)?([^"]+)"[^>]*Id="${rid}"`).exec(unzip(xlsx, 'xl/_rels/workbook.xml.rels'));
  const sheet = unzip(xlsx, 'xl/' + (target[1] || target[2]));
  const cell = (ref) => Number(new RegExp(`<c r="${ref}"[^>]*>(?:<f>[^<]*</f>)?<v>([^<]+)</v>`).exec(sheet)[1]);
  assert.deepEqual([cell('B3'), cell('B4'), cell('B5')], [...BANDS].map((b) => b.below / 100), // spread: BANDS comes from the vm realm
    'regenerate it with python scripts/make-tracker-template.py after changing the bands there');
});

test('the calculator note states BANDS, on the home page and the prime cost page', () => {
  const note = `under ${strong}% strong, ${strong}-${target}% on target, ${target}-${watch}% watch, over ${watch}% needs attention`;
  for (const page of ['index.html', 'tools/prime-cost-calculator/index.html']) {
    assert.ok(fs.readFileSync(path.join(ROOT, page), 'utf8').includes(note), `${page}: calculator note does not say "${note}"`);
  }
});

test('the prime cost explainer states BANDS', () => {
  const text = fs.readFileSync(path.join(ROOT, 'tools', 'prime-cost-calculator', 'index.html'), 'utf8');
  const prose = `under ${strong}% strong, ${strong} to ${target}% on target, ${target} to ${watch}% worth watching and over ${watch}% needing attention`;
  assert.ok(text.includes(prose), `explainer does not say "${prose}"`);
});
