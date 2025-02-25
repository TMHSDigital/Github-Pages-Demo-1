// Learning Mode Core Implementation
export class LearningCore {
    constructor() {
        this.enabled = localStorage.getItem('learning_mode') === 'true';
        this.root = document.documentElement;
        this.notifications = {
            show: this.announceMessage.bind(this)
        };
        this.currentStep = 0;
        this.tourActive = false;
        this.learningElements = [];
    }

    init() {
        // Set initial state
        this.toggle(this.enabled);

        // Listen for learning mode toggle events
        document.addEventListener('learning-mode-toggle', (e) => {
            this.toggle(e.detail.enabled);
        });

        // Set up all learning elements
        this.setupLearningElements();
        
        // Setup keyboard navigation for tour
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            
            // Arrow keys to navigate tour
            if (e.key === 'ArrowRight' && this.tourActive) {
                this.nextStep();
            } else if (e.key === 'ArrowLeft' && this.tourActive) {
                this.prevStep();
            } else if (e.key === 'Escape' && this.tourActive) {
                this.endTour();
            } else if (e.key === 'Enter' && this.enabled && !this.tourActive) {
                this.startTour();
            }
        });
    }

    toggle(enabled) {
        this.enabled = enabled;
        localStorage.setItem('learning_mode', enabled);
        
        if (enabled) {
            this.root.classList.add('learning-mode');
            this.announceMessage('Learning mode enabled (Press L to toggle, Enter to start tour)');
            this.showLearnPrompt();
        } else {
            this.root.classList.remove('learning-mode');
            this.announceMessage('Learning mode disabled');
            this.endTour();
            this.removeLearnPrompt();
        }
    }

    setupLearningElements() {
        // Setup feature cards
        this.setupFeatureCards();
        
        // Setup additional elements for learning
        this.setupSiteHeader();
        this.setupHeroSection();
        this.setupAboutSection();
        this.setupContactSection();
        this.setupSettingsPanel();
        
        // Track mouse position for tooltip parallax
        document.addEventListener('mousemove', (e) => {
            this.root.style.setProperty('--mouse-x', e.clientX);
            this.root.style.setProperty('--mouse-y', e.clientY);
        }, { passive: true });
    }

    setupFeatureCards() {
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach((card, index) => {
            // Create tooltip if it doesn't exist
            if (!card.querySelector('.feature-tooltip')) {
                const tooltip = document.createElement('div');
                tooltip.className = 'feature-tooltip';
                tooltip.textContent = card.getAttribute('data-tooltip') || 'Click to learn more about this feature';
                card.appendChild(tooltip);
            }

            // Add keyboard navigation
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', card.querySelector('h3')?.textContent);
            
            // Add to learning elements
            this.learningElements.push({
                element: card,
                title: card.querySelector('h3')?.textContent || `Feature ${index + 1}`,
                description: card.getAttribute('data-tooltip') || 'A key feature of this template',
                category: 'feature'
            });
            
            // Add click handler to show more info
            card.addEventListener('click', () => {
                if (this.enabled) {
                    this.showFeatureInfo(card);
                }
            });
        });
    }
    
    setupSiteHeader() {
        const header = document.querySelector('.site-header');
        if (header) {
            const headerTitle = header.querySelector('h1');
            const nav = header.querySelector('nav');
            
            // Add logo tooltip
            if (headerTitle && !headerTitle.querySelector('.feature-tooltip')) {
                const logoTooltip = document.createElement('div');
                logoTooltip.className = 'feature-tooltip';
                logoTooltip.textContent = 'The site logo with responsive design';
                headerTitle.style.position = 'relative';
                headerTitle.appendChild(logoTooltip);
                
                this.learningElements.push({
                    element: headerTitle,
                    title: 'Site Logo',
                    description: 'A modern, responsive logo with gradient effects',
                    category: 'header'
                });
            }
            
            // Add navigation tooltip
            if (nav && !nav.querySelector('.feature-tooltip')) {
                const navTooltip = document.createElement('div');
                navTooltip.className = 'feature-tooltip';
                navTooltip.textContent = 'Responsive navigation menu with smooth scrolling';
                nav.style.position = 'relative';
                nav.appendChild(navTooltip);
                
                this.learningElements.push({
                    element: nav,
                    title: 'Navigation Menu',
                    description: 'Mobile-friendly navigation with smooth scroll effects',
                    category: 'header'
                });
            }
        }
    }
    
    setupHeroSection() {
        const hero = document.querySelector('.hero');
        if (hero) {
            const heroContent = hero.querySelector('.container');
            if (heroContent && !heroContent.querySelector('.feature-tooltip')) {
                const heroTooltip = document.createElement('div');
                heroTooltip.className = 'feature-tooltip';
                heroTooltip.textContent = 'Eye-catching hero section with animated background';
                heroContent.style.position = 'relative';
                heroContent.appendChild(heroTooltip);
                
                this.learningElements.push({
                    element: heroContent,
                    title: 'Hero Section',
                    description: 'A bold, attention-grabbing introduction with animations',
                    category: 'section'
                });
            }
        }
    }
    
    setupAboutSection() {
        const about = document.querySelector('.about-content');
        if (about && !about.querySelector('.feature-tooltip')) {
            const aboutTooltip = document.createElement('div');
            aboutTooltip.className = 'feature-tooltip';
            aboutTooltip.textContent = 'Glass-effect content area with optimized readability';
            about.style.position = 'relative';
            about.appendChild(aboutTooltip);
            
            this.learningElements.push({
                element: about,
                title: 'About Section',
                description: 'Modern glass morphism effect with optimized typography',
                category: 'section'
            });
        }
    }
    
    setupContactSection() {
        const form = document.querySelector('.contact-form');
        if (form && !form.querySelector('.feature-tooltip')) {
            const formTooltip = document.createElement('div');
            formTooltip.className = 'feature-tooltip';
            formTooltip.textContent = 'Accessible contact form with client-side validation';
            form.style.position = 'relative';
            form.appendChild(formTooltip);
            
            this.learningElements.push({
                element: form,
                title: 'Contact Form',
                description: 'ARIA-compliant form with client-side validation and focus styles',
                category: 'section'
            });
        }
    }
    
    setupSettingsPanel() {
        const toggle = document.querySelector('.settings-toggle');
        if (toggle && !toggle.querySelector('.feature-tooltip')) {
            const toggleTooltip = document.createElement('div');
            toggleTooltip.className = 'feature-tooltip';
            toggleTooltip.textContent = 'Open settings panel for theme options';
            toggle.style.position = 'relative';
            toggle.appendChild(toggleTooltip);
            
            this.learningElements.push({
                element: toggle,
                title: 'Settings Panel',
                description: 'Customizable theme options with animated interface',
                category: 'controls'
            });
        }
    }
    
    showFeatureInfo(element) {
        const title = element.querySelector('h3')?.textContent;
        const description = element.getAttribute('data-tooltip');
        
        this.showModalInfo(title, description, element);
    }
    
    showModalInfo(title, description, relatedElement) {
        // Remove any existing modals
        const existingModal = document.querySelector('.learning-modal');
        if (existingModal) existingModal.remove();
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'learning-modal';
        
        // Create content
        modal.innerHTML = `
            <div class="learning-modal-content">
                <h3>${title}</h3>
                <p>${description}</p>
                <div class="learning-modal-actions">
                    <button class="modal-close">Close</button>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(modal);
        
        // Add close functionality
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // Close on escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Highlight the related element
        if (relatedElement) {
            relatedElement.classList.add('learning-highlight');
            setTimeout(() => {
                relatedElement.classList.remove('learning-highlight');
            }, 2000);
        }
        
        // Show modal with animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }
    
    showLearnPrompt() {
        // Remove any existing prompt
        this.removeLearnPrompt();
        
        // Create prompt
        const prompt = document.createElement('div');
        prompt.className = 'learning-prompt';
        prompt.innerHTML = `
            <div class="learning-prompt-content">
                <h3>Learning Mode Active</h3>
                <p>Hover over elements to see tooltips or press Enter to start guided tour</p>
                <div class="learning-prompt-actions">
                    <button class="start-tour">Start Tour</button>
                    <button class="dismiss-prompt">Dismiss</button>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(prompt);
        
        // Add button functionality
        const startBtn = prompt.querySelector('.start-tour');
        const dismissBtn = prompt.querySelector('.dismiss-prompt');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startTour();
                prompt.remove();
            });
        }
        
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                prompt.remove();
            });
        }
        
        // Show with animation
        requestAnimationFrame(() => {
            prompt.classList.add('active');
        });
        
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            if (document.body.contains(prompt)) {
                prompt.classList.remove('active');
                setTimeout(() => {
                    if (document.body.contains(prompt)) {
                        prompt.remove();
                    }
                }, 500);
            }
        }, 8000);
    }
    
    removeLearnPrompt() {
        const prompt = document.querySelector('.learning-prompt');
        if (prompt) {
            prompt.classList.remove('active');
            setTimeout(() => prompt.remove(), 500);
        }
    }
    
    startTour() {
        if (!this.enabled || this.tourActive) return;
        
        this.tourActive = true;
        this.currentStep = 0;
        
        // Create tour UI
        const tourUI = document.createElement('div');
        tourUI.className = 'learning-tour-ui';
        tourUI.innerHTML = `
            <div class="tour-controls">
                <button class="tour-prev" aria-label="Previous step">&larr;</button>
                <span class="tour-progress">Step 1 of ${this.learningElements.length}</span>
                <button class="tour-next" aria-label="Next step">&rarr;</button>
            </div>
            <button class="tour-close" aria-label="End tour">✕</button>
        `;
        document.body.appendChild(tourUI);
        
        // Add control handlers
        const prevBtn = tourUI.querySelector('.tour-prev');
        const nextBtn = tourUI.querySelector('.tour-next');
        const closeBtn = tourUI.querySelector('.tour-close');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (closeBtn) closeBtn.addEventListener('click', () => this.endTour());
        
        // Show first step
        this.showTourStep(0);
        
        // Announce to screen readers
        this.announceMessage('Guided tour started. Use arrow keys to navigate or Escape to end tour.');
    }
    
    endTour() {
        if (!this.tourActive) return;
        
        this.tourActive = false;
        
        // Remove tour UI
        const tourUI = document.querySelector('.learning-tour-ui');
        if (tourUI) tourUI.remove();
        
        // Remove any highlights
        document.querySelectorAll('.learning-highlight').forEach(el => {
            el.classList.remove('learning-highlight');
        });
        
        // Announce to screen readers
        this.announceMessage('Guided tour ended.');
    }
    
    nextStep() {
        if (!this.tourActive) return;
        
        if (this.currentStep < this.learningElements.length - 1) {
            this.currentStep++;
            this.showTourStep(this.currentStep);
        } else {
            // End of tour
            this.announceMessage('End of tour reached');
            // Loop back to beginning
            this.currentStep = 0;
            this.showTourStep(this.currentStep);
        }
    }
    
    prevStep() {
        if (!this.tourActive) return;
        
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showTourStep(this.currentStep);
        } else {
            // Beginning of tour
            this.announceMessage('Beginning of tour reached');
        }
    }
    
    showTourStep(stepIndex) {
        if (!this.tourActive || !this.learningElements[stepIndex]) return;
        
        const element = this.learningElements[stepIndex];
        
        // Update progress indicator
        const progressEl = document.querySelector('.tour-progress');
        if (progressEl) {
            progressEl.textContent = `Step ${stepIndex + 1} of ${this.learningElements.length}`;
        }
        
        // Scroll element into view if needed
        element.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove previous highlights
        document.querySelectorAll('.learning-highlight').forEach(el => {
            el.classList.remove('learning-highlight');
        });
        
        // Highlight current element
        element.element.classList.add('learning-highlight');
        
        // Show info for this element
        this.showModalInfo(element.title, element.description, element.element);
    }

    announceMessage(message) {
        // Create notification container if it doesn't exist
        let container = document.querySelector('.notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notifications-container';
            
            // Set the container's theme to match current theme
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            container.setAttribute('data-theme', currentTheme);
            
            document.body.appendChild(container);
        }

        // Create and show notification
        const notification = document.createElement('div');
        notification.className = 'notification info';
        notification.textContent = message;
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');

        container.appendChild(notification);
        
        // Trigger animation on next frame for better performance
        requestAnimationFrame(() => {
            notification.classList.add('fade-in');
            
            // Remove notification after delay
            setTimeout(() => {
                notification.classList.remove('fade-in');
                notification.classList.add('fade-out');
                
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        });
    }
} 