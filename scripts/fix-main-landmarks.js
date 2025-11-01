/**
 * Script to fix main landmark issues in HTML files
 * This script specifically addresses the missing main content landmarks
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class MainLandmarkFixer {
    constructor(publicDir = './public') {
        this.publicDir = publicDir;
        this.processedFiles = [];
    }

    async fixAllFiles() {
        try {
            const htmlFiles = this.getMainHTMLFiles(this.publicDir);
            console.log(`Fixing main landmarks for ${htmlFiles.length} HTML files...\n`);

            for (const file of htmlFiles) {
                await this.fixFile(file);
            }

            console.log(`Successfully fixed ${this.processedFiles.length} files`);
            return this.processedFiles;
        } catch (error) {
            console.error('Error fixing files:', error);
            throw error;
        }
    }

    getMainHTMLFiles(dir) {
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

    async fixFile(filePath) {
        try {
            console.log(`Fixing: ${filePath}`);
            
            const html = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(html);
            const document = dom.window.document;

            let modified = false;

            // Fix main content landmark
            if (this.addMainLandmark(document)) {
                modified = true;
            }

            // Fix navigation landmark
            if (this.addNavigationLandmark(document)) {
                modified = true;
            }

            // Fix footer landmark
            if (this.addFooterLandmark(document)) {
                modified = true;
            }

            // Fix external links
            if (this.fixExternalLinks(document)) {
                modified = true;
            }

            // Fix social media links
            if (this.fixSocialLinks(document)) {
                modified = true;
            }

            if (modified) {
                // Write the fixed HTML back to file
                const fixedHTML = dom.serialize();
                fs.writeFileSync(filePath, fixedHTML, 'utf8');
                this.processedFiles.push(filePath);
                console.log(`✓ Fixed: ${filePath}`);
            } else {
                console.log(`- No changes needed: ${filePath}`);
            }
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error);
        }
    }

    addMainLandmark(document) {
        // Check if main landmark already exists
        let main = document.querySelector('main, [role="main"]');
        if (main) {
            main.id = 'main-content';
            return false; // No changes needed
        }

        // Find the main content area
        const contentSelectors = [
            '.contolib-slider-area',
            '.more-customers-area',
            '.opportunity-area',
            '.container',
            'section'
        ];

        let contentElement = null;
        for (const selector of contentSelectors) {
            contentElement = document.querySelector(selector);
            if (contentElement && !contentElement.closest('header') && !contentElement.closest('footer')) {
                break;
            }
        }

        if (contentElement) {
            // Create main wrapper
            const mainElement = document.createElement('main');
            mainElement.id = 'main-content';
            mainElement.setAttribute('role', 'main');
            
            // Wrap the content
            contentElement.parentNode.insertBefore(mainElement, contentElement);
            mainElement.appendChild(contentElement);
            
            return true;
        }

        return false;
    }

    addNavigationLandmark(document) {
        const nav = document.querySelector('nav, .navbar, .navbar-nav');
        if (nav && !nav.id) {
            nav.id = 'navigation';
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'Main navigation');
            return true;
        }
        return false;
    }

    addFooterLandmark(document) {
        const footer = document.querySelector('footer, .footer-area, .footer');
        if (footer && !footer.id) {
            footer.id = 'footer';
            footer.setAttribute('role', 'contentinfo');
            return true;
        }
        return false;
    }

    fixExternalLinks(document) {
        const externalLinks = document.querySelectorAll('a[href^="http"]');
        let modified = false;

        externalLinks.forEach(link => {
            const href = link.href;
            if (!href.includes('stoneonepointsolutions.in')) {
                if (!link.getAttribute('rel') || !link.getAttribute('rel').includes('noopener')) {
                    link.setAttribute('rel', 'noopener noreferrer');
                    modified = true;
                }

                // Add screen reader text for external links
                if (!link.querySelector('.sr-only')) {
                    const srText = document.createElement('span');
                    srText.className = 'sr-only';
                    srText.textContent = ' (opens in new tab)';
                    link.appendChild(srText);
                    modified = true;
                }
            }
        });

        return modified;
    }

    fixSocialLinks(document) {
        const socialLinks = document.querySelectorAll('.social-list a, .social-icon a');
        let modified = false;

        socialLinks.forEach(link => {
            const icon = link.querySelector('i');
            if (icon && !link.getAttribute('aria-label')) {
                const platform = this.getSocialPlatform(icon.className);
                link.setAttribute('aria-label', `Visit our ${platform} page (opens in new tab)`);
                link.setAttribute('rel', 'noopener noreferrer');
                modified = true;
            }
        });

        return modified;
    }

    getSocialPlatform(className) {
        if (className.includes('facebook')) return 'Facebook';
        if (className.includes('linkedin')) return 'LinkedIn';
        if (className.includes('twitter')) return 'Twitter';
        if (className.includes('instagram')) return 'Instagram';
        if (className.includes('youtube')) return 'YouTube';
        return 'social media';
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainLandmarkFixer;
}

// Run if called directly
if (require.main === module) {
    const fixer = new MainLandmarkFixer();
    fixer.fixAllFiles()
        .then(files => {
            console.log('\n✅ Main landmark fixes completed successfully!');
            console.log(`Fixed ${files.length} HTML files`);
        })
        .catch(error => {
            console.error('\n❌ Error during main landmark fixes:', error);
            process.exit(1);
        });
}