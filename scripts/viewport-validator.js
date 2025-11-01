/**
 * Viewport Validation and Responsive Behavior Script
 * Ensures proper responsive behavior and validates viewport settings
 */

class ViewportValidator {
    constructor() {
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.validate());
        } else {
            this.validate();
        }
        
        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
        
        // Listen for resize events
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));
    }

    validate() {
        this.validateViewportMeta();
        this.validateResponsiveImages();
        this.validateTouchTargets();
        this.addResponsiveBehaviors();
        console.log('Viewport validation completed');
    }

    validateViewportMeta() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            console.warn('Missing viewport meta tag');
            return;
        }

        const content = viewport.content;
        const requiredProperties = ['width=device-width', 'initial-scale=1'];
        const missingProperties = requiredProperties.filter(prop => !content.includes(prop));
        
        if (missingProperties.length > 0) {
            console.warn('Viewport meta tag missing properties:', missingProperties);
        }
    }

    validateResponsiveImages() {
        const images = document.querySelectorAll('img');
        let issueCount = 0;

        images.forEach(img => {
            if (!img.classList.contains('img-fluid') && !img.classList.contains('img-responsive')) {
                img.classList.add('img-fluid');
                issueCount++;
            }
        });

        if (issueCount > 0) {
            console.log(`Fixed ${issueCount} non-responsive images`);
        }
    }

    validateTouchTargets() {
        const interactiveElements = document.querySelectorAll('a, button, .btn, input[type="button"], input[type="submit"]');
        let issueCount = 0;

        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                element.style.minHeight = '44px';
                element.style.minWidth = '44px';
                element.style.display = 'inline-flex';
                element.style.alignItems = 'center';
                element.style.justifyContent = 'center';
                issueCount++;
            }
        });

        if (issueCount > 0) {
            console.log(`Fixed ${issueCount} touch targets that were too small`);
        }
    }

    addResponsiveBehaviors() {
        // Add responsive table behavior
        this.makeTablesResponsive();
        
        // Add responsive navigation behavior
        this.enhanceResponsiveNavigation();
        
        // Add responsive modal behavior
        this.enhanceResponsiveModals();
    }

    makeTablesResponsive() {
        const tables = document.querySelectorAll('table:not(.table-responsive table)');
        
        tables.forEach(table => {
            if (!table.closest('.table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    enhanceResponsiveNavigation() {
        const navbars = document.querySelectorAll('.navbar');
        
        navbars.forEach(navbar => {
            const toggle = navbar.querySelector('.navbar-toggler');
            const collapse = navbar.querySelector('.navbar-collapse');
            
            if (toggle && collapse) {
                // Ensure proper ARIA attributes
                toggle.setAttribute('aria-controls', collapse.id || 'navbarNav');
                toggle.setAttribute('aria-expanded', 'false');
                
                // Add click handler for mobile menu
                toggle.addEventListener('click', () => {
                    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                    toggle.setAttribute('aria-expanded', !isExpanded);
                });
            }
        });
    }

    enhanceResponsiveModals() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            // Ensure modals are properly sized on mobile
            const dialog = modal.querySelector('.modal-dialog');
            if (dialog && !dialog.classList.contains('modal-dialog-scrollable')) {
                dialog.classList.add('modal-dialog-scrollable');
            }
        });
    }

    handleOrientationChange() {
        // Force layout recalculation after orientation change
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
        
        // Validate touch targets again after orientation change
        this.validateTouchTargets();
        
        console.log('Handled orientation change');
    }

    handleResize() {
        // Re-validate responsive elements on resize
        this.validateTouchTargets();
        
        // Update any dynamic responsive behaviors
        const currentWidth = window.innerWidth;
        
        if (currentWidth < 768) {
            // Mobile specific adjustments
            this.applyMobileOptimizations();
        } else if (currentWidth < 992) {
            // Tablet specific adjustments
            this.applyTabletOptimizations();
        } else {
            // Desktop specific adjustments
            this.applyDesktopOptimizations();
        }
    }

    applyMobileOptimizations() {
        // Ensure all interactive elements are touch-friendly
        const buttons = document.querySelectorAll('.btn, button');
        buttons.forEach(btn => {
            if (!btn.style.minHeight) {
                btn.style.minHeight = '44px';
                btn.style.padding = '12px 16px';
            }
        });
    }

    applyTabletOptimizations() {
        // Tablet-specific optimizations
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.style.padding = '8px 12px';
        });
    }

    applyDesktopOptimizations() {
        // Desktop-specific optimizations
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.style.padding = '';
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize viewport validator
new ViewportValidator();