'use strict';

// Example of a modern JavaScript module
const app = {
    init() {
        // Cache DOM elements
        this.header = document.querySelector('.site-header');
        this.progressBar = document.querySelector('.scroll-progress');
        this.menuButton = document.querySelector('.menu-button');
        this.nav = document.querySelector('nav');
        this.form = document.getElementById('contact-form');
        this.settingsToggle = document.querySelector('.settings-toggle');
        this.settingsPanel = document.querySelector('.settings-panel');
        this.settingsClose = document.querySelector('.settings-close');
        this.darkModeToggle = document.getElementById('darkModeToggle');

        // Initialize components
        this.setupScrollHandling();
        this.setupSmoothScroll();
        if (this.form) this.setupFormHandling();
        if (this.menuButton && this.nav) this.setupMobileMenu();
        if (this.settingsToggle && this.settingsPanel) this.setupSettings();
        this.loadSettings();

        // Announce when the page is fully loaded
        window.addEventListener('load', () => {
            this.announcePageLoaded();
        });
    },

    setupScrollHandling() {
        let scrollTimeout;
        let lastScroll = 0;
        let scrollTicking = false;

        const handleScroll = () => {
            if (!scrollTicking) {
                requestAnimationFrame(() => {
                    const currentScroll = window.pageYOffset;
                    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const progress = (currentScroll / scrollHeight) * 100;

                    // Update progress bar
                    if (this.progressBar) {
                        this.progressBar.style.width = `${progress}%`;
                        this.progressBar.setAttribute('aria-valuenow', Math.round(progress));
                    }

                    // Header visibility
                    if (currentScroll <= 0) {
                        this.header.classList.remove('scroll-up');
                        this.header.setAttribute('aria-hidden', 'false');
                    } else if (currentScroll > lastScroll && !this.header.classList.contains('scroll-down')) {
                        this.header.classList.remove('scroll-up');
                        this.header.classList.add('scroll-down');
                        this.header.setAttribute('aria-hidden', 'true');
                    } else if (currentScroll < lastScroll && this.header.classList.contains('scroll-down')) {
                        this.header.classList.remove('scroll-down');
                        this.header.classList.add('scroll-up');
                        this.header.setAttribute('aria-hidden', 'false');
                    }

                    lastScroll = currentScroll;
                    scrollTicking = false;
                });
                scrollTicking = true;
            }

            // Debounce progress bar animation
            clearTimeout(scrollTimeout);
            this.progressBar?.classList.add('pulse');
            scrollTimeout = setTimeout(() => {
                this.progressBar?.classList.remove('pulse');
            }, 200);
        };

        // Use passive scroll listener for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });
    },

    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
                    const startPosition = window.pageYOffset;
                    const distance = targetPosition - startPosition;
                    
                    // Skip animation if user prefers reduced motion
                    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        window.scrollTo(0, targetPosition);
                        target.focus({ preventScroll: true });
                        return;
                    }

                    // Smooth scroll with RAF
                    let startTime = null;
                    const duration = 600;

                    function animation(currentTime) {
                        if (startTime === null) startTime = currentTime;
                        const timeElapsed = currentTime - startTime;
                        const progress = Math.min(timeElapsed / duration, 1);
                        const easeProgress = 0.5 * (1 - Math.cos(Math.PI * progress));
                        
                        window.scrollTo(0, startPosition + distance * easeProgress);
                        
                        if (timeElapsed < duration) {
                            requestAnimationFrame(animation);
                        } else {
                            target.focus({ preventScroll: true });
                        }
                    }
                    
                    requestAnimationFrame(animation);
                }
            });
        });
    },

    setupFormHandling() {
        const formGroups = this.form.querySelectorAll('.form-group');
        
        // Add live validation feedback
        formGroups.forEach(group => {
            const input = group.querySelector('input, textarea');
            const error = group.querySelector('.form-error');
            
            if (input && error) {
                input.addEventListener('input', () => {
                    this.validateInput(input);
                });

                input.addEventListener('blur', () => {
                    this.validateInput(input, true);
                });
            }
        });

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.submitForm();
            }
        });
    },

    validateInput(input, showError = false) {
        const error = document.getElementById(`${input.id}-error`);
        let isValid = true;
        let message = '';

        if (!input.value.trim()) {
            isValid = false;
            message = `${input.name.charAt(0).toUpperCase() + input.name.slice(1)} is required`;
        } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
            isValid = false;
            message = 'Please enter a valid email address';
        }

        input.setAttribute('aria-invalid', (!isValid).toString());
        if (error) {
            error.textContent = showError ? message : '';
            error.setAttribute('aria-hidden', (!showError || isValid).toString());
        }

        return isValid;
    },

    validateForm() {
        const inputs = this.form.querySelectorAll('input, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateInput(input, true)) {
                isValid = false;
                if (!this.form.querySelector('[aria-invalid="true"]:focus')) {
                    input.focus();
                }
            }
        });

        return isValid;
    },

    async submitForm() {
        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showFormSuccess();
            this.form.reset();
            
            // Announce success to screen readers
            this.announceMessage('Message sent successfully!');
        } catch (error) {
            this.showFormError('Failed to send message. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    },

    setupMobileMenu() {
        let isMenuOpen = false;

        const updateMenuState = (isOpen) => {
            isMenuOpen = isOpen;
            this.nav.classList.toggle('active', isOpen);
            this.menuButton.innerHTML = isOpen ? 
                '<i class="fas fa-times"></i>' : 
                '<i class="fas fa-bars"></i>';
            this.menuButton.setAttribute('aria-expanded', isOpen.toString());
            document.body.style.overflow = isOpen ? 'hidden' : '';

            // Announce menu state to screen readers
            this.announceMessage(`Menu ${isOpen ? 'opened' : 'closed'}`);

            // Trap focus when menu is open
            if (isOpen) {
                this.trapFocus(this.nav);
            }
        };

        this.menuButton.addEventListener('click', () => {
            updateMenuState(!isMenuOpen);
        });

        // Close menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                updateMenuState(false);
                this.menuButton.focus();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (isMenuOpen && !this.nav.contains(e.target) && !this.menuButton.contains(e.target)) {
                updateMenuState(false);
            }
        });
    },

    setupSettings() {
        let isSettingsOpen = false;
        let previousActiveElement = null;

        const updateSettingsState = (isOpen) => {
            isSettingsOpen = isOpen;
            this.settingsPanel.classList.toggle('active', isOpen);
            this.settingsToggle.setAttribute('aria-expanded', isOpen.toString());
            this.settingsPanel.setAttribute('aria-hidden', (!isOpen).toString());
            document.body.style.overflow = isOpen ? 'hidden' : '';

            if (isOpen) {
                previousActiveElement = document.activeElement;
                this.trapFocus(this.settingsPanel);
                this.announceMessage('Settings panel opened');
            } else {
                previousActiveElement?.focus();
                this.announceMessage('Settings panel closed');
            }
        };

        this.settingsToggle.addEventListener('click', () => {
            updateSettingsState(!isSettingsOpen);
        });

        this.settingsClose.addEventListener('click', () => {
            updateSettingsState(false);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isSettingsOpen) {
                updateSettingsState(false);
            }
        });
    },

    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });

        firstFocusable.focus();
    },

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

    announcePageLoaded() {
        this.announceMessage('Page loaded. Welcome to TMHSDigital.');
    },

    // Theme state management
    themeState: {
        isTransitioning: false,
        currentTheme: null,
        TRANSITION_DURATION: 300
    },

    // Theme utility method
    updateTheme(isDark, enableTransition = true) {
        // Prevent rapid toggles during transition
        if (enableTransition && this.themeState.isTransitioning) return;
        
        const root = document.documentElement;
        const newTheme = isDark ? 'dark' : 'light';
        
        // Skip if theme hasn't changed
        if (newTheme === this.themeState.currentTheme) return;
        this.themeState.currentTheme = newTheme;
        
        if (enableTransition) {
            this.themeState.isTransitioning = true;
            requestAnimationFrame(() => {
                root.classList.add('theme-transitioning');
                root.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                
                setTimeout(() => {
                    root.classList.remove('theme-transitioning');
                    this.themeState.isTransitioning = false;
                }, this.themeState.TRANSITION_DURATION);
            });
        } else {
            root.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        }
        
        document.getElementById('darkModeToggle').checked = isDark;
    },

    loadSettings() {
        // Initialize theme state
        this.themeState.currentTheme = document.documentElement.getAttribute('data-theme');
        document.getElementById('darkModeToggle').checked = this.themeState.currentTheme === 'dark';

        // Listen for system preference changes
        const darkModeMediaQuery = matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = (e) => {
            if (!localStorage.getItem('theme')) {
                this.updateTheme(e.matches, false);
            }
        };

        // Use newer event listener if supported, fallback for Safari
        if (darkModeMediaQuery.addEventListener) {
            darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
        } else {
            darkModeMediaQuery.addListener(handleSystemThemeChange);
        }
    },

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    showFormError(message) {
        alert(message); // Replace with better UI feedback in production
    },

    showFormSuccess() {
        const form = document.getElementById('contact-form');
        const successMessage = document.createElement('div');
        successMessage.className = 'form-success';
        successMessage.setAttribute('role', 'alert');
        successMessage.textContent = 'Message sent successfully!';
        
        form.reset();
        form.insertAdjacentElement('beforebegin', successMessage);
        
        setTimeout(() => successMessage.remove(), 5000);
    }
};

// Single DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    app.init();
    console.log('Site loaded!');
}); 