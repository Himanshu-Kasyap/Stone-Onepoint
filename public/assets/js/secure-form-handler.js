/**
 * Secure Form Handler
 * Provides comprehensive security features for contact forms
 * Stone OnePoint Solutions Website
 */

class SecureFormHandler {
    constructor(formSelector, options = {}) {
        this.form = document.querySelector(formSelector);
        this.options = {
            enableCSRF: true,
            enableRateLimit: true,
            rateLimitWindow: 60000, // 1 minute
            maxSubmissions: 3,
            enableRealTimeValidation: true,
            sanitizeInputs: true,
            ...options
        };
        
        this.submissionCount = 0;
        this.lastSubmissionTime = 0;
        this.csrfToken = null;
        
        if (this.form) {
            this.init();
        }
    }

    /**
     * Initialize the secure form handler
     */
    init() {
        this.generateCSRFToken();
        this.setupEventListeners();
        this.setupRealTimeValidation();
        this.addSecurityHeaders();
        
        console.log('Secure form handler initialized');
    }

    /**
     * Generate CSRF token for form protection
     */
    generateCSRFToken() {
        if (!this.options.enableCSRF) return;
        
        // Generate a random CSRF token
        this.csrfToken = this.generateRandomToken(32);
        
        // Add CSRF token to form
        let csrfInput = this.form.querySelector('input[name="csrf_token"]');
        if (!csrfInput) {
            csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrf_token';
            this.form.appendChild(csrfInput);
        }
        csrfInput.value = this.csrfToken;
        
        // Store token in session storage for validation
        sessionStorage.setItem('csrf_token', this.csrfToken);
    }

    /**
     * Generate random token for CSRF protection
     */
    generateRandomToken(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Setup event listeners for form security
     */
    setupEventListeners() {
        // Form submission handler
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission(e);
        });

        // Input event listeners for real-time validation
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                if (this.options.sanitizeInputs) {
                    this.sanitizeInput(e.target);
                }
                if (this.options.enableRealTimeValidation) {
                    this.validateField(e.target);
                }
            });

            input.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });
        });
    }

    /**
     * Setup real-time validation
     */
    setupRealTimeValidation() {
        if (!this.options.enableRealTimeValidation) return;

        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            // Add validation attributes
            if (input.type === 'email') {
                input.pattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
            }
            if (input.name === 'phone') {
                input.pattern = '^[+]?[0-9\\s\\-\\(\\)]{10,15}$';
            }
            if (input.name === 'name') {
                input.pattern = '^[a-zA-Z\\s]{2,50}$';
            }
        });
    }

    /**
     * Validate individual form field
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Remove existing error styling
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(fieldName)} is required`;
        }

        // Field-specific validation
        if (value && isValid) {
            switch (fieldName) {
                case 'name':
                    if (!/^[a-zA-Z\s]{2,50}$/.test(value)) {
                        isValid = false;
                        errorMessage = 'Name must contain only letters and spaces (2-50 characters)';
                    }
                    break;

                case 'email':
                    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address';
                    }
                    break;

                case 'phone':
                    if (!/^[+]?[0-9\s\-\(\)]{10,15}$/.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid phone number';
                    }
                    break;

                case 'message':
                    if (value.length < 10) {
                        isValid = false;
                        errorMessage = 'Message must be at least 10 characters long';
                    }
                    if (value.length > 1000) {
                        isValid = false;
                        errorMessage = 'Message must not exceed 1000 characters';
                    }
                    break;
            }
        }

        // Display validation result
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Sanitize user input to prevent XSS
     */
    sanitizeInput(field) {
        let value = field.value;
        
        // Remove potentially dangerous characters
        value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        value = value.replace(/<[^>]*>/g, '');
        value = value.replace(/javascript:/gi, '');
        value = value.replace(/on\w+\s*=/gi, '');
        
        // Update field value if it was modified
        if (value !== field.value) {
            field.value = value;
        }
    }

    /**
     * Handle form submission with security checks
     */
    async handleFormSubmission(event) {
        try {
            // Rate limiting check
            if (!this.checkRateLimit()) {
                this.showError('Too many submissions. Please wait before trying again.');
                return;
            }

            // CSRF token validation
            if (!this.validateCSRFToken()) {
                this.showError('Security token validation failed. Please refresh the page.');
                return;
            }

            // Validate all fields
            if (!this.validateAllFields()) {
                this.showError('Please correct the errors in the form.');
                return;
            }

            // Show loading state
            this.setLoadingState(true);

            // Prepare form data
            const formData = this.prepareFormData();

            // Submit form
            const result = await this.submitForm(formData);

            if (result.success) {
                this.showSuccess('Thank you! Your message has been sent successfully.');
                this.resetForm();
            } else {
                this.showError(result.message || 'An error occurred. Please try again.');
            }

        } catch (error) {
            console.error('Form submission error:', error);
            this.showError('An unexpected error occurred. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Check rate limiting
     */
    checkRateLimit() {
        if (!this.options.enableRateLimit) return true;

        const now = Date.now();
        
        // Reset counter if window has passed
        if (now - this.lastSubmissionTime > this.options.rateLimitWindow) {
            this.submissionCount = 0;
        }

        // Check if limit exceeded
        if (this.submissionCount >= this.options.maxSubmissions) {
            return false;
        }

        // Update counters
        this.submissionCount++;
        this.lastSubmissionTime = now;
        
        return true;
    }

    /**
     * Validate CSRF token
     */
    validateCSRFToken() {
        if (!this.options.enableCSRF) return true;

        const formToken = this.form.querySelector('input[name="csrf_token"]')?.value;
        const sessionToken = sessionStorage.getItem('csrf_token');
        
        return formToken && sessionToken && formToken === sessionToken;
    }

    /**
     * Validate all form fields
     */
    validateAllFields() {
        const inputs = this.form.querySelectorAll('input[required], textarea[required]');
        let allValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                allValid = false;
            }
        });

        return allValid;
    }

    /**
     * Prepare form data for submission
     */
    prepareFormData() {
        const formData = new FormData(this.form);
        const data = {};

        // Convert FormData to object and sanitize
        for (let [key, value] of formData.entries()) {
            if (typeof value === 'string') {
                // Additional sanitization for submission
                value = value.trim();
                value = this.escapeHtml(value);
            }
            data[key] = value;
        }

        // Add timestamp and user agent for logging
        data.timestamp = new Date().toISOString();
        data.user_agent = navigator.userAgent;

        return data;
    }

    /**
     * Submit form data to server
     */
    async submitForm(data) {
        try {
            const response = await fetch(this.form.action || '/contact-form-handler.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Form submission error:', error);
            return { success: false, message: 'Network error occurred' };
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        let errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Get field label for error messages
     */
    getFieldLabel(fieldName) {
        const labels = {
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            message: 'Message'
        };
        return labels[fieldName] || fieldName;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message to user
     */
    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = this.form.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message alert ${type === 'success' ? 'alert-success' : 'alert-danger'}`;
        messageDiv.textContent = message;

        // Insert message at the top of the form
        this.form.insertBefore(messageDiv, this.form.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            if (loading) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
            } else {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Enquire Now';
            }
        }
    }

    /**
     * Reset form after successful submission
     */
    resetForm() {
        this.form.reset();
        
        // Clear all validation states
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            this.clearFieldError(input);
        });

        // Generate new CSRF token
        this.generateCSRFToken();
    }

    /**
     * Add security headers to form
     */
    addSecurityHeaders() {
        // Add security-related meta tags if not present
        if (!document.querySelector('meta[name="csrf-token"]')) {
            const csrfMeta = document.createElement('meta');
            csrfMeta.name = 'csrf-token';
            csrfMeta.content = this.csrfToken;
            document.head.appendChild(csrfMeta);
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize secure form handler for contact form
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        new SecureFormHandler('.contact-form form', {
            enableCSRF: true,
            enableRateLimit: true,
            rateLimitWindow: 60000, // 1 minute
            maxSubmissions: 3,
            enableRealTimeValidation: true,
            sanitizeInputs: true
        });
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureFormHandler;
}