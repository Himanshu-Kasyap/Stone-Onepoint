/**
 * Accessibility Enhancement Script for Stone OnePoint Solutions Website
 * This script enhances accessibility compliance by adding ARIA labels,
 * improving keyboard navigation, and ensuring proper accessibility standards.
 */

class AccessibilityEnhancer {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.enhance());
        } else {
            this.enhance();
        }
    }

    enhance() {
        this.addSkipNavigation();
        this.enhanceNavigation();
        this.enhanceImages();
        this.enhanceButtons();
        this.enhanceModals();
        this.enhanceCarousels();
        this.enhanceForms();
        this.enhanceKeyboardNavigation();
        this.addLandmarkRoles();
        this.enhanceColorContrast();
        this.addFocusManagement();
        console.log('Accessibility enhancements applied successfully');
    }

    /**
     * Add skip navigation links for screen readers
     */
    addSkipNavigation() {
        const skipNav = document.createElement('div');
        skipNav.className = 'skip-navigation';
        skipNav.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
            <a href="#footer" class="skip-link">Skip to footer</a>
        `;
        
        // Insert at the beginning of body
        document.body.insertBefore(skipNav, document.body.firstChild);

        // Add CSS for skip links
        this.addSkipNavigationStyles();
    }

    addSkipNavigationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .skip-navigation {
                position: absolute;
                top: -40px;
                left: 6px;
                z-index: 10000;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: #000;
                color: #fff;
                padding: 8px;
                text-decoration: none;
                border-radius: 0 0 4px 4px;
                font-weight: bold;
                z-index: 10001;
                transition: top 0.3s;
            }
            
            .skip-link:focus {
                top: 0;
                outline: 2px solid #4a90e2;
                outline-offset: 2px;
            }
            
            .skip-link:hover {
                background: #333;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Enhance navigation with proper ARIA labels and roles
     */
    enhanceNavigation() {
        // Main navigation
        const mainNav = document.querySelector('.navbar-nav');
        if (mainNav) {
            mainNav.setAttribute('role', 'navigation');
            mainNav.setAttribute('aria-label', 'Main navigation');
            mainNav.id = 'navigation';
        }

        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach((link, index) => {
            if (!link.getAttribute('aria-label')) {
                const text = link.textContent.trim();
                link.setAttribute('aria-label', `Navigate to ${text}`);
            }
            
            // Handle dropdown toggles
            if (link.classList.contains('dropdown-toggle')) {
                link.setAttribute('aria-haspopup', 'true');
                link.setAttribute('aria-expanded', 'false');
                link.setAttribute('role', 'button');
                
                // Find associated dropdown menu
                const dropdown = link.nextElementSibling;
                if (dropdown && dropdown.classList.contains('dropdown-menu')) {
                    const dropdownId = `dropdown-${index}`;
                    dropdown.id = dropdownId;
                    link.setAttribute('aria-controls', dropdownId);
                }
            }
        });

        // Mobile menu toggle
        const mobileToggle = document.querySelector('.navbar-toggler, .mobile-nav-toggle');
        if (mobileToggle) {
            mobileToggle.setAttribute('aria-label', 'Toggle mobile navigation menu');
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileToggle.setAttribute('role', 'button');
        }

        // Social media links
        const socialLinks = document.querySelectorAll('.social-list a, .social-icon a');
        socialLinks.forEach(link => {
            const icon = link.querySelector('i');
            if (icon) {
                const platform = this.getSocialPlatform(icon.className);
                link.setAttribute('aria-label', `Visit our ${platform} page`);
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    getSocialPlatform(className) {
        if (className.includes('facebook')) return 'Facebook';
        if (className.includes('linkedin')) return 'LinkedIn';
        if (className.includes('twitter')) return 'Twitter';
        if (className.includes('instagram')) return 'Instagram';
        if (className.includes('youtube')) return 'YouTube';
        return 'social media';
    }

    /**
     * Enhance images with proper alt text and ARIA labels
     */
    enhanceImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // If no alt text, add descriptive alt based on context
            if (!img.alt || img.alt.trim() === '' || img.alt === 'Image') {
                const context = this.getImageContext(img);
                img.alt = context;
            }

            // Add role for decorative images
            if (img.alt === '' || img.classList.contains('decorative')) {
                img.setAttribute('role', 'presentation');
                img.setAttribute('aria-hidden', 'true');
            }

            // Handle logo images
            if (img.src.includes('logo') || img.src.includes('Picture1')) {
                img.alt = 'Stone OnePoint Solutions Pvt. Ltd. Logo';
                img.setAttribute('role', 'img');
            }
        });
    }

    getImageContext(img) {
        // Try to get context from parent elements or nearby text
        const parent = img.closest('.single-opportunity, .partners-item, .single-company');
        if (parent) {
            const heading = parent.querySelector('h3, h2, h1');
            if (heading) {
                return `Image for ${heading.textContent.trim()}`;
            }
        }

        // Check for nearby headings
        const nearbyHeading = img.parentElement.querySelector('h1, h2, h3, h4, h5, h6');
        if (nearbyHeading) {
            return `Image related to ${nearbyHeading.textContent.trim()}`;
        }

        // Default descriptive text
        if (img.src.includes('slider')) return 'Hero banner image';
        if (img.src.includes('opportunity')) return 'Service illustration';
        if (img.src.includes('client') || img.src.includes('company')) return 'Client company logo';
        
        return 'Decorative image';
    }

    /**
     * Enhance buttons and interactive elements
     */
    enhanceButtons() {
        // All buttons
        const buttons = document.querySelectorAll('button, .btn, .default-btn');
        buttons.forEach(button => {
            if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
                button.setAttribute('aria-label', 'Interactive button');
            }

            // Ensure buttons have proper role
            if (button.tagName !== 'BUTTON') {
                button.setAttribute('role', 'button');
                button.setAttribute('tabindex', '0');
            }

            // Add keyboard event handlers for non-button elements
            if (button.tagName !== 'BUTTON' && !button.hasAttribute('data-keyboard-enhanced')) {
                button.addEventListener('keydown', this.handleButtonKeydown.bind(this));
                button.setAttribute('data-keyboard-enhanced', 'true');
            }
        });

        // Close buttons
        const closeButtons = document.querySelectorAll('.close, [data-bs-dismiss]');
        closeButtons.forEach(button => {
            button.setAttribute('aria-label', 'Close dialog');
        });

        // Menu toggles
        const menuToggles = document.querySelectorAll('[data-bs-toggle="modal"]');
        menuToggles.forEach(toggle => {
            toggle.setAttribute('aria-label', 'Open menu');
        });
    }

    handleButtonKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.target.click();
        }
    }

    /**
     * Enhance modal dialogs
     */
    enhanceModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            
            // Find modal title
            const title = modal.querySelector('.modal-title, h2, h3');
            if (title) {
                const titleId = `modal-title-${Date.now()}`;
                title.id = titleId;
                modal.setAttribute('aria-labelledby', titleId);
            }

            // Add focus trap
            modal.addEventListener('shown.bs.modal', () => {
                this.trapFocus(modal);
            });
        });
    }

    /**
     * Enhance carousel/slider elements
     */
    enhanceCarousels() {
        const carousels = document.querySelectorAll('.owl-carousel, .carousel');
        carousels.forEach(carousel => {
            carousel.setAttribute('role', 'region');
            carousel.setAttribute('aria-label', 'Image carousel');
            
            // Carousel items
            const items = carousel.querySelectorAll('.owl-item, .carousel-item');
            items.forEach((item, index) => {
                item.setAttribute('role', 'group');
                item.setAttribute('aria-label', `Slide ${index + 1} of ${items.length}`);
            });

            // Carousel controls
            const prevBtn = carousel.querySelector('.owl-prev, .carousel-control-prev');
            const nextBtn = carousel.querySelector('.owl-next, .carousel-control-next');
            
            if (prevBtn) {
                prevBtn.setAttribute('aria-label', 'Previous slide');
                prevBtn.setAttribute('role', 'button');
            }
            
            if (nextBtn) {
                nextBtn.setAttribute('aria-label', 'Next slide');
                nextBtn.setAttribute('role', 'button');
            }
        });
    }

    /**
     * Enhance forms with proper labels and validation
     */
    enhanceForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.setAttribute('role', 'form');
            
            // Form inputs
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                // Ensure all inputs have labels
                if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
                    const label = form.querySelector(`label[for="${input.id}"]`);
                    if (!label && input.placeholder) {
                        input.setAttribute('aria-label', input.placeholder);
                    }
                }

                // Required field indicators
                if (input.required) {
                    input.setAttribute('aria-required', 'true');
                }

                // Error handling
                input.addEventListener('invalid', (e) => {
                    e.target.setAttribute('aria-invalid', 'true');
                });

                input.addEventListener('input', (e) => {
                    if (e.target.validity.valid) {
                        e.target.removeAttribute('aria-invalid');
                    }
                });
            });
        });
    }

    /**
     * Enhance keyboard navigation
     */
    enhanceKeyboardNavigation() {
        // Add focus indicators
        this.addFocusStyles();

        // Handle dropdown keyboard navigation
        const dropdowns = document.querySelectorAll('.dropdown-toggle');
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('keydown', this.handleDropdownKeydown.bind(this));
        });

        // Ensure all interactive elements are keyboard accessible
        const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]');
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex') && element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA' && element.tagName !== 'SELECT') {
                if (element.tagName === 'A' && !element.href) {
                    element.setAttribute('tabindex', '0');
                }
            }
        });
    }

    addFocusStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced focus indicators for accessibility */
            *:focus {
                outline: 2px solid #4a90e2 !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3) !important;
            }
            
            .btn:focus, .default-btn:focus {
                outline: 2px solid #fff !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.5) !important;
            }
            
            .nav-link:focus {
                background-color: rgba(74, 144, 226, 0.1) !important;
                border-radius: 4px !important;
            }
            
            /* High contrast mode support */
            @media (prefers-contrast: high) {
                *:focus {
                    outline: 3px solid #000 !important;
                    outline-offset: 2px !important;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    handleDropdownKeydown(event) {
        const dropdown = event.target;
        const menu = document.querySelector(dropdown.getAttribute('aria-controls'));
        
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const isExpanded = dropdown.getAttribute('aria-expanded') === 'true';
            dropdown.setAttribute('aria-expanded', !isExpanded);
            
            if (menu) {
                menu.style.display = isExpanded ? 'none' : 'block';
                if (!isExpanded) {
                    const firstLink = menu.querySelector('a');
                    if (firstLink) firstLink.focus();
                }
            }
        }
        
        if (event.key === 'Escape' && menu) {
            dropdown.setAttribute('aria-expanded', 'false');
            menu.style.display = 'none';
            dropdown.focus();
        }
    }

    /**
     * Add landmark roles for better navigation
     */
    addLandmarkRoles() {
        // Header
        const header = document.querySelector('header, .header-area');
        if (header) {
            header.setAttribute('role', 'banner');
        }

        // Main content
        const main = document.querySelector('main, .main-content');
        if (main) {
            main.setAttribute('role', 'main');
            main.id = 'main-content';
        } else {
            // Create main landmark if not exists
            const content = document.querySelector('.contolib-slider-area');
            if (content) {
                content.setAttribute('role', 'main');
                content.id = 'main-content';
            }
        }

        // Footer
        const footer = document.querySelector('footer, .footer-area');
        if (footer) {
            footer.setAttribute('role', 'contentinfo');
            footer.id = 'footer';
        }

        // Navigation
        const nav = document.querySelector('nav, .navbar');
        if (nav) {
            nav.setAttribute('role', 'navigation');
        }

        // Search
        const search = document.querySelector('.search, [role="search"]');
        if (search) {
            search.setAttribute('role', 'search');
        }
    }

    /**
     * Enhance color contrast and visual accessibility
     */
    enhanceColorContrast() {
        // Add high contrast mode detection and styles
        const style = document.createElement('style');
        style.textContent = `
            /* Ensure minimum color contrast ratios */
            .text-muted {
                color: #666 !important;
            }
            
            .btn-outline-primary {
                border-color: #0056b3 !important;
                color: #0056b3 !important;
            }
            
            .btn-outline-primary:hover {
                background-color: #0056b3 !important;
                border-color: #0056b3 !important;
            }
            
            /* High contrast mode */
            @media (prefers-contrast: high) {
                body {
                    background: #fff !important;
                    color: #000 !important;
                }
                
                .btn {
                    border: 2px solid #000 !important;
                }
                
                a {
                    color: #0000EE !important;
                    text-decoration: underline !important;
                }
                
                a:visited {
                    color: #551A8B !important;
                }
            }
            
            /* Ensure text is readable on all backgrounds */
            .text-white {
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            }
            
            /* Focus indicators with sufficient contrast */
            .form-control:focus {
                border-color: #0056b3 !important;
                box-shadow: 0 0 0 0.2rem rgba(0, 86, 179, 0.25) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add focus management for dynamic content
     */
    addFocusManagement() {
        // Manage focus for modals
        document.addEventListener('shown.bs.modal', (event) => {
            const modal = event.target;
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        });

        // Return focus when modal closes
        let lastFocusedElement = null;
        document.addEventListener('show.bs.modal', (event) => {
            lastFocusedElement = document.activeElement;
        });

        document.addEventListener('hidden.bs.modal', () => {
            if (lastFocusedElement) {
                lastFocusedElement.focus();
            }
        });
    }

    /**
     * Trap focus within modal dialogs
     */
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }
}

// Initialize accessibility enhancements
new AccessibilityEnhancer();