/**
 * Script to apply accessibility enhancements to all HTML files
 * This script modifies HTML files to include proper ARIA labels, semantic markup, and accessibility features
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class HTMLAccessibilityEnhancer {
    constructor(publicDir = './public') {
        this.publicDir = publicDir;
        this.processedFiles = [];
    }

    async enhanceAllFiles() {
        try {
            const htmlFiles = this.getHTMLFiles(this.publicDir);
            console.log(`Found ${htmlFiles.length} HTML files to process`);

            for (const file of htmlFiles) {
                await this.enhanceFile(file);
            }

            console.log(`Successfully enhanced ${this.processedFiles.length} files`);
            return this.processedFiles;
        } catch (error) {
            console.error('Error enhancing files:', error);
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

    async enhanceFile(filePath) {
        try {
            console.log(`Processing: ${filePath}`);
            
            const html = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(html);
            const document = dom.window.document;

            // Apply all enhancements
            this.addAccessibilityCSS(document);
            this.addAccessibilityScript(document);
            this.enhanceSemanticStructure(document);
            this.enhanceNavigation(document);
            this.enhanceImages(document);
            this.enhanceButtons(document);
            this.enhanceForms(document);
            this.addSkipNavigation(document);
            this.addLandmarkRoles(document);
            this.enhanceHeadings(document);
            this.enhanceLinks(document);

            // Write the enhanced HTML back to file
            const enhancedHTML = dom.serialize();
            fs.writeFileSync(filePath, enhancedHTML, 'utf8');
            
            this.processedFiles.push(filePath);
            console.log(`✓ Enhanced: ${filePath}`);
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error);
        }
    }

    addAccessibilityCSS(document) {
        // Check if accessibility CSS is already included
        const existingLink = document.querySelector('link[href*="accessibility.css"]');
        if (existingLink) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/accessibility.css';
        document.head.appendChild(link);
    }

    addAccessibilityScript(document) {
        // Check if accessibility script is already included
        const existingScript = document.querySelector('script[src*="accessibility-enhancer.js"]');
        if (existingScript) return;

        const script = document.createElement('script');
        script.src = '../scripts/accessibility-enhancer.js';
        script.defer = true;
        document.body.appendChild(script);
    }

    addSkipNavigation(document) {
        // Check if skip navigation already exists
        if (document.querySelector('.skip-navigation')) return;

        const skipNav = document.createElement('div');
        skipNav.className = 'skip-navigation';
        skipNav.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
            <a href="#footer" class="skip-link">Skip to footer</a>
        `;

        // Insert at the beginning of body
        document.body.insertBefore(skipNav, document.body.firstChild);
    }

    enhanceSemanticStructure(document) {
        // Add main landmark if not exists
        let main = document.querySelector('main');
        if (!main) {
            const content = document.querySelector('.contolib-slider-area, .main-content, .container');
            if (content && !content.closest('header') && !content.closest('footer')) {
                const mainElement = document.createElement('main');
                mainElement.id = 'main-content';
                mainElement.setAttribute('role', 'main');
                
                // Wrap the content
                content.parentNode.insertBefore(mainElement, content);
                mainElement.appendChild(content);
            }
        } else {
            main.id = 'main-content';
            main.setAttribute('role', 'main');
        }

        // Enhance header
        const header = document.querySelector('header, .header-area');
        if (header) {
            header.setAttribute('role', 'banner');
        }

        // Enhance footer
        const footer = document.querySelector('footer, .footer-area');
        if (footer) {
            footer.setAttribute('role', 'contentinfo');
            footer.id = 'footer';
        }
    }

    enhanceNavigation(document) {
        // Main navigation
        const mainNav = document.querySelector('.navbar-nav, nav ul');
        if (mainNav) {
            mainNav.setAttribute('role', 'navigation');
            mainNav.setAttribute('aria-label', 'Main navigation');
            mainNav.id = 'navigation';
        }

        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link, nav a');
        navLinks.forEach((link, index) => {
            if (!link.getAttribute('aria-label')) {
                const text = link.textContent.trim();
                if (text) {
                    link.setAttribute('aria-label', `Navigate to ${text}`);
                }
            }

            // Handle dropdown toggles
            if (link.classList.contains('dropdown-toggle') || link.querySelector('.bx-chevrons-down')) {
                link.setAttribute('aria-haspopup', 'true');
                link.setAttribute('aria-expanded', 'false');
                
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
        const mobileToggle = document.querySelector('.navbar-toggler, .mobile-nav, [data-bs-toggle="collapse"]');
        if (mobileToggle) {
            mobileToggle.setAttribute('aria-label', 'Toggle mobile navigation menu');
            mobileToggle.setAttribute('aria-expanded', 'false');
        }

        // Social media links
        const socialLinks = document.querySelectorAll('.social-list a, .social-icon a');
        socialLinks.forEach(link => {
            const icon = link.querySelector('i');
            if (icon) {
                const platform = this.getSocialPlatform(icon.className);
                link.setAttribute('aria-label', `Visit our ${platform} page (opens in new tab)`);
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

    enhanceImages(document) {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Skip if already has proper alt text
            if (img.alt && img.alt.trim() !== '' && img.alt !== 'Image') {
                return;
            }

            // Generate appropriate alt text
            const context = this.getImageContext(img, document);
            img.alt = context;

            // Add role for decorative images
            if (context === '' || img.classList.contains('decorative')) {
                img.setAttribute('role', 'presentation');
                img.setAttribute('aria-hidden', 'true');
            }

            // Handle logo images
            if (img.src.includes('logo') || img.src.includes('Picture1')) {
                img.alt = 'Stone OnePoint Solutions Pvt. Ltd. Logo';
            }
        });
    }

    getImageContext(img, document) {
        // Try to get context from parent elements
        const parent = img.closest('.single-opportunity, .partners-item, .single-company, .contolib-slider-item');
        if (parent) {
            const heading = parent.querySelector('h1, h2, h3, h4, h5, h6');
            if (heading) {
                return `Image for ${heading.textContent.trim()}`;
            }
        }

        // Check for nearby headings
        const nearbyHeading = img.parentElement.querySelector('h1, h2, h3, h4, h5, h6');
        if (nearbyHeading) {
            return `Image related to ${nearbyHeading.textContent.trim()}`;
        }

        // Check data attributes or classes for context
        if (img.dataset.alt) return img.dataset.alt;
        if (img.className.includes('logo')) return 'Company logo';
        if (img.className.includes('hero')) return 'Hero banner image';

        // Default based on file path
        if (img.src.includes('slider')) return 'Hero banner image';
        if (img.src.includes('opportunity')) return 'Service illustration';
        if (img.src.includes('client') || img.src.includes('company')) return 'Client company logo';
        if (img.src.includes('team')) return 'Team member photo';
        
        return 'Decorative image';
    }

    enhanceButtons(document) {
        const buttons = document.querySelectorAll('button, .btn, .default-btn, [role="button"]');
        buttons.forEach(button => {
            // Ensure proper role
            if (button.tagName !== 'BUTTON') {
                button.setAttribute('role', 'button');
                if (!button.hasAttribute('tabindex')) {
                    button.setAttribute('tabindex', '0');
                }
            }

            // Add aria-label if missing and no text content
            if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
                if (button.classList.contains('close')) {
                    button.setAttribute('aria-label', 'Close');
                } else if (button.dataset.bsToggle === 'modal') {
                    button.setAttribute('aria-label', 'Open menu');
                } else {
                    button.setAttribute('aria-label', 'Interactive button');
                }
            }

            // Handle modal toggles
            if (button.dataset.bsToggle === 'modal') {
                const targetModal = document.querySelector(button.dataset.bsTarget);
                if (targetModal) {
                    button.setAttribute('aria-controls', targetModal.id);
                }
            }
        });

        // Close buttons
        const closeButtons = document.querySelectorAll('.close, [data-bs-dismiss]');
        closeButtons.forEach(button => {
            button.setAttribute('aria-label', 'Close dialog');
        });
    }

    enhanceForms(document) {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.setAttribute('role', 'form');

            // Form inputs
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                // Ensure all inputs have labels or aria-label
                if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
                    const label = form.querySelector(`label[for="${input.id}"]`);
                    if (!label && input.placeholder) {
                        input.setAttribute('aria-label', input.placeholder);
                    } else if (!label && input.name) {
                        input.setAttribute('aria-label', input.name.replace(/[-_]/g, ' '));
                    }
                }

                // Required field indicators
                if (input.required || input.hasAttribute('required')) {
                    input.setAttribute('aria-required', 'true');
                }

                // Add proper input types
                if (input.type === 'text' && input.name.includes('email')) {
                    input.type = 'email';
                }
                if (input.type === 'text' && input.name.includes('phone')) {
                    input.type = 'tel';
                }
            });
        });
    }

    addLandmarkRoles(document) {
        // Navigation landmarks
        const navElements = document.querySelectorAll('nav, .navbar, .navigation');
        navElements.forEach(nav => {
            if (!nav.getAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }
        });

        // Search landmarks
        const searchElements = document.querySelectorAll('.search, [type="search"]');
        searchElements.forEach(search => {
            const searchContainer = search.closest('form, div');
            if (searchContainer && !searchContainer.getAttribute('role')) {
                searchContainer.setAttribute('role', 'search');
            }
        });

        // Complementary content (sidebars, etc.)
        const sidebars = document.querySelectorAll('.sidebar, .aside, aside');
        sidebars.forEach(sidebar => {
            sidebar.setAttribute('role', 'complementary');
        });
    }

    enhanceHeadings(document) {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let h1Count = 0;

        headings.forEach(heading => {
            if (heading.tagName === 'H1') {
                h1Count++;
                // Ensure only one H1 per page
                if (h1Count > 1) {
                    console.warn(`Multiple H1 tags found in document. Consider using H2 for: ${heading.textContent}`);
                }
            }

            // Add IDs for anchor links if missing
            if (!heading.id && heading.textContent.trim()) {
                const id = heading.textContent.trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                if (id && !document.getElementById(id)) {
                    heading.id = id;
                }
            }
        });
    }

    enhanceLinks(document) {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            // External links
            if (link.href && (link.href.startsWith('http') && !link.href.includes(document.location.hostname))) {
                if (!link.getAttribute('rel')) {
                    link.setAttribute('rel', 'noopener noreferrer');
                }
                
                // Add screen reader text for external links
                if (!link.querySelector('.sr-only')) {
                    const srText = document.createElement('span');
                    srText.className = 'sr-only';
                    srText.textContent = ' (opens in new tab)';
                    link.appendChild(srText);
                }
            }

            // Email links
            if (link.href && link.href.startsWith('mailto:')) {
                if (!link.getAttribute('aria-label')) {
                    const email = link.href.replace('mailto:', '');
                    link.setAttribute('aria-label', `Send email to ${email}`);
                }
            }

            // Phone links
            if (link.href && link.href.startsWith('tel:')) {
                if (!link.getAttribute('aria-label')) {
                    const phone = link.href.replace('tel:', '');
                    link.setAttribute('aria-label', `Call ${phone}`);
                }
            }

            // Links without href (should be buttons)
            if (!link.href && !link.getAttribute('role')) {
                link.setAttribute('role', 'button');
                link.setAttribute('tabindex', '0');
            }
        });
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HTMLAccessibilityEnhancer;
}

// Run if called directly
if (require.main === module) {
    const enhancer = new HTMLAccessibilityEnhancer();
    enhancer.enhanceAllFiles()
        .then(files => {
            console.log('\n✅ Accessibility enhancement completed successfully!');
            console.log(`Enhanced ${files.length} HTML files`);
        })
        .catch(error => {
            console.error('\n❌ Error during accessibility enhancement:', error);
            process.exit(1);
        });
}