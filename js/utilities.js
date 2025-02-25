/**
 * Shared utility functions for the website
 */
const Utilities = {
    /**
     * Create or get the accessibility announcer and announce a message
     * This is used by both main.js and animations.js
     * @param {string} message - The message to announce
     */
    announceMessage(message) {
        const announcer = document.getElementById('a11y-announcer') || (() => {
            const el = document.createElement('div');
            el.id = 'a11y-announcer';
            el.setAttribute('aria-live', 'polite');
            el.className = 'sr-only';
            document.body.appendChild(el);
            return el;
        })();
        announcer.textContent = message;
    },

    /**
     * Get a querystring parameter by name
     * @param {string} name - The name of the parameter to retrieve
     * @returns {string|null} - The parameter value or null if not found
     */
    getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    /**
     * Debounce a function to improve performance
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce delay in milliseconds
     * @returns {Function} - The debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },
    
    /**
     * Feature detection for browser capabilities
     * @returns {Object} Object containing feature support booleans
     */
    detectFeatures() {
        return {
            // Check if IntersectionObserver is supported
            intersectionObserver: 'IntersectionObserver' in window,
            
            // Check if Web Animations API is supported
            webAnimations: 'animate' in document.createElement('div'),
            
            // Check if CSS custom properties are supported
            cssVariables: window.CSS && CSS.supports('color', 'var(--test)'),
            
            // Check if the browser supports the clip-path property
            clipPath: CSS.supports('clip-path', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'),
            
            // Check if the browser supports the backdrop-filter property
            backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
            
            // Check touch support
            touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            
            // Check if reduced motion is preferred
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            
            // Check localStorage support with error handling
            localStorage: (() => {
                try {
                    const testKey = '__test__';
                    localStorage.setItem(testKey, testKey);
                    localStorage.removeItem(testKey);
                    return true;
                } catch (e) {
                    return false;
                }
            })()
        };
    },
    
    /**
     * Apply fallbacks for unsupported features
     * @param {HTMLElement} root - The root element to apply fallbacks to (default: document.documentElement)
     */
    applyFeatureFallbacks(root = document.documentElement) {
        const features = this.detectFeatures();
        
        // Add classes to the root element to allow CSS fallbacks
        if (!features.cssVariables) root.classList.add('no-css-variables');
        if (!features.clipPath) root.classList.add('no-clip-path');
        if (!features.backdropFilter) root.classList.add('no-backdrop-filter');
        if (features.touch) root.classList.add('touch-device');
        if (features.reducedMotion) root.classList.add('reduced-motion');
        
        // Fallback for IntersectionObserver - load all elements immediately
        if (!features.intersectionObserver) {
            document.querySelectorAll('.fade-in').forEach(el => {
                el.classList.add('visible');
            });
        }
        
        // Fallback for backdrop-filter
        if (!features.backdropFilter) {
            document.querySelectorAll('.site-header, .settings-panel').forEach(el => {
                el.style.backgroundColor = getComputedStyle(el).backgroundColor.replace('rgba', 'rgb').replace(/,[^,]+\)/, ')');
            });
        }
        
        return features;
    }
};

// Export as global object
window.Utilities = Utilities;

// Support ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utilities;
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return Utilities; });
} 