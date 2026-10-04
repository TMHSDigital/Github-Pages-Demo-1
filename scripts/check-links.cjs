'use strict';
/**
 * External link check. Social networks block bots (403/429/999), so those
 * statuses count as "reachable but guarded"; anything else >= 400 fails.
 * Run: node scripts/check-links.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const FILES = ['index.html', '404.html', 'README.md', ...fs.readdirSync(path.join(__dirname, '..', 'tools')).map((slug) => path.join('tools', slug, 'index.html'))]
  .filter((f) => fs.existsSync(path.join(__dirname, '..', f)));
const GUARDED = new Set([403, 429, 999]);
const IGNORE = [/^https?:\/\/(localhost|www\.w3\.org\/2000\/svg)/, /img\.shields\.io/, /^https:\/\/tmhsdigital\.github\.io\/Github-Pages-Demo-1\/(assets|sitemap|tools)/];

const urls = new Set();
for (const f of FILES) {
  const text = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  for (const m of text.matchAll(/https?:\/\/[^\s"'<>)\]]+/g)) {
    const u = m[0].replace(/[.,;]+$/, '');
    if (!IGNORE.some((re) => re.test(u))) urls.add(u);
  }
}

(async () => {
  let failed = 0;
  for (const url of [...urls].sort()) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 link-check' } });
      const ok = res.status < 400 || GUARDED.has(res.status);
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${res.status} ${url}`);
      if (!ok) failed++;
    } catch (e) {
      console.log(`FAIL ERR ${url} (${e.message})`);
      failed++;
    }
  }
  console.log(`\n${urls.size - failed}/${urls.size} links ok`);
  process.exit(failed ? 1 : 0);
})();
