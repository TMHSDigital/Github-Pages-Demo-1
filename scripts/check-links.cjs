'use strict';
/**
 * External link check. Social networks block bots (403/429/999), so those
 * statuses count as "reachable but guarded"; anything else >= 400 fails. Network
 * errors and 5xx responses are retried twice before they count.
 * Run: node scripts/check-links.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const FILES = ['index.html', '404.html', 'README.md', ...fs.readdirSync(path.join(__dirname, '..', 'tools')).map((slug) => path.join('tools', slug, 'index.html'))]
  .filter((f) => fs.existsSync(path.join(__dirname, '..', f)));
const GUARDED = new Set([403, 429, 999]);
const IGNORE = [/^https:\/\/tmhsdigital\.github\.io\/?$/, /^https?:\/\/(localhost|www\.w3\.org\/2000\/svg)/, /img\.shields\.io/, /^https:\/\/tmhsdigital\.github\.io\/Github-Pages-Demo-1\/(assets|sitemap|tools)/];

const urls = new Set();
for (const f of FILES) {
  // Decode the entities that matter, so an escaped code sample (the embed snippet) reads as its URLs
  const text = fs.readFileSync(path.join(__dirname, '..', f), 'utf8').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  for (const m of text.matchAll(/https?:\/\/[^\s"'<>)\]]+/g)) {
    const u = m[0].replace(/[.,;]+$/, '');
    if (!IGNORE.some((re) => re.test(u))) urls.add(u);
  }
}

// A network error or a 5xx is often a passing blip on the runner or the far end, and a
// dead link is not, so those are retried with a growing pause before counting as broken
const RETRY_PAUSES = [3000, 10000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const probe = async (url) => {
  for (let attempt = 0; ; attempt++) {
    let status;
    let error;
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 link-check' } });
      status = res.status;
    } catch (e) {
      error = e.message;
    }
    if ((error || status >= 500) && attempt < RETRY_PAUSES.length) {
      await sleep(RETRY_PAUSES[attempt]);
      continue;
    }
    return { status, error, attempts: attempt + 1 };
  }
};

(async () => {
  let failed = 0;
  for (const url of [...urls].sort()) {
    const { status, error, attempts } = await probe(url);
    const ok = !error && (status < 400 || GUARDED.has(status));
    const tries = attempts > 1 ? ` after ${attempts} tries` : '';
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${error ? 'ERR' : status} ${url}${error ? ` (${error})` : ''}${tries}`);
    if (!ok) failed++;
  }
  console.log(`\n${urls.size - failed}/${urls.size} links ok`);
  process.exit(failed ? 1 : 0);
})();
