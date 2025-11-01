/**
 * Accessibility Validation Script
 * Tests the accessibility enhancements applied to HTML files
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class AccessibilityValidator {
    constructor(publicDir = './public') {
        this.publicDir = publicDir;
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            issues: []
        };
    }

    async validateAllFiles() {
        try {
            const htmlFiles = this.getHTMLFiles(this.publicDir);
            console.log(`Validating accessibility for ${htmlFiles.length} HTML files...\n`);

            for (const file of htmlFiles) {
                await this.validateFile(file);
            }

            this.generateReport();
            return this.results;
        } catch (error) {
            console.error('Error during validation:', error);
            throw error;
        }
    }

    getHTMLFiles(dir) {
        const files = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                files.push(...this.getHTMLFiles(fullPath));
            } else if (path.extname(item) === '.html') {
                files.push(fullPath);
            }
        }

        return files;
    }

    async validateFile(filePath) {
        try {
            const html = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(html);
            const document = dom.window.document;

            const fileIssues = [];

            // Run all validation checks
            this.validateSkipNavigation(document, fileIssues, filePath);
            this.validateHeadingStructure(document, fileIssues, filePath);
            this.validateImages(document, fileIssues, filePath);
            this.validateButtons(document, fileIssues, filePath);
            this.validateLinks(document, fileIssues, filePath);
            this.validateForms(document, fileIssues, filePath);
            this.validateLandmarks(document, fileIssues, filePath);
            this.validateARIALabels(document, fileIssues, filePath);
            this.validateKeyboardNavigation(document, fileIssues, filePath);
            this.validateColorContrast(document, fileIssues, filePath);

            if (fileIssues.length === 0) {
                this.results.passed++;
                console.log(`✅ ${path.basename(filePath)} - All accessibility checks passed`);
            } else {
                this.results.failed++;
                console.log(`❌ ${path.basename(filePath)} - ${fileIssues.length} issues found`);
                this.results.issues.push({
                    file: filePath,
                    issues: fileIssues
                });
            }
        } catch (error) {
            console.error(`Error validating ${filePath}:`, error);
            this.results.failed++;
        }
    }

    validateSkipNavigation(document, issues, filePath) {
        const skipNav = document.querySelector('.skip-navigation');
        if (!skipNav) {
            issues.push({
                type: 'error',
                message: 'Missing skip navigation links',
                element: 'body'
            });
            return;
        }

        const skipLinks = skipNav.querySelectorAll('.skip-link');
        if (skipLinks.length < 2) {
            issues.push({
                type: 'warning',
                message: 'Should have at least 2 skip navigation links (main content, navigation)',
                element: '.skip-navigation'
            });
        }

        // Check if skip links have proper targets
        skipLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const target = document.querySelector(href);
                if (!target) {
                    issues.push({
                        type: 'error',
                        message: `Skip link target "${href}" not found`,
                        element: 'a.skip-link'
                    });
                }
            }
        });
    }

    validateHeadingStructure(document, issues, filePath) {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const h1Count = document.querySelectorAll('h1').length;

        if (h1Count === 0) {
            issues.push({
                type: 'error',
                message: 'Page should have exactly one H1 heading',
                element: 'document'
            });
        } else if (h1Count > 1) {
            issues.push({
                type: 'error',
                message: `Page has ${h1Count} H1 headings, should have only one`,
                element: 'h1'
            });
        }

        // Check heading hierarchy
        let previousLevel = 0;
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            
            if (index === 0 && level !== 1) {
                issues.push({
                    type: 'warning',
                    message: 'First heading should be H1',
                    element: heading.tagName.toLowerCase()
                });
            }

            if (level > previousLevel + 1) {
                issues.push({
                    type: 'warning',
                    message: `Heading level jumps from H${previousLevel} to H${level}`,
                    element: heading.tagName.toLowerCase()
                });
            }

            previousLevel = level;
        });
    }

    validateImages(document, issues, filePath) {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            const alt = img.getAttribute('alt');
            const src = img.getAttribute('src');

            if (alt === null) {
                issues.push({
                    type: 'error',
                    message: 'Image missing alt attribute',
                    element: `img[src="${src}"]`
                });
            } else if (alt === 'Image' || alt === 'image') {
                issues.push({
                    type: 'warning',
                    message: 'Image has generic alt text',
                    element: `img[src="${src}"]`
                });
            }

            // Check for decorative images
            if (alt === '' && !img.getAttribute('role')) {
                issues.push({
                    type: 'warning',
                    message: 'Decorative image should have role="presentation"',
                    element: `img[src="${src}"]`
                });
            }
        });
    }

    validateButtons(document, issues, filePath) {
        const buttons = document.querySelectorAll('button, .btn, .default-btn, [role="button"]');
        
        buttons.forEach(button => {
            const text = button.textContent.trim();
            const ariaLabel = button.getAttribute('aria-label');
            
            if (!text && !ariaLabel) {
                issues.push({
                    type: 'error',
                    message: 'Button has no accessible text',
                    element: button.tagName.toLowerCase()
                });
            }

            // Check for proper role
            if (button.tagName !== 'BUTTON' && !button.getAttribute('role')) {
                issues.push({
                    type: 'error',
                    message: 'Interactive element should have role="button"',
                    element: button.tagName.toLowerCase()
                });
            }

            // Check for keyboard accessibility
            if (button.tagName !== 'BUTTON' && !button.hasAttribute('tabindex')) {
                issues.push({
                    type: 'warning',
                    message: 'Interactive element should be keyboard accessible',
                    element: button.tagName.toLowerCase()
                });
            }
        });
    }

    validateLinks(document, issues, filePath) {
        const links = document.querySelectorAll('a');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            const text = link.textContent.trim();
            const ariaLabel = link.getAttribute('aria-label');

            if (!text && !ariaLabel) {
                issues.push({
                    type: 'error',
                    message: 'Link has no accessible text',
                    element: 'a'
                });
            }

            // Check for generic link text
            if (text && (text.toLowerCase() === 'click here' || text.toLowerCase() === 'read more' || text.toLowerCase() === 'more')) {
                issues.push({
                    type: 'warning',
                    message: 'Link has generic text, consider more descriptive text',
                    element: 'a'
                });
            }

            // Check external links
            if (href && href.startsWith('http') && !href.includes('stoneonepointsolutions.in')) {
                if (!link.getAttribute('rel') || !link.getAttribute('rel').includes('noopener')) {
                    issues.push({
                        type: 'warning',
                        message: 'External link should have rel="noopener noreferrer"',
                        element: 'a'
                    });
                }
            }

            // Check links without href
            if (!href && !link.getAttribute('role')) {
                issues.push({
                    type: 'error',
                    message: 'Link without href should have role="button"',
                    element: 'a'
                });
            }
        });
    }

    validateForms(document, issues, filePath) {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                const label = form.querySelector(`label[for="${input.id}"]`);
                const ariaLabel = input.getAttribute('aria-label');
                const ariaLabelledby = input.getAttribute('aria-labelledby');

                if (!label && !ariaLabel && !ariaLabelledby) {
                    issues.push({
                        type: 'error',
                        message: 'Form input has no associated label',
                        element: input.tagName.toLowerCase()
                    });
                }

                if (input.required && !input.getAttribute('aria-required')) {
                    issues.push({
                        type: 'warning',
                        message: 'Required field should have aria-required="true"',
                        element: input.tagName.toLowerCase()
                    });
                }
            });
        });
    }

    validateLandmarks(document, issues, filePath) {
        const main = document.querySelector('main, [role="main"]');
        if (!main) {
            issues.push({
                type: 'error',
                message: 'Page should have a main landmark',
                element: 'document'
            });
        }

        const nav = document.querySelector('nav, [role="navigation"]');
        if (!nav) {
            issues.push({
                type: 'warning',
                message: 'Page should have a navigation landmark',
                element: 'document'
            });
        }

        const header = document.querySelector('header, [role="banner"]');
        if (!header) {
            issues.push({
                type: 'warning',
                message: 'Page should have a banner landmark',
                element: 'document'
            });
        }
    }

    validateARIALabels(document, issues, filePath) {
        const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
        
        elementsWithAria.forEach(element => {
            const ariaLabelledby = element.getAttribute('aria-labelledby');
            if (ariaLabelledby) {
                const labelElement = document.getElementById(ariaLabelledby);
                if (!labelElement) {
                    issues.push({
                        type: 'error',
                        message: `aria-labelledby references non-existent element "${ariaLabelledby}"`,
                        element: element.tagName.toLowerCase()
                    });
                }
            }

            const ariaDescribedby = element.getAttribute('aria-describedby');
            if (ariaDescribedby) {
                const descElement = document.getElementById(ariaDescribedby);
                if (!descElement) {
                    issues.push({
                        type: 'error',
                        message: `aria-describedby references non-existent element "${ariaDescribedby}"`,
                        element: element.tagName.toLowerCase()
                    });
                }
            }
        });
    }

    validateKeyboardNavigation(document, issues, filePath) {
        const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]');
        
        interactiveElements.forEach(element => {
            const tabindex = element.getAttribute('tabindex');
            
            if (tabindex && parseInt(tabindex) > 0) {
                issues.push({
                    type: 'warning',
                    message: 'Avoid positive tabindex values',
                    element: element.tagName.toLowerCase()
                });
            }
        });
    }

    validateColorContrast(document, issues, filePath) {
        // Check for accessibility CSS inclusion
        const accessibilityCSS = document.querySelector('link[href*="accessibility.css"]');
        if (!accessibilityCSS) {
            issues.push({
                type: 'warning',
                message: 'Accessibility CSS not included',
                element: 'head'
            });
        }

        // Check for focus indicators
        const focusStyles = document.querySelector('style');
        if (!focusStyles || !focusStyles.textContent.includes(':focus')) {
            issues.push({
                type: 'warning',
                message: 'Custom focus styles may be missing',
                element: 'head'
            });
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('ACCESSIBILITY VALIDATION REPORT');
        console.log('='.repeat(60));
        console.log(`Total files validated: ${this.results.passed + this.results.failed}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⚠️  Total issues: ${this.results.issues.reduce((sum, file) => sum + file.issues.length, 0)}`);

        if (this.results.issues.length > 0) {
            console.log('\nDETAILED ISSUES:');
            console.log('-'.repeat(40));
            
            this.results.issues.forEach(fileResult => {
                console.log(`\n📄 ${path.basename(fileResult.file)}:`);
                
                fileResult.issues.forEach(issue => {
                    const icon = issue.type === 'error' ? '❌' : '⚠️';
                    console.log(`  ${icon} ${issue.message}`);
                    console.log(`     Element: ${issue.element}`);
                });
            });
        }

        console.log('\n' + '='.repeat(60));
        
        if (this.results.failed === 0) {
            console.log('🎉 All files passed accessibility validation!');
        } else {
            console.log(`⚠️  ${this.results.failed} files need attention for full accessibility compliance.`);
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityValidator;
}

// Run if called directly
if (require.main === module) {
    const validator = new AccessibilityValidator();
    validator.validateAllFiles()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('\n❌ Error during accessibility validation:', error);
            process.exit(1);
        });
}