// Learning Mode Core Implementation
class LearningCore {
    constructor() {
        this.enabled = false;
        this.notifications = new LearningNotifications();
        this.currentFocusIndex = -1;
        this.cards = [];
    }

    async init() {
        this.enabled = localStorage.getItem('learning_mode') === 'true';
        
        // Initialize feature cards
        this.cards = Array.from(document.querySelectorAll('.feature-card'));
        this.cards.forEach(card => {
            const title = card.querySelector('h3').textContent;
            const description = card.querySelector('p').textContent;
            
            card.dataset.feature = card.dataset.feature || this.slugify(title);
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-describedby', `tooltip-${card.dataset.feature}`);
            
            // Add tooltip
            const tooltip = document.createElement('div');
            tooltip.id = `tooltip-${card.dataset.feature}`;
            tooltip.className = 'feature-tooltip';
            tooltip.textContent = description;
            card.appendChild(tooltip);
        });

        // Event listeners
        document.addEventListener('learning-mode-toggle', this.toggle.bind(this));
        document.addEventListener('focusin', this.handleFocus.bind(this));
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // Initial state
        document.documentElement.classList.toggle('learning-mode', this.enabled);
        if (this.enabled) {
            this.notifications.show('Learning Mode active! Use arrow keys to navigate, Enter to select, L to toggle.', 'info');
        }
    }

    toggle({ detail }) {
        this.enabled = detail.enabled;
        localStorage.setItem('learning_mode', this.enabled);
        document.documentElement.classList.toggle('learning-mode', this.enabled);
        this.notifications.show(this.enabled ? 'Learning Mode enabled (L to toggle)' : 'Learning Mode disabled', 
                              this.enabled ? 'info' : 'warning');
        
        // Reset focus when disabling
        if (!this.enabled) {
            this.currentFocusIndex = -1;
        }
    }

    handleFocus(e) {
        if (!this.enabled) return;
        const card = e.target.closest('.feature-card');
        if (card) {
            this.currentFocusIndex = this.cards.indexOf(card);
            this.notifications.playSound();
        }
    }

    handleClick(e) {
        if (!this.enabled) return;
        const card = e.target.closest('.feature-card');
        if (card) {
            const title = card.querySelector('h3').textContent;
            const description = card.querySelector('p').textContent;
            this.notifications.show(`${title}: ${description}`, 'info');
        }
    }

    handleKeydown(e) {
        if (!this.enabled && e.key !== 'l' && e.key !== 'L') return;
        
        switch(e.key) {
            case 'l':
            case 'L':
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    document.getElementById('learningModeToggle').click();
                }
                break;
                
            case 'ArrowRight':
            case 'ArrowDown':
                if (this.enabled) {
                    e.preventDefault();
                    this.focusNextCard();
                }
                break;
                
            case 'ArrowLeft':
            case 'ArrowUp':
                if (this.enabled) {
                    e.preventDefault();
                    this.focusPreviousCard();
                }
                break;
                
            case 'Enter':
            case ' ':
                if (this.enabled && this.currentFocusIndex >= 0) {
                    e.preventDefault();
                    this.cards[this.currentFocusIndex].click();
                }
                break;
                
            case 'Escape':
                if (this.enabled) {
                    e.preventDefault();
                    document.getElementById('learningModeToggle').click();
                }
                break;
        }
    }

    focusNextCard() {
        if (this.cards.length === 0) return;
        
        this.currentFocusIndex = this.currentFocusIndex < 0 ? 
            0 : (this.currentFocusIndex + 1) % this.cards.length;
            
        this.cards[this.currentFocusIndex].focus();
    }

    focusPreviousCard() {
        if (this.cards.length === 0) return;
        
        this.currentFocusIndex = this.currentFocusIndex < 0 ? 
            this.cards.length - 1 : 
            (this.currentFocusIndex - 1 + this.cards.length) % this.cards.length;
            
        this.cards[this.currentFocusIndex].focus();
    }

    slugify(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
}

class LearningNotifications {
    constructor() {
        this.audio = new Audio('/sounds/notification.mp3');
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} fade-in`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        
        this.container.appendChild(notification);
        this.playSound();
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    }

    playSound() {
        if (this.audio.readyState >= 2) {
            this.audio.currentTime = 0;
            this.audio.play().catch(() => {});
        }
    }
}

// Export for use in main.js
export { LearningCore, LearningNotifications }; 