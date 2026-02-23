<div align="center">
<br>
<img src="assets/images/TMHSDigital-LOGO.png" alt="TMHSDigital Logo" width="140">
<br><br>

# Modern Demo Site

Glass morphism, 20+ CSS animations, and adaptive theming in a single static page<br>with zero build tools and zero framework dependencies.

<br>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)](#)
[![Build](https://img.shields.io/github/actions/workflow/status/TMHSDigital/Github-Pages-Demo-1/pages.yml?branch=main&style=for-the-badge&label=Deploy)](https://github.com/TMHSDigital/Github-Pages-Demo-1/actions/workflows/pages.yml)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)

<br>

`Glass Morphism UI` &middot; `20+ Animations` &middot; `Dark / Light Theme` &middot; `Fully Accessible` &middot; `No Build Step`

<br>

[Live Demo](https://tmhsdigital.github.io/Github-Pages-Demo-1/) | [Download](https://github.com/TMHSDigital/Github-Pages-Demo-1/archive/refs/heads/main.zip) | [Contributing](#contributing) | [Report Bug](../../issues)

</div>

<br>

---

<br>

## What It Does

| Feature | Description |
| :---- | :---- |
| Glass Morphism UI | Translucent cards with backdrop blur, dynamic shadows, 3D perspective. |
| Theme System | Light/dark modes, system-preference detection, localStorage persistence. |
| Animation Showcase | 20+ animations with live demos, replay, and copyable code snippets. |
| Settings Panel | Runtime theme, contrast, and font-size controls; keyboard shortcuts. |
| Portfolio Grid | Filterable project cards with category tabs and hover overlays. |
| Contact Form | Client-side validation with animated feedback, no server needed. |
| Responsive Layout | Mobile-first fluid type, CSS Grid, touch-optimized interactions. |
| Accessibility | ARIA attributes, focus trapping, skip links, reduced-motion support. |
| Scroll Progress | Header-mounted indicator tracking vertical scroll position. |
| Performance | Asset preloading, passive listeners, GPU-accelerated transforms. |

<br>

---

<br>

> [!NOTE]
> This project loads fonts and icons from external CDNs (Google Fonts, Font Awesome, Prism.js). No data is collected, no cookies are set, and the contact form is entirely client-side with no backend submission.

<br>

---

<br>

## Quick Start

Prerequisites: `git` and any static file server (`python3`, `npx serve`, or similar).

```bash
git clone https://github.com/TMHSDigital/Github-Pages-Demo-1.git
cd Github-Pages-Demo-1
python -m http.server 8000
```

Open `http://localhost:8000`. Alternatively, use `npx serve` or open `index.html` directly.

> [!IMPORTANT]
> A local server is recommended over `file://` for correct CORS behavior with Google Fonts and Font Awesome.

<br>

---

<br>

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    index.html                       │
│              (single-page entry point)              │
├────────────────────┬────────────────────────────────┤
│      Styling       │           Scripts              │
│                    │                                │
│  style.css         │  utilities.js                  │
│  ├ Theme system    │  ├ Feature detection           │
│  ├ Glass morphism  │  └ Accessibility helpers       │
│  ├ Responsive grid │         │                      │
│  └ Component styles│         ▼                      │
│                    │  main.js                       │
│  animations.css    │  ├ Navigation + scroll         │
│  └ 20+ effects    │  ├ Theme toggle + settings     │
│                    │  ├ Form validation             │
│                    │  └ Portfolio filters            │
│                    │         │                      │
│                    │         ▼                      │
│                    │  animations.js                 │
│                    │  ├ Showcase UI + replay        │
│                    │  └ Code snippet copy           │
├────────────────────┴────────────────────────────────┤
│                  External CDNs                      │
│   Google Fonts &middot; Font Awesome &middot; Prism.js              │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│   GitHub Actions    │
│   (pages.yml)       │
│   push to main ──▶  │
│   deploy to Pages   │
└─────────────────────┘
```

<br>

---

<br>

## Tech Stack

| | |
| :---- | :---- |
| **Markup** | HTML5, semantic elements, Open Graph meta |
| **Styling** | CSS3 custom properties, Grid, Flexbox, glass morphism |
| **Scripts** | Vanilla JavaScript (ES6+) |
| **Fonts** | Inter via Google Fonts |
| **Icons** | Font Awesome 6.5.1 |
| **Syntax** | Prism.js 1.24.1 |
| **Deploy** | GitHub Pages via GitHub Actions |

<br>

---

<br>

<details>
<summary><strong>Project Structure</strong></summary>
<br>

```
Github-Pages-Demo-1/
├── index.html                  # Single-page app with all sections
├── css/
│   ├── style.css               # Theme, layout, components (~2500 lines)
│   └── animations.css          # Animation library (~1050 lines)
├── js/
│   ├── main.js                 # Core logic: nav, forms, theme, settings
│   ├── animations.js           # Showcase controls, replay, code copy
│   └── utilities.js            # Feature detection, a11y helpers
├── assets/
│   └── images/
│       ├── TMHSDigital-LOGO.png
│       ├── TMHS-LOGO.png
│       └── preview.png
├── .github/
│   └── workflows/
│       └── pages.yml           # Auto-deploy on push to main
├── LICENSE
└── README.md
```

</details>

<br>

---

<br>

## Contributing

Fork, branch, and open a pull request. Bugs and feature requests go in [Issues](../../issues).

<br>

---

<br>

<div align="center">

[MIT License](LICENSE) &middot; [TMHSDigital](https://github.com/TMHSDigital)

</div>
