/**
 * Responsive Design Enhancement Script for Stone OnePoint Solutions Website
 * This script validates and enhances responsive design across all breakpoints,
 * optimizes touch targets, and ensures proper viewport configuration.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class ResponsiveDesignEnhancer {
    constructor(publicDir) {
        this.publicDir = publicDir;
        this.processedFiles = [];
        this.issues = [];
        this.breakpoints = {
            xs: '0px',
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            xxl: '1400px'
        };
    }

    /**
     * Process all HTML files for responsive design enhancement
     */
    async enhanceAllFiles() {
        console.log('📱 Starting responsive design enhancement...');
        
        const htmlFiles = this.getHtmlFiles();
        
        for (const file of htmlFiles) {
            try {
                await this.enhanceFile(file);
                this.processedFiles.push(file);
                console.log(`✅ Enhanced responsive design: ${file}`);
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
                this.issues.push({ file, error: error.message });
            }
        }
        
        await this.createResponsiveCSS();
        this.generateReport();
    }

    /**
     * Get all HTML files from the public directory
     */
    getHtmlFiles() {
        const files = fs.readdirSync(this.publicDir);
        return files.filter(file => file.endsWith('.html'));
    }

    /**
     * Enhance responsive design for a single HTML file
     */
    async enhanceFile(filename) {
        const filePath = path.join(this.publicDir, filename);
        const html = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(html);

        // Ensure proper viewport configuration
        this.ensureViewportMeta($);
        
        // Optimize touch targets
        this.optimizeTouchTargets($);
        
        // Enhance responsive images
        this.enhanceResponsiveImages($);
        
        // Fix responsive layout issues
        this.fixResponsiveLayouts($);
        
        // Add responsive navigation enhancements
        this.enhanceResponsiveNavigation($);
        
        // Optimize responsive typography
        this.optimizeResponsiveTypography($);
        
        // Add responsive utility classes
        this.addResponsiveUtilities($);

        // Write the enhanced HTML back to file
        fs.writeFileSync(filePath, $.html());
    }

    /**
     * Ensure proper viewport configuration
     */
    ensureViewportMeta($) {
        let viewportMeta = $('meta[name="viewport"]');
        
        if (viewportMeta.length === 0) {
            $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">');
        } else {
            // Update existing viewport meta to ensure proper configuration
            viewportMeta.attr('content', 'width=device-width, initial-scale=1, shrink-to-fit=no');
        }
        
        // Add responsive meta tags if not present
        if (!$('meta[name="format-detection"]').length) {
            $('head').append('<meta name="format-detection" content="telephone=no">');
        }
        
        if (!$('meta[name="mobile-web-app-capable"]').length) {
            $('head').append('<meta name="mobile-web-app-capable" content="yes">');
        }
    }

    /**
     * Optimize touch targets for mobile devices
     */
    optimizeTouchTargets($) {
        // Enhance buttons and links for touch
        $('button, a, input[type="submit"], input[type="button"]').each((i, el) => {
            const $el = $(el);
            
            // Add touch-friendly class
            $el.addClass('touch-target');
            
            // Ensure minimum touch target size
            if (!$el.hasClass('btn-sm') && !$el.hasClass('btn-xs')) {
                $el.addClass('touch-optimized');
            }
        });

        // Enhance form controls
        $('input, textarea, select').each((i, el) => {
            const $el = $(el);
            $el.addClass('form-control-touch');
        });

        // Enhance navigation items
        $('.nav-link, .dropdown-item').addClass('nav-touch-target');
        
        // Enhance social media icons
        $('.social-list a, .social-icon a').addClass('social-touch-target');
    }

    /**
     * Enhance responsive images
     */
    enhanceResponsiveImages($) {
        $('img').each((i, img) => {
            const $img = $(img);
            
            // Add responsive image class if not present
            if (!$img.hasClass('img-fluid') && !$img.hasClass('img-responsive')) {
                $img.addClass('img-fluid');
            }
            
            // Add loading="lazy" for performance
            if (!$img.attr('loading')) {
                $img.attr('loading', 'lazy');
            }
            
            // Enhance images in specific containers
            if ($img.closest('.slider-img, .opportunity-content, .partners-item').length) {
                $img.addClass('responsive-content-img');
            }
        });

        // Enhance background images with responsive classes
        $('.slider-img, .more-customers-img').addClass('responsive-bg-container');
    }

    /**
     * Fix responsive layout issues
     */
    fixResponsiveLayouts($) {
        // Enhance grid layouts
        $('.row').each((i, row) => {
            const $row = $(row);
            
            // Add responsive spacing
            $row.addClass('responsive-row');
            
            // Fix column spacing issues
            $row.find('[class*="col-"]').each((j, col) => {
                const $col = $(col);
                $col.addClass('responsive-col');
            });
        });

        // Enhance container responsiveness
        $('.container, .container-fluid').addClass('responsive-container');
        
        // Fix specific layout components
        $('.contolib-slider-area').addClass('responsive-slider');
        $('.more-customers-area').addClass('responsive-section');
        $('.opportunity-area').addClass('responsive-grid-section');
        $('.mission-vission').addClass('responsive-mission-section');
        
        // Enhance flexbox layouts
        $('.flexbox, .flex').addClass('responsive-flex');
    }

    /**
     * Enhance responsive navigation
     */
    enhanceResponsiveNavigation($) {
        // Enhance main navigation
        $('.navbar').addClass('responsive-navbar');
        $('.navbar-collapse').addClass('responsive-nav-collapse');
        
        // Enhance mobile navigation
        $('.mobile-nav').addClass('responsive-mobile-nav');
        $('.mean-menu').addClass('responsive-mean-menu');
        
        // Enhance dropdown menus
        $('.dropdown-menu').addClass('responsive-dropdown');
        
        // Add hamburger menu enhancements
        $('.navbar-toggler, .mobile-nav a').addClass('responsive-nav-toggle');
    }

    /**
     * Optimize responsive typography
     */
    optimizeResponsiveTypography($) {
        // Add responsive typography classes
        $('h1, .h1').addClass('responsive-h1');
        $('h2, .h2').addClass('responsive-h2');
        $('h3, .h3').addClass('responsive-h3');
        $('h4, .h4').addClass('responsive-h4');
        $('h5, .h5').addClass('responsive-h5');
        $('h6, .h6').addClass('responsive-h6');
        
        // Enhance paragraph text
        $('p').addClass('responsive-text');
        
        // Enhance specific text elements
        $('.contolib-slider-text h1, .contolib-slider-text h2').addClass('hero-responsive-title');
        $('.section-title h2').addClass('section-responsive-title');
    }

    /**
     * Add responsive utility classes
     */
    addResponsiveUtilities($) {
        // Add responsive spacing utilities to sections
        $('section, .section').addClass('responsive-section-spacing');
        
        // Add responsive padding to containers
        $('.container, .container-fluid').addClass('responsive-container-padding');
        
        // Enhance specific components
        $('.preloader').addClass('responsive-preloader');
        $('.header-area').addClass('responsive-header');
        $('.footer-area').addClass('responsive-footer');
    }

    /**
     * Create comprehensive responsive CSS
     */
    async createResponsiveCSS() {
        const responsiveCSS = `
/* Enhanced Responsive Design Styles */
/* Generated by Responsive Design Enhancer */

/* Touch Target Optimization */
.touch-target {
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
}

.touch-optimized {
    padding: 12px 20px;
    margin: 4px;
}

.form-control-touch {
    min-height: 44px;
    padding: 12px 16px;
    font-size: 16px; /* Prevents zoom on iOS */
}

.nav-touch-target {
    min-height: 44px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
}

.social-touch-target {
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 4px;
}

/* Responsive Images */
.responsive-content-img {
    width: 100%;
    height: auto;
    object-fit: cover;
}

.responsive-bg-container {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

/* Responsive Layout Fixes */
.responsive-row {
    margin-left: -8px;
    margin-right: -8px;
}

.responsive-col {
    padding-left: 8px;
    padding-right: 8px;
    margin-bottom: 16px;
}

.responsive-container {
    padding-left: 16px;
    padding-right: 16px;
}

.responsive-container-padding {
    padding-top: 20px;
    padding-bottom: 20px;
}

/* Responsive Navigation */
.responsive-navbar {
    padding: 8px 0;
}

.responsive-nav-collapse {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    margin-top: 8px;
    padding: 16px;
}

.responsive-dropdown {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border: none;
    padding: 8px 0;
}

.responsive-nav-toggle {
    padding: 12px;
    border-radius: 8px;
}

/* Responsive Typography */
.responsive-h1 {
    font-size: clamp(1.75rem, 4vw, 3rem);
    line-height: 1.2;
}

.responsive-h2 {
    font-size: clamp(1.5rem, 3.5vw, 2.5rem);
    line-height: 1.3;
}

.responsive-h3 {
    font-size: clamp(1.25rem, 3vw, 2rem);
    line-height: 1.4;
}

.responsive-h4 {
    font-size: clamp(1.1rem, 2.5vw, 1.5rem);
    line-height: 1.4;
}

.responsive-h5 {
    font-size: clamp(1rem, 2vw, 1.25rem);
    line-height: 1.5;
}

.responsive-h6 {
    font-size: clamp(0.9rem, 1.5vw, 1.1rem);
    line-height: 1.5;
}

.hero-responsive-title {
    font-size: clamp(2rem, 5vw, 4rem);
    line-height: 1.1;
    margin-bottom: 1rem;
}

.section-responsive-title {
    font-size: clamp(1.75rem, 4vw, 3rem);
    line-height: 1.2;
    margin-bottom: 1.5rem;
}

.responsive-text {
    font-size: clamp(0.9rem, 1.5vw, 1.1rem);
    line-height: 1.6;
}

/* Responsive Sections */
.responsive-section-spacing {
    padding: clamp(2rem, 5vw, 5rem) 0;
}

.responsive-slider {
    min-height: 60vh;
}

.responsive-section {
    padding: clamp(2rem, 4vw, 4rem) 0;
}

.responsive-grid-section {
    padding: clamp(2rem, 4vw, 4rem) 0;
}

.responsive-mission-section {
    padding: clamp(3rem, 6vw, 6rem) 0;
}

.responsive-flex {
    flex-wrap: wrap;
    gap: 1rem;
}

/* Mobile Specific Styles */
@media (max-width: 575.98px) {
    .responsive-container {
        padding-left: 12px;
        padding-right: 12px;
    }
    
    .responsive-row {
        margin-left: -6px;
        margin-right: -6px;
    }
    
    .responsive-col {
        padding-left: 6px;
        padding-right: 6px;
        margin-bottom: 20px;
    }
    
    .responsive-nav-collapse {
        margin-top: 12px;
        padding: 20px;
    }
    
    .touch-target {
        min-height: 48px;
        min-width: 48px;
        padding: 12px 20px;
    }
    
    .form-control-touch {
        min-height: 48px;
        padding: 14px 18px;
        font-size: 16px;
    }
    
    .nav-touch-target {
        min-height: 48px;
        padding: 14px 18px;
    }
    
    .social-touch-target {
        min-height: 48px;
        min-width: 48px;
        margin: 6px;
    }
    
    .responsive-section-spacing {
        padding: clamp(1.5rem, 4vw, 3rem) 0;
    }
    
    .hero-responsive-title {
        font-size: clamp(1.5rem, 6vw, 2.5rem);
        margin-bottom: 0.75rem;
    }
    
    .section-responsive-title {
        font-size: clamp(1.5rem, 5vw, 2rem);
        margin-bottom: 1rem;
    }
}

/* Tablet Specific Styles */
@media (min-width: 576px) and (max-width: 991.98px) {
    .responsive-container {
        padding-left: 14px;
        padding-right: 14px;
    }
    
    .responsive-flex {
        gap: 1.5rem;
    }
    
    .responsive-section-spacing {
        padding: clamp(2.5rem, 5vw, 4rem) 0;
    }
}

/* Desktop Specific Styles */
@media (min-width: 992px) {
    .responsive-container {
        padding-left: 16px;
        padding-right: 16px;
    }
    
    .responsive-flex {
        gap: 2rem;
    }
    
    .responsive-nav-collapse {
        background: transparent;
        box-shadow: none;
        margin-top: 0;
        padding: 0;
    }
    
    .responsive-dropdown {
        margin-top: 8px;
    }
}

/* Large Desktop Styles */
@media (min-width: 1200px) {
    .responsive-container {
        max-width: 1140px;
        margin: 0 auto;
    }
    
    .responsive-section-spacing {
        padding: clamp(4rem, 6vw, 6rem) 0;
    }
}

/* Extra Large Desktop Styles */
@media (min-width: 1400px) {
    .responsive-container {
        max-width: 1320px;
    }
}

/* High DPI Display Support */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .responsive-content-img {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
    }
}

/* Landscape Mobile Orientation */
@media (max-height: 500px) and (orientation: landscape) {
    .responsive-slider {
        min-height: 80vh;
    }
    
    .responsive-section-spacing {
        padding: 1rem 0;
    }
    
    .hero-responsive-title {
        font-size: clamp(1.25rem, 4vw, 2rem);
    }
}

/* Print Styles */
@media print {
    .responsive-nav-toggle,
    .responsive-preloader,
    .social-touch-target {
        display: none !important;
    }
    
    .responsive-text {
        font-size: 12pt;
        line-height: 1.4;
    }
    
    .responsive-h1,
    .responsive-h2,
    .responsive-h3,
    .responsive-h4,
    .responsive-h5,
    .responsive-h6 {
        page-break-after: avoid;
    }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
    .responsive-slider,
    .responsive-content-img {
        animation: none !important;
        transition: none !important;
    }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
    .responsive-nav-collapse {
        background: #2d3748;
        color: #fff;
    }
    
    .responsive-dropdown {
        background: #2d3748;
        color: #fff;
    }
}
`;

        const cssPath = path.join(this.publicDir, 'assets/css/responsive-enhancements.css');
        fs.writeFileSync(cssPath, responsiveCSS);
        console.log('📝 Created responsive enhancement CSS file');
        
        // Add CSS link to all HTML files
        const htmlFiles = this.getHtmlFiles();
        for (const file of htmlFiles) {
            const filePath = path.join(this.publicDir, file);
            const html = fs.readFileSync(filePath, 'utf8');
            const $ = cheerio.load(html);
            
            // Add CSS link if not already present
            if (!$('link[href*="responsive-enhancements.css"]').length) {
                $('head').append('<link href="assets/css/responsive-enhancements.css" rel="stylesheet">');
                fs.writeFileSync(filePath, $.html());
            }
        }
    }

    /**
     * Generate responsive design enhancement report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            processedFiles: this.processedFiles.length,
            files: this.processedFiles,
            issues: this.issues,
            breakpoints: this.breakpoints,
            enhancements: [
                'Ensured proper viewport configuration on all pages',
                'Optimized touch targets for mobile devices (44px minimum)',
                'Enhanced responsive images with lazy loading',
                'Fixed responsive layout issues across breakpoints',
                'Enhanced responsive navigation and dropdowns',
                'Optimized responsive typography with clamp() functions',
                'Added comprehensive responsive CSS utilities',
                'Implemented mobile-first responsive design patterns',
                'Added support for high DPI displays',
                'Implemented print styles optimization',
                'Added reduced motion and dark mode support'
            ],
            testingRecommendations: [
                'Test on actual devices: iPhone, iPad, Android phones/tablets',
                'Test in Chrome DevTools device emulation',
                'Verify touch targets are easily tappable',
                'Check text readability at all breakpoints',
                'Validate navigation usability on mobile',
                'Test form interactions on touch devices',
                'Verify image loading and responsiveness',
                'Check landscape orientation behavior'
            ]
        };

        const reportPath = path.join(this.publicDir, '../docs/responsive-design-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 Responsive Design Enhancement Report:');
        console.log(`✅ Files processed: ${report.processedFiles}`);
        console.log(`❌ Issues encountered: ${report.issues.length}`);
        console.log(`📱 Breakpoints configured: ${Object.keys(report.breakpoints).length}`);
        console.log(`📄 Report saved to: ${reportPath}`);
        
        if (report.issues.length > 0) {
            console.log('\n⚠️  Issues:');
            report.issues.forEach(issue => {
                console.log(`   - ${issue.file}: ${issue.error}`);
            });
        }
        
        console.log('\n📋 Testing Recommendations:');
        report.testingRecommendations.forEach(rec => {
            console.log(`   • ${rec}`);
        });
    }
}

// Export for use in other scripts
module.exports = ResponsiveDesignEnhancer;

// Run if called directly
if (require.main === module) {
    const publicDir = path.join(__dirname, '../public');
    const enhancer = new ResponsiveDesignEnhancer(publicDir);
    enhancer.enhanceAllFiles().catch(console.error);
}