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
npm ci                              # pinned tooling, only needed to run checks (uses your installed Chrome)
```

## Before you commit

```bash
npm run test:unit # calculator maths only, in Node: no browser, under a second
npm run check     # unit tests, html-validate, ESLint, then layout, keyboard, theme, calculator and axe checks on the source and the published build
npm run links     # external link check
```

If you change `js/calc-math.js`, add cases to the tables in `tests/calc-math.test.cjs`.

If you change the header, footer, icon sprite or a calculator in `index.html`, run `npm run sync` so the pages in `tools/` match (CI checks this).

If you change the page visibly, regenerate the README images and social card with `node scripts/screenshots.cjs`.

## Commits and pull requests

- Keep commits focused, with a short imperative subject.
- Stage files by name rather than `git add -A`, so scratch files and tool output are never committed.
- CI (`.github/workflows/ci.yml`) runs the checks above plus Lighthouse budgets, and deploys to GitHub Pages only when they all pass. A change should leave all of them green.
- Tooling versions are pinned in `package.json`; Dependabot proposes updates weekly.

## Reporting problems

Open an [issue](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues). For security matters, see [SECURITY.md](SECURITY.md) instead.
