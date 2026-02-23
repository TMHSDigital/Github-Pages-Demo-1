<div align="center">
<br>
<img src="assets/images/TMHSDigital-LOGO.png" alt="TMHSDigital Logo" width="120">
<br><br>

# Modern Demo Site

A production-ready static website template showcasing glass morphism,<br>advanced CSS animations, and adaptive theming — built with zero dependencies.

<br>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

<br>

`Glass Morphism UI` &middot; `20+ Animations` &middot; `Dark / Light Theme` &middot; `Fully Accessible` &middot; `No Build Step`

<br>

[Live Demo](https://tmhsdigital.github.io/Github-Pages-Demo-1/) | [Download](https://github.com/TMHSDigital/Github-Pages-Demo-1/archive/refs/heads/main.zip) | [Report Bug](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues)

</div>

<br>

---

<br>

## What It Does

| Feature | Description |
| :---- | :---- |
| Glass Morphism UI | Translucent cards and panels with backdrop blur, dynamic shadows, and 3D perspective effects. |
| Theme System | Light and dark modes with system-preference detection, localStorage persistence, and high-contrast option. |
| Animation Showcase | 20+ categorized animations (transitions, keyframes, scroll, interactive, text) with live demos, replay controls, and copyable code snippets. |
| Settings Panel | In-page controls for theme, contrast, and font size with keyboard shortcuts (D, A, S). |
| Portfolio Grid | Filterable project grid with category tabs and hover overlays. |
| Contact Form | Client-side validated form with animated feedback (no server required). |
| Responsive Layout | Mobile-first fluid typography, dynamic CSS Grid, and touch-optimized interactions. |
| Accessibility | Skip-to-content link, ARIA attributes, keyboard navigation, focus trapping, screen reader announcements, and reduced-motion support. |
| Scroll Progress | Visual indicator tracking page scroll position in the header. |
| Performance | Preloaded critical assets, passive scroll listeners, hardware-accelerated transforms, `will-change` optimization, and content containment. |

<br>

---

<br>

## Install

Clone the repo and open it with any static file server. No build tools, no `npm install`.

```bash
git clone https://github.com/TMHSDigital/Github-Pages-Demo-1.git
cd Github-Pages-Demo-1

# pick one
python -m http.server 8000
npx serve
```

Then visit `http://localhost:8000`.

> [!NOTE]
> Opening `index.html` directly via `file://` works for most features, but a local server is recommended for full font loading and correct CORS behavior.

<br>

---

<br>

## Tech Stack

| | |
| :---- | :---- |
| **Markup** | HTML5, semantic elements, Open Graph meta |
| **Styling** | CSS3 custom properties, Grid, Flexbox, animations, glass morphism |
| **Scripts** | Vanilla JavaScript (ES6+), no frameworks |
| **Fonts** | Inter via Google Fonts |
| **Icons** | Font Awesome 6.5.1 (CDN) |
| **Syntax Highlighting** | Prism.js 1.24.1 (CDN) |
| **Deployment** | GitHub Pages via GitHub Actions |

<br>

---

<br>

<details>
<summary><strong>Project Structure</strong></summary>
<br>

```
Github-Pages-Demo-1/
├── index.html                 # Single-page entry point (all sections)
├── css/
│   ├── style.css              # Core styles, theme system, responsive layout
│   └── animations.css         # Animation library (20+ effects)
├── js/
│   ├── main.js                # Navigation, forms, theme, settings panel
│   ├── animations.js          # Animation showcase UI and controls
│   └── utilities.js           # Feature detection, accessibility helpers
├── assets/
│   └── images/
│       ├── TMHSDigital-LOGO.png
│       ├── TMHS-LOGO.png
│       └── preview.png
├── .github/
│   └── workflows/
│       └── pages.yml          # GitHub Pages deploy on push to main
├── LICENSE
└── README.md
```

</details>

<br>

---

<br>

## Contributing

Fork the repo, create a feature branch, and open a pull request. Bug reports and feature requests go in [Issues](https://github.com/TMHSDigital/Github-Pages-Demo-1/issues).

<br>

---

<br>

<div align="center">

[MIT License](LICENSE) &middot; [TMHSDigital](https://github.com/TMHSDigital)

</div>
