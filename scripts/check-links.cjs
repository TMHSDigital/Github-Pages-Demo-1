'use strict';
/**
 * External link check. Social networks block bots (403/429/999), so those
 * statuses count as "reachable but guarded"; anything else >= 400 fails. Network
 * errors and 5xx responses are retried twice before they count.
 * Runs weekly in .github/workflows/links.yml (it does not gate deploys: other people's
 * servers should not stop a release). With LINK_REPORT=<file> it also writes a Markdown
 * report of the broken links, which that workflow posts as an issue.
 * Run: node scripts/check-links.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const FILES = ['index.html', '404.html', 'README.md', ...fs.readdirSync(path.join(__dirname, '..', 'tools')).map((slug) => path.join('tools', slug, 'index.html'))]
  .filter((f) => fs.existsSync(path.join(__dirname, '..', f)));
const GUARDED = new Set([403, 429, 999]);
const IGNORE = [/^https:\/\/tmhsdigital\.github\.io\/?$/, /^https?:\/\/(localhost|www\.w3\.org\/2000\/svg)/, /img\.shields\.io/, /^https:\/\/tmhsdigital\.github\.io\/Github-Pages-Demo-1\/(assets|sitemap|tools)/];

// Every external URL in a page or document. Entities are decoded first, so an escaped code
// sample (the embed snippet) reads as the URLs it contains
const extractUrls = (text) => {
  const decoded = text.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const found = new Set();
  for (const m of decoded.matchAll(/https?:\/\/[^\s"'<>)\]]+/g)) {
    const u = m[0].replace(/[.,;]+$/, '');
    if (!IGNORE.some((re) => re.test(u))) found.add(u);
  }
  return [...found];
};

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

const main = async () => {
  const urls = new Set(FILES.flatMap((f) => extractUrls(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'))));
  const broken = [];
  for (const url of [...urls].sort()) {
    const { status, error, attempts } = await probe(url);
    const ok = !error && (status < 400 || GUARDED.has(status));
    const tries = attempts > 1 ? ` after ${attempts} tries` : '';
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${error ? 'ERR' : status} ${url}${error ? ` (${error})` : ''}${tries}`);
    if (!ok) broken.push({ url, result: error ? `no response (${error})` : `HTTP ${status}` });
  }
  console.log(`\n${urls.size - broken.length}/${urls.size} links ok`);
  if (process.env.LINK_REPORT) {
    const where = (url) => FILES.filter((f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8').includes(url)).map((f) => `\`${f.split(path.sep).join('/')}\``).join(', ');
    fs.writeFileSync(process.env.LINK_REPORT, [
      `${broken.length} of ${urls.size} external links failed in the weekly check.`, '',
      '| Link | Result | Found in |', '| :-- | :-- | :-- |',
      ...broken.map((b) => `| ${b.url} | ${b.result} | ${where(b.url)} |`), '',
      'Fix or remove each link, or add it to `IGNORE` in `scripts/check-links.cjs` if it only blocks bots. This issue closes itself when a weekly run passes.',
    ].join('\n'));
  }
  process.exit(broken.length ? 1 : 0);
};

if (require.main === module) main();
module.exports = { extractUrls };
