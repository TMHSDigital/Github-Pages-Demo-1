'use strict';
/**
 * Builds the publishable site into _site/ (used by the Pages workflow and CI).
 * Source files stay unbundled for development; the published copy gets one
 * minified stylesheet and minified scripts. Fonts and images are copied as is.
 *
 * Run: npm i --no-save esbuild && node scripts/stage.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_site');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });

for (const f of ['robots.txt', 'sitemap.xml']) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const minCss = (files) => esbuild.transformSync(files.map(read).join('\n'), { loader: 'css', minify: true }).code;

// Stylesheets: the font URLs are relative to css/, so the bundle stays in css/
fs.writeFileSync(path.join(OUT, 'css', 'site.min.css'), minCss(['css/tokens.css', 'css/base.css', 'css/components.css']));
fs.writeFileSync(path.join(OUT, 'css', 'base.min.css'), minCss(['css/tokens.css', 'css/base.css']));

// Scripts: minified in place (same names, so the HTML needs no change)
for (const f of fs.readdirSync(path.join(ROOT, 'js'))) {
  const code = esbuild.transformSync(read(path.join('js', f)), { loader: 'js', minify: true }).code;
  fs.writeFileSync(path.join(OUT, 'js', f), code);
}

// HTML: swap the stylesheet links for the bundles
const stripLinks = (html, bundle, files) => {
  let out = html;
  files.forEach((f, i) => {
    const re = new RegExp(`\\s*<link rel="stylesheet" href="css/${f}\\.css">`);
    out = out.replace(re, i === 0 ? `\n  <link rel="stylesheet" href="css/${bundle}.min.css">` : '');
  });
  return out;
};
fs.writeFileSync(path.join(OUT, 'index.html'), stripLinks(read('index.html'), 'site', ['tokens', 'base', 'components']));
fs.writeFileSync(path.join(OUT, '404.html'), stripLinks(read('404.html'), 'base', ['tokens', 'base']));

const size = (p) => fs.statSync(path.join(OUT, p)).size;
console.log(`staged _site: site.min.css ${size('css/site.min.css')} B (from ${['tokens', 'base', 'components'].reduce((n, f) => n + fs.statSync(path.join(ROOT, `css/${f}.css`)).size, 0)} B)`);
