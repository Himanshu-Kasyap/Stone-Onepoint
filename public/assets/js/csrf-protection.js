/**
 * CSRF Protection Script
 * Generates and manages CSRF tokens for form security
 */

(function() {
    'use strict';
    
    // Generate a random CSRF token
    function generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Get or create CSRF token
    function getCSRFToken() {
        let token = sessionStorage.getItem('csrf_token');
        
        if (!token) {
            token = generateCSRFToken();
            sessionStorage.setItem('csrf_token', token);
        }
        
        return token;
    }
    
    // Add CSRF token to forms
    function addCSRFTokenToForms() {
        const forms = document.querySelectorAll('form.contact-form');
        const token = getCSRFToken();
        
        forms.forEach(form => {
            // Remove existing CSRF input if any
            const existingInput = form.querySelector('input[name="csrf_token"]');
            if (existingInput) {
                existingInput.remove();
            }
            
            // Add new CSRF input
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrf_token';
            csrfInput.value = token;
            
            form.appendChild(csrfInput);
        });
        
        // Make token available globally for AJAX requests
        window.csrfToken = token;
    }
    
    // Initialize CSRF protection when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addCSRFTokenToForms);
    } else {
        addCSRFTokenToForms();
    }
    
    // Refresh token periodically (every 30 minutes)
    setInterval(() => {
        sessionStorage.removeItem('csrf_token');
        addCSRFTokenToForms();
    }, 30 * 60 * 1000);
    
})();