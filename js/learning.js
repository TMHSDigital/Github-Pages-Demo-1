// Learning Mode Core Implementation
export class LearningCore {
    constructor() {
        this.enabled = localStorage.getItem('learning_mode') === 'true';
        this.root = document.documentElement;
        this.notifications = {
            show: this.announceMessage.bind(this)
        };
    }

    init() {
        // Set initial state
        this.toggle(this.enabled);

        // Listen for learning mode toggle events
        document.addEventListener('learning-mode-toggle', (e) => {
            this.toggle(e.detail.enabled);
        });

        // Add feature card tooltips and keyboard enhancements
        this.setupFeatureCards();
    }

    toggle(enabled) {
        this.enabled = enabled;
        if (enabled) {
            this.root.classList.add('learning-mode');
            this.announceMessage('Learning mode enabled');
        } else {
            this.root.classList.remove('learning-mode');
            this.announceMessage('Learning mode disabled');
        }
    }

    setupFeatureCards() {
        // Add mouse tracking for tooltip parallax
        document.addEventListener('mousemove', (e) => {
            this.root.style.setProperty('--mouse-x', e.clientX);
            this.root.style.setProperty('--mouse-y', e.clientY);
        }, { passive: true });

        const cards = document.querySelectorAll('.feature-card');
        cards.forEach(card => {
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
        });
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