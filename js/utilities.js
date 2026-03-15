'use strict';

const Utilities = {
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

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    detectFeatures() {
        const cssSupports = window.CSS && typeof CSS.supports === 'function';
        return {
            intersectionObserver: 'IntersectionObserver' in window,
            webAnimations: 'animate' in document.createElement('div'),
            cssVariables: cssSupports && CSS.supports('color', 'var(--test)'),
            clipPath: cssSupports && CSS.supports('clip-path', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'),
            backdropFilter: cssSupports && CSS.supports('backdrop-filter', 'blur(10px)'),
            touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
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

    applyFeatureFallbacks(root = document.documentElement) {
        const features = this.detectFeatures();

        if (!features.cssVariables) root.classList.add('no-css-variables');
        if (!features.clipPath) root.classList.add('no-clip-path');
        if (!features.backdropFilter) root.classList.add('no-backdrop-filter');
        if (features.touch) root.classList.add('touch-device');
        if (features.reducedMotion) root.classList.add('reduced-motion');

        if (!features.intersectionObserver) {
            document.querySelectorAll('.fade-in').forEach(el => {
                el.classList.add('visible');
            });
        }

        if (!features.backdropFilter) {
            document.querySelectorAll('.site-header, .settings-panel').forEach(el => {
                el.style.backgroundColor = getComputedStyle(el).backgroundColor.replace('rgba', 'rgb').replace(/,[^,]+\)/, ')');
            });
        }

        return features;
    }
};

window.Utilities = Utilities;
