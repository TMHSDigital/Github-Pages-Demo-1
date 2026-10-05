'use strict';
/**
 * Keeps the calculator pages (tools/<slug>/index.html) in step with the home page and with
 * the tool registry (tools/tools.json).
 *
 * 1. Shared markup. The icon sprite, header, footer and each tool's markup live once, in
 *    index.html, between <!-- sync:NAME --> and <!-- /sync:NAME --> markers. Every block a tool
 *    page asks for (by having the same markers) is copied in, adjusted for the page's location:
 *    links and images point back up to the site root, and a tool panel loses the tab wiring.
 * 2. Generated markup. Anything that lists the tools or names a tool's address is built from
 *    tools/tools.json: <!-- gen:NAME --> blocks in the pages (the home page's links to each
 *    tool page; each tool page's "More free tools" list, embed snippet and credit line), and
 *    the whole of sitemap.xml and the manifest's shortcuts.
 * 3. The site's address. tools/tools.json `site` is the one place it is set; when it changes, every
 *    page's absolute URLs (canonical, social tags, structured data), robots.txt and the 404
 *    page's base path follow on the next sync. The pages' current address is read from the home
 *    page's canonical link.
 * 4. Consistency. Every registry entry needs its tools/<slug>/ page, a home-page tab and a
 *    sync:tool-<key> block, and every tools/<slug>/ page needs a registry entry.
 *
 * Everything else (titles, metadata, explainer copy) is edited in the page.
 *
 * Run: node scripts/sync-tool-pages.cjs           (rewrite what is out of date)
 *      node scripts/sync-tool-pages.cjs --check   (fail if anything is out of date; used in CI)
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TOOLS = path.join(ROOT, 'tools');
const check = process.argv.includes('--check');
const { site: SITE, tools: REGISTRY } = JSON.parse(fs.readFileSync(path.join(TOOLS, 'tools.json'), 'utf8'));

const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const BLOCK = /<!-- sync:([\w-]+) -->\n([\s\S]*?)[ \t]*<!-- \/sync:\1 -->/g;
const GEN = /([ \t]*)<!-- gen:([\w-]+) -->\n[\s\S]*?[ \t]*<!-- \/gen:\2 -->/g;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const homeFile = path.join(ROOT, 'index.html');
// 3. Move every absolute URL from the address the pages use now to the registry's
const CURRENT = (/<link rel="canonical" href="([^"]+)">/.exec(read(homeFile)) || [])[1] || SITE;
const relocateSite = (text) => (CURRENT === SITE ? text : text.split(CURRENT).join(SITE));
const home = relocateSite(read(homeFile));
const blocks = {};
for (const [, name, body] of home.matchAll(BLOCK)) blocks[name] = body;

// 4. The registry, the tool pages and the home page's tabs and tool blocks must agree
const problems = [];
const pages = fs.readdirSync(TOOLS).filter((slug) => fs.existsSync(path.join(TOOLS, slug, 'index.html')));
for (const t of REGISTRY) {
  if (!pages.includes(t.slug)) problems.push(`tools.json lists ${t.slug}, but tools/${t.slug}/index.html does not exist`);
  if (!home.includes(`data-tool="${t.key}"`)) problems.push(`index.html has no tab for "${t.key}" (data-tool="${t.key}")`);
  if (!blocks[`tool-${t.key}`]) problems.push(`index.html has no sync:tool-${t.key} block`);
}
for (const slug of pages) if (!REGISTRY.some((t) => t.slug === slug)) problems.push(`tools/${slug}/ has no entry in tools/tools.json`);
if (problems.length) {
  console.log(problems.map((p) => '- ' + p).join('\n'));
  process.exit(1);
}

// 1. Shared markup, relocated for a page two levels down (tools/<slug>/ reaches the root through ../../)
const relocate = (html, up) => html
  .replace(/(<a class="(?:brand|foot-brand)"[^>]*?href=")#top"/g, `$1${up}"`) // logos go home
  .replace(/(<a\b[^>]*?\bhref=")(?!#top"|https?:|mailto:|\/|\.\.\/)/g, `$1${up}`)
  .replace(/(<img\b[^>]*?\bsrc=")(?!https?:|data:|\/|\.\.\/)/g, `$1${up}`);

const forPage = (name, body, up) => {
  let out = relocate(body, up);
  // A tool on its own page is not a tab panel
  if (name.startsWith('tool-')) out = out.replace(/(<div class="calc[^"]*" id="[\w-]+") role="tabpanel" aria-labelledby="tab-[\w-]+"( hidden)?>/, '$1>');
  return out;
};

// 2. Generated markup
const joinList = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const generators = {
  'tool-links': () => [
    `<p class="tool-pages">Each one also has its own page with a worked example: ${joinList(REGISTRY.map((t) => `<a href="tools/${t.slug}/">${t.link}</a>`))}.</p>`,
  ],
  'other-tools': (tool) => [
    '<ul class="other-tools">',
    ...REGISTRY.filter((t) => t !== tool).map((t) => `  <li><a class="text-link" href="../${t.slug}/">${t.name} <svg aria-hidden="true"><use href="#i-arrow"/></svg></a></li>`),
    '</ul>',
  ],
  credit: (tool) => [
    `<p class="embed-credit">Free calculator by <a href="${SITE}tools/${tool.slug}/" target="_blank" rel="noopener">TM Hospitality Strategies</a></p>`,
  ],
  embed: (tool) => {
    const origin = new URL(SITE).origin;
    const snippet = `<iframe src="${SITE}tools/${tool.slug}/?embed=1" title="${tool.name} by TM Hospitality Strategies" width="100%" height="900" style="border:0" loading="lazy"></iframe>\n`
      + `<script>addEventListener("message",function(e){if(e.origin!==${JSON.stringify(origin)}||!e.data||e.data.type!=="tmhs:height")return;`
      + 'document.querySelectorAll("iframe").forEach(function(f){if(f.contentWindow===e.source)f.style.height=e.data.height+"px"})})</script>';
    const [first, second] = esc(snippet).split('\n');
    return [
      '<details class="embed-box">',
      '  <summary>Embed this calculator on your site</summary>',
      '  <p>Paste this where the calculator should appear. It sizes itself to fit, links back here, and like this page it sends nothing anywhere. Add <code>&amp;theme=dark</code> to the address for the dark theme.</p>',
      '  <label class="sr-only" for="embed-code">Embed code</label>',
      `  <textarea class="embed-code" id="embed-code" rows="5" readonly>${first}`,
      `${second}</textarea>`, // a textarea's content is literal: no indent on its second line
      '  <p><button type="button" class="btn btn-ghost btn-sm" data-copy="embed-code"><svg aria-hidden="true"><use href="#i-copy"/></svg>Copy the embed code</button> <span class="share-status" role="status"></span></p>',
      '</details>',
    ];
  },
};
const fillGen = (html, file, tool) => html.replace(GEN, (all, indent, name) => {
  if (!generators[name]) throw new Error(`${path.relative(ROOT, file)}: unknown gen:${name} block`);
  const lines = generators[name](tool).map((l, i, a) => (name === 'embed' && i === a.length - 3 ? l : indent + l));
  return `${indent}<!-- gen:${name} -->\n${lines.join('\n')}\n${indent}<!-- /gen:${name} -->`;
});

// Whole files built from the registry
const sitemap = () => [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...['', ...REGISTRY.map((t) => `tools/${t.slug}/`)].flatMap((p) => ['  <url>', `    <loc>${SITE}${p}</loc>`, '  </url>']),
  '</urlset>',
  '',
].join('\n');
const manifestFile = path.join(ROOT, 'manifest.webmanifest');
const manifest = () => {
  const m = JSON.parse(read(manifestFile));
  m.shortcuts = REGISTRY.map((t) => ({ name: t.name, url: `tools/${t.slug}/` }));
  return JSON.stringify(m, null, 2) + '\n';
};

const outputs = [[homeFile, fillGen(home, homeFile)]];
for (const tool of REGISTRY) {
  const file = path.join(TOOLS, tool.slug, 'index.html');
  const up = '../'.repeat(path.relative(ROOT, path.dirname(file)).split(path.sep).length);
  const synced = relocateSite(read(file)).replace(BLOCK, (all, name) => {
    if (!(name in blocks)) throw new Error(`${path.relative(ROOT, file)}: index.html has no sync:${name} block`);
    const indent = /^[ \t]*/.exec(all.slice(all.indexOf('\n') + 1))[0];
    return `<!-- sync:${name} -->\n${forPage(name, blocks[name], up)}${indent}<!-- /sync:${name} -->`;
  });
  outputs.push([file, fillGen(synced, file, tool)]);
}
outputs.push([path.join(ROOT, 'sitemap.xml'), sitemap()], [manifestFile, manifest()]);
// robots.txt points at the sitemap; the 404 page resolves its files through a <base> of the site's path
const robotsFile = path.join(ROOT, 'robots.txt');
outputs.push([robotsFile, read(robotsFile).replace(/^Sitemap: .*$/m, `Sitemap: ${SITE}sitemap.xml`)]);
const notFoundFile = path.join(ROOT, '404.html');
outputs.push([notFoundFile, read(notFoundFile).replace(/<base href="[^"]*">/, `<base href="${new URL(SITE).pathname}">`)]);

let stale = 0;
for (const [file, after] of outputs) {
  if (fs.existsSync(file) && read(file) === after) continue;
  stale++;
  if (check) console.log(`out of date: ${path.relative(ROOT, file)}`);
  else { fs.writeFileSync(file, after); console.log(`updated ${path.relative(ROOT, file)}`); }
}

if (check && stale) {
  console.log('\nRun `npm run sync` and commit the result.');
  process.exit(1);
}
if (!stale) console.log('pages, sitemap, manifest, robots.txt and 404 page are in sync with index.html and tools/tools.json');
