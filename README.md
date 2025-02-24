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

<details>
<summary>Preview</summary>
<br>

<div align="center">
    <img src="assets/images/preview.png" alt="Modern Demo Site Preview" style="max-width: 100%; border-radius: 8px;">
</div>

</details>

## Table of Contents
- [Getting Started](#getting-started)
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
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

## Getting Started

Experience the future of web design in three simple steps:

1. **Quick Start**: Visit our [live demo](https://tmhsdigital.github.io/Github-Pages-Demo-1/)
2. **Explore Features**: Test the dark mode, responsive layouts, and animations
3. **Make It Yours**: Fork the repository and customize to your needs

Watch our brief introduction:
<div align="center">
    <a href="https://www.youtube.com/watch?v=your-video-id" target="_blank">
        <img src="assets/images/video-thumbnail.png" alt="Introduction Video" style="max-width: 600px; border-radius: 8px;">
    </a>
</div>

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
- High contrast options
- System sync with OS preferences

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
- Mobile-first design
- Fluid typography
- Smart layouts
- Touch optimized
- Adaptive grid system

    </td>
  </tr>
</table>

## Documentation

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 72+, Safari 13.1+, or Edge 80+)
- Basic familiarity with HTML, CSS, and JavaScript
- Local development server (Python, Node.js, or PHP)
- Text editor or IDE
- Git for version control

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
| Chrome  |    ✅    | Full  |
| Firefox |    ✅    | Full  |
| Safari  |    ✅    | Full  |
| Edge    |    ✅    | Full  |

## FAQ

<details>
<summary>How do I customize the color scheme?</summary>

Modify the CSS variables in `css/style.css`. See [Theme Configuration](#theme-configuration) for details.
</details>

<details>
<summary>Can I use this template for commercial projects?</summary>

Yes! This project is licensed under MIT. You're free to use it for personal or commercial projects.
</details>

<details>
<summary>How do I deploy to GitHub Pages?</summary>

1. Fork this repository
2. Enable GitHub Pages in your repository settings
3. Select the main branch as source
4. Your site will be live at `https://[username].github.io/[repo-name]`
</details>

<details>
<summary>How do I report a bug?</summary>

Open an issue using our [bug report template](../../issues/new?template=bug_report.md).
Include:
- Expected behavior
- Actual behavior
- Steps to reproduce
- Screenshots if applicable
</details>

<details>
<summary>How do I add new features?</summary>

1. Check our [roadmap](../../projects) for planned features
2. Open a feature request if your idea isn't listed
3. Fork, implement, and submit a PR
</details>

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

<a href="https://tmhsdigital.github.io/Github-Pages-Demo-1/">View Demo</a> • 
<a href="../../issues">Report Bug</a> • 
<a href="../../issues">Request Feature</a>

<sub>Designed and developed by TMHSDigital</sub>

</div> 