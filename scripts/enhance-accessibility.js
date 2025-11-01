/**
 * Accessibility Enhancement Script for Stone OnePoint Solutions Website
 * This script enhances accessibility compliance by adding ARIA labels,
 * improving keyboard navigation, and ensuring proper semantic structure.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

class AccessibilityEnhancer {
    constructor(publicDir) {
        this.publicDir = publicDir;
        this.processedFiles = [];
        this.issues = [];
    }

    /**
     * Process all HTML files in the public directory
     */
    async enhanceAllFiles() {
        console.log('🚀 Starting accessibility enhancement...');
        
        const htmlFiles = this.getHtmlFiles();
        
        for (const file of htmlFiles) {
            try {
                await this.enhanceFile(file);
                this.processedFiles.push(file);
                console.log(`✅ Enhanced: ${file}`);
            } catch (error) {
                console.error(`❌ Error processing ${file}:`, error.message);
                this.issues.push({ file, error: error.message });
            }
        }
        
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
     * Enhance accessibility for a single HTML file
     */
    async enhanceFile(filename) {
        const filePath = path.join(this.publicDir, filename);
        const html = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(html);

        // Add skip navigation links
        this.addSkipNavigation($);
        
        // Enhance navigation accessibility
        this.enhanceNavigation($);
        
        // Add ARIA labels to interactive elements
        this.addAriaLabels($);
        
        // Enhance form accessibility
        this.enhanceForms($);
        
        // Improve image accessibility
        this.enhanceImages($);
        
        // Add keyboard navigation support
        this.addKeyboardSupport($);
        
        // Enhance modal accessibility
        this.enhanceModals($);
        
        // Add focus management
        this.addFocusManagement($);

        // Write the enhanced HTML back to file
        fs.writeFileSync(filePath, $.html());
    }

    /**
     * Add skip navigation links for screen readers
     */
    addSkipNavigation($) {
        const skipNav = `
            <div class="skip-navigation" aria-label="Skip navigation links">
                <a href="#main-content" class="skip-link">Skip to main content</a>
                <a href="#navigation" class="skip-link">Skip to navigation</a>
                <a href="#footer" class="skip-link">Skip to footer</a>
            </div>
        `;
        
        $('body').prepend(skipNav);
        
        // Add main content landmark if not exists
        if (!$('#main-content').length && !$('main').length) {
            $('body').find('.contolib-slider-area, .more-customers-area').first().attr('id', 'main-content');
        }
    }

    /**
     * Enhance navigation accessibility
     */
    enhanceNavigation($) {
        // Add navigation landmark
        $('nav').attr('role', 'navigation').attr('aria-label', 'Main navigation');
        
        // Enhance dropdown menus
        $('.dropdown-toggle').each((i, el) => {
            const $el = $(el);
            const dropdownId = `dropdown-${i}`;
            
            $el.attr({
                'aria-haspopup': 'true',
                'aria-expanded': 'false',
                'aria-controls': dropdownId,
                'role': 'button'
            });
            
            $el.next('.dropdown-menu').attr({
                'id': dropdownId,
                'role': 'menu',
                'aria-labelledby': $el.attr('id') || `dropdown-toggle-${i}`
            });
            
            if (!$el.attr('id')) {
                $el.attr('id', `dropdown-toggle-${i}`);
            }
        });

        // Enhance mobile menu
        $('.mobile-nav').attr('aria-label', 'Mobile navigation');
        $('.mean-menu').attr('role', 'menubar');
        
        // Add proper roles to menu items
        $('.navbar-nav .nav-item').attr('role', 'none');
        $('.navbar-nav .nav-link').attr('role', 'menuitem');
    }

    /**
     * Add ARIA labels to interactive elements
     */
    addAriaLabels($) {
        // Buttons without proper labels
        $('button').each((i, el) => {
            const $el = $(el);
            if (!$el.attr('aria-label') && !$el.text().trim()) {
                const iconClass = $el.find('i').attr('class');
                if (iconClass) {
                    if (iconClass.includes('close') || iconClass.includes('x')) {
                        $el.attr('aria-label', 'Close');
                    } else if (iconClass.includes('menu')) {
                        $el.attr('aria-label', 'Open menu');
                    } else {
                        $el.attr('aria-label', 'Button');
                    }
                }
            }
        });

        // Links without descriptive text
        $('a').each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            const href = $el.attr('href');
            
            if (!text && !$el.attr('aria-label')) {
                if ($el.find('img').length) {
                    $el.attr('aria-label', 'Link with image');
                } else if (href) {
                    $el.attr('aria-label', `Link to ${href}`);
                }
            }
            
            // Add external link indicators
            if (href && (href.startsWith('http') && !href.includes('stoneonepointsolutions.in'))) {
                $el.attr('aria-label', ($el.attr('aria-label') || text) + ' (opens in new window)');
                $el.attr('target', '_blank');
                $el.attr('rel', 'noopener noreferrer');
            }
        });

        // Social media links
        $('.social-list a, .social-icon a').each((i, el) => {
            const $el = $(el);
            const iconClass = $el.find('i').attr('class');
            
            if (iconClass) {
                if (iconClass.includes('facebook')) {
                    $el.attr('aria-label', 'Visit our Facebook page (opens in new window)');
                } else if (iconClass.includes('linkedin')) {
                    $el.attr('aria-label', 'Visit our LinkedIn page (opens in new window)');
                } else if (iconClass.includes('twitter')) {
                    $el.attr('aria-label', 'Visit our Twitter page (opens in new window)');
                }
            }
        });

        // Contact information
        $('a[href^="tel:"]').attr('aria-label', 'Call us at ' + $('a[href^="tel:"]').text().trim());
        $('a[href^="mailto:"]').attr('aria-label', 'Send email to ' + $('a[href^="mailto:"]').text().trim());
    }

    /**
     * Enhance form accessibility
     */
    enhanceForms($) {
        $('form').each((i, form) => {
            const $form = $(form);
            
            // Add form role and label
            $form.attr('role', 'form');
            if (!$form.attr('aria-label')) {
                $form.attr('aria-label', 'Contact form');
            }
            
            // Enhance form fields
            $form.find('input, textarea, select').each((j, field) => {
                const $field = $(field);
                const fieldId = $field.attr('id') || `field-${i}-${j}`;
                $field.attr('id', fieldId);
                
                // Add required attribute and aria-required
                if ($field.attr('required') !== undefined) {
                    $field.attr('aria-required', 'true');
                }
                
                // Add labels if missing
                let $label = $(`label[for="${fieldId}"]`);
                if (!$label.length) {
                    const placeholder = $field.attr('placeholder');
                    const name = $field.attr('name');
                    
                    if (placeholder) {
                        $field.attr('aria-label', placeholder);
                    } else if (name) {
                        $field.attr('aria-label', name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
                    }
                }
            });
            
            // Enhance submit buttons
            $form.find('button[type="submit"], input[type="submit"]').each((j, btn) => {
                const $btn = $(btn);
                if (!$btn.attr('aria-label') && !$btn.text().trim()) {
                    $btn.attr('aria-label', 'Submit form');
                }
            });
        });
    }

    /**
     * Improve image accessibility
     */
    enhanceImages($) {
        $('img').each((i, img) => {
            const $img = $(img);
            const alt = $img.attr('alt');
            const src = $img.attr('src') || $img.attr('data-cfsrc');
            
            // Add alt text if missing
            if (!alt) {
                if (src) {
                    const filename = path.basename(src, path.extname(src));
                    $img.attr('alt', filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
                } else {
                    $img.attr('alt', 'Image');
                }
            }
            
            // Mark decorative images
            if ($img.closest('.slider-shape, .shape, .bg').length) {
                $img.attr('alt', '');
                $img.attr('role', 'presentation');
            }
        });
    }

    /**
     * Add keyboard navigation support
     */
    addKeyboardSupport($) {
        // Make interactive elements focusable
        $('.single-opportunity, .partners-item, .single-company').each((i, el) => {
            const $el = $(el);
            if (!$el.attr('tabindex')) {
                $el.attr('tabindex', '0');
            }
            
            // Add role if it's interactive
            if ($el.find('a').length) {
                $el.attr('role', 'button');
                $el.attr('aria-label', 'Click to learn more');
            }
        });

        // Enhance carousel controls
        $('.owl-nav button').each((i, btn) => {
            const $btn = $(btn);
            if ($btn.hasClass('owl-prev')) {
                $btn.attr('aria-label', 'Previous slide');
            } else if ($btn.hasClass('owl-next')) {
                $btn.attr('aria-label', 'Next slide');
            }
        });

        $('.owl-dots button').each((i, btn) => {
            $(btn).attr('aria-label', `Go to slide ${i + 1}`);
        });
    }

    /**
     * Enhance modal accessibility
     */
    enhanceModals($) {
        $('.modal').each((i, modal) => {
            const $modal = $(modal);
            
            // Add proper ARIA attributes
            $modal.attr({
                'role': 'dialog',
                'aria-modal': 'true',
                'aria-labelledby': $modal.find('.modal-title').attr('id') || `modal-title-${i}`,
                'aria-describedby': $modal.find('.modal-body').attr('id') || `modal-body-${i}`
            });
            
            // Ensure title and body have IDs
            const $title = $modal.find('.modal-title');
            const $body = $modal.find('.modal-body');
            
            if (!$title.attr('id')) {
                $title.attr('id', `modal-title-${i}`);
            }
            
            if (!$body.attr('id')) {
                $body.attr('id', `modal-body-${i}`);
            }
            
            // Enhance close button
            $modal.find('.close, [data-bs-dismiss="modal"]').attr('aria-label', 'Close modal');
        });
    }

    /**
     * Add focus management
     */
    addFocusManagement($) {
        // Add focus indicators CSS if not present
        if (!$('style#focus-styles').length) {
            const focusStyles = `
                <style id="focus-styles">
                /* Enhanced focus indicators for accessibility */
                *:focus {
                    outline: 2px solid #4a90e2 !important;
                    outline-offset: 2px !important;
                }
                
                .skip-link {
                    position: absolute;
                    top: -40px;
                    left: 6px;
                    background: #000;
                    color: #fff;
                    padding: 8px;
                    text-decoration: none;
                    z-index: 9999;
                    border-radius: 4px;
                }
                
                .skip-link:focus {
                    top: 6px;
                }
                
                /* High contrast mode support */
                @media (prefers-contrast: high) {
                    * {
                        border-color: currentColor !important;
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
                
                /* Touch target sizing */
                @media (pointer: coarse) {
                    button, a, input, select, textarea {
                        min-height: 44px;
                        min-width: 44px;
                    }
                }
                </style>
            `;
            $('head').append(focusStyles);
        }
    }

    /**
     * Generate accessibility enhancement report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            processedFiles: this.processedFiles.length,
            files: this.processedFiles,
            issues: this.issues,
            enhancements: [
                'Added skip navigation links',
                'Enhanced navigation with ARIA labels',
                'Improved form accessibility',
                'Added proper image alt text',
                'Enhanced keyboard navigation support',
                'Improved modal accessibility',
                'Added focus management styles',
                'Enhanced interactive elements with ARIA attributes'
            ]
        };

        const reportPath = path.join(this.publicDir, '../docs/accessibility-enhancement-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 Accessibility Enhancement Report:');
        console.log(`✅ Files processed: ${report.processedFiles}`);
        console.log(`❌ Issues encountered: ${report.issues.length}`);
        console.log(`📄 Report saved to: ${reportPath}`);
        
        if (report.issues.length > 0) {
            console.log('\n⚠️  Issues:');
            report.issues.forEach(issue => {
                console.log(`   - ${issue.file}: ${issue.error}`);
            });
        }
    }
}

// Export for use in other scripts
module.exports = AccessibilityEnhancer;

// Run if called directly
if (require.main === module) {
    const publicDir = path.join(__dirname, '../public');
    const enhancer = new AccessibilityEnhancer(publicDir);
    enhancer.enhanceAllFiles().catch(console.error);
}