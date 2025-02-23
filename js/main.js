'use strict';

// Example of a modern JavaScript module
const app = {
    init() {
        this.attachEventListeners();
        this.setupFormHandling();
    },

    attachEventListeners() {
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
                const header = document.querySelector('.site-header');
                const currentScroll = window.pageYOffset;

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

        if (!data.name || data.name.trim() === '') {
            errors.push('Name is required');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Valid email is required');
        }

        if (!data.message || data.message.trim() === '') {
            errors.push('Message is required');
        }

        if (errors.length > 0) {
            this.showFormError(errors.join('\n'));
            return false;
        }

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
        form.reset();
        alert('Message sent successfully!'); // Replace with better UI feedback in production
    },

    async submitForm(data) {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.showFormSuccess();
        } catch (error) {
            this.showFormError('Failed to send message. Please try again.');
        }
    }
};

app.init(); 