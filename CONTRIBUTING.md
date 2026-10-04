# Contributing

Thanks for helping with the TM Hospitality Strategies site. It is a small, dependency-free static site, so contributing is quick.

## Ground rules

- **Vanilla only.** HTML, CSS and JavaScript with no framework, bundler or runtime dependencies. Tooling (Playwright, axe-core, esbuild) is for tests and publishing only.
- **No invented claims.** Do not add testimonials, statistics, client names or credentials. Placeholder copy must be labeled and marked `TODO(verify)`.
- **No third-party requests, cookies or analytics** without updating the README privacy section.
- **Accessibility is a requirement.** Keep AA contrast, visible focus, semantic markup, `alt` text and `prefers-reduced-motion` support.
- **Use the design tokens** in `css/tokens.css`; avoid hardcoded colors and inline `style` attributes.
- **Respect the Content-Security-Policy.** The build hashes inline `<script>` and `<style>` blocks automatically, but anything loaded from another origin is blocked; add it to the policy in `scripts/stage.cjs` only if it is truly needed (and update the README privacy section).

## Set up

```bash
git clone https://github.com/TMHSDigital/Github-Pages-Demo-1.git
cd Github-Pages-Demo-1
python -m http.server 8000          # open http://localhost:8000
npm i --no-save playwright axe-core esbuild   # only needed to run checks (uses your installed Chrome)
```

## Before you commit

```bash
npx html-validate index.html 404.html
node tests/smoke.cjs                        # layout, keyboard, theme, calculator, axe
node scripts/stage.cjs && SITE_DIR=_site node tests/smoke.cjs   # same checks on the published build
node scripts/check-links.cjs
```

If you change the page visibly, regenerate the README images and social card with `node scripts/screenshots.cjs`.

## Commits and pull requests

- Keep commits focused, with a short imperative subject.
- Stage files by name rather than `git add -A`, so scratch files and tool output are never committed.
- CI (`.github/workflows/ci.yml`) runs the checks above plus Lighthouse budgets. A change should leave all of them green.

## Reporting problems

Open an [issue](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues). For security matters, see [SECURITY.md](SECURITY.md) instead.
