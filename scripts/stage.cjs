'use strict';
/**
 * Builds the publishable site into _site/ (used by the Pages workflow and CI).
 * Source files stay unbundled for development; the published copy gets one
 * minified stylesheet (inlined into the home page), minified scripts and a
 * hash-based Content-Security-Policy. Fonts and images are copied as is.
 *
 * Run: npm ci && npm run build
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_site');

// Empty _site rather than deleting it, so a local server running inside it keeps working
fs.mkdirSync(OUT, { recursive: true });
for (const entry of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, entry), { recursive: true, force: true });
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
// The home page inlines its (small) stylesheet to remove a render-blocking request.
// Font URLs are relative to css/, so they are rewritten for the page root.
const inlineCss = fs.readFileSync(path.join(OUT, 'css', 'site.min.css'), 'utf8').replace(/url\((['"]?)\.\.\/assets\//g, 'url($1assets/');
const home = stripLinks(read('index.html'), 'site', ['tokens', 'base', 'components'])
  .replace('<link rel="stylesheet" href="css/site.min.css">', () => `<style>${inlineCss}</style>`);
// Content-Security-Policy: only this site's own files, plus the exact inline
// <script> and <style> blocks of each page (allowed by hash). JSON-LD is data, not script.
const sha = (text) => `'sha256-${crypto.createHash('sha256').update(text, 'utf8').digest('base64')}'`;
const withCsp = (html) => {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => sha(m[1]));
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => sha(m[1]));
  const policy = [
    "default-src 'self'",
    `script-src 'self' ${scripts.join(' ')}`.trim(),
    `style-src 'self' ${styles.join(' ')}`.trim(),
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'", // 'none' would also block same-origin tools such as Lighthouse's robots.txt check
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
  return html.replace(/(<meta name="viewport"[^>]*>)/, `$1
  <meta http-equiv="Content-Security-Policy" content="${policy}">`);
};
fs.writeFileSync(path.join(OUT, 'index.html'), withCsp(home));
fs.writeFileSync(path.join(OUT, '404.html'), withCsp(stripLinks(read('404.html'), 'base', ['tokens', 'base'])));

const size = (p) => fs.statSync(path.join(OUT, p)).size;
console.log(`staged _site: site.min.css ${size('css/site.min.css')} B (from ${['tokens', 'base', 'components'].reduce((n, f) => n + fs.statSync(path.join(ROOT, `css/${f}.css`)).size, 0)} B)`);
