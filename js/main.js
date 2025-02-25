'use strict';

// Example of a modern JavaScript module
// Remove learning mode import
// import { LearningCore } from './learning.js';

const app = {
    init() {
        // Wait for DOM content to be loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initNavigation();
                this.loadSettings();
                this.initHero();
                this.initSettingsPanel();
                this.initPortfolio();
                this.initAnimations();
                this.setupKeyboardShortcuts();
                this.initSideNav();
                this.announcePageLoaded();
            });
        } else {
            // DOM already loaded
            this.initNavigation();
            this.loadSettings();
            this.initHero();
            this.initSettingsPanel();
            this.initPortfolio();
            this.initAnimations();
            this.setupKeyboardShortcuts();
            this.initSideNav();
            this.announcePageLoaded();
        }
    },

    initNavigation() {
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
        // Remove learning mode toggle reference
        // this.learningModeToggle = document.getElementById('learningModeToggle');

        // Initialize components
        this.setupScrollHandling();
        this.setupSmoothScroll();
        if (this.form) this.setupFormHandling();
        if (this.menuButton && this.nav) this.setupMobileMenu();
        if (this.settingsToggle && this.settingsPanel) this.setupSettings();

        // Remove learning mode initialization
        // this.learningCore = new LearningCore();
        // this.learningCore.init();
        
        // Remove keyboard shortcut for learning mode
        // this.setupKeyboardShortcuts();

        // Initialize theme management with improved memory handling
        this.themeState = {
            isTransitioning: false,
            currentTheme: null,
            TRANSITION_DURATION: 300,
            transitionTimeout: null,
            rafHandle: null
        };

        this.setupThemeManagement();
        this.setupIntersectionObserver();
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

        // Enhanced debounce validation
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
            input.classList.remove('is-validating');
        }

        const validate = () => {
            if (!input.value.trim()) {
                isValid = false;
                message = `${input.name.charAt(0).toUpperCase() + input.name.slice(1)} is required`;
            } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }

            input.setAttribute('aria-invalid', (!isValid).toString());
            
            if (error) {
                if (showError) {
                    error.textContent = message;
                    error.setAttribute('aria-hidden', 'false');
                    if (!input.matches(':focus')) {
                        this.announceMessage(message);
                    }
                } else {
                    error.textContent = '';
                    error.setAttribute('aria-hidden', 'true');
                }
            }

            // Enhanced visual feedback
            input.classList.remove('is-validating');
            input.classList.toggle('is-invalid', !isValid);
            input.classList.toggle('is-valid', isValid && input.value.trim());

            return isValid;
        };

        // Show validating state immediately when there's input
        if (input.value.trim()) {
            input.classList.add('is-validating');
        }

        if (!showError) {
            this.validationTimeout = setTimeout(validate, 300);
            return true;
        }

        return validate();
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
        let retries = 0;
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000;
        
        const showError = (message, isRetrying = false) => {
            const errorEl = document.createElement('div');
            errorEl.className = 'form-error-message';
            errorEl.setAttribute('role', 'alert');
            errorEl.setAttribute('aria-live', isRetrying ? 'polite' : 'assertive');
            errorEl.textContent = message;
            
            const existing = this.form.querySelector('.form-error-message');
            if (existing) existing.remove();
            
            this.form.insertBefore(errorEl, this.form.firstChild);
            
            // Only auto-remove non-retry errors
            if (!isRetrying) {
                setTimeout(() => errorEl.remove(), 5000);
            }
        };
        
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        const trySubmit = async () => {
            try {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Sending...';
                submitButton.setAttribute('aria-label', 'Sending message...');
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                this.showFormSuccess();
                this.form.reset();
                this.announceMessage('Message sent successfully!');
                return true;
            } catch (error) {
                retries++;
                if (retries < MAX_RETRIES) {
                    const delay = RETRY_DELAY * Math.pow(2, retries - 1); // Exponential backoff
                    showError(`Failed to send message. Retrying in ${delay/1000} seconds... (${retries}/${MAX_RETRIES})`, true);
                    await wait(delay);
                    return await trySubmit();
                }
                showError('Failed to send message after multiple attempts. Please try again later.');
                return false;
            }
        };
        
        try {
            await trySubmit();
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            submitButton.removeAttribute('aria-label');
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
        const updateSettingsState = (isOpen) => {
            this.settingsPanel.classList.toggle('active', isOpen);
            this.settingsToggle.setAttribute('aria-expanded', isOpen);
            this.settingsPanel.setAttribute('aria-hidden', !isOpen);
            
            // Remove learning mode code
            // if (isOpen) {
            //     this.trapFocus(this.settingsPanel);
            //     // Update learning mode toggle state
            //     if (this.learningModeToggle) {
            //         this.learningModeToggle.checked = this.learningCore.enabled;
            //     }
            // }
            if (isOpen) {
                this.trapFocus(this.settingsPanel);
            }
        };

        this.settingsToggle.addEventListener('click', () => {
            const isOpen = !this.settingsPanel.classList.contains('active');
            updateSettingsState(isOpen);
        });

        this.settingsClose.addEventListener('click', () => {
            updateSettingsState(false);
        });

        // Remove learning mode toggle handler
        // if (this.learningModeToggle) {
        //     this.learningModeToggle.addEventListener('change', () => {
        //         document.dispatchEvent(new CustomEvent('learning-mode-toggle', {
        //             detail: { enabled: this.learningModeToggle.checked }
        //         }));
        //     });
        // }

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsPanel.classList.contains('active')) {
                updateSettingsState(false);
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.settingsPanel.contains(e.target) && 
                !this.settingsToggle.contains(e.target) && 
                this.settingsPanel.classList.contains('active')) {
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

    // Theme state management with improved memory handling
    themeState: {
        isTransitioning: false,
        currentTheme: null,
        TRANSITION_DURATION: 300,
        transitionTimeout: null,
        rafHandle: null
    },

    updateTheme(isDark, enableTransition = true) {
        // Clear existing transitions
        if (this.themeState.transitionTimeout) clearTimeout(this.themeState.transitionTimeout);
        if (this.themeState.rafHandle) cancelAnimationFrame(this.themeState.rafHandle);

        const root = document.documentElement;
        const newTheme = isDark ? 'dark' : 'light';
        if (newTheme === this.themeState.currentTheme) return;

        // Immediate state update
        this.themeState.currentTheme = newTheme;
        localStorage.setItem('theme', newTheme);

        const applyTheme = () => {
            root.setAttribute('data-theme', newTheme);
            if (this.darkModeToggle) this.darkModeToggle.checked = isDark;
            
            // Remove learning mode specific notification code
            // Update notification container theme if it exists
            // const notificationContainer = document.querySelector('.notifications-container');
            // if (notificationContainer) {
            //     notificationContainer.setAttribute('data-theme', newTheme);
            // }
        };

        if (enableTransition) {
            root.classList.add('theme-transitioning');
            this.themeState.rafHandle = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    applyTheme();
                    this.themeState.transitionTimeout = setTimeout(() => {
                        root.classList.remove('theme-transitioning');
                    }, 300);
                });
            });
        } else {
            applyTheme();
        }
    },

    loadSettings() {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.updateTheme(savedTheme === 'dark', false);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.updateTheme(prefersDark, false);
        }

        // Remove learning mode code
        // Load learning mode state and set up toggle handler
        // if (this.learningModeToggle) {
        //     const learningEnabled = localStorage.getItem('learning_mode') === 'true';
        //     this.learningModeToggle.checked = learningEnabled;
        //     
        //     // Add learning mode toggle handler
        //     this.learningModeToggle.addEventListener('change', (e) => {
        //         const enabled = e.target.checked;
        //         localStorage.setItem('learning_mode', enabled);
        //         
        //         // Dispatch event for learning mode toggle
        //         document.dispatchEvent(new CustomEvent('learning-mode-toggle', { 
        //             detail: { enabled } 
        //         }));
        //         
        //         // Show feedback message
        //         const message = enabled ? 'Learning mode enabled (Press L to toggle)' : 'Learning mode disabled';
        //         if (this.learningCore && this.learningCore.notifications) {
        //             this.learningCore.notifications.show(message);
        //         }
        //     });
        // }

        // Set up dark mode toggle handler
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('change', (e) => {
                this.updateTheme(e.target.checked);
            });
        }

        // Watch for system theme changes
        const handleSystemThemeChange = (e) => {
            if (!localStorage.getItem('theme')) {
                this.updateTheme(e.matches, false);
            }
        };

        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', handleSystemThemeChange);
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

    setupThemeManagement() {
        const darkModeToggle = this.darkModeToggle;
        if (!darkModeToggle) return;

        // Initialize theme state
        this.themeState.currentTheme = document.documentElement.getAttribute('data-theme');
        darkModeToggle.checked = this.themeState.currentTheme === 'dark';

        // Handle toggle changes
        darkModeToggle.addEventListener('change', () => {
            this.updateTheme(darkModeToggle.checked);
        });

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

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe feature cards and sections
        document.querySelectorAll('.feature-card, section').forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
    },

    // Remove keyboard shortcuts function that handled learning mode
    // setupKeyboardShortcuts() {
    //     // Add keyboard shortcuts (L for learning mode, D for dark mode)
    //     document.addEventListener('keydown', (e) => {
    //         // Only trigger if no input elements are focused
    //         if (document.activeElement.tagName === 'INPUT' || 
    //             document.activeElement.tagName === 'TEXTAREA' ||
    //             document.activeElement.isContentEditable) {
    //             return;
    //         }
    //         
    //         // L key for learning mode
    //         if (e.key.toLowerCase() === 'l') {
    //             if (this.learningModeToggle) {
    //                 this.learningModeToggle.checked = !this.learningModeToggle.checked;
    //                 
    //                 // Trigger the change event
    //                 const event = new Event('change');
    //                 this.learningModeToggle.dispatchEvent(event);
    //             }
    //         }
    //         
    //         // D key for dark mode
    //         if (e.key.toLowerCase() === 'd') {
    //             if (this.darkModeToggle) {
    //                 this.darkModeToggle.checked = !this.darkModeToggle.checked;
    //                 
    //                 // Trigger the change event
    //                 const event = new Event('change');
    //                 this.darkModeToggle.dispatchEvent(event);
    //             }
    //         }
    //     });
    // }

    // Add dark mode keyboard shortcut only
    setupKeyboardShortcuts() {
        // Add keyboard shortcuts (D for dark mode, A for animations)
        document.addEventListener('keydown', (e) => {
            // Only trigger if no input elements are focused
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA' ||
                document.activeElement.isContentEditable) {
                return;
            }
            
            // D key for dark mode
            if (e.key.toLowerCase() === 'd') {
                if (this.darkModeToggle) {
                    this.darkModeToggle.checked = !this.darkModeToggle.checked;
                    
                    // Trigger the change event
                    const event = new Event('change');
                    this.darkModeToggle.dispatchEvent(event);
                }
            }
            
            // A key for animations section
            if (e.key.toLowerCase() === 'a') {
                const animationsSection = document.getElementById('animation-showcase');
                if (animationsSection) {
                    animationsSection.scrollIntoView({ behavior: 'smooth' });
                    this.announceMessage('Navigated to Animations section');
                }
            }
        });
    },

    initSettingsPanel() {
        const settingsToggle = document.querySelector('.settings-toggle');
        const settingsPanel = document.querySelector('.settings-panel');
        const closeSettings = document.querySelector('.close-settings');

        if (settingsToggle && settingsPanel) {
            settingsToggle.addEventListener('click', () => {
                settingsPanel.classList.toggle('open');
            });
        }

        if (closeSettings && settingsPanel) {
            closeSettings.addEventListener('click', () => {
                settingsPanel.classList.remove('open');
            });
        }
    },

    initPortfolio() {
        // Check if we're on a page with the portfolio section
        const portfolioSection = document.getElementById('portfolio');
        if (!portfolioSection) return;

        // Add category filters if they don't exist yet
        if (!document.querySelector('.portfolio-filters')) {
            const filtersHTML = `
                <div class="portfolio-filters">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="web">Web Design</button>
                    <button class="filter-btn" data-filter="app">App Development</button>
                    <button class="filter-btn" data-filter="ui">UI/UX</button>
                </div>
            `;
            
            const sectionIntro = portfolioSection.querySelector('.section-intro');
            if (sectionIntro) {
                sectionIntro.insertAdjacentHTML('afterend', filtersHTML);
            }
            
            // Add data-category attributes to portfolio items
            const portfolioItems = portfolioSection.querySelectorAll('.portfolio-item');
            
            // No need to assign categories as they're already in HTML
            
            // Add click event listener to filter buttons
            const filterBtns = portfolioSection.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active class from all buttons
                    filterBtns.forEach(b => b.classList.remove('active'));
                    
                    // Add active class to clicked button
                    btn.classList.add('active');
                    
                    // Get filter value
                    const filter = btn.getAttribute('data-filter');
                    
                    // Filter items
                    portfolioItems.forEach(item => {
                        if (filter === 'all') {
                            item.style.display = 'block';
                            setTimeout(() => {
                                item.style.opacity = '1';
                                item.style.transform = 'translateY(0)';
                            }, 50);
                        } else {
                            if (item.getAttribute('data-category') === filter) {
                                item.style.display = 'block';
                                setTimeout(() => {
                                    item.style.opacity = '1';
                                    item.style.transform = 'translateY(0)';
                                }, 50);
                            } else {
                                item.style.opacity = '0';
                                item.style.transform = 'translateY(20px)';
                                setTimeout(() => {
                                    item.style.display = 'none';
                                }, 300);
                            }
                        }
                    });
                });
            });
            
            // Initialize with 'all' filter
            portfolioItems.forEach(item => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
                item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            });
        }
    },

    initSideNav() {
        const sections = document.querySelectorAll('section[id]');
        const sideNavLinks = document.querySelectorAll('.side-nav a');
        const sideNav = document.querySelector('.side-nav');
        
        // Update active link and progress line on scroll
        const updateActiveLink = () => {
            let currentSection = '';
            let passed = false;
            
            // Calculate total scroll progress for the progress line
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollProgress = (scrollTop / scrollHeight) * 100;
            
            // Update progress line height
            if (sideNav) {
                const isMobile = window.innerWidth <= 768;
                if (isMobile) {
                    // For mobile (horizontal orientation)
                    const totalWidth = sideNav.querySelector('ul').offsetWidth;
                    const progressWidth = (scrollProgress / 100) * totalWidth;
                    sideNav.style.setProperty('--pseudo-height', `${Math.min(progressWidth, totalWidth)}px`);
                } else {
                    // For desktop (vertical orientation)
                    const totalHeight = sideNav.querySelector('ul').offsetHeight - 32; // Accounting for padding
                    const progressHeight = (scrollProgress / 100) * totalHeight;
                    sideNav.style.setProperty('--pseudo-height', `${Math.min(progressHeight, totalHeight)}px`);
                }
            }
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                
                if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                    currentSection = sectionId;
                    passed = true;
                }
            });
            
            // If at the bottom of the page, activate last section
            if (!passed && window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
                currentSection = sections[sections.length - 1].getAttribute('id');
            }
            
            // Update active classes
            sideNavLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSection}`) {
                    link.classList.add('active');
                }
            });
        };
        
        // Initial state
        updateActiveLink();
        
        // Update on scroll (with requestAnimationFrame for performance)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                window.cancelAnimationFrame(scrollTimeout);
            }
            scrollTimeout = window.requestAnimationFrame(updateActiveLink);
        }, { passive: true });
        
        // Update on resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) {
                window.cancelAnimationFrame(resizeTimeout);
            }
            resizeTimeout = window.requestAnimationFrame(updateActiveLink);
        }, { passive: true });
        
        // Handle click events
        sideNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Get offset for fixed header
                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    // Smooth scroll to target
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update URL hash without scrolling
                    history.pushState(null, null, targetId);
                    
                    // Update active state manually
                    sideNavLinks.forEach(navLink => navLink.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });
    }
};

// Single DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    app.init();
    
    // Set active navigation link based on current URL
    const setActiveNavLink = () => {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            // Get the path from the href
            const linkPath = new URL(link.href, window.location.origin).pathname;
            
            // Check if this link matches the current path
            if (currentPath === linkPath) {
                link.classList.add('active');
            } else if (currentPath === '/' && link.getAttribute('href') === '#home') {
                // Special case for home page
                link.classList.add('active');
            } else {
                // Check if the link's href is a fragment that matches the current hash
                const fragment = link.getAttribute('href');
                if (fragment && fragment.startsWith('#') && 
                    (window.location.hash === fragment || 
                     (!window.location.hash && currentPath === '/' && fragment === '#home'))) {
                    link.classList.add('active');
                }
            }
        });
    };
    
    // Set active link on page load
    setActiveNavLink();
    
    // Update active link when hash changes
    window.addEventListener('hashchange', setActiveNavLink);
    
    console.log('Site loaded!');
}); 