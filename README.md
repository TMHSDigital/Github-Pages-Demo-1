# Modern Demo Site

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-blue)](https://tmhsdigital.github.io/Github-Pages-Demo-1/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/TMHSDigital/Github-Pages-Demo-1/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with: HTML](https://img.shields.io/badge/Built%20with-HTML-orange)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Style: CSS](https://img.shields.io/badge/Style-CSS-blue)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Maintained](https://img.shields.io/badge/Maintained-yes-green.svg)](https://github.com/TMHSDigital/Github-Pages-Demo-1/graphs/commit-activity)

> A sophisticated, modern website template showcasing advanced CSS effects, responsive design, and smooth interactions. Built with pure HTML, CSS, and JavaScript.

[View Demo](https://tmhsdigital.github.io/Github-Pages-Demo-1/) • [Documentation](#documentation) • [Report Bug](../../issues) • [Request Feature](../../issues)

## Table of Contents
- [Highlights](#highlights)
- [Documentation](#documentation)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Project Structure](#project-structure)
- [Customization](#customization)
  - [Theme Configuration](#theme-configuration)
  - [Typography System](#typography-system)
- [Core Components](#core-components)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

<details>
<summary>Screenshot</summary>
<br>

<div align="center">
    <img src="assets/images/preview.png" alt="Modern Demo Site Preview" style="max-width: 100%; border-radius: 8px;">
</div>

</details>

---

## Highlights

<table>
<tr>
<td width="50%">

### Modern Design
- Frosted glass UI
- Multi-layered gradients
- Advanced animations
- Dynamic shadows
- Progress indicators

</td>
<td width="50%">

### Theme System
- Smart theme detection
- Smooth transitions
- Persistent settings
- High contrast
- System sync

</td>
</tr>
<tr>
<td>

### Performance
- Zero dependencies
- Hardware acceleration
- Optimized assets
- Native scrolling
- Minimal footprint

</td>
<td>

### Responsive
- Mobile-first
- Fluid typography
- Smart layouts
- Touch optimized
- Adaptive grid

</td>
</tr>
</table>

## Documentation

### Prerequisites
- Modern web browser
- Basic understanding of HTML/CSS/JS
- Local development server (Python or Node.js)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/TMHSDigital/modern-demo-site.git
   ```

2. Navigate to the project directory
   ```bash
   cd modern-demo-site
   ```

3. Serve locally
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   
   # Using PHP
   php -S localhost:8000
   ```

4. View in browser
   ```
   http://localhost:8000
   ```

<details>
<summary>Project Structure</summary>

```
modern-demo-site/
├── index.html              # Entry point
├── css/                    # Styles
│   └── style.css           # Main stylesheet
├── js/                     # Scripts
│   └── main.js             # Core functionality
├── assets/                 # Static files
│   ├── images/             # Image assets
│   └── favicon.ico         # Site favicon
└── README.md               # Documentation
```
</details>

## Customization

<details>
<summary>Theme Configuration</summary>

### Basic Customization
Modify the CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #0f172a;
    --secondary-color: #3b82f6;
    --accent-color: #22d3ee;
    --text-color: #334155;
    --bg-color: #ffffff;
}
```

### Advanced Theming
- Create new theme files in `css/themes/`
- Override default variables
- Import in your HTML
</details>

<details>
<summary>Typography System</summary>

### Font Configuration
The type system uses [Inter](https://fonts.google.com/specimen/Inter) for optimal legibility.

1. Configure sources in `index.html`:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
   ```

2. Adjust scale in `css/style.css`:
   ```css
   html {
       font-size: 16px;
       line-height: 1.5;
   }
   ```
</details>

## Core Components

<details>
<summary>View Components</summary>

### Header
- Frosted glass effect
- Dynamic navigation
- Gradient branding
- Smart collapse

### Hero Section
- Gradient system
- Pattern overlays
- Smart scaling
- CTA optimization

### Feature Grid
- CSS Grid layout
- Interactive cards
- Fluid breakpoints
- Consistent spacing

### Contact Form
- Modern controls
- Live validation
- Smart feedback
- Responsive layout

### Footer
- Modular structure
- Smart reflow
- Brand elements
- Accessibility optimized

</details>

## Browser Support

| Browser | Support | Notes |
|:--------|:-------:|:------|
| Chrome  | ✅ 2    | Full  |
| Firefox | ✅ 2    | Full  |
| Safari  | ✅ 2    | Full  |
| Edge    | ✅ 2    | Full  |

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a Pull Request.

### Development Process
1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/amazing
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to your fork
   ```bash
   git push origin feature/amazing
   ```
5. Open a Pull Request

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.

## Credits

- Typography: [Inter](https://fonts.google.com/specimen/Inter) by Rasmus Andersson
- Icons: [Heroicons](https://heroicons.com/)
- Inspiration: Modern web design trends and best practices

---

<div align="center">

[View Demo](https://tmhsdigital.github.io/Github-Pages-Demo-1/) • 
[Report Bug](../../issues) • 
[Request Feature](../../issues)

<sub>Designed and developed by TMHSDigital</sub>

</div> 