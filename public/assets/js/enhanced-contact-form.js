/**
 * Enhanced Contact Form Script
 * Provides real-time validation, loading states, and improved user experience
 * Stone OnePoint Solutions Website
 */

(function($) {
    'use strict';

    class EnhancedContactForm {
        constructor() {
            this.form = $('.contact-form');
            this.submitButton = this.form.find('button[type="submit"]');
            this.originalButtonText = this.submitButton.text();
            this.isSubmitting = false;
            
            this.init();
        }

        init() {
            this.setupValidation();
            this.setupFormSubmission();
            this.setupRealTimeValidation();
            this.addLoadingStates();
            this.addProgressIndicator();
        }

        setupValidation() {
            // Add validation rules and messages
            this.validationRules = {
                name: {
                    required: true,
                    minLength: 2,
                    maxLength: 50,
                    pattern: /^[a-zA-Z\s\.\-\']+$/,
                    message: 'Please enter a valid name (2-50 characters, letters only)'
                },
                email: {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    maxLength: 100,
                    message: 'Please enter a valid email address'
                },
                phone: {
                    required: true,
                    pattern: /^[+]?[0-9\s\-\(\)]{10,15}$/,
                    message: 'Please enter a valid phone number (10-15 digits)'
                },
                message: {
                    required: true,
                    minLength: 10,
                    maxLength: 1000,
                    message: 'Message must be between 10 and 1000 characters'
                }
            };
        }

        setupRealTimeValidation() {
            const self = this;
            
            // Add validation on input blur and keyup
            this.form.find('input, textarea').each(function() {
                const field = $(this);
                const fieldName = field.attr('name');
                
                if (self.validationRules[fieldName]) {
                    // Validate on blur
                    field.on('blur', function() {
                        self.validateField(field, fieldName);
                    });
                    
                    // Validate on keyup with debounce
                    let timeout;
                    field.on('keyup', function() {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            self.validateField(field, fieldName);
                        }, 500);
                    });
                    
                    // Character counter for message field
                    if (fieldName === 'message') {
                        self.addCharacterCounter(field);
                    }
                }
            });
        }

        validateField(field, fieldName) {
            const value = field.val().trim();
            const rules = this.validationRules[fieldName];
            const feedbackElement = field.siblings('.invalid-feedback');
            
            let isValid = true;
            let errorMessage = '';

            // Required validation
            if (rules.required && !value) {
                isValid = false;
                errorMessage = `${this.capitalizeFirst(fieldName)} is required`;
            }
            
            // Length validation
            else if (value) {
                if (rules.minLength && value.length < rules.minLength) {
                    isValid = false;
                    errorMessage = `${this.capitalizeFirst(fieldName)} must be at least ${rules.minLength} characters`;
                }
                else if (rules.maxLength && value.length > rules.maxLength) {
                    isValid = false;
                    errorMessage = `${this.capitalizeFirst(fieldName)} must not exceed ${rules.maxLength} characters`;
                }
                // Pattern validation
                else if (rules.pattern && !rules.pattern.test(value)) {
                    isValid = false;
                    errorMessage = rules.message;
                }
            }

            // Update field appearance
            if (isValid) {
                field.removeClass('is-invalid').addClass('is-valid');
                feedbackElement.text('');
            } else {
                field.removeClass('is-valid').addClass('is-invalid');
                feedbackElement.text(errorMessage);
            }

            return isValid;
        }

        addCharacterCounter(field) {
            const maxLength = this.validationRules.message.maxLength;
            const counter = $(`<small class="form-text text-muted character-counter">0 / ${maxLength} characters</small>`);
            field.after(counter);
            
            field.on('input', function() {
                const currentLength = $(this).val().length;
                counter.text(`${currentLength} / ${maxLength} characters`);
                
                if (currentLength > maxLength * 0.9) {
                    counter.removeClass('text-muted').addClass('text-warning');
                } else if (currentLength > maxLength) {
                    counter.removeClass('text-warning').addClass('text-danger');
                } else {
                    counter.removeClass('text-warning text-danger').addClass('text-muted');
                }
            });
        }

        setupFormSubmission() {
            const self = this;
            
            this.form.on('submit', function(e) {
                e.preventDefault();
                
                if (self.isSubmitting) {
                    return false;
                }
                
                if (self.validateForm()) {
                    self.submitForm();
                } else {
                    self.showValidationErrors();
                }
            });
        }

        validateForm() {
            let isValid = true;
            const self = this;
            
            this.form.find('input, textarea').each(function() {
                const field = $(this);
                const fieldName = field.attr('name');
                
                if (self.validationRules[fieldName]) {
                    if (!self.validateField(field, fieldName)) {
                        isValid = false;
                    }
                }
            });
            
            return isValid;
        }

        submitForm() {
            const self = this;
            const formData = new FormData(this.form[0]);
            
            // Add CSRF token if available
            if (window.csrfToken) {
                formData.append('csrf_token', window.csrfToken);
            }
            
            this.setLoadingState(true);
            this.updateProgress(25);
            
            $.ajax({
                url: this.form.attr('action') || 'contact-form-handler.php',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                xhr: function() {
                    const xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener('progress', function(evt) {
                        if (evt.lengthComputable) {
                            const percentComplete = (evt.loaded / evt.total) * 100;
                            self.updateProgress(Math.min(percentComplete, 90));
                        }
                    }, false);
                    return xhr;
                },
                success: function(response) {
                    self.updateProgress(100);
                    setTimeout(() => {
                        self.handleSuccess(response);
                    }, 500);
                },
                error: function(xhr, status, error) {
                    self.handleError(xhr, status, error);
                },
                complete: function() {
                    setTimeout(() => {
                        self.setLoadingState(false);
                    }, 1000);
                }
            });
        }

        handleSuccess(response) {
            // Show success message
            this.showMessage('Thank you! Your message has been sent successfully. We will get back to you soon.', 'success');
            
            // Reset form
            this.form[0].reset();
            this.form.find('.is-valid, .is-invalid').removeClass('is-valid is-invalid');
            this.form.find('.character-counter').text('0 / 1000 characters');
            
            // Scroll to message
            this.scrollToMessage();
            
            // Optional: Redirect after delay
            setTimeout(() => {
                if (response && response.redirect) {
                    window.location.href = response.redirect;
                }
            }, 3000);
        }

        handleError(xhr, status, error) {
            let errorMessage = 'An error occurred while sending your message. Please try again.';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 429) {
                errorMessage = 'Too many requests. Please wait a moment before trying again.';
            } else if (xhr.status === 0) {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            this.showMessage(errorMessage, 'error');
            this.scrollToMessage();
        }

        showMessage(message, type) {
            // Remove existing messages
            $('.form-message').remove();
            
            const messageClass = type === 'success' ? 'alert-success' : 'alert-danger';
            const iconClass = type === 'success' ? 'bx-check-circle' : 'bx-error-circle';
            
            const messageHtml = `
                <div class="form-message alert ${messageClass} alert-dismissible fade show" role="alert">
                    <i class="bx ${iconClass}"></i>
                    <span>${message}</span>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            
            this.form.before(messageHtml);
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    $('.form-message').fadeOut();
                }, 5000);
            }
        }

        showValidationErrors() {
            this.showMessage('Please correct the errors below and try again.', 'error');
            
            // Focus on first invalid field
            const firstInvalid = this.form.find('.is-invalid').first();
            if (firstInvalid.length) {
                firstInvalid.focus();
            }
        }

        setLoadingState(loading) {
            this.isSubmitting = loading;
            
            if (loading) {
                this.submitButton
                    .prop('disabled', true)
                    .html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...');
                
                this.form.addClass('form-loading');
            } else {
                this.submitButton
                    .prop('disabled', false)
                    .html(this.originalButtonText);
                
                this.form.removeClass('form-loading');
                this.hideProgress();
            }
        }

        addProgressIndicator() {
            const progressHtml = `
                <div class="form-progress" style="display: none;">
                    <div class="progress mb-3">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" 
                             role="progressbar" style="width: 0%" aria-valuenow="0" 
                             aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <small class="text-muted">Sending your message...</small>
                </div>
            `;
            
            this.form.prepend(progressHtml);
        }

        updateProgress(percent) {
            const progressBar = this.form.find('.progress-bar');
            const progressContainer = this.form.find('.form-progress');
            
            if (percent > 0) {
                progressContainer.show();
                progressBar.css('width', percent + '%').attr('aria-valuenow', percent);
            }
        }

        hideProgress() {
            this.form.find('.form-progress').fadeOut();
        }

        scrollToMessage() {
            const message = $('.form-message');
            if (message.length) {
                $('html, body').animate({
                    scrollTop: message.offset().top - 100
                }, 500);
            }
        }

        capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    }

    // Initialize when document is ready
    $(document).ready(function() {
        if ($('.contact-form').length) {
            new EnhancedContactForm();
        }
    });

    // Add CSS for enhanced form styling
    const enhancedFormCSS = `
        <style>
        .form-loading {
            opacity: 0.7;
            pointer-events: none;
        }
        
        .form-message {
            margin-bottom: 20px;
            border-radius: 8px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .form-message i {
            font-size: 20px;
        }
        
        .is-valid {
            border-color: #28a745 !important;
            box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25) !important;
        }
        
        .is-invalid {
            border-color: #dc3545 !important;
            box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
        }
        
        .invalid-feedback {
            display: block;
            color: #dc3545;
            font-size: 0.875em;
            margin-top: 0.25rem;
        }
        
        .character-counter {
            text-align: right;
            margin-top: 0.25rem;
        }
        
        .character-counter.text-warning {
            color: #ffc107 !important;
        }
        
        .character-counter.text-danger {
            color: #dc3545 !important;
        }
        
        .form-progress {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .progress {
            height: 8px;
            margin-bottom: 10px;
        }
        
        .spinner-border-sm {
            width: 1rem;
            height: 1rem;
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .form-loading .form-control {
            animation: pulse 2s infinite;
        }
        </style>
    `;
    
    $('head').append(enhancedFormCSS);

})(jQuery);