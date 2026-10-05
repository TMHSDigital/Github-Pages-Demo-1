'use strict';
/**
 * Unit tests for the URL extraction in scripts/check-links.cjs (no network).
 * Run: npm run test:unit
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { extractUrls } = require('../scripts/check-links.cjs');
const { site: SITE } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'tools.json'), 'utf8'));

test('plain links in HTML and Markdown', () => {
  assert.deepEqual(extractUrls('<a href="https://example.com/a">x</a> see [docs](https://example.org/b), then https://example.net/c.'), [
    'https://example.com/a', 'https://example.org/b', 'https://example.net/c',
  ]);
});

test('an HTML-escaped code sample yields its URLs, not the escaped script around them (#48)', () => {
  const snippet = `&lt;iframe src=&quot;https://example.com/tools/x/?embed=1&quot;&gt;&lt;/iframe&gt;&lt;script&gt;if(e.origin!==&quot;${new URL(SITE).origin}&quot;||!e.data)return;&lt;/script&gt;`;
  assert.deepEqual(extractUrls(snippet), ['https://example.com/tools/x/?embed=1']);
});

test('ignored hosts and the site\'s own deploy-time paths are skipped', () => {
  assert.deepEqual(extractUrls(`http://localhost:8000/ https://img.shields.io/badge/x ${SITE}assets/a.png ${new URL(SITE).origin}`), []);
});

test('every URL found in the real pages parses', () => {
  const root = path.join(__dirname, '..');
  const pages = ['index.html', 'README.md', ...fs.readdirSync(path.join(root, 'tools')).map((s) => path.join('tools', s, 'index.html'))]
    .filter((p) => fs.existsSync(path.join(root, p)));
  for (const page of pages) {
    for (const url of extractUrls(fs.readFileSync(path.join(root, page), 'utf8'))) {
      assert.doesNotThrow(() => new URL(url), `${page}: ${url}`);
    }
  }
});
