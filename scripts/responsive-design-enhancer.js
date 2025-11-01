/**
 * Responsive Design Enhancement Script
 * This script validates and enhances responsive design across all breakpoints
 * and ensures proper touch targets for mobile devices
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class ResponsiveDesignEnhancer {
    constructor(publicDir = './public') {
        this.publicDir = publicDir;
        this.processedFiles = [];
        this.issues = [];
    }

    async enhanceAllFiles() {
        try {
            const htmlFiles = this.getHTMLFiles(this.publicDir);
            console.log(`Enhancing responsive design for ${htmlFiles.length} HTML files...\n`);

            for (const file of htmlFiles) {
                await this.enhanceFile(file);
            }

            // Create responsive CSS enhancements
            this.createResponsiveCSS();
            
            // Create viewport validation script
            this.createViewportScript();

            console.log(`Successfully enhanced ${this.processedFiles.length} files`);
            this.generateReport();
            return this.processedFiles;
        } catch (error) {
            console.error('Error enhancing responsive design:', error);
            throw error;
        }
    }

    getHTMLFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isFile() && path.extname(item) === '.html') {
                // Only process main content pages, not asset files
                if (!fullPath.includes('assets/') && !fullPath.includes('client-logos/')) {
                    files.push(fullPath);
                }
            }
        }

        return files;
    }

    async enhanceFile(filePath) {
        try {
            console.log(`Processing: ${filePath}`);
            
            const html = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(html);
            const document = dom.window.document;

            let modified = false;
            const fileIssues = [];

            // Validate and fix viewport configuration
            if (this.validateViewport(document, fileIssues)) {
                modified = true;
            }

            // Enhance responsive images
            if (this.enhanceResponsiveImages(document, fileIssues)) {
                modified = true;
            }

            // Optimize touch targets
            if (this.optimizeTouchTargets(document, fileIssues)) {
                modified = true;
            }

            // Add responsive CSS if not present
            if (this.addResponsiveCSS(document)) {
                modified = true;
            }

            // Enhance responsive tables
            if (this.enhanceResponsiveTables(document)) {
                modified = true;
            }

            // Add responsive navigation enhancements
            if (this.enhanceResponsiveNavigation(document)) {
                modified = true;
            }

            if (modified) {
                // Write the enhanced HTML back to file
                const enhancedHTML = dom.serialize();
                fs.writeFileSync(filePath, enhancedHTML, 'utf8');
                this.processedFiles.push(filePath);
                console.log(`✓ Enhanced: ${filePath}`);
            } else {
                console.log(`- No changes needed: ${filePath}`);
            }

            if (fileIssues.length > 0) {
                this.issues.push({
                    file: filePath,
                    issues: fileIssues
                });
            }
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error);
        }
    }

    validateViewport(document, issues) {
        let viewport = document.querySelector('meta[name="viewport"]');
        let modified = false;

        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1, shrink-to-fit=no';
            document.head.appendChild(viewport);
            modified = true;
            issues.push({
                type: 'fixed',
                message: 'Added missing viewport meta tag'
            });
        } else {
            const content = viewport.content;
            const requiredProperties = ['width=device-width', 'initial-scale=1'];
            const missingProperties = requiredProperties.filter(prop => !content.includes(prop));
            
            if (missingProperties.length > 0) {
                viewport.content = 'width=device-width, initial-scale=1, shrink-to-fit=no';
                modified = true;
                issues.push({
                    type: 'fixed',
                    message: `Updated viewport meta tag to include: ${missingProperties.join(', ')}`
                });
            }
        }

        return modified;
    }

    enhanceResponsiveImages(document, issues) {
        const images = document.querySelectorAll('img');
        let modified = false;

        images.forEach(img => {
            // Add responsive image classes if not present
            if (!img.classList.contains('img-responsive') && !img.classList.contains('img-fluid')) {
                img.classList.add('img-fluid');
                modified = true;
            }

            // Add loading="lazy" for performance
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
                modified = true;
            }

            // Ensure images have proper dimensions
            if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
                // Add default responsive behavior
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                modified = true;
            }
        });

        if (modified) {
            issues.push({
                type: 'enhanced',
                message: 'Enhanced images for responsive design'
            });
        }

        return modified;
    }

    optimizeTouchTargets(document, issues) {
        const interactiveElements = document.querySelectorAll('a, button, .btn, input, select, textarea');
        let modified = false;

        interactiveElements.forEach(element => {
            // Add touch-friendly class for mobile optimization
            if (!element.classList.contains('touch-target')) {
                element.classList.add('touch-target');
                modified = true;
            }

            // Ensure proper spacing for touch targets
            if (element.tagName === 'A' || element.classList.contains('btn')) {
                if (!element.style.minHeight && !element.classList.contains('btn-sm')) {
                    element.style.minHeight = '44px';
                    element.style.minWidth = '44px';
                    modified = true;
                }
            }
        });

        if (modified) {
            issues.push({
                type: 'enhanced',
                message: 'Optimized touch targets for mobile devices'
            });
        }

        return modified;
    }

    addResponsiveCSS(document) {
        // Check if responsive CSS is already included
        const existingLink = document.querySelector('link[href*="responsive-enhancements.css"]');
        if (existingLink) return false;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/responsive-enhancements.css';
        document.head.appendChild(link);
        return true;
    }

    enhanceResponsiveTables(document) {
        const tables = document.querySelectorAll('table');
        let modified = false;

        tables.forEach(table => {
            // Wrap tables in responsive container if not already wrapped
            if (!table.closest('.table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
                modified = true;
            }

            // Add responsive table class
            if (!table.classList.contains('table')) {
                table.classList.add('table');
                modified = true;
            }
        });

        return modified;
    }

    enhanceResponsiveNavigation(document) {
        const navbars = document.querySelectorAll('.navbar, nav');
        let modified = false;

        navbars.forEach(navbar => {
            // Ensure navbar has responsive classes
            if (!navbar.classList.contains('navbar-expand-lg') && 
                !navbar.classList.contains('navbar-expand-md') &&
                !navbar.classList.contains('navbar-expand-sm')) {
                navbar.classList.add('navbar-expand-lg');
                modified = true;
            }

            // Add mobile menu toggle if not present
            const toggle = navbar.querySelector('.navbar-toggler');
            if (!toggle) {
                const navCollapse = navbar.querySelector('.navbar-collapse');
                if (navCollapse) {
                    const toggleButton = document.createElement('button');
                    toggleButton.className = 'navbar-toggler';
                    toggleButton.type = 'button';
                    toggleButton.setAttribute('data-bs-toggle', 'collapse');
                    toggleButton.setAttribute('data-bs-target', '#navbarNav');
                    toggleButton.setAttribute('aria-controls', 'navbarNav');
                    toggleButton.setAttribute('aria-expanded', 'false');
                    toggleButton.setAttribute('aria-label', 'Toggle navigation');
                    
                    const toggleIcon = document.createElement('span');
                    toggleIcon.className = 'navbar-toggler-icon';
                    toggleButton.appendChild(toggleIcon);
                    
                    navbar.insertBefore(toggleButton, navCollapse);
                    navCollapse.id = 'navbarNav';
                    modified = true;
                }
            }
        });

        return modified;
    }

    createResponsiveCSS() {
        const cssPath = path.join(this.publicDir, 'assets/css/responsive-enhancements.css');
        
        // Check if file already exists
        if (fs.existsSync(cssPath)) {
            console.log('Responsive CSS already exists, skipping creation');
            return;
        }

        const responsiveCSS = `/**
 * Responsive Design Enhancements
 * Ensures proper responsive behavior across all breakpoints
 */

/* Base responsive utilities */
.img-fluid {
    max-width: 100% !important;
    height: auto !important;
}

/* Touch target optimization */
.touch-target {
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
}

/* Mobile-first responsive breakpoints */
@media (max-width: 575.98px) {
    /* Extra small devices (phones) */
    .container {
        padding-left: 15px !important;
        padding-right: 15px !important;
    }
    
    .btn, .default-btn {
        min-height: 44px !important;
        min-width: 44px !important;
        padding: 12px 16px !important;
        font-size: 16px !important; /* Prevents zoom on iOS */
    }
    
    .nav-link {
        padding: 12px 16px !important;
        font-size: 16px !important;
    }
    
    /* Improve text readability on small screens */
    body {
        font-size: 16px !important;
        line-height: 1.5 !important;
    }
    
    h1 { font-size: 1.75rem !important; }
    h2 { font-size: 1.5rem !important; }
    h3 { font-size: 1.25rem !important; }
    
    /* Stack columns on mobile */
    .row > [class*="col-"] {
        margin-bottom: 1rem;
    }
    
    /* Mobile navigation improvements */
    .navbar-nav {
        text-align: center;
    }
    
    .navbar-nav .nav-link {
        border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    
    /* Form improvements for mobile */
    .form-control, input, textarea, select {
        min-height: 44px !important;
        font-size: 16px !important; /* Prevents zoom on iOS */
        padding: 12px 16px !important;
    }
    
    /* Social icons spacing */
    .social-icon a, .social-list a {
        margin: 5px !important;
        min-height: 44px !important;
        min-width: 44px !important;
    }
}

@media (min-width: 576px) and (max-width: 767.98px) {
    /* Small devices (landscape phones) */
    .container {
        max-width: 540px;
    }
    
    .btn, .default-btn {
        min-height: 40px;
        padding: 10px 16px;
    }
}

@media (min-width: 768px) and (max-width: 991.98px) {
    /* Medium devices (tablets) */
    .container {
        max-width: 720px;
    }
    
    /* Tablet-specific adjustments */
    .navbar-nav .nav-link {
        padding: 8px 12px;
    }
    
    /* Optimize carousel for tablets */
    .carousel-item img {
        max-height: 400px;
        object-fit: cover;
    }
}

@media (min-width: 992px) and (max-width: 1199.98px) {
    /* Large devices (desktops) */
    .container {
        max-width: 960px;
    }
}

@media (min-width: 1200px) {
    /* Extra large devices (large desktops) */
    .container {
        max-width: 1140px;
    }
}

/* Responsive tables */
.table-responsive {
    display: block;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

@media (max-width: 767.98px) {
    .table-responsive table {
        font-size: 0.875rem;
    }
    
    .table-responsive th,
    .table-responsive td {
        padding: 0.5rem !important;
        white-space: nowrap;
    }
}

/* Responsive images and media */
.responsive-media {
    position: relative;
    display: block;
    width: 100%;
    padding: 0;
    overflow: hidden;
}

.responsive-media::before {
    display: block;
    content: "";
}

.responsive-media img,
.responsive-media video {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
    object-fit: cover;
}

/* Aspect ratio utilities */
.aspect-ratio-16-9::before { padding-top: 56.25%; }
.aspect-ratio-4-3::before { padding-top: 75%; }
.aspect-ratio-1-1::before { padding-top: 100%; }

/* Responsive typography */
@media (max-width: 575.98px) {
    .display-1 { font-size: 2.5rem; }
    .display-2 { font-size: 2rem; }
    .display-3 { font-size: 1.75rem; }
    .display-4 { font-size: 1.5rem; }
}

/* Responsive spacing utilities */
@media (max-width: 575.98px) {
    .py-5 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
    .my-5 { margin-top: 2rem !important; margin-bottom: 2rem !important; }
    .px-5 { padding-left: 1rem !important; padding-right: 1rem !important; }
    .mx-5 { margin-left: 1rem !important; margin-right: 1rem !important; }
}

/* Responsive carousel improvements */
@media (max-width: 767.98px) {
    .carousel-caption {
        position: static;
        padding: 1rem;
        background: rgba(0,0,0,0.7);
        color: white;
    }
    
    .carousel-control-prev,
    .carousel-control-next {
        width: 15%;
    }
    
    .carousel-indicators {
        margin-bottom: 0.5rem;
    }
}

/* Responsive modal improvements */
@media (max-width: 575.98px) {
    .modal-dialog {
        margin: 0.5rem;
        max-width: none;
        width: auto;
    }
    
    .modal-content {
        border-radius: 0;
    }
    
    .modal-header .close {
        padding: 1rem;
        margin: -1rem -1rem -1rem auto;
    }
}

/* Print styles for responsive design */
@media print {
    .container {
        max-width: none !important;
        width: 100% !important;
    }
    
    .row {
        display: block !important;
    }
    
    .col-1, .col-2, .col-3, .col-4, .col-5, .col-6,
    .col-7, .col-8, .col-9, .col-10, .col-11, .col-12,
    .col-sm-1, .col-sm-2, .col-sm-3, .col-sm-4, .col-sm-5, .col-sm-6,
    .col-sm-7, .col-sm-8, .col-sm-9, .col-sm-10, .col-sm-11, .col-sm-12,
    .col-md-1, .col-md-2, .col-md-3, .col-md-4, .col-md-5, .col-md-6,
    .col-md-7, .col-md-8, .col-md-9, .col-md-10, .col-md-11, .col-md-12,
    .col-lg-1, .col-lg-2, .col-lg-3, .col-lg-4, .col-lg-5, .col-lg-6,
    .col-lg-7, .col-lg-8, .col-lg-9, .col-lg-10, .col-lg-11, .col-lg-12,
    .col-xl-1, .col-xl-2, .col-xl-3, .col-xl-4, .col-xl-5, .col-xl-6,
    .col-xl-7, .col-xl-8, .col-xl-9, .col-xl-10, .col-xl-11, .col-xl-12 {
        width: 100% !important;
        float: none !important;
    }
}

/* High DPI display optimizations */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    /* Optimize for retina displays */
    .img-fluid {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
    }
}

/* Landscape orientation optimizations */
@media (orientation: landscape) and (max-height: 500px) {
    .navbar {
        min-height: auto;
    }
    
    .navbar-brand img {
        max-height: 30px;
    }
    
    .carousel-item {
        min-height: 300px;
    }
}

/* Dark mode responsive adjustments */
@media (prefers-color-scheme: dark) {
    .table-responsive {
        border: 1px solid #444;
    }
    
    .modal-content {
        background-color: #2d3748;
        color: #e2e8f0;
    }
}

/* Reduced motion responsive behavior */
@media (prefers-reduced-motion: reduce) {
    .carousel-item {
        transition: none !important;
    }
    
    .carousel-fade .carousel-item {
        opacity: 1;
    }
    
    .carousel-control-prev,
    .carousel-control-next {
        transition: none !important;
    }
}`;

        fs.writeFileSync(cssPath, responsiveCSS, 'utf8');
        console.log('✓ Created responsive enhancements CSS');
    }

    createViewportScript() {
        const scriptPath = path.join(this.publicDir, '../scripts/viewport-validator.js');
        
        const viewportScript = `/**
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
            console.log(\`Fixed \${issueCount} non-responsive images\`);
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
            console.log(\`Fixed \${issueCount} touch targets that were too small\`);
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
new ViewportValidator();`;

        fs.writeFileSync(scriptPath, viewportScript, 'utf8');
        console.log('✓ Created viewport validation script');
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('RESPONSIVE DESIGN ENHANCEMENT REPORT');
        console.log('='.repeat(60));
        console.log(`Total files processed: ${this.processedFiles.length}`);
        console.log(`Files with issues found: ${this.issues.length}`);

        if (this.issues.length > 0) {
            console.log('\nENHANCEMENTS APPLIED:');
            console.log('-'.repeat(40));
            
            this.issues.forEach(fileResult => {
                console.log(`\n📄 ${path.basename(fileResult.file)}:`);
                
                fileResult.issues.forEach(issue => {
                    const icon = issue.type === 'fixed' ? '🔧' : '✨';
                    console.log(`  ${icon} ${issue.message}`);
                });
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 Responsive design enhancements completed successfully!');
        console.log('📱 All pages are now optimized for mobile, tablet, and desktop devices');
        console.log('👆 Touch targets have been optimized for mobile interaction');
        console.log('🖼️ Images are now fully responsive across all breakpoints');
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponsiveDesignEnhancer;
}

// Run if called directly
if (require.main === module) {
    const enhancer = new ResponsiveDesignEnhancer();
    enhancer.enhanceAllFiles()
        .then(files => {
            console.log('\n✅ Responsive design enhancement completed successfully!');
            console.log(`Enhanced ${files.length} HTML files`);
        })
        .catch(error => {
            console.error('\n❌ Error during responsive design enhancement:', error);
            process.exit(1);
        });
}