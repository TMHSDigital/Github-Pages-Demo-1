'use strict';

/**
 * Animation Showcase - A comprehensive library of web animations
 * This module manages the animation showcase functionality including:
 * - Dynamic loading of animation categories
 * - Interactive demos
 * - Code snippet management
 * - Animation customization
 */

const AnimationShowcase = {
    /**
     * Initialize the animation showcase
     */
    init() {
        // Cache DOM elements
        this.container = document.querySelector('.animation-gallery');
        this.categoryTabs = document.querySelectorAll('.category-tab');
        this.activeCategory = 'transitions';
        
        // Initialize animation library with predefined animations
        this.animationLibrary = {
            transitions: [
                {
                    name: 'Fade In/Out',
                    id: 'fade-in-out',
                    description: 'Simple opacity transition that smoothly fades an element in or out on hover.',
                    css: `.fade-in-out {
  transition: opacity 0.5s ease;
}

.fade-in-out:hover {
  opacity: 0.5;
}`,
                    html: `<div class="fade-in-out">Hover over me</div>`,
                    js: ''
                },
                {
                    name: 'Scale Up',
                    id: 'scale-up',
                    description: 'Enlarges an element smoothly when hovered, creating emphasis.',
                    css: `.scale-up {
  transition: transform 0.5s ease;
}

.scale-up:hover {
  transform: scale(1.2);
}`,
                    html: `<div class="scale-up">Hover over me</div>`,
                    js: ''
                },
                {
                    name: 'Slide Left',
                    id: 'slide-left',
                    description: 'Slides an element to the left when hovered, suggesting interaction.',
                    css: `.slide-left {
  transition: transform 0.5s ease;
}

.slide-left:hover {
  transform: translateX(-20px);
}`,
                    html: `<div class="slide-left">Hover over me</div>`,
                    js: ''
                },
                {
                    name: 'Rotate 360',
                    id: 'rotate-360',
                    description: 'Rotates an element a full 360 degrees when hovered.',
                    css: `.rotate-360 {
  transition: transform 0.7s ease;
}

.rotate-360:hover {
  transform: rotate(360deg);
}`,
                    html: `<div class="rotate-360">Hover over me</div>`,
                    js: ''
                },
                {
                    name: 'Color Shift',
                    id: 'color-shift',
                    description: 'Changes background color, text color, and shadow on hover.',
                    css: `.color-shift {
  transition: background-color 0.5s ease, 
              color 0.5s ease, 
              box-shadow 0.5s ease;
}

.color-shift:hover {
  background: var(--accent-color);
  color: white;
  box-shadow: 0 10px 25px rgba(8, 145, 178, 0.4);
}`,
                    html: `<div class="color-shift">Hover over me</div>`,
                    js: ''
                }
            ],
            keyframes: [
                {
                    name: 'Pulse',
                    id: 'pulse',
                    description: 'Creates a pulsing effect by scaling an element up and down repeatedly.',
                    css: `@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.pulse {
  animation: pulse 1.5s infinite;
}`,
                    html: `<div class="pulse">Pulse Animation</div>`,
                    js: ''
                },
                {
                    name: 'Shake',
                    id: 'shake',
                    description: 'Creates a shaking effect, useful for error states or drawing attention.',
                    css: `@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.shake {
  animation: shake 0.8s ease-in-out;
}`,
                    html: `<div class="shake">Shake Animation</div>`,
                    js: `// Optionally trigger shake with JavaScript
document.querySelector('.shake').addEventListener('click', function() {
  this.classList.remove('shake');
  void this.offsetWidth; // Force reflow
  this.classList.add('shake');
});`
                },
                {
                    name: 'Bounce',
                    id: 'bounce',
                    description: 'Creates a bouncing effect, great for drawing attention to elements.',
                    css: `@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  60% { transform: translateY(-10px); }
}

.bounce {
  animation: bounce 2s infinite;
}`,
                    html: `<div class="bounce">Bounce Animation</div>`,
                    js: ''
                },
                {
                    name: 'Spin',
                    id: 'spin',
                    description: 'Rotates an element continuously, often used for loading indicators.',
                    css: `@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spin {
  animation: spin 2s linear infinite;
}`,
                    html: `<div class="spin">Spin Animation</div>`,
                    js: ''
                },
                {
                    name: 'Fade In Scale',
                    id: 'fade-in-scale',
                    description: 'Fades in an element while scaling it up, creating a smooth entrance.',
                    css: `@keyframes fadeInScale {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

.fade-in-scale {
  animation: fadeInScale 1s cubic-bezier(0.4, 0, 0.2, 1);
}`,
                    html: `<div class="fade-in-scale">Fade In Scale</div>`,
                    js: `// Replay animation with JavaScript
function replayAnimation(element) {
  element.classList.remove('fade-in-scale');
  void element.offsetWidth; // Force reflow
  element.classList.add('fade-in-scale');
}`
                }
            ],
            scroll: [
                {
                    name: 'Reveal On Scroll',
                    id: 'reveal-on-scroll',
                    description: 'Reveals elements as they enter the viewport during scrolling.',
                    css: `.reveal-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.reveal-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}`,
                    html: `<div class="reveal-on-scroll">I'll appear when scrolled into view</div>`,
                    js: `// Add scroll observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal-on-scroll').forEach(el => {
  observer.observe(el);
});`
                },
                {
                    name: 'Reveal From Left',
                    id: 'reveal-from-left',
                    description: 'Slides elements in from the left as they enter the viewport.',
                    css: `.reveal-from-left {
  opacity: 0;
  transform: translateX(-100px);
  transition: all 0.8s ease;
}

.reveal-from-left.visible {
  opacity: 1;
  transform: translateX(0);
}`,
                    html: `<div class="reveal-from-left">I'll slide in from the left</div>`,
                    js: `// Add scroll observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal-from-left').forEach(el => {
  observer.observe(el);
});`
                },
                {
                    name: 'Reveal From Right',
                    id: 'reveal-from-right',
                    description: 'Slides elements in from the right as they enter the viewport.',
                    css: `.reveal-from-right {
  opacity: 0;
  transform: translateX(100px);
  transition: all 0.8s ease;
}

.reveal-from-right.visible {
  opacity: 1;
  transform: translateX(0);
}`,
                    html: `<div class="reveal-from-right">I'll slide in from the right</div>`,
                    js: `// Add scroll observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal-from-right').forEach(el => {
  observer.observe(el);
});`
                }
            ],
            text: [
                {
                    name: 'Typewriter',
                    id: 'typewriter',
                    description: 'Simulates text being typed out character by character.',
                    css: `@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

.typewriter {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  animation: typewriter 2s steps(40) forwards;
}`,
                    html: `<span class="typewriter">Typing animation effect</span>`,
                    js: ''
                },
                {
                    name: 'Gradient Text',
                    id: 'gradient-text',
                    description: 'Creates a flowing gradient color effect for text.',
                    css: `@keyframes gradient-text {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.gradient-text {
  background: linear-gradient(135deg, 
    var(--secondary-color), 
    var(--accent-color), 
    var(--secondary-color));
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-text 3s linear infinite;
}`,
                    html: `<span class="gradient-text">Gradient Text Animation</span>`,
                    js: ''
                },
                {
                    name: 'Letter Spacing',
                    id: 'letter-spacing',
                    description: 'Increases the spacing between letters on hover.',
                    css: `.letter-spacing {
  transition: letter-spacing 0.5s ease;
}

.letter-spacing:hover {
  letter-spacing: 4px;
}`,
                    html: `<span class="letter-spacing">Hover to expand</span>`,
                    js: ''
                },
                {
                    name: 'Text Blur',
                    id: 'text-blur',
                    description: 'Creates a pulsating blur effect on text.',
                    css: `@keyframes text-blur {
  0% { filter: blur(0); }
  50% { filter: blur(4px); }
  100% { filter: blur(0); }
}

.text-blur {
  animation: text-blur 2s infinite;
}`,
                    html: `<span class="text-blur">Blurry Text Effect</span>`,
                    js: ''
                }
            ],
            interactive: [
                {
                    name: 'Hover Float',
                    id: 'hover-float',
                    description: 'Elevates an element when hovered, creating a floating effect.',
                    css: `.hover-float {
  transition: transform 0.3s ease;
}

.hover-float:hover {
  transform: translateY(-10px);
}`,
                    html: `<div class="hover-float">Hover over me</div>`,
                    js: ''
                },
                {
                    name: 'Hover Grow',
                    id: 'hover-grow',
                    description: 'Scales up an element when hovered, emphasizing it.',
                    css: `.hover-grow {
  transition: transform 0.3s ease;
}

.hover-grow:hover {
  transform: scale(1.1);
}`,
                    html: `<div class="hover-grow">Hover over me</div>`,
                    js: ''
                },
                {
                    name: 'Hover Glow',
                    id: 'hover-glow',
                    description: 'Adds a glowing effect around an element when hovered.',
                    css: `.hover-glow {
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px var(--accent-color);
  transform: translateY(-5px);
}`,
                    html: `<div class="hover-glow">Hover over me</div>`,
                    js: ''
                },
                {
                    name: 'Click Ripple',
                    id: 'click-ripple',
                    description: 'Creates a ripple effect emanating from where the element is clicked.',
                    css: `.click-ripple {
  position: relative;
  overflow: hidden;
}

.click-ripple::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.click-ripple.animate::after {
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0) translate(-50%, -50%);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20) translate(-50%, -50%);
    opacity: 0;
  }
}`,
                    html: `<div class="click-ripple">Click me</div>`,
                    js: `// Add click handler for ripple effect
document.querySelector('.click-ripple').addEventListener('click', function() {
  this.classList.remove('animate');
  void this.offsetWidth; // Force reflow
  this.classList.add('animate');
});`
                }
            ]
        };
        
        if (this.container) {
            // Set up event listeners first
            this.setupEventListeners();
            
            // Then load animations
            try {
                this.loadAnimations(this.activeCategory);
                console.log('Animation showcase initialized successfully');
            } catch (err) {
                console.error('Error loading animations:', err);
                this.container.innerHTML = `
                    <div class="error-message">
                        There was an error loading animations. Please try refreshing the page.
                    </div>
                `;
            }
        } else {
            console.warn('Animation gallery container not found');
        }
    },
    
    /**
     * Load animations for the selected category
     */
    loadAnimations(category) {
        if (!this.container) return;
        
        // Clear any existing content
        this.container.innerHTML = '';
        
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner"></div>
            <p>Loading animations...</p>
        `;
        this.container.appendChild(loadingIndicator);
        
        // Load animations (with minimal delay for smoother UX)
        setTimeout(() => {
            // Clear loading indicator
            this.container.innerHTML = '';
            
            // Get animations for the category
            const animations = this.animationLibrary[category] || [];
            
            if (animations.length === 0) {
                this.container.innerHTML = `<p class="no-results">No animations found for "${category}"</p>`;
                return;
            }
            
            // Create and append animation cards
            animations.forEach(animation => {
                try {
                    const card = this.createAnimationCard(animation);
                    this.container.appendChild(card);
                } catch (err) {
                    console.error(`Error creating card for "${animation.name}":`, err);
                }
            });
            
            // Add flash effect for category change
            const showcaseSection = this.container.closest('.showcase-section');
            if (showcaseSection) {
                showcaseSection.classList.add('category-tab-changing');
                setTimeout(() => {
                    showcaseSection.classList.remove('category-tab-changing');
                }, 300);
            }
            
            // Init syntax highlighting if Prism is available
            if (window.Prism) {
                try {
                    window.Prism.highlightAllUnder(this.container);
                } catch (e) {
                    console.warn('Prism syntax highlighting error:', e);
                }
            }
        }, 100);
    },
    
    /**
     * Create an animation card for a specific animation
     */
    createAnimationCard(animation) {
        const card = document.createElement('div');
        card.className = 'animation-card collapsed';
        card.dataset.animation = animation.id;
        
        // Create card HTML
        card.innerHTML = `
            <div class="animation-header">
                <div class="animation-preview">
                    <div class="demo-element ${animation.id}">
                        ${animation.id.includes('text') || animation.id.includes('typewriter') || animation.id.includes('gradient') || animation.id.includes('letter') ? 
                          animation.id : 'Demo'}
                    </div>
                    <button class="replay-animation" aria-label="Replay ${animation.name} animation">Replay</button>
                </div>
                
                <div class="animation-title">
                    <h3>${animation.name}</h3>
                    <button class="toggle-details" aria-expanded="false" aria-label="Toggle details for ${animation.name}">
                        <i class="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            
            <div class="animation-details">
                <p>${animation.description}</p>
                
                <div class="code-tabs">
                    <button class="code-tab active" data-code="css">CSS</button>
                    <button class="code-tab" data-code="html">HTML</button>
                    ${animation.js ? `<button class="code-tab" data-code="js">JavaScript</button>` : ''}
                </div>
                
                <div class="code-panel">
                    <pre><code class="language-css">${this.escapeHtml(animation.css)}</code></pre>
                </div>
                
                <div class="customization-panel">
                    <label>
                        Duration: 
                        <input type="range" class="duration-slider" min="0.1" max="2" step="0.1" value="0.5">
                        <span class="slider-value">0.5s</span>
                    </label>
                    
                    <label>
                        Easing:
                        <select class="easing-select">
                            <option value="ease">ease</option>
                            <option value="ease-in">ease-in</option>
                            <option value="ease-out">ease-out</option>
                            <option value="linear">linear</option>
                            <option value="cubic-bezier(0.2, 0.8, 0.2, 1)">cubic-bezier</option>
                        </select>
                    </label>
                    
                    <button class="copy-code-btn">Copy Code</button>
                </div>
            </div>
        `;
        
        return card;
    },
    
    /**
     * Set up event listeners for category tabs and animation cards
     */
    setupEventListeners() {
        // Category tab selection
        this.categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const currentActive = document.querySelector('.category-tab.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                tab.classList.add('active');
                
                // Load animations for category
                this.activeCategory = tab.dataset.category;
                this.loadAnimations(this.activeCategory);
                
                // Announce category change for screen readers
                this.announceChange(`Showing ${this.activeCategory} animations`);
            });
        });
        
        // Use event delegation for animation card interactions
        if (this.container) {
            this.container.addEventListener('click', (e) => {
                // Replay animation button
                if (e.target.classList.contains('replay-animation')) {
                    const card = e.target.closest('.animation-card');
                    this.replayAnimation(card);
                } 
                // Toggle details button
                else if (e.target.classList.contains('toggle-details') || e.target.closest('.toggle-details')) {
                    const card = e.target.closest('.animation-card');
                    this.toggleCardDetails(card);
                }
                // Copy code button
                else if (e.target.classList.contains('copy-code-btn')) {
                    const card = e.target.closest('.animation-card');
                    this.copyCode(card);
                }
                // Code tabs
                else if (e.target.classList.contains('code-tab')) {
                    const card = e.target.closest('.animation-card');
                    const tabs = card.querySelectorAll('.code-tab');
                    tabs.forEach(tab => tab.classList.remove('active'));
                    e.target.classList.add('active');
                    this.updateCodePanel(card, e.target.dataset.code);
                }
                // Animation title (also toggles details)
                else if (e.target.closest('.animation-title h3')) {
                    const card = e.target.closest('.animation-card');
                    this.toggleCardDetails(card);
                }
            });
            
            // Handle customization inputs
            this.container.addEventListener('input', (e) => {
                if (e.target.classList.contains('duration-slider')) {
                    const card = e.target.closest('.animation-card');
                    const value = e.target.value;
                    const valueDisplay = card.querySelector('.slider-value');
                    valueDisplay.textContent = `${value}s`;
                    this.updateCustomization(card, { duration: value });
                }
                else if (e.target.classList.contains('easing-select')) {
                    const card = e.target.closest('.animation-card');
                    this.updateCustomization(card, { easing: e.target.value });
                }
            });
        }
    },
    
    /**
     * Toggle animation card details visibility
     */
    toggleCardDetails(card) {
        const isCollapsed = card.classList.contains('collapsed');
        const toggleBtn = card.querySelector('.toggle-details');
        const chevron = toggleBtn.querySelector('i');
        
        if (isCollapsed) {
            // Expand
            card.classList.remove('collapsed');
            card.classList.add('expanded');
            toggleBtn.setAttribute('aria-expanded', 'true');
            chevron.classList.remove('fa-chevron-down');
            chevron.classList.add('fa-chevron-up');
            
            // Force syntax highlighting to re-run after expansion
            if (window.Prism && card.querySelector('pre code')) {
                try {
                    window.Prism.highlightElement(card.querySelector('pre code'));
                } catch (e) {
                    console.warn('Prism highlighting error:', e);
                }
            }
        } else {
            // Collapse
            card.classList.remove('expanded');
            card.classList.add('collapsed');
            toggleBtn.setAttribute('aria-expanded', 'false');
            chevron.classList.remove('fa-chevron-up');
            chevron.classList.add('fa-chevron-down');
        }
        
        // Announce state change for screen readers
        this.announceChange(`Details ${isCollapsed ? 'expanded' : 'collapsed'} for ${card.querySelector('h3').textContent}`);
    },
    
    /**
     * Replay animation in demo element
     */
    replayAnimation(card) {
        const demoElement = card.querySelector('.demo-element');
        const animationName = card.dataset.animation;
        
        // Remove class to reset animation
        demoElement.classList.remove(animationName);
        void demoElement.offsetWidth; // Force reflow
        
        // Add class back to restart animation
        demoElement.classList.add(animationName);
        
        // Announce for screen readers
        this.announceChange(`Replaying ${card.querySelector('h3').textContent} animation`);
    },
    
    /**
     * Update code panel content based on tab
     */
    updateCodePanel(card, codeType) {
        const animationId = card.dataset.animation;
        const animation = this.getAnimationById(animationId);
        if (!animation) return;
        
        const codePanel = card.querySelector('.code-panel');
        let codeContent = '';
        
        switch (codeType) {
            case 'css':
                codeContent = animation.css;
                break;
            case 'html':
                codeContent = animation.html;
                break;
            case 'js':
                codeContent = animation.js || '// No JavaScript required for this animation';
                break;
        }
        
        codePanel.innerHTML = `<pre><code class="language-${codeType}">${this.escapeHtml(codeContent)}</code></pre>`;
        
        // Apply syntax highlighting if Prism is available
        if (window.Prism) {
            try {
                window.Prism.highlightElement(codePanel.querySelector('code'));
            } catch (e) {
                console.warn('Prism syntax highlighting error:', e);
            }
        }
    },
    
    /**
     * Copy code snippet to clipboard
     */
    copyCode(card) {
        const codePanel = card.querySelector('.code-panel');
        const code = codePanel.textContent.trim();
        const copyBtn = card.querySelector('.copy-code-btn');
        const originalText = copyBtn.textContent;
        
        navigator.clipboard.writeText(code)
            .then(() => {
                copyBtn.textContent = 'Copied!';
                copyBtn.classList.add('copied');
                
                // Announce for screen readers
                this.announceChange('Code copied to clipboard');
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                copyBtn.textContent = 'Copy failed';
                copyBtn.classList.add('error');
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('error');
                }, 2000);
            });
    },
    
    /**
     * Update animation customization
     */
    updateCustomization(card, options) {
        const demoElement = card.querySelector('.demo-element');
        const animationId = card.dataset.animation;
        const animation = this.getAnimationById(animationId);
        
        if (!animation) return;
        
        // Get current customizations or defaults
        const duration = options.duration || card.querySelector('.duration-slider').value || 0.5;
        const easing = options.easing || card.querySelector('.easing-select').value || 'ease';
        
        // Apply customization based on animation type
        if (animation.id.includes('hover') || animation.id.includes('scale') || animation.id.includes('slide') || animation.id.includes('rotate') || animation.id.includes('color-shift')) {
            // For CSS transitions
            demoElement.style.transition = `all ${duration}s ${easing}`;
        } else {
            // For CSS animations
            demoElement.style.animationDuration = `${duration}s`;
            demoElement.style.animationTimingFunction = easing;
        }
        
        // Update code panel with new customizations
        const activeCodeTab = card.querySelector('.code-tab.active');
        if (activeCodeTab && activeCodeTab.dataset.code === 'css') {
            this.updateCodePanelWithCustomization(card, animation, duration, easing);
        }
    },
    
    /**
     * Update code panel with customization values
     */
    updateCodePanelWithCustomization(card, animation, duration, easing) {
        let updatedCss = animation.css;
        
        if (animation.id.includes('hover') || animation.id.includes('scale') || animation.id.includes('slide') || animation.id.includes('rotate') || animation.id.includes('color-shift')) {
            // Update transition property in CSS
            updatedCss = updatedCss.replace(
                /transition:.*?;/g, 
                `transition: all ${duration}s ${easing};`
            );
        } else {
            // Update animation properties in CSS
            updatedCss = updatedCss.replace(
                /animation:.*?;/g, 
                (match) => match.replace(/\d+(\.\d+)?s/, `${duration}s`).replace(/ease.*?[,;]/, `${easing},`)
            );
        }
        
        const codePanel = card.querySelector('.code-panel');
        codePanel.innerHTML = `<pre><code class="language-css">${this.escapeHtml(updatedCss)}</code></pre>`;
        
        // Apply syntax highlighting if Prism is available
        if (window.Prism) {
            try {
                window.Prism.highlightElement(codePanel.querySelector('code'));
            } catch (e) {
                console.warn('Prism syntax highlighting error:', e);
            }
        }
    },
    
    /**
     * Get animation object by ID
     */
    getAnimationById(id) {
        for (const category in this.animationLibrary) {
            const animation = this.animationLibrary[category].find(anim => anim.id === id);
            if (animation) return animation;
        }
        return null;
    },
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },
    
    /**
     * Announce changes for screen readers
     */
    announceChange(message) {
        // Use the Utilities module if available
        if (window.Utilities && typeof window.Utilities.announceMessage === 'function') {
            window.Utilities.announceMessage(message);
            return;
        }
        
        // Fallback method
        const announcer = document.getElementById('a11y-announcer') || (() => {
            const el = document.createElement('div');
            el.id = 'a11y-announcer';
            el.setAttribute('aria-live', 'polite');
            el.className = 'sr-only';
            document.body.appendChild(el);
            return el;
        })();
        announcer.textContent = message;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing Animation Showcase');
    try {
        AnimationShowcase.init();
    } catch (err) {
        console.error('Error initializing Animation Showcase:', err);
        // Attempt to display a fallback error message
        const container = document.querySelector('.animation-gallery');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    There was an error loading the animation showcase. 
                    Please check the console for details or refresh the page.
                </div>
            `;
        }
    }
}); 