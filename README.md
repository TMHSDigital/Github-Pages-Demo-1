# Modern Demo Site

A sleek, modern website template built with pure HTML, CSS, and JavaScript. Features a responsive design, modern UI components, and smooth interactions.

![Modern Demo Site](assets/preview.png)

## Features

### Modern Design
- Frosted glass effects with backdrop filters
- Hardware-accelerated animations
- Responsive grid system
- Advanced gradient compositions
- Sophisticated shadow hierarchy

### Performance
- Zero external dependencies
- Optimized asset loading
- Native smooth scrolling
- Efficient DOM operations
- Minimal CSS footprint

### Responsive Design
- Mobile-first architecture
- Fluid typography system
- Contextual layouts
- Touch-optimized interactions
- Breakpoint-free design

### Development
- Semantic HTML structure
- Modern CSS architecture
- Modular JavaScript patterns
- Comprehensive documentation
- DRY principles

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/TMHSDigital/modern-demo-site.git
   ```

2. Navigate to the project:
   ```bash
   cd modern-demo-site
   ```

3. Serve the project:
   ```bash
   # Python
   python -m http.server 8000

   # Node.js
   npx serve
   ```

## Project Structure

```
.
├── index.html              # Entry point
├── css/
│   └── style.css          # Styles
├── js/
│   └── main.js            # Core functionality
├── assets/                # Static assets
│   ├── images/
│   └── favicon.ico
└── README.md
```

## Customization

### Theme Configuration

The design system uses CSS custom properties for theming. Modify the variables in `css/style.css`:

```css
:root {
    --primary-color: #0f172a;
    --secondary-color: #3b82f6;
    --accent-color: #22d3ee;
}
```

### Typography System

The type system uses [Inter](https://fonts.google.com/specimen/Inter) for optimal legibility:

1. Configure font sources in `index.html`
2. Adjust typography scale in `css/style.css`

### Core Components

#### Header
- Frosted glass UI
- Dynamic navigation states
- Responsive collapse system

#### Hero Section
- Multi-layer gradient system
- SVG pattern overlays
- Responsive text scaling

#### Feature Grid
- CSS Grid layout
- Interactive card states
- Fluid responsive breakpoints

#### Contact Form
- Modern form controls
- Interactive states
- Validation system

#### Footer
- Modular layout system
- Responsive reflow
- Accessibility optimized

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement`)
3. Commit changes (`git commit -m 'Add enhancement'`)
4. Push to branch (`git push origin feature/enhancement`)
5. Open a Pull Request

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.

## Credits

- Typography: [Inter](https://fonts.google.com/specimen/Inter) by Rasmus Andersson
- Icons: [Heroicons](https://heroicons.com/)

---

Designed and maintained by TMHSDigital 