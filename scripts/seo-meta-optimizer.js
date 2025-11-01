#!/usr/bin/env node

/**
 * SEO Meta Tags and Page Structure Optimizer
 * 
 * This script optimizes meta tags and page structure for all HTML files:
 * - Optimizes title tags to 60 characters maximum
 * - Optimizes meta descriptions to 120-160 characters
 * - Ensures proper H1 tag structure (one per page)
 * - Adds canonical URLs to all pages
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class SEOMetaOptimizer {
    constructor(publicDir, baseUrl = 'https://www.stoneonepointsolutions.in') {
        this.publicDir = publicDir;
        this.baseUrl = baseUrl;
        this.processedFiles = [];
        this.errors = [];
        
        // SEO configuration for different page types
        this.seoConfig = {
            'index.html': {
                title: 'Stone OnePoint Solutions Pvt. Ltd. - Leading HR Solutions',
                description: 'India\'s premier HR solutions partner. Expert temporary staffing, permanent recruitment, payroll management, and training services across Mumbai, Bangalore, Delhi.',
                h1: 'Leading HR Solutions Provider in India'
            },
            'company-profile.html': {
                title: 'Company Profile - Stone OnePoint Solutions Pvt. Ltd.',
                description: 'Learn about Stone OnePoint Solutions Pvt. Ltd. - India\'s premier HR solutions partner. Discover our vision, mission, values, and comprehensive HR services.',
                h1: 'About Stone OnePoint Solutions Pvt. Ltd.'
            },
            'contact.html': {
                title: 'Contact Us - Stone OnePoint Solutions Pvt. Ltd.',
                description: 'Get in touch with Stone OnePoint Solutions Pvt. Ltd. for professional HR solutions. Contact our offices in Mumbai, Bangalore, Delhi, Kolkata, and Noida.',
                h1: 'Contact Stone OnePoint Solutions'
            },
            'clients.html': {
                title: 'Our Clients - Stone OnePoint Solutions Pvt. Ltd.',
                description: 'Discover the diverse portfolio of clients served by Stone OnePoint Solutions Pvt. Ltd. Trusted by leading companies across various industries.',
                h1: 'Our Valued Clients'
            },
            'temporary-staffing.html': {
                title: 'Temporary Staffing Services - Stone OnePoint Solutions',
                description: 'Professional temporary staffing solutions to meet your workforce demands. Flexible, reliable, and cost-effective staffing services across India.',
                h1: 'Temporary Staffing Services'
            },
            'permanent-recruitment.html': {
                title: 'Permanent Recruitment Services - Stone OnePoint Solutions',
                description: 'Expert permanent recruitment services to find the right talent for your organization. Comprehensive hiring solutions across all industries.',
                h1: 'Permanent Recruitment Services'
            },
            'payroll-outsourcing.html': {
                title: 'Payroll Management Services - Stone OnePoint Solutions',
                description: 'Comprehensive payroll outsourcing and management services. Streamline your payroll processes with our expert solutions.',
                h1: 'Payroll Management Services'
            },
            'training.html': {
                title: 'Training & Development Services - Stone OnePoint Solutions',
                description: 'Professional training and development programs to enhance your workforce skills. Leadership, soft skills, and technical training solutions.',
                h1: 'Training and Development Services'
            },
            'executive-hiring.html': {
                title: 'Executive Hiring Services - Stone OnePoint Solutions',
                description: 'Specialized executive search and hiring services for senior-level positions. Find top-tier talent for your leadership team.',
                h1: 'Executive Hiring Services'
            },
            'bulk-campus-hiring.html': {
                title: 'Bulk & Campus Hiring Services - Stone OnePoint Solutions',
                description: 'Efficient bulk and campus hiring solutions for large-scale recruitment needs. Connect with fresh talent from top institutions.',
                h1: 'Bulk / Campus Hiring Services'
            }
        };
    }

    /**
     * Process all HTML files in the public directory
     */
    async processAllFiles() {
        console.log('🚀 Starting SEO Meta Tags Optimization...\n');
        
        try {
            const files = await this.getHtmlFiles();
            console.log(`📁 Found ${files.length} HTML files to process\n`);
            
            for (const file of files) {
                await this.processFile(file);
            }
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Error processing files:', error.message);
            process.exit(1);
        }
    }

    /**
     * Get all HTML files from the public directory
     */
    async getHtmlFiles() {
        const files = [];
        const entries = await fs.promises.readdir(this.publicDir);
        
        for (const entry of entries) {
            const fullPath = path.join(this.publicDir, entry);
            const stat = await fs.promises.stat(fullPath);
            
            if (stat.isFile() && entry.endsWith('.html')) {
                // Skip error pages and non-content files
                if (!this.shouldSkipFile(entry)) {
                    files.push(entry);
                }
            }
        }
        
        return files.sort();
    }

    /**
     * Check if file should be skipped
     */
    shouldSkipFile(filename) {
        const skipPatterns = [
            /^\d+\.html$/,  // Numbered files like 1.html, 2.html
            /^(bg|shape|section-shape|right-img|help-img|experience-img|download-img|quote-here-img|what-do-img|popular-posts-\d+|owl\.video\.play)\.html$/,
            /^(fade|backblue)\.html$/
        ];
        
        return skipPatterns.some(pattern => pattern.test(filename));
    }

    /**
     * Process individual HTML file
     */
    async processFile(filename) {
        const filePath = path.join(this.publicDir, filename);
        
        try {
            console.log(`📄 Processing: ${filename}`);
            
            const content = await fs.promises.readFile(filePath, 'utf8');
            const dom = new JSDOM(content);
            const document = dom.window.document;
            
            let modified = false;
            
            // Optimize title tag
            if (this.optimizeTitle(document, filename)) {
                modified = true;
            }
            
            // Optimize meta description
            if (this.optimizeMetaDescription(document, filename)) {
                modified = true;
            }
            
            // Add canonical URL
            if (this.addCanonicalUrl(document, filename)) {
                modified = true;
            }
            
            // Optimize H1 structure
            if (this.optimizeH1Structure(document, filename)) {
                modified = true;
            }
            
            // Save changes if any modifications were made
            if (modified) {
                const optimizedContent = dom.serialize();
                await fs.promises.writeFile(filePath, optimizedContent, 'utf8');
                console.log(`  ✅ Optimized and saved`);
            } else {
                console.log(`  ℹ️  No changes needed`);
            }
            
            this.processedFiles.push({
                filename,
                modified,
                status: 'success'
            });
            
        } catch (error) {
            console.error(`  ❌ Error processing ${filename}:`, error.message);
            this.errors.push({
                filename,
                error: error.message
            });
        }
        
        console.log(''); // Empty line for readability
    }

    /**
     * Optimize title tag to 60 characters maximum
     */
    optimizeTitle(document, filename) {
        let titleElement = document.querySelector('title');
        let modified = false;
        
        if (!titleElement) {
            titleElement = document.createElement('title');
            document.head.appendChild(titleElement);
            modified = true;
        }
        
        const currentTitle = titleElement.textContent.trim();
        let newTitle = currentTitle;
        
        // Use predefined title if available
        if (this.seoConfig[filename]) {
            newTitle = this.seoConfig[filename].title;
        } else if (currentTitle.length > 60) {
            // Truncate and add ellipsis if too long
            newTitle = currentTitle.substring(0, 57) + '...';
        } else if (!currentTitle || currentTitle.length < 10) {
            // Generate title from filename if missing or too short
            newTitle = this.generateTitleFromFilename(filename);
        }
        
        if (newTitle !== currentTitle) {
            titleElement.textContent = newTitle;
            console.log(`    📝 Title: "${newTitle}" (${newTitle.length} chars)`);
            modified = true;
        }
        
        return modified;
    }

    /**
     * Optimize meta description to 120-160 characters
     */
    optimizeMetaDescription(document, filename) {
        let metaDesc = document.querySelector('meta[name="description"]');
        let modified = false;
        
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
            modified = true;
        }
        
        const currentDesc = metaDesc.getAttribute('content') || '';
        let newDesc = currentDesc;
        
        // Use predefined description if available
        if (this.seoConfig[filename]) {
            newDesc = this.seoConfig[filename].description;
        } else if (currentDesc.length > 160) {
            // Truncate if too long
            newDesc = currentDesc.substring(0, 157) + '...';
        } else if (!currentDesc || currentDesc.length < 120) {
            // Generate description if missing or too short
            newDesc = this.generateDescriptionFromFilename(filename);
        }
        
        if (newDesc !== currentDesc) {
            metaDesc.setAttribute('content', newDesc);
            console.log(`    📄 Description: "${newDesc}" (${newDesc.length} chars)`);
            modified = true;
        }
        
        return modified;
    }

    /**
     * Add canonical URL to all pages
     */
    addCanonicalUrl(document, filename) {
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        let modified = false;
        
        const canonicalUrl = `${this.baseUrl}/${filename}`;
        
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
            modified = true;
        }
        
        const currentHref = canonicalLink.getAttribute('href');
        if (currentHref !== canonicalUrl) {
            canonicalLink.setAttribute('href', canonicalUrl);
            console.log(`    🔗 Canonical URL: ${canonicalUrl}`);
            modified = true;
        }
        
        return modified;
    }

    /**
     * Ensure proper H1 tag structure (one per page)
     */
    optimizeH1Structure(document, filename) {
        const h1Elements = document.querySelectorAll('h1');
        let modified = false;
        
        if (h1Elements.length === 0) {
            // Add H1 if missing
            const h1 = document.createElement('h1');
            const h1Text = this.seoConfig[filename]?.h1 || this.generateH1FromFilename(filename);
            h1.textContent = h1Text;
            
            // Try to insert after page title or at the beginning of main content
            const mainContent = document.querySelector('main, .container, .page-title-content, .header-content-right');
            if (mainContent) {
                mainContent.insertBefore(h1, mainContent.firstChild);
            } else {
                // Fallback: add to body
                document.body.insertBefore(h1, document.body.firstChild);
            }
            
            console.log(`    📌 Added H1: "${h1Text}"`);
            modified = true;
            
        } else if (h1Elements.length > 1) {
            // Convert extra H1s to H2s
            for (let i = 1; i < h1Elements.length; i++) {
                const h1 = h1Elements[i];
                const h2 = document.createElement('h2');
                h2.innerHTML = h1.innerHTML;
                
                // Copy attributes
                for (const attr of h1.attributes) {
                    h2.setAttribute(attr.name, attr.value);
                }
                
                h1.parentNode.replaceChild(h2, h1);
                console.log(`    🔄 Converted extra H1 to H2: "${h2.textContent}"`);
                modified = true;
            }
        }
        
        // Update main H1 if we have a predefined one
        if (h1Elements.length > 0 && this.seoConfig[filename]?.h1) {
            const mainH1 = h1Elements[0];
            const newH1Text = this.seoConfig[filename].h1;
            
            if (mainH1.textContent.trim() !== newH1Text) {
                mainH1.textContent = newH1Text;
                console.log(`    📝 Updated H1: "${newH1Text}"`);
                modified = true;
            }
        }
        
        return modified;
    }

    /**
     * Generate title from filename
     */
    generateTitleFromFilename(filename) {
        const baseName = filename.replace('.html', '');
        const words = baseName.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        );
        return `${words.join(' ')} - Stone OnePoint Solutions Pvt. Ltd.`;
    }

    /**
     * Generate description from filename
     */
    generateDescriptionFromFilename(filename) {
        const baseName = filename.replace('.html', '');
        const service = baseName.split('-').join(' ');
        return `Professional ${service} services by Stone OnePoint Solutions Pvt. Ltd. Expert HR solutions across Mumbai, Bangalore, Delhi, Kolkata, and Noida.`;
    }

    /**
     * Generate H1 from filename
     */
    generateH1FromFilename(filename) {
        const baseName = filename.replace('.html', '');
        const words = baseName.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        );
        return words.join(' ');
    }

    /**
     * Generate optimization report
     */
    generateReport() {
        console.log('📊 SEO Meta Tags Optimization Report');
        console.log('=====================================\n');
        
        const successful = this.processedFiles.filter(f => f.status === 'success');
        const modified = successful.filter(f => f.modified);
        
        console.log(`✅ Successfully processed: ${successful.length} files`);
        console.log(`🔧 Modified: ${modified.length} files`);
        console.log(`❌ Errors: ${this.errors.length} files\n`);
        
        if (modified.length > 0) {
            console.log('📝 Modified Files:');
            modified.forEach(file => {
                console.log(`  • ${file.filename}`);
            });
            console.log('');
        }
        
        if (this.errors.length > 0) {
            console.log('❌ Errors:');
            this.errors.forEach(error => {
                console.log(`  • ${error.filename}: ${error.error}`);
            });
            console.log('');
        }
        
        console.log('🎉 SEO Meta Tags optimization completed!\n');
        
        // Save report to file
        const reportPath = path.join(this.publicDir, '../docs/seo-optimization-report.md');
        this.saveReportToFile(reportPath);
    }

    /**
     * Save detailed report to markdown file
     */
    async saveReportToFile(reportPath) {
        const report = `# SEO Meta Tags Optimization Report

Generated on: ${new Date().toISOString()}

## Summary

- **Total files processed:** ${this.processedFiles.length}
- **Files modified:** ${this.processedFiles.filter(f => f.modified).length}
- **Errors encountered:** ${this.errors.length}

## Optimizations Applied

### Title Tags
- Optimized to maximum 60 characters
- Added descriptive, keyword-rich titles
- Ensured brand consistency

### Meta Descriptions
- Optimized to 120-160 characters range
- Added compelling, descriptive content
- Included relevant keywords and locations

### Canonical URLs
- Added canonical URLs to all pages
- Prevents duplicate content issues
- Improves SEO ranking

### H1 Structure
- Ensured one H1 per page
- Converted multiple H1s to H2s
- Added missing H1 tags where needed

## Modified Files

${this.processedFiles.filter(f => f.modified).map(f => `- ${f.filename}`).join('\n')}

## Errors

${this.errors.length > 0 ? this.errors.map(e => `- ${e.filename}: ${e.error}`).join('\n') : 'No errors encountered.'}

## Next Steps

1. Review the optimized meta tags for accuracy
2. Test pages for proper SEO structure
3. Validate HTML markup
4. Submit updated sitemap to search engines
`;

        try {
            await fs.promises.writeFile(reportPath, report, 'utf8');
            console.log(`📄 Detailed report saved to: ${reportPath}`);
        } catch (error) {
            console.error('❌ Error saving report:', error.message);
        }
    }
}

// Main execution
if (require.main === module) {
    const publicDir = path.join(__dirname, '../public');
    const optimizer = new SEOMetaOptimizer(publicDir);
    
    optimizer.processAllFiles().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = SEOMetaOptimizer;