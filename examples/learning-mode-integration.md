# Learning Mode Complete Integration

## Settings Panel HTML
```html
<div class="settings-panel" role="dialog" aria-labelledby="settings-title">
    <!-- Existing settings content -->
    <div class="settings-group">
        <label class="settings-label" for="learningModeToggle">
            <span>Learning Mode</span>
            <div class="toggle-switch">
                <input type="checkbox" 
                       id="learningModeToggle" 
                       aria-label="Toggle learning mode">
                <span class="toggle-slider" aria-hidden="true"></span>
            </div>
        </label>
        <p class="settings-description">
            Enable interactive guides to learn about site customization
        </p>
    </div>
</div>
```

## Settings Integration
```javascript
// Extend existing settings manager
class SettingsManager {
    constructor() {
        this.settings = {
            // Existing settings...
            learningMode: {
                id: 'learningModeToggle',
                storageKey: 'learning_mode_enabled',
                defaultValue: false,
                onChange: (enabled) => this.handleLearningModeChange(enabled)
            }
        };
        
        this.init();
    }

    init() {
        // Initialize existing settings...
        this.initLearningMode();
    }

    initLearningMode() {
        const toggle = document.getElementById(this.settings.learningMode.id);
        if (!toggle) return;

        // Load saved state
        const savedState = localStorage.getItem(this.settings.learningMode.storageKey);
        const isEnabled = savedState ? savedState === 'true' : this.settings.learningMode.defaultValue;
        
        // Update UI
        toggle.checked = isEnabled;
        document.documentElement.setAttribute('data-learning-mode', isEnabled);

        // Bind events
        toggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            this.handleLearningModeChange(enabled);
        });
    }

    handleLearningModeChange(enabled) {
        // Update storage
        localStorage.setItem(this.settings.learningMode.storageKey, enabled);
        
        // Update UI state
        document.documentElement.setAttribute('data-learning-mode', enabled);
        
        // Dispatch event for other components
        const event = new CustomEvent('learning-mode-change', {
            detail: { enabled }
        });
        document.documentElement.dispatchEvent(event);

        // Lazy load learning system if enabled
        if (enabled) {
            this.loadLearningSystem();
        }
    }

    async loadLearningSystem() {
        if (!this.learningSystem) {
            const { FeatureLearningSystem } = await import('./learning-system.js');
            this.learningSystem = new FeatureLearningSystem();
            await this.learningSystem.init();
        }
    }
}
```

## Live Editor Integration
```javascript
class LearningEditor {
    constructor() {
        this.editor = null;
        this.originalCode = null;
        this.activePreview = null;
    }

    async init(popup, code) {
        this.originalCode = code;
        
        // Create editor container
        const container = document.createElement('div');
        container.className = 'learning-editor';
        popup.querySelector('.popup-content').appendChild(container);

        // Load Monaco editor
        await this.loadMonaco();
        
        // Initialize editor
        this.editor = monaco.editor.create(container, {
            value: code,
            language: 'css',
            theme: this.getEditorTheme(),
            minimap: { enabled: false },
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontSize: 14,
            tabSize: 4
        });

        // Setup preview system
        this.setupPreview();
        
        // Handle theme changes
        document.documentElement.addEventListener('theme-change', () => {
            monaco.editor.setTheme(this.getEditorTheme());
        });
    }

    getEditorTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark' 
            ? 'vs-dark' 
            : 'vs-light';
    }

    async loadMonaco() {
        if (window.monaco) return;

        // Load Monaco editor dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs/loader.min.js';
        document.head.appendChild(script);

        await new Promise(resolve => script.onload = resolve);

        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' }});
        await new Promise(resolve => {
            require(['vs/editor/editor.main'], resolve);
        });
    }

    setupPreview() {
        let previewTimeout;
        
        this.editor.onDidChangeModelContent(() => {
            clearTimeout(previewTimeout);
            previewTimeout = setTimeout(() => {
                this.updatePreview(this.editor.getValue());
            }, 500);
        });
    }

    updatePreview(code) {
        if (this.activePreview) {
            this.activePreview.remove();
        }

        // Create preview stylesheet
        const style = document.createElement('style');
        style.textContent = code;
        document.head.appendChild(style);
        this.activePreview = style;

        // Revert after delay
        setTimeout(() => {
            if (this.activePreview === style) {
                style.remove();
                this.activePreview = null;
            }
        }, 5000);
    }

    cleanup() {
        if (this.editor) {
            this.editor.dispose();
        }
        if (this.activePreview) {
            this.activePreview.remove();
        }
    }
}

// Extend FeatureLearningSystem with editor support
class FeatureLearningSystem {
    constructor() {
        // Existing initialization...
        this.editor = null;
    }

    async initializeEditor(popup, code) {
        if (!this.editor) {
            this.editor = new LearningEditor();
        }
        await this.editor.init(popup, code);
    }

    handleTryItClick(popup, code) {
        this.initializeEditor(popup, code);
    }
}
```

## CSS Enhancements
```css
/* Add to your existing CSS */
.learning-editor {
    height: 300px;
    margin: 1rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.learning-editor.visible {
    opacity: 1;
    transform: translateY(0);
}

/* Dark mode support */
[data-theme="dark"] .learning-editor {
    border: 1px solid var(--gray-700);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .learning-editor {
        height: 200px;
    }
}

/* Animation optimizations */
.learning-editor {
    will-change: transform, opacity;
    contain: content;
}
```

## Usage Example
```javascript
// In your main.js or app initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize settings manager
    const settings = new SettingsManager();

    // Handle "Try It" button clicks
    document.addEventListener('click', (e) => {
        if (e.target.matches('.try-it-btn')) {
            const popup = e.target.closest('.learning-popup');
            const code = popup.querySelector('code').textContent;
            settings.learningSystem?.handleTryItClick(popup, code);
        }
    });
});
```

This integration:
- Seamlessly extends your settings panel
- Lazy loads the Monaco editor
- Maintains theme compatibility
- Provides live CSS preview
- Follows your performance patterns
- Uses existing animation system
- Preserves accessibility support

The system is modular and builds on your existing components while maintaining the same code style and optimization patterns. 