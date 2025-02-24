// Learning Mode Core Implementation
class LearningCore {
    constructor() {
        this.enabled = localStorage.getItem('learning_mode') === 'true';
        this.root = document.documentElement;
        this.init();
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
            document.body.appendChild(container);
        }

        // Create and show notification
        const notification = document.createElement('div');
        notification.className = 'notification info fade-in';
        notification.textContent = message;

        container.appendChild(notification);

        // Remove notification after delay
        setTimeout(() => {
            notification.classList.replace('fade-in', 'fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize learning mode
const learningCore = new LearningCore();
export default learningCore; 