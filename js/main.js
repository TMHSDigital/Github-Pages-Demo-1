'use strict';

// Example of a modern JavaScript module
const app = {
    init() {
        this.attachEventListeners();
    },

    attachEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Site loaded!');
            // Add your JavaScript functionality here
        });
    }
};

app.init(); 