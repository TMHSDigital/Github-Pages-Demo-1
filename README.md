<div align="center">

<a href="https://tmhsdigital.github.io/Github-Pages-Demo-1/"><img src="docs/screenshots/banner.png" alt="TM Hospitality Strategies. Sharper concepts. Tighter operations. Better margins." width="100%"></a>

<br>

**The official marketing site for TM Hospitality Strategies.**<br>
A fast, accessible, single-page build with a dark/light theme and a prime cost calculator. No framework, no runtime dependencies.

<br>

[![Visit the live site](https://img.shields.io/badge/VISIT_THE_LIVE_SITE-tmhsdigital.github.io-00A5F6?style=for-the-badge&labelColor=203164)](https://tmhsdigital.github.io/Github-Pages-Demo-1/)

<br>

[![Deploy](https://img.shields.io/github/actions/workflow/status/TMHSDigital/Github-Pages-Demo-1/pages.yml?branch=main&label=deploy&style=flat-square&labelColor=203164&color=00A5F6)](https://github.com/TMHSDigital/Github-Pages-Demo-1/actions/workflows/pages.yml)
[![CI](https://img.shields.io/github/actions/workflow/status/TMHSDigital/Github-Pages-Demo-1/ci.yml?branch=main&label=ci&style=flat-square&labelColor=203164&color=00A5F6)](https://github.com/TMHSDigital/Github-Pages-Demo-1/actions/workflows/ci.yml)
[![Lighthouse accessibility](https://img.shields.io/badge/lighthouse_a11y-100-00A5F6?style=flat-square&labelColor=203164)](#quality-gates)
[![Lighthouse performance](https://img.shields.io/badge/lighthouse_perf-95%2B-00A5F6?style=flat-square&labelColor=203164)](#quality-gates)
[![axe](https://img.shields.io/badge/axe--core-0_violations-00A5F6?style=flat-square&labelColor=203164)](#quality-gates)
[![WCAG](https://img.shields.io/badge/WCAG_2.2_AA-automated_checks-00A5F6?style=flat-square&labelColor=203164)](#quality-gates)
[![Dependencies](https://img.shields.io/badge/runtime_dependencies-0-00A5F6?style=flat-square&labelColor=203164)](#tech-stack)
[![License](https://img.shields.io/github/license/TMHSDigital/Github-Pages-Demo-1?style=flat-square&labelColor=203164&color=336193)](LICENSE)

<br>

[**Live site**](https://tmhsdigital.github.io/Github-Pages-Demo-1/) &nbsp;·&nbsp; [Preview](#preview) &nbsp;·&nbsp; [Quick start](#quick-start) &nbsp;·&nbsp; [Customize](#customize) &nbsp;·&nbsp; [Quality gates](#quality-gates) &nbsp;·&nbsp; [Issues](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues)

</div>

<br>

<table width="100%">
  <tr>
    <td width="25%" align="center" valign="top"><h3>2 themes</h3><sub>Light and dark, following the system setting</sub></td>
    <td width="25%" align="center" valign="top"><h3>0 requests</h3><sub>No third-party requests, cookies or analytics</sub></td>
    <td width="25%" align="center" valign="top"><h3>0 violations</h3><sub>axe-core, WCAG 2.2 A/AA, both themes</sub></td>
    <td width="25%" align="center" valign="top"><h3>22 checks</h3><sub>Automated browser tests on every push</sub></td>
  </tr>
</table>

<br>

> [!NOTE]
> **Content status.** The About, Services, Approach, Selected work and FAQ copy is **placeholder text** drafted for layout review. Each spot that needs real information is marked `TODO(verify)` in [`index.html`](index.html), and no testimonials, statistics or client names have been invented. Tracked in [#14](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/14).

<br>

## Contents

<div align="center">

**The site** &nbsp;·&nbsp; [Preview](#preview) &nbsp;·&nbsp; [What's on the page](#whats-on-the-page) &nbsp;·&nbsp; [Design system](#design-system)

**Build and run** &nbsp;·&nbsp; [Quick start](#quick-start) &nbsp;·&nbsp; [Customize](#customize) &nbsp;·&nbsp; [Project structure](#project-structure) &nbsp;·&nbsp; [Deployment](#deployment)

**Quality** &nbsp;·&nbsp; [Quality gates](#quality-gates) &nbsp;·&nbsp; [Tech stack](#tech-stack) &nbsp;·&nbsp; [Privacy and security](#privacy-and-security) &nbsp;·&nbsp; [Roadmap](#roadmap)

</div>

<br>

## Preview

<div align="center">
  <img src="docs/screenshots/hero.png" width="860" alt="Light theme hero: 'Sharper concepts. Tighter operations. Better margins.' beside the animated TMHS brand scene">
  <br><sub><b>Hero</b> · light theme, desktop</sub>
</div>

<br>

<div align="center">
  <img src="docs/screenshots/hero-dark.png" width="860" alt="Dark theme hero with glowing logo-blue accents">
  <br><sub><b>Hero</b> · dark theme (follows the system setting, with a manual toggle)</sub>
</div>

<br>

<table width="100%">
  <tr>
    <td width="50%" align="center" valign="top">
      <img src="docs/screenshots/services.png" alt="Services bento grid with a large Concept and positioning card">
      <br><sub><b>Services</b> · bento layout</sub>
    </td>
    <td width="50%" align="center" valign="top">
      <img src="docs/screenshots/calculator.png" alt="Prime cost calculator with sliders and a gauge">
      <br><sub><b>Prime cost calculator</b> · live gauge and bands</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center" valign="top">
      <img src="docs/screenshots/approach.png" alt="Approach: four steps joined by a progress line">
      <br><sub><b>Approach</b> · scroll-linked progress line</sub>
    </td>
    <td width="50%" align="center" valign="top">
      <img src="docs/screenshots/calculator-dark.png" alt="Calculator in the dark theme">
      <br><sub><b>Calculator</b> · dark theme</sub>
    </td>
  </tr>
</table>

<br>

<table align="center">
  <tr>
    <td align="center" valign="top">
      <img src="docs/screenshots/mobile.png" width="260" alt="Mobile hero at 390px wide">
      <br><sub><b>Mobile</b> · 390px</sub>
    </td>
    <td align="center" valign="top">
      <img src="docs/screenshots/mobile-menu.png" width="260" alt="Mobile navigation menu open">
      <br><sub><b>Mobile menu</b> · keyboard operable</sub>
    </td>
  </tr>
</table>

<div align="center"><sub>Screenshots, the banner and the social card are generated by <a href="scripts/screenshots.cjs"><code>scripts/screenshots.cjs</code></a>.</sub></div>

<br>

## What's on the page

| Section | Purpose |
| :-- | :-- |
| **Header** | Sticky glass bar with section links, a scroll-aware current-section indicator and a dark/light toggle. |
| **Hero** | Value proposition, two calls to action and an animated brand scene (orbiting light, drifting rings, pointer parallax on fine pointers). |
| **Focus marquee** | Pausable strip of service areas and venue types. It names no clients. |
| **About** | The story behind the brand, a pull quote and three principles. |
| **Services** | Bento grid: concept and positioning, operations, financial performance, growth and openings. |
| **Approach** | Listen, diagnose, build, sustain, joined by a progress line that fills as you scroll. |
| **Prime cost calculator** | Sliders and a live gauge for food, labor and other costs, with a rule-of-thumb band. Runs entirely in the browser. |
| **Selected work** | Case-study cards, currently labeled placeholders. |
| **FAQ** | Native `<details>` accordion, fully keyboard operable. |
| **Contact** | LinkedIn and Instagram, with an optional `mailto:` once an email is configured. |
| **404** | Branded error page that resolves its assets correctly from any nested URL. |

<br>

## Design system

Tokens live in [`css/tokens.css`](css/tokens.css) and follow the TM Hospitality Strategies Canva brand kit and logo.

<table width="100%">
  <tr>
    <td align="center" width="16%"><img src="https://img.shields.io/badge/%20-%20-0E1A33?style=for-the-badge" width="120" height="36" alt="Navy swatch"><br><sub><b>Navy</b><br><code>#0E1A33</code></sub></td>
    <td align="center" width="16%"><img src="https://img.shields.io/badge/%20-%20-203164?style=for-the-badge" width="120" height="36" alt="Brand navy swatch"><br><sub><b>Brand</b><br><code>#203164</code></sub></td>
    <td align="center" width="16%"><img src="https://img.shields.io/badge/%20-%20-336193?style=for-the-badge" width="120" height="36" alt="Brand blue swatch"><br><sub><b>Brand&nbsp;blue</b><br><code>#336193</code></sub></td>
    <td align="center" width="16%"><img src="https://img.shields.io/badge/%20-%20-1F4E8C?style=for-the-badge" width="120" height="36" alt="Action blue swatch"><br><sub><b>Action</b><br><code>#1F4E8C</code></sub></td>
    <td align="center" width="16%"><img src="https://img.shields.io/badge/%20-%20-00A5F6?style=for-the-badge" width="120" height="36" alt="Logo blue swatch"><br><sub><b>Logo&nbsp;blue</b><br><code>#00A5F6</code></sub></td>
    <td align="center" width="16%"><img src="https://img.shields.io/badge/%20-%20-F6F7FA?style=for-the-badge" width="120" height="36" alt="Canvas swatch"><br><sub><b>Canvas</b><br><code>#F6F7FA</code></sub></td>
  </tr>
</table>

| | |
| :-- | :-- |
| **Tokens** | Fluid type and spacing scales, elevation and glow tokens, with complete light and dark sets. |
| **Type** | Fraunces (with true italics for accent words) for headings and Inter for text, both self-hosted variable fonts. |
| **Theme** | Follows the system setting until the visitor chooses, then remembers the choice. No flash on load. |
| **Contrast** | Every text pairing is chosen for WCAG AA and verified by axe in both themes. The bright logo blue is decorative, or used for text only on navy. |
| **Motion** | Transforms and opacity only, paused or disabled under `prefers-reduced-motion`. Content is fully visible without JavaScript. |

<br>

## Quick start

> [!TIP]
> There is nothing to install. Any static file server works.

```bash
git clone https://github.com/TMHSDigital/Github-Pages-Demo-1.git
cd Github-Pages-Demo-1
python -m http.server 8000      # or: npx serve
```

Then open <http://localhost:8000>.

<br>

## Customize

| To change | Do this |
| :-- | :-- |
| **Copy and sections** | Edit [`index.html`](index.html). Search for `TODO(verify)` to find placeholder text. |
| **Colors, fonts, spacing** | Edit the tokens in [`css/tokens.css`](css/tokens.css). Light values are in `:root`, dark in `[data-theme="dark"]`. |
| **Calculator bands** | Edit `band()` in [`js/calculator.js`](js/calculator.js) and the note under the calculator in `index.html`. Confirm the ranges before relying on them. |
| **Contact email** | Set `CONTACT_EMAIL` in [`js/main.js`](js/main.js). While empty, the button links to LinkedIn. |
| **Logo** | Replace `assets/images/tmhs-logo.png` and `tmhs-logo-96.png` (an SVG master is tracked in [#16](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/16)). |
| **Social card, banner, screenshots** | Run `node scripts/screenshots.cjs` after changing the page. |
| **Repo name or domain** | Update `og:url`, canonical, `sitemap.xml`, `robots.txt` and the `<base>` in `404.html`. |

<br>

## Project structure

<details>
<summary><b>Show the file tree</b></summary>

```text
.
├── index.html               Single page: hero, about, services, approach, calculator, work, FAQ, contact
├── 404.html                 Branded error page (uses <base> for the repo path)
├── css/
│   ├── tokens.css           Fonts, brand tokens, fluid scales, light and dark themes
│   ├── base.css             Reset, typography, layout primitives, buttons, reveal rules
│   └── components.css       Header, hero scene, marquee, sections, calculator, footer
├── js/
│   ├── theme.js             Dark/light toggle (pre-paint snippet lives in index.html)
│   ├── calculator.js        Prime cost maths (TMHSCalc) and DOM wiring
│   └── main.js              Menu, scroll reveal, nav spy, parallax, marquee pause, CONTACT_EMAIL
├── assets/
│   ├── fonts/               Self-hosted Fraunces (upright and italic) and Inter, latin variable woff2
│   └── images/              Logo, small logo, favicon, apple-touch icon, social card
├── tests/smoke.cjs          Layout, keyboard, theme, calculator and axe checks (Playwright)
├── scripts/
│   ├── stage.cjs            Builds the publishable _site (minified CSS/JS, site files only)
│   ├── check-links.cjs      External link checker
│   └── screenshots.cjs      Regenerates docs/screenshots, the banner and the social card
├── docs/                    README banner source and screenshots
├── CONTRIBUTING.md  SECURITY.md  LICENSE
└── .github/
    ├── workflows/pages.yml  Builds and deploys the site to GitHub Pages
    ├── workflows/ci.yml     Validation, tests, Lighthouse, link checks
    └── dependabot.yml       Weekly GitHub Actions updates
```

</details>

<br>

## Deployment

Every push to `main` runs [`pages.yml`](.github/workflows/pages.yml), which builds `_site/` with [`scripts/stage.cjs`](scripts/stage.cjs) and publishes it to GitHub Pages. The build bundles and minifies the CSS into one file, minifies the scripts and copies only site files (`index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `assets`). Source files stay unbundled for development.

<details>
<summary><b>Preview the published build locally</b></summary>

```bash
npm i --no-save esbuild
node scripts/stage.cjs && cd _site && python -m http.server 8000
```

</details>

<br>

## Quality gates

[`ci.yml`](.github/workflows/ci.yml) runs on every push and pull request.

| Gate | Tool | Standard |
| :-- | :-- | :-- |
| HTML validity | `html-validate` | No errors |
| JavaScript lint | ESLint | No errors |
| Layout | Playwright, source and staged build | No horizontal scroll at 375, 768 and 1280px; no console errors |
| Features | Playwright | Theme toggle persists and follows the system; calculator maths and live readout; marquee pauses; content visible with JavaScript off |
| Keyboard | Playwright | Skip link first, menu and FAQ operable, Escape returns focus, visible focus rings |
| Accessibility | axe-core | 0 violations (WCAG 2.0, 2.1 and 2.2 A/AA, best practice) at mobile and desktop, in both themes and with reduced motion |
| Performance and quality | Lighthouse, staged build | Performance 90 or higher; Accessibility, Best Practices and SEO 95 or higher |
| Links | internal and external checkers | No broken links |

<details>
<summary><b>Run the checks locally</b></summary>

```bash
npm i --no-save playwright axe-core esbuild    # uses your installed Chrome
npx html-validate index.html 404.html
node tests/smoke.cjs
node scripts/stage.cjs && SITE_DIR=_site node tests/smoke.cjs    # the published build
node scripts/check-links.cjs
```

</details>

> [!IMPORTANT]
> Automated checks do not replace a real screen-reader review. A manual NVDA and VoiceOver pass is still recommended before launch ([#17](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/17)).

<br>

## Tech stack

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-203164?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-336193?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-00A5F6?style=for-the-badge&logo=javascript&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-0E1A33?style=for-the-badge&logo=githubpages&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-1F4E8C?style=for-the-badge&logo=githubactions&logoColor=white)

</div>

No framework, no bundler in development and no runtime dependencies. Playwright, axe-core and esbuild are used only for testing and publishing and are never shipped.

<br>

## Privacy and security

- The site makes **no third-party requests**: fonts are self-hosted, and there are no cookies, analytics or forms. The calculator runs locally and never stores or sends what you enter.
- GitHub Actions are pinned to commit SHAs and kept current by Dependabot.
- Found a vulnerability? See [SECURITY.md](SECURITY.md) and report it privately through the repository's **Security** tab.

<br>

## Roadmap

Open work is tracked in [Issues](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues).

| Next | Issue |
| :-- | :-- |
| Replace placeholder copy with real content | [#14](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/14) |
| Choose a contact method (email or booking link) | [#15](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/15) |
| Verify the calculator's benchmark bands | [#27](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/27) |
| Vector logo | [#16](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/16) |
| Manual screen-reader and zoom review | [#17](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/17) |
| Photography and richer visuals | [#20](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/20) |
| Repo rename and domain | [#18](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/18) |
| TMHS and TMHS Digital brand relationship | [#19](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/19) |
| Analytics and privacy decision | [#29](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/29) |
| Further performance gains | [#28](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues/28) |

<br>

<div align="center">

<img src="assets/images/tmhs-logo-96.png" alt="" width="48">

**TM Hospitality Strategies**<br>
<sub><a href="https://www.linkedin.com/company/tm-hospitality-strategies/">LinkedIn</a> &nbsp;·&nbsp; <a href="https://www.instagram.com/tmhs.ig/">Instagram</a> &nbsp;·&nbsp; <a href="LICENSE">MIT License</a></sub>

</div>
