# Modern Demo Site

A sophisticated, modern website template showcasing advanced CSS effects, responsive design, and smooth interactions. Built with pure HTML, CSS, and JavaScript.

<div style="padding: 20px; border-radius: 12px; background: white; box-shadow: 0 8px 30px rgba(0,0,0,0.12); margin: 20px 0;">
    <img src="assets/images/preview.png" alt="Modern Demo Site" style="width: 100%; border-radius: 8px; display: block;">
</div>

## Features

### Modern Design
- Frosted glass UI with backdrop filters
- Multi-layered gradient compositions
- Advanced CSS animations and transitions
- SVG pattern overlays
- Sophisticated shadow hierarchy
- Floating gradient blob effects
- Scroll progress indicators

### Theme System
- Dark/Light mode toggle
- System preference detection
- Smooth theme transitions
- Persistent theme settings
- Accessible color schemes
- High contrast support

### Performance
- Zero external dependencies
- Hardware-accelerated animations
- Optimized asset loading
- Native smooth scrolling
- Minimal CSS footprint
- Efficient theme switching

### Responsive Design
- Mobile-first architecture
- Fluid typography system
- Contextual layouts
- Touch-optimized interactions
- Breakpoint-free design
- Adaptive feature grid

### Development
- Semantic HTML structure
- Modern CSS architecture (Custom Properties, Grid, Flexbox)
- Modular JavaScript patterns
- Comprehensive documentation
- DRY principles
- Progressive enhancement

### Accessibility
- ARIA-enhanced components
- Keyboard navigation support
- Screen reader optimized
- Skip-to-content links
- Focus management
- Reduced motion support

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
    --text-color: #334155;
    --bg-color: #ffffff;
}
```

### Typography System

The type system uses [Inter](https://fonts.google.com/specimen/Inter) for optimal legibility:

1. Configure font sources in `index.html`
2. Adjust typography scale in `css/style.css`

### Core Components

#### Header
- Frosted glass effect with backdrop filters
- Dynamic navigation states
- Gradient-enhanced branding
- Responsive collapse system

#### Hero Section
- Multi-layer gradient system
- SVG pattern overlays
- Responsive text scaling
- Optimized CTA placement

#### Feature Grid
- CSS Grid layout
- Interactive card states
- Fluid responsive breakpoints
- Consistent spacing system

#### Contact Form
- Modern form controls
- Interactive states
- Client-side validation
- Responsive layout

#### Footer
- Modular layout system
- Responsive reflow
- Branded elements
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

Designed and developed by TMHSDigital 