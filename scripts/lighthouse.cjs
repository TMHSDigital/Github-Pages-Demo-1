'use strict';
/**
 * Lighthouse budgets for every page in sitemap.xml, run against the staged build in _site/.
 * Fails if any page scores below a floor. Writes a score table to the GitHub job summary
 * when run in Actions.
 *
 * Run: npm run build && node scripts/lighthouse.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const ORIGIN = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'tools.json'), 'utf8')).site; // the site's address, from the tool registry
const FLOORS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 95 };
const RUNS = 2;
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };

if (!fs.existsSync(path.join(SITE, 'index.html'))) {
  console.error('No _site/ build found. Run `npm run build` first.');
  process.exit(1);
}

const pages = [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].replace(ORIGIN, ''));

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(SITE, rel);
  if (rel.endsWith('/')) file = path.join(file, 'index.html');
  if (!file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

// Lighthouse runs as a child process (asynchronously, so this process keeps serving the pages)
const audit = (url, out) => new Promise((resolve, reject) => {
  const cli = path.join(ROOT, 'node_modules', 'lighthouse', 'cli', 'index.js');
  const args = [cli, url, '--output=json', `--output-path=${out}`, '--quiet', '--chrome-flags=--headless=new --no-sandbox'];
  spawn(process.execPath, args, { stdio: 'inherit' }).on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`lighthouse exited ${code}`))));
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lh-'));
  const rows = [];
  let failed = 0;

  for (const [i, page] of pages.entries()) {
    // Performance varies from run to run (a cold first run especially), so a page under a floor
    // gets one more run and keeps its best score per category
    const scores = {};
    let bad = [];
    for (let run = 0; run < RUNS && (run === 0 || bad.length); run++) {
      const out = path.join(tmp, `${i}-${run}.json`);
      try {
        await audit(base + page, out);
      } catch (e) {
        console.log(`lighthouse run failed for /${page}: ${e.message}`);
        continue;
      }
      const cats = JSON.parse(fs.readFileSync(out, 'utf8')).categories;
      for (const k of Object.keys(FLOORS)) scores[k] = Math.max(scores[k] ?? 0, Math.round(cats[k].score * 100));
      bad = Object.keys(FLOORS).filter((k) => scores[k] < FLOORS[k]);
    }
    if (!Object.keys(scores).length) bad = Object.keys(FLOORS);
    if (bad.length) failed++;
    rows.push({ page, scores, bad });
    console.log(`${bad.length ? 'FAIL' : 'ok  '} /${page} ${JSON.stringify(scores)}`);
  }
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });

  const keys = Object.keys(FLOORS);
  const table = [
    `| Page | ${keys.join(' | ')} |`,
    `| :-- | ${keys.map(() => '--:').join(' | ')} |`,
    ...rows.map((r) => `| \`/${r.page}\` | ${keys.map((k) => (r.scores[k] == null ? '–' : (r.bad.includes(k) ? `**${r.scores[k]}** ✗` : r.scores[k]))).join(' | ')} |`),
    '',
    `Floors: ${keys.map((k) => `${k} ${FLOORS[k]}`).join(', ')}.`,
  ].join('\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Lighthouse\n\n${table}\n`);

  console.log(`\n${pages.length - failed}/${pages.length} pages meet the Lighthouse floors`);
  process.exit(failed ? 1 : 0);
})();
