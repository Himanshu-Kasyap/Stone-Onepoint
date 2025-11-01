#!/usr/bin/env node

/**
 * SEO Supporting Files Generator
 * 
 * This script generates SEO supporting files and adds social media meta tags:
 * - Create XML sitemap with all pages and proper priorities
 * - Generate robots.txt file with appropriate directives
 * - Implement Open Graph meta tags for social sharing
 * - Add Twitter Card meta tags
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class SEOSupportingFilesGenerator {
    constructor(publicDir, baseUrl = 'https://www.stoneonepointsolutions.in') {
        this.publicDir = publicDir;
        this.baseUrl = baseUrl;
        this.processedFiles = [];
        this.errors = [];
        
        // Page priorities and change frequencies for sitemap
        this.sitemapConfig = {
            'index.html': { priority: 1.0, changefreq: 'weekly' },
            'company-profile.html': { priority: 0.9, changefreq: 'monthly' },
            'contact.html': { priority: 0.9, changefreq: 'monthly' },
            'clients.html': { priority: 0.8, changefreq: 'monthly' },
            'temporary-staffing.html': { priority: 0.8, changefreq: 'monthly' },
            'permanent-recruitment.html': { priority: 0.8, changefreq: 'monthly' },
            'payroll-outsourcing.html': { priority: 0.8, changefreq: 'monthly' },
            'training.html': { priority: 0.8, changefreq: 'monthly' },
            'executive-hiring.html': { priority: 0.8, changefreq: 'monthly' },
            'bulk-campus-hiring.html': { priority: 0.8, changefreq: 'monthly' },
            'leadership.html': { priority: 0.7, changefreq: 'monthly' },
            'information-technology.html': { priority: 0.7, changefreq: 'monthly' }
        };
        
        // Default values for pages not in config
        this.defaultSitemapConfig = { priority: 0.6, changefreq: 'monthly' };
        
        // Social media configuration
        this.socialConfig = {
            siteName: 'Stone OnePoint Solutions Pvt. Ltd.',
            twitterHandle: '@stoneonepointsolutions',
            fbAppId: '', // Add if available
            defaultImage: 'https://www.stoneonepointsolutions.in/assets/img/logo-og.png',
            defaultDescription: 'India\'s premier HR solutions partner providing temporary staffing, permanent recruitment, payroll management, and training services.'
        };
    }

    /**
     * Generate all SEO supporting files
     */
    async generateAllFiles() {
        console.log('🚀 Starting SEO Supporting Files Generation...\n');
        
        try {
            // Get all HTML files
            const htmlFiles = await this.getHtmlFiles();
            console.log(`📁 Found ${htmlFiles.length} HTML files\n`);
            
            // Generate XML sitemap
            await this.generateXMLSitemap(htmlFiles);
            
            // Generate robots.txt
            await this.generateRobotsTxt();
            
            // Add social media meta tags to HTML files
            await this.addSocialMediaMetaTags(htmlFiles);
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Error generating files:', error.message);
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
     * Generate XML sitemap
     */
    async generateXMLSitemap(htmlFiles) {
        console.log('📄 Generating XML sitemap...');
        
        const currentDate = new Date().toISOString().split('T')[0];
        
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

        for (const file of htmlFiles) {
            const config = this.sitemapConfig[file] || this.defaultSitemapConfig;
            const url = `${this.baseUrl}/${file}`;
            
            sitemap += `  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${config.changefreq}</changefreq>
    <priority>${config.priority}</priority>
  </url>
`;
        }
        
        sitemap += `</urlset>`;
        
        const sitemapPath = path.join(this.publicDir, 'sitemap.xml');
        await fs.promises.writeFile(sitemapPath, sitemap, 'utf8');
        
        console.log(`  ✅ XML sitemap created with ${htmlFiles.length} URLs`);
        console.log(`  📍 Saved to: sitemap.xml\n`);
        
        return sitemapPath;
    }

    /**
     * Generate robots.txt file
     */
    async generateRobotsTxt() {
        console.log('🤖 Generating robots.txt...');
        
        const robotsTxt = `# Robots.txt for Stone OnePoint Solutions Pvt. Ltd.
# Generated on ${new Date().toISOString()}

User-agent: *
Allow: /

# Disallow admin and private directories
Disallow: /admin/
Disallow: /private/
Disallow: /temp/
Disallow: /.git/
Disallow: /node_modules/

# Disallow search and filter pages to prevent duplicate content
Disallow: /search
Disallow: /*?*

# Allow important directories
Allow: /assets/
Allow: /images/
Allow: /css/
Allow: /js/

# Sitemap location
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay (optional - be respectful to search engines)
Crawl-delay: 1

# Specific rules for major search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

# Block known bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /
`;

        const robotsPath = path.join(this.publicDir, 'robots.txt');
        await fs.promises.writeFile(robotsPath, robotsTxt, 'utf8');
        
        console.log('  ✅ robots.txt created');
        console.log(`  📍 Saved to: robots.txt\n`);
        
        return robotsPath;
    }

    /**
     * Add social media meta tags to HTML files
     */
    async addSocialMediaMetaTags(htmlFiles) {
        console.log('📱 Adding social media meta tags to HTML files...\n');
        
        for (const file of htmlFiles) {
            await this.processFileForSocialTags(file);
        }
    }

    /**
     * Process individual HTML file for social media tags
     */
    async processFileForSocialTags(filename) {
        const filePath = path.join(this.publicDir, filename);
        
        try {
            console.log(`📄 Processing: ${filename}`);
            
            const content = await fs.promises.readFile(filePath, 'utf8');
            const dom = new JSDOM(content);
            const document = dom.window.document;
            
            let modified = false;
            
            // Get page information
            const pageInfo = this.getPageInfo(document, filename);
            
            // Add Open Graph meta tags
            if (this.addOpenGraphTags(document, pageInfo)) {
                modified = true;
            }
            
            // Add Twitter Card meta tags
            if (this.addTwitterCardTags(document, pageInfo)) {
                modified = true;
            }
            
            // Add additional social meta tags
            if (this.addAdditionalSocialTags(document, pageInfo)) {
                modified = true;
            }
            
            // Save changes if any modifications were made
            if (modified) {
                const optimizedContent = dom.serialize();
                await fs.promises.writeFile(filePath, optimizedContent, 'utf8');
                console.log(`  ✅ Added social media meta tags`);
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
     * Extract page information for social tags
     */
    getPageInfo(document, filename) {
        const titleElement = document.querySelector('title');
        const descElement = document.querySelector('meta[name="description"]');
        const canonicalElement = document.querySelector('link[rel="canonical"]');
        
        const title = titleElement ? titleElement.textContent.trim() : this.generateTitleFromFilename(filename);
        const description = descElement ? descElement.getAttribute('content') : this.socialConfig.defaultDescription;
        const url = canonicalElement ? canonicalElement.getAttribute('href') : `${this.baseUrl}/${filename}`;
        
        return {
            title,
            description,
            url,
            image: this.getPageImage(filename),
            type: this.getPageType(filename)
        };
    }

    /**
     * Get appropriate image for the page
     */
    getPageImage(filename) {
        // You can customize this to return specific images for different pages
        const pageImages = {
            'index.html': 'https://www.stoneonepointsolutions.in/assets/img/hero-banner.jpg',
            'company-profile.html': 'https://www.stoneonepointsolutions.in/assets/img/about-us.jpg',
            'contact.html': 'https://www.stoneonepointsolutions.in/assets/img/contact-us.jpg',
            'clients.html': 'https://www.stoneonepointsolutions.in/assets/img/our-clients.jpg'
        };
        
        return pageImages[filename] || this.socialConfig.defaultImage;
    }

    /**
     * Get page type for Open Graph
     */
    getPageType(filename) {
        if (filename === 'index.html') {
            return 'website';
        }
        return 'article';
    }

    /**
     * Add Open Graph meta tags
     */
    addOpenGraphTags(document, pageInfo) {
        let modified = false;
        
        const ogTags = [
            { property: 'og:title', content: pageInfo.title },
            { property: 'og:description', content: pageInfo.description },
            { property: 'og:url', content: pageInfo.url },
            { property: 'og:type', content: pageInfo.type },
            { property: 'og:image', content: pageInfo.image },
            { property: 'og:image:width', content: '1200' },
            { property: 'og:image:height', content: '630' },
            { property: 'og:site_name', content: this.socialConfig.siteName },
            { property: 'og:locale', content: 'en_US' }
        ];
        
        // Add Facebook App ID if available
        if (this.socialConfig.fbAppId) {
            ogTags.push({ property: 'fb:app_id', content: this.socialConfig.fbAppId });
        }
        
        for (const tag of ogTags) {
            if (this.addOrUpdateMetaTag(document, 'property', tag.property, tag.content)) {
                modified = true;
            }
        }
        
        return modified;
    }

    /**
     * Add Twitter Card meta tags
     */
    addTwitterCardTags(document, pageInfo) {
        let modified = false;
        
        const twitterTags = [
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: pageInfo.title },
            { name: 'twitter:description', content: pageInfo.description },
            { name: 'twitter:image', content: pageInfo.image },
            { name: 'twitter:url', content: pageInfo.url }
        ];
        
        // Add Twitter handle if available
        if (this.socialConfig.twitterHandle) {
            twitterTags.push({ name: 'twitter:site', content: this.socialConfig.twitterHandle });
            twitterTags.push({ name: 'twitter:creator', content: this.socialConfig.twitterHandle });
        }
        
        for (const tag of twitterTags) {
            if (this.addOrUpdateMetaTag(document, 'name', tag.name, tag.content)) {
                modified = true;
            }
        }
        
        return modified;
    }

    /**
     * Add additional social meta tags
     */
    addAdditionalSocialTags(document, pageInfo) {
        let modified = false;
        
        const additionalTags = [
            { name: 'author', content: this.socialConfig.siteName },
            { name: 'publisher', content: this.socialConfig.siteName },
            { property: 'article:publisher', content: 'https://www.facebook.com/stoneonepointsolutions/' },
            { name: 'theme-color', content: '#4a90e2' }
        ];
        
        for (const tag of additionalTags) {
            const attribute = tag.property ? 'property' : 'name';
            const value = tag.property || tag.name;
            if (this.addOrUpdateMetaTag(document, attribute, value, tag.content)) {
                modified = true;
            }
        }
        
        return modified;
    }

    /**
     * Add or update meta tag
     */
    addOrUpdateMetaTag(document, attribute, value, content) {
        let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
        let modified = false;
        
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute(attribute, value);
            document.head.appendChild(metaTag);
            modified = true;
        }
        
        const currentContent = metaTag.getAttribute('content');
        if (currentContent !== content) {
            metaTag.setAttribute('content', content);
            modified = true;
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
     * Generate processing report
     */
    generateReport() {
        console.log('📊 SEO Supporting Files Generation Report');
        console.log('=========================================\n');
        
        const successful = this.processedFiles.filter(f => f.status === 'success');
        const modified = successful.filter(f => f.modified);
        
        console.log(`✅ Successfully processed: ${successful.length} HTML files`);
        console.log(`🔧 Modified: ${modified.length} HTML files`);
        console.log(`📄 Generated: sitemap.xml`);
        console.log(`🤖 Generated: robots.txt`);
        console.log(`❌ Errors: ${this.errors.length} files\n`);
        
        if (modified.length > 0) {
            console.log('📝 Modified Files (Social Media Tags):');
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
        
        console.log('🎉 SEO supporting files generation completed!\n');
        
        // Save report to file
        const reportPath = path.join(this.publicDir, '../docs/seo-supporting-files-report.md');
        this.saveReportToFile(reportPath);
    }

    /**
     * Save detailed report to markdown file
     */
    async saveReportToFile(reportPath) {
        const report = `# SEO Supporting Files Generation Report

Generated on: ${new Date().toISOString()}

## Summary

- **HTML files processed:** ${this.processedFiles.length}
- **Files modified:** ${this.processedFiles.filter(f => f.modified).length}
- **Files generated:** 2 (sitemap.xml, robots.txt)
- **Errors encountered:** ${this.errors.length}

## Generated Files

### XML Sitemap (sitemap.xml)
- Contains ${this.processedFiles.length} URLs
- Includes priority and change frequency for each page
- Follows XML sitemap protocol 0.9
- Accessible at: ${this.baseUrl}/sitemap.xml

### Robots.txt
- Allows all search engines to crawl the site
- Blocks access to admin and private directories
- Includes sitemap location
- Implements crawl delay for respectful crawling
- Blocks known bad bots

## Social Media Meta Tags Added

### Open Graph Tags
- og:title - Page title for social sharing
- og:description - Page description for social sharing
- og:url - Canonical URL of the page
- og:type - Page type (website/article)
- og:image - Featured image for social sharing
- og:site_name - Site name for branding
- og:locale - Content locale

### Twitter Card Tags
- twitter:card - Card type (summary_large_image)
- twitter:title - Title for Twitter sharing
- twitter:description - Description for Twitter sharing
- twitter:image - Image for Twitter sharing
- twitter:url - URL for Twitter sharing

### Additional Tags
- author - Content author
- publisher - Content publisher
- theme-color - Browser theme color
- article:publisher - Facebook page URL

## Modified Files

${this.processedFiles.filter(f => f.modified).map(f => `- ${f.filename}`).join('\n')}

## Errors

${this.errors.length > 0 ? this.errors.map(e => `- ${e.filename}: ${e.error}`).join('\n') : 'No errors encountered.'}

## Validation and Testing

### XML Sitemap
1. Test sitemap at: https://www.xml-sitemaps.com/validate-xml-sitemap.html
2. Submit to Google Search Console
3. Submit to Bing Webmaster Tools

### Robots.txt
1. Test robots.txt at: https://www.google.com/webmasters/tools/robots-testing-tool
2. Validate syntax and rules

### Social Media Tags
1. Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
2. Twitter Card Validator: https://cards-dev.twitter.com/validator
3. LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

## Next Steps

1. Submit sitemap.xml to search engines
2. Test social media sharing on different platforms
3. Monitor search console for crawl errors
4. Update sitemap when new pages are added
5. Review and update robots.txt as needed
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
    const generator = new SEOSupportingFilesGenerator(publicDir);
    
    generator.generateAllFiles().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = SEOSupportingFilesGenerator;