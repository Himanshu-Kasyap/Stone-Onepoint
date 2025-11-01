#!/usr/bin/env node

/**
 * Content Validation Script
 * Validates website content for consistency, SEO compliance, and quality
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class ContentValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.publicDir = path.join(__dirname, '../../public');
        this.contentDir = path.join(__dirname, '..');
        this.siteConfig = this.loadSiteConfig();
    }

    loadSiteConfig() {
        try {
            const configPath = path.join(this.contentDir, 'data/site-config.json');
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            this.errors.push(`Failed to load site configuration: ${error.message}`);
            return {};
        }
    }

    validateHTML(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(content);
            const document = dom.window.document;
            const fileName = path.basename(filePath);

            // Validate basic HTML structure
            this.validateBasicStructure(document, fileName);
            
            // Validate SEO elements
            this.validateSEOElements(document, fileName);
            
            // Validate accessibility
            this.validateAccessibility(document, fileName);
            
            // Validate content consistency
            this.validateContentConsistency(document, fileName);
            
            // Validate links
            this.validateLinks(document, fileName);

        } catch (error) {
            this.errors.push(`Error validating ${filePath}: ${error.message}`);
        }
    }

    validateBasicStructure(document, fileName) {
        // Check for required elements
        const requiredElements = ['title', 'meta[charset]', 'meta[name="viewport"]'];
        
        requiredElements.forEach(selector => {
            if (!document.querySelector(selector)) {
                this.errors.push(`${fileName}: Missing required element: ${selector}`);
            }
        });

        // Check for proper heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        
        headings.forEach(heading => {
            const currentLevel = parseInt(heading.tagName.charAt(1));
            if (currentLevel > previousLevel + 1) {
                this.warnings.push(`${fileName}: Heading hierarchy skip from h${previousLevel} to h${currentLevel}`);
            }
            previousLevel = currentLevel;
        });

        // Check for single H1
        const h1Elements = document.querySelectorAll('h1');
        if (h1Elements.length === 0) {
            this.errors.push(`${fileName}: Missing H1 element`);
        } else if (h1Elements.length > 1) {
            this.warnings.push(`${fileName}: Multiple H1 elements found (${h1Elements.length})`);
        }
    }

    validateSEOElements(document, fileName) {
        // Validate title tag
        const title = document.querySelector('title');
        if (title) {
            const titleText = title.textContent.trim();
            if (titleText.length < 30) {
                this.warnings.push(`${fileName}: Title too short (${titleText.length} chars): "${titleText}"`);
            } else if (titleText.length > 60) {
                this.warnings.push(`${fileName}: Title too long (${titleText.length} chars): "${titleText}"`);
            }
            
            // Check if title contains company name
            if (!titleText.includes('Stone OnePoint Solutions')) {
                this.warnings.push(`${fileName}: Title doesn't contain company name`);
            }
        }

        // Validate meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            const descText = metaDesc.getAttribute('content').trim();
            if (descText.length < 120) {
                this.warnings.push(`${fileName}: Meta description too short (${descText.length} chars)`);
            } else if (descText.length > 160) {
                this.warnings.push(`${fileName}: Meta description too long (${descText.length} chars)`);
            }
        } else {
            this.errors.push(`${fileName}: Missing meta description`);
        }

        // Validate canonical URL
        const canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            this.warnings.push(`${fileName}: Missing canonical URL`);
        }

        // Validate Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDesc = document.querySelector('meta[property="og:description"]');
        const ogUrl = document.querySelector('meta[property="og:url"]');
        
        if (!ogTitle) this.warnings.push(`${fileName}: Missing Open Graph title`);
        if (!ogDesc) this.warnings.push(`${fileName}: Missing Open Graph description`);
        if (!ogUrl) this.warnings.push(`${fileName}: Missing Open Graph URL`);
    }

    validateAccessibility(document, fileName) {
        // Check for alt attributes on images
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            if (!img.hasAttribute('alt')) {
                this.errors.push(`${fileName}: Image ${index + 1} missing alt attribute`);
            } else if (img.getAttribute('alt').trim() === '') {
                this.warnings.push(`${fileName}: Image ${index + 1} has empty alt attribute`);
            }
        });

        // Check for form labels
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea, select');
        inputs.forEach((input, index) => {
            const id = input.getAttribute('id');
            if (id) {
                const label = document.querySelector(`label[for="${id}"]`);
                if (!label) {
                    this.warnings.push(`${fileName}: Input ${index + 1} missing associated label`);
                }
            } else {
                this.warnings.push(`${fileName}: Input ${index + 1} missing id attribute`);
            }
        });

        // Check for skip navigation links
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        if (skipLinks.length === 0 && fileName === 'index.html') {
            this.warnings.push(`${fileName}: Consider adding skip navigation links for accessibility`);
        }
    }

    validateContentConsistency(document, fileName) {
        const content = document.documentElement.innerHTML;
        
        // Check for consistent company name usage
        const companyVariations = [
            'Stone OnePoint Solutions Pvt. Ltd.',
            'Stone OnePoint Solutions',
            'Bayleaf' // Legacy name that should be removed
        ];
        
        if (content.includes('Bayleaf')) {
            this.errors.push(`${fileName}: Contains legacy "Bayleaf" reference`);
        }

        // Check for consistent contact information
        const phonePattern = /\+91\s*8595378782/;
        const emailPattern = /hr@stoneonepointsolutions\.in/;
        
        if (content.includes('phone') || content.includes('contact')) {
            if (!phonePattern.test(content)) {
                this.warnings.push(`${fileName}: Phone number format inconsistent or missing`);
            }
        }
        
        if (content.includes('email') || content.includes('contact')) {
            if (!emailPattern.test(content)) {
                this.warnings.push(`${fileName}: Email format inconsistent or missing`);
            }
        }

        // Check for HTTrack artifacts
        const httrackPatterns = [
            /HTTrack/i,
            /Mirror and index made by/i,
            /<!-- Mirrored from/i,
            /hts-cache/i
        ];
        
        httrackPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                this.errors.push(`${fileName}: Contains HTTrack artifacts`);
            }
        });
    }

    validateLinks(document, fileName) {
        const links = document.querySelectorAll('a[href]');
        
        links.forEach((link, index) => {
            const href = link.getAttribute('href');
            
            // Check for empty href
            if (!href || href.trim() === '') {
                this.warnings.push(`${fileName}: Link ${index + 1} has empty href`);
                return;
            }
            
            // Check for HTTrack-style links
            if (href.includes('hts-cache') || href.includes('.hts')) {
                this.errors.push(`${fileName}: Link ${index + 1} contains HTTrack artifacts: ${href}`);
            }
            
            // Check for external links without proper attributes
            if (href.startsWith('http') && !href.includes('stoneonepointsolutions.in')) {
                if (!link.hasAttribute('target') || link.getAttribute('target') !== '_blank') {
                    this.warnings.push(`${fileName}: External link ${index + 1} should open in new tab: ${href}`);
                }
                if (!link.hasAttribute('rel') || !link.getAttribute('rel').includes('noopener')) {
                    this.warnings.push(`${fileName}: External link ${index + 1} missing security attributes: ${href}`);
                }
            }
            
            // Check for internal links
            if (href.endsWith('.html') && !href.startsWith('http')) {
                const targetFile = path.join(this.publicDir, href);
                if (!fs.existsSync(targetFile)) {
                    this.errors.push(`${fileName}: Broken internal link: ${href}`);
                }
            }
        });
    }

    validateAllFiles() {
        console.log('🔍 Starting content validation...\n');
        
        // Get all HTML files in public directory
        const htmlFiles = this.getHTMLFiles(this.publicDir);
        
        htmlFiles.forEach(file => {
            console.log(`Validating: ${path.basename(file)}`);
            this.validateHTML(file);
        });
        
        this.generateReport();
    }

    getHTMLFiles(dir) {
        const files = [];
        
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                files.push(...this.getHTMLFiles(fullPath));
            } else if (item.endsWith('.html')) {
                files.push(fullPath);
            }
        });
        
        return files;
    }

    generateReport() {
        console.log('\n📊 Validation Report');
        console.log('='.repeat(50));
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ All content validation checks passed!');
            return;
        }
        
        if (this.errors.length > 0) {
            console.log(`\n❌ Errors (${this.errors.length}):`);
            this.errors.forEach(error => console.log(`  • ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }
        
        // Save report to file
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                errors: this.errors.length,
                warnings: this.warnings.length,
                status: this.errors.length === 0 ? 'PASS' : 'FAIL'
            },
            errors: this.errors,
            warnings: this.warnings
        };
        
        const reportPath = path.join(this.contentDir, 'validation/validation-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Exit with error code if there are errors
        if (this.errors.length > 0) {
            process.exit(1);
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ContentValidator();
    validator.validateAllFiles();
}

module.exports = ContentValidator;