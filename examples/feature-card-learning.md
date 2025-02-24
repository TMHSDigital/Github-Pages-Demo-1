# Feature Card Learning Mode Integration

## HTML Structure
```html
<div class="feature-card" 
     data-learning-hotspot="style"
     data-feature="glass-card">
    <h3>Modern Design</h3>
    <p>Clean and responsive layout with beautiful gradients and animations.</p>
</div>
```

## CSS Integration
```css
/* Extend existing feature-card styles */
.feature-card {
    /* ... existing styles ... */
    position: relative; /* Ensure proper hotspot positioning */
}

/* Learning Mode Indicators */
[data-learning-hotspot]::before {
    content: '';
    position: absolute;
    inset: -4px;
    border: 2px solid transparent;
    border-radius: inherit;
    transition: border-color 0.3s var(--transition-speed);
    pointer-events: none;
    z-index: 1;
}

/* Category-specific colors using existing variables */
[data-learning-hotspot="style"]::before { border-color: var(--secondary-color); }
[data-learning-hotspot="structure"]::before { border-color: var(--accent-color); }
[data-learning-hotspot="function"]::before { border-color: var(--primary-color); }
[data-learning-hotspot="layout"]::before { border-color: var(--text-color); }

/* Hover state enhancement */
.feature-card:hover[data-learning-hotspot]::before {
    border-width: 3px;
    box-shadow: 0 0 15px var(--secondary-color);
}

/* Dark mode compatibility */
[data-theme="dark"] [data-learning-hotspot]::before {
    opacity: 0.8;
}
```

## JavaScript Integration
```javascript
// Extend existing feature card initialization
class FeatureLearningSystem {
    constructor() {
        this.learningData = {
            'glass-card': {
                title: 'Glass Card Effect',
                category: 'style',
                description: 'Create modern glass-like cards with backdrop filters',
                code: {
                    css: `.feature-card {
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}`,
                    file: 'css/style.css',
                    lines: '440-480'
                },
                tips: [
                    'Adjust --glass-bg opacity for different transparency levels',
                    'Use backdrop-filter for the frosted effect',
                    'Add subtle border for depth'
                ]
            }
        };
    }

    init() {
        // Integrate with existing settings system
        document.documentElement.addEventListener('learning-mode-change', (e) => {
            this.toggleLearningMode(e.detail.enabled);
        });

        // Use existing event delegation
        document.addEventListener('mouseover', (e) => {
            const card = e.target.closest('[data-learning-hotspot]');
            if (card && this.isLearningModeActive()) {
                this.showFeaturePopup(card);
            }
        });
    }

    showFeaturePopup(element) {
        const featureId = element.dataset.feature;
        const data = this.learningData[featureId];
        
        if (!data) return;

        // Reuse existing fade-in animation system
        const popup = this.createPopup(data);
        popup.classList.add('fade-in');
        
        // Position relative to card using existing layout system
        this.positionPopup(popup, element);
        
        // Add to DOM using existing portal system
        document.querySelector('.popup-container').appendChild(popup);
    }

    createPopup(data) {
        const popup = document.createElement('div');
        popup.className = 'learning-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <h3>${data.title}</h3>
                <span class="category ${data.category}">
                    ${this.getCategoryIcon(data.category)}
                </span>
            </div>
            <div class="popup-content">
                <p>${data.description}</p>
                <pre><code>${data.code.css}</code></pre>
                <div class="file-location">
                    📁 ${data.code.file} (lines ${data.code.lines})
                </div>
                <ul class="tips">
                    ${data.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
            <div class="popup-footer">
                <button class="try-it-btn">Try It Live</button>
                <button class="learn-more-btn">Learn More</button>
            </div>
        `;
        
        return popup;
    }

    getCategoryIcon(category) {
        const icons = {
            style: '🎨',
            structure: '🏗️',
            function: '⚡',
            layout: '📱'
        };
        return icons[category] || '📝';
    }
}

// Initialize with existing app
document.addEventListener('DOMContentLoaded', () => {
    const learningSystem = new FeatureLearningSystem();
    learningSystem.init();
});
```

## Accessibility Integration
```javascript
// Add to existing accessibility setup
const a11yExtensions = {
    learningMode: {
        announceHotspot: (element) => {
            const feature = element.dataset.feature;
            const category = element.dataset.learningHotspot;
            return `${feature} example. Press Enter to learn more about this ${category} feature.`;
        },
        
        setupKeyboardNav: () => {
            // Add to existing keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && document.activeElement.hasAttribute('data-learning-hotspot')) {
                    this.showFeaturePopup(document.activeElement);
                }
            });
        }
    }
};
```

## Performance Considerations

1. **Lazy Loading**
```javascript
// Add to existing dynamic imports
const loadLearningMode = async () => {
    if (settings.learningMode) {
        const { FeatureLearningSystem } = await import('./learning-system.js');
        this.learningSystem = new FeatureLearningSystem();
    }
};
```

2. **Resource Optimization**
```javascript
// Add to existing performance optimizations
const optimizeLearningMode = {
    hints: {
        'learning-popup': { preload: false },
        'monaco-editor': { prefetch: true }
    },
    containment: {
        '.learning-popup': 'content',
        '[data-learning-hotspot]::before': 'paint'
    }
};
```

## Theme Integration
```css
/* Add to existing theme system */
[data-theme="dark"] .learning-popup {
    --popup-bg: var(--gray-800);
    --popup-border: var(--gray-700);
    --popup-text: var(--gray-100);
}

[data-theme="light"] .learning-popup {
    --popup-bg: var(--glass-bg);
    --popup-border: var(--glass-border);
    --popup-text: var(--text-color);
}
```

This integration:
- Maintains existing performance optimizations
- Uses current animation system
- Follows established accessibility patterns
- Preserves theme switching functionality
- Leverages existing CSS variables 