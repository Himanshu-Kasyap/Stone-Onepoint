#!/usr/bin/env node

/**
 * Automated Link Checker
 * Validates all internal and external links on the website
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');

class LinkChecker {
    constructor() {
        this.publicDir = path.join(__dirname, '../../public');
        this.contentDir = path.join(__dirname, '..');
        this.results = {
            internal: { checked: 0, broken: 0, links: [] },
            external: { checked: 0, broken: 0, links: [] },
            anchors: { checked: 0, broken: 0, links: [] }
        };
        this.checkedUrls = new Map(); // Cache for external URL checks
        this.timeout = 10000; // 10 second timeout
    }

    async checkAllLinks() {
        console.log('🔗 Starting comprehensive link check...\n');
        
        const htmlFiles = this.getHTMLFiles(this.publicDir);
        
        for (const file of htmlFiles) {
            console.log(`Checking links in: ${path.basename(file)}`);
            await this.checkLinksInFile(file);
        }
        
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

    async checkLinksInFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(content);
            const document = dom.window.document;
            const fileName = path.basename(filePath);
            
            const links = document.querySelectorAll('a[href]');
            
            for (const link of links) {
                const href = link.getAttribute('href').trim();
                if (!href) continue;
                
                await this.checkLink(href, fileName, link.textContent.trim());
            }
            
            // Check image sources
            const images = document.querySelectorAll('img[src]');
            for (const img of images) {
                const src = img.getAttribute('src').trim();
                if (!src) continue;
                
                await this.checkImageLink(src, fileName, img.getAttribute('alt') || 'No alt text');
            }
            
        } catch (error) {
            console.error(`Error checking links in ${filePath}:`, error.message);
        }
    }

    async checkLink(href, fileName, linkText) {
        // Skip certain types of links
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
            return;
        }
        
        if (href.startsWith('#')) {
            // Anchor link
            await this.checkAnchorLink(href, fileName, linkText);
        } else if (href.startsWith('http://') || href.startsWith('https://')) {
            // External link
            await this.checkExternalLink(href, fileName, linkText);
        } else {
            // Internal link
            await this.checkInternalLink(href, fileName, linkText);
        }
    }

    async checkInternalLink(href, fileName, linkText) {
        this.results.internal.checked++;
        
        // Remove query parameters and anchors for file checking
        const cleanHref = href.split('?')[0].split('#')[0];
        let targetPath;
        
        if (cleanHref.startsWith('/')) {
            targetPath = path.join(this.publicDir, cleanHref.substring(1));
        } else {
            targetPath = path.join(this.publicDir, cleanHref);
        }
        
        // Check if file exists
        if (!fs.existsSync(targetPath)) {
            this.results.internal.broken++;
            this.results.internal.links.push({
                file: fileName,
                url: href,
                text: linkText,
                status: 'File not found',
                type: 'internal'
            });
        }
    }

    async checkExternalLink(href, fileName, linkText) {
        this.results.external.checked++;
        
        // Check cache first
        if (this.checkedUrls.has(href)) {
            const cachedResult = this.checkedUrls.get(href);
            if (!cachedResult.success) {
                this.results.external.broken++;
                this.results.external.links.push({
                    file: fileName,
                    url: href,
                    text: linkText,
                    status: cachedResult.error,
                    type: 'external'
                });
            }
            return;
        }
        
        try {
            const success = await this.makeHttpRequest(href);
            this.checkedUrls.set(href, { success, error: null });
        } catch (error) {
            this.results.external.broken++;
            this.checkedUrls.set(href, { success: false, error: error.message });
            this.results.external.links.push({
                file: fileName,
                url: href,
                text: linkText,
                status: error.message,
                type: 'external'
            });
        }
    }

    async checkImageLink(src, fileName, altText) {
        // Similar to internal link checking but for images
        let targetPath;
        
        if (src.startsWith('http://') || src.startsWith('https://')) {
            // External image - check if accessible
            try {
                await this.makeHttpRequest(src);
            } catch (error) {
                this.results.internal.broken++;
                this.results.internal.links.push({
                    file: fileName,
                    url: src,
                    text: `Image: ${altText}`,
                    status: `External image error: ${error.message}`,
                    type: 'image'
                });
            }
        } else {
            // Internal image
            this.results.internal.checked++;
            
            if (src.startsWith('/')) {
                targetPath = path.join(this.publicDir, src.substring(1));
            } else {
                targetPath = path.join(this.publicDir, src);
            }
            
            if (!fs.existsSync(targetPath)) {
                this.results.internal.broken++;
                this.results.internal.links.push({
                    file: fileName,
                    url: src,
                    text: `Image: ${altText}`,
                    status: 'Image file not found',
                    type: 'image'
                });
            }
        }
    }

    async checkAnchorLink(href, fileName, linkText) {
        this.results.anchors.checked++;
        
        // For anchor links, we need to check if the target element exists
        // This is a simplified check - in a real scenario, you'd need to parse the target file
        const anchorId = href.substring(1);
        
        try {
            const filePath = path.join(this.publicDir, fileName);
            const content = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(content);
            const document = dom.window.document;
            
            const targetElement = document.getElementById(anchorId) || 
                                document.querySelector(`[name="${anchorId}"]`);
            
            if (!targetElement) {
                this.results.anchors.broken++;
                this.results.anchors.links.push({
                    file: fileName,
                    url: href,
                    text: linkText,
                    status: 'Anchor target not found',
                    type: 'anchor'
                });
            }
        } catch (error) {
            // If we can't check the anchor, mark it as potentially broken
            this.results.anchors.broken++;
            this.results.anchors.links.push({
                file: fileName,
                url: href,
                text: linkText,
                status: `Cannot verify anchor: ${error.message}`,
                type: 'anchor'
            });
        }
    }

    makeHttpRequest(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const options = {
                method: 'HEAD', // Use HEAD to avoid downloading content
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
                }
            };
            
            const req = client.request(url, options, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    resolve(true);
                } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    // Follow redirects (simplified)
                    resolve(true);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.end();
        });
    }

    generateReport() {
        console.log('\n🔗 Link Check Report');
        console.log('='.repeat(50));
        
        const totalChecked = this.results.internal.checked + this.results.external.checked + this.results.anchors.checked;
        const totalBroken = this.results.internal.broken + this.results.external.broken + this.results.anchors.broken;
        
        console.log(`\n📊 Summary:`);
        console.log(`   Total links checked: ${totalChecked}`);
        console.log(`   Broken links found: ${totalBroken}`);
        console.log(`   Success rate: ${((totalChecked - totalBroken) / totalChecked * 100).toFixed(1)}%`);
        
        console.log(`\n📋 Breakdown:`);
        console.log(`   Internal links: ${this.results.internal.checked} checked, ${this.results.internal.broken} broken`);
        console.log(`   External links: ${this.results.external.checked} checked, ${this.results.external.broken} broken`);
        console.log(`   Anchor links: ${this.results.anchors.checked} checked, ${this.results.anchors.broken} broken`);
        
        // Show broken links
        const allBrokenLinks = [
            ...this.results.internal.links,
            ...this.results.external.links,
            ...this.results.anchors.links
        ];
        
        if (allBrokenLinks.length > 0) {
            console.log(`\n❌ Broken Links (${allBrokenLinks.length}):`);
            allBrokenLinks.forEach((link, index) => {
                console.log(`\n${index + 1}. ${link.file}`);
                console.log(`   URL: ${link.url}`);
                console.log(`   Text: "${link.text}"`);
                console.log(`   Error: ${link.status}`);
                console.log(`   Type: ${link.type}`);
            });
        } else {
            console.log('\n✅ No broken links found!');
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalChecked,
                totalBroken,
                successRate: ((totalChecked - totalBroken) / totalChecked * 100).toFixed(1)
            },
            breakdown: this.results,
            brokenLinks: allBrokenLinks
        };
        
        const reportPath = path.join(this.contentDir, 'validation/link-check-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Exit with error code if there are broken links
        if (totalBroken > 0) {
            process.exit(1);
        }
    }

    async checkSingleUrl(url) {
        console.log(`🔗 Checking single URL: ${url}`);
        
        try {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                await this.makeHttpRequest(url);
                console.log('✅ URL is accessible');
            } else {
                // Internal URL
                const targetPath = path.join(this.publicDir, url.startsWith('/') ? url.substring(1) : url);
                if (fs.existsSync(targetPath)) {
                    console.log('✅ File exists');
                } else {
                    console.log('❌ File not found');
                    process.exit(1);
                }
            }
        } catch (error) {
            console.log(`❌ URL check failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// CLI interface
if (require.main === module) {
    const checker = new LinkChecker();
    const command = process.argv[2];
    const url = process.argv[3];
    
    if (command === 'check' && url) {
        checker.checkSingleUrl(url);
    } else {
        checker.checkAllLinks();
    }
}

module.exports = LinkChecker;