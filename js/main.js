'use strict';

// Example of a modern JavaScript module
const app = {
    init() {
        this.attachEventListeners();
        this.setupFormHandling();
        this.setupMobileMenu();
        this.setupSettings();
        this.loadSettings();
    },

    attachEventListeners() {
        let scrollTimeout;
        let ticking = false;
        
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Site loaded!');
            // Smooth scroll for navigation links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.querySelector(anchor.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });

            // Header scroll effect
            let lastScroll = 0;
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        const header = document.querySelector('.site-header');
                        const progressBar = document.querySelector('.scroll-progress');
                        const currentScroll = window.pageYOffset;
                        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                        const progress = (currentScroll / scrollHeight) * 100;

                        // Update scroll progress bar
                        progressBar.style.width = `${progress}%`;

                        // Add pulse effect
                        clearTimeout(scrollTimeout);
                        progressBar.classList.add('pulse');
                        scrollTimeout = setTimeout(() => {
                            progressBar.classList.remove('pulse');
                        }, 500);

                        // Existing header scroll logic
                        if (currentScroll <= 0) {
                            header.classList.remove('scroll-up');
                            return;
                        }

                        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
                            header.classList.remove('scroll-up');
                            header.classList.add('scroll-down');
                        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
                            header.classList.remove('scroll-down');
                            header.classList.add('scroll-up');
                        }
                        lastScroll = currentScroll;
                        ticking = false;
                    });
                    ticking = true;
                }
            });
        });
    },

    setupFormHandling() {
        const form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                // Validate form
                if (this.validateForm(data)) {
                    // Simulate form submission
                    this.submitForm(data);
                }
            });
        }
    },

    validateForm(data) {
        const errors = [];
        const errorElements = {
            name: document.getElementById('name-error'),
            email: document.getElementById('email-error'),
            message: document.getElementById('message-error')
        };

        // Reset previous errors
        Object.values(errorElements).forEach(el => el.textContent = '');

        if (!data.name || data.name.trim() === '') {
            errors.push({ field: 'name', message: 'Name is required' });
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push({ field: 'email', message: 'Valid email is required' });
        }

        if (!data.message || data.message.trim() === '') {
            errors.push({ field: 'message', message: 'Message is required' });
        }

        if (errors.length > 0) {
            errors.forEach(error => {
                const element = errorElements[error.field];
                if (element) {
                    element.textContent = error.message;
                    const input = document.getElementById(error.field);
                    input.setAttribute('aria-invalid', 'true');
                    input.focus();
                }
            });
            return false;
        }

        // Reset aria-invalid
        ['name', 'email', 'message'].forEach(field => {
            document.getElementById(field).setAttribute('aria-invalid', 'false');
        });

        return true;
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
    },

    async submitForm(data) {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.showFormSuccess();
        } catch (error) {
            this.showFormError('Failed to send message. Please try again.');
        }
    },

    setupMobileMenu() {
        const menuButton = document.querySelector('.menu-button');
        const nav = document.querySelector('nav');
        const navLinks = document.querySelectorAll('nav a');
        let isMenuOpen = false;

        const updateMenuState = (isOpen) => {
            isMenuOpen = isOpen;
            nav.classList.toggle('active', isOpen);
            menuButton.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
            menuButton.setAttribute('aria-expanded', isOpen.toString());
            this.updateBodyOverflow();
        };

        if (menuButton && nav) {
            // Toggle menu
            menuButton.addEventListener('click', () => {
                updateMenuState(!isMenuOpen);
            });

            // Close menu when clicking a link
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    updateMenuState(false);
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (isMenuOpen && !nav.contains(e.target) && !menuButton.contains(e.target)) {
                    updateMenuState(false);
                }
            });

            // Handle escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isMenuOpen) {
                    updateMenuState(false);
                }
            });
        }
    },

    setupSettings() {
        const settingsToggle = document.querySelector('.settings-toggle');
        const settingsPanel = document.querySelector('.settings-panel');
        const settingsClose = document.querySelector('.settings-close');
        const darkModeToggle = document.getElementById('darkModeToggle');
        let isSettingsOpen = false;
        let previousActiveElement = null;

        const updatePanelState = (isOpen) => {
            isSettingsOpen = isOpen;
            settingsPanel.classList.toggle('active', isOpen);
            settingsToggle.setAttribute('aria-expanded', isOpen.toString());
            settingsPanel.setAttribute('aria-hidden', (!isOpen).toString());
            
            if (isOpen) {
                previousActiveElement = document.activeElement;
                // Ensure panel is focusable
                settingsPanel.setAttribute('tabindex', '-1');
                // Delay focus to allow for animation
                requestAnimationFrame(() => {
                    this.trapFocus(settingsPanel);
                });
            } else {
                // Return focus after animation completes
                setTimeout(() => {
                    previousActiveElement?.focus();
                }, 300); // Match transition duration
            }
            
            this.updateBodyOverflow();
        };

        // Toggle settings panel
        settingsToggle.addEventListener('click', () => {
            updatePanelState(!isSettingsOpen);
        });

        // Close settings panel
        settingsClose.addEventListener('click', () => {
            updatePanelState(false);
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isSettingsOpen) {
                updatePanelState(false);
            }
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (isSettingsOpen && 
                !settingsPanel.contains(e.target) && 
                !settingsToggle.contains(e.target)) {
                updatePanelState(false);
            }
        });

        // Handle dark mode toggle
        darkModeToggle.addEventListener('change', () => {
            this.updateTheme(darkModeToggle.checked);
        });
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

    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0] || element;
        const lastFocusable = focusableElements[focusableElements.length - 1] || element;

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        });

        firstFocusable.focus();
    },

    updateBodyOverflow() {
        const mobileMenu = document.querySelector('nav');
        const settingsPanel = document.querySelector('.settings-panel');
        const isMenuOpen = mobileMenu?.classList.contains('active');
        const isSettingsOpen = settingsPanel?.classList.contains('active');
        const isAnyPanelOpen = isMenuOpen || isSettingsOpen;

        document.body.style.overflow = isAnyPanelOpen ? 'hidden' : '';
        document.documentElement.style.overflow = isAnyPanelOpen ? 'hidden' : '';

        // Update ARIA attributes
        if (mobileMenu) {
            mobileMenu.setAttribute('aria-hidden', (!isMenuOpen).toString());
        }
        if (settingsPanel) {
            settingsPanel.setAttribute('aria-hidden', (!isSettingsOpen).toString());
        }
    }
};

app.init(); 