#!/usr/bin/env node

/**
 * Automated Link Checker
 * Validates all internal and external links across the website
 * Generates reports for broken links and provides recommendations
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const https = require('https');
const http = require('http');
const url = require('url');

class LinkChecker {
    constructor(options = {}) {
        this.publicDir = options.publicDir || path.join(__dirname, '../public');
        this.baseUrl = options.baseUrl || 'https://www.stoneonepointsolutions.in';
        this.timeout = options.timeout || 10000;
        this.maxRetries = options.maxRetries || 2;
        this.results = {
            total: 0,
            valid: 0,
            broken: 0,
            warnings: 0,
            links: []
        };
        this.checkedUrls = new Map();
    }

    /**
     * Main function to check all links
     */
    async checkAllLinks() {
        console.log('🔍 Starting comprehensive link check...');
        
        try {
            const htmlFiles = this.getHtmlFiles();
            console.log(`📄 Found ${htmlFiles.length} HTML files to check`);

            for (const file of htmlFiles) {
                await this.checkLinksInFile(file);
            }

            this.generateReport();
            return this.results;
        } catch (error) {
            console.error('❌ Error during link checking:', error.message);
            throw error;
        }
    }

    /**
     * Get all HTML files in the public directory
     */
    getHtmlFiles() {
        const files = [];
        
        const scanDirectory = (dir) => {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (item.endsWith('.html')) {
                    files.push(fullPath);
                }
            }
        };

        scanDirectory(this.publicDir);
        return files;
    }

    /**
     * Check all links in a specific HTML file
     */
    async checkLinksInFile(filePath) {
        const relativePath = path.relative(this.publicDir, filePath);
        console.log(`🔗 Checking links in: ${relativePath}`);

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(content);
            const document = dom.window.document;

            // Check anchor links
            const anchors = document.querySelectorAll('a[href]');
            for (const anchor of anchors) {
                await this.checkLink(anchor.href, filePath, 'anchor');
            }

            // Check image sources
            const images = document.querySelectorAll('img[src]');
            for (const img of images) {
                await this.checkLink(img.src, filePath, 'image');
            }

            // Check CSS links
            const cssLinks = document.querySelectorAll('link[rel="stylesheet"][href]');
            for (const link of cssLinks) {
                await this.checkLink(link.href, filePath, 'stylesheet');
            }

            // Check script sources
            const scripts = document.querySelectorAll('script[src]');
            for (const script of scripts) {
                await this.checkLink(script.src, filePath, 'script');
            }

        } catch (error) {
            console.error(`❌ Error checking file ${relativePath}:`, error.message);
        }
    }

    /**
     * Check individual link
     */
    async checkLink(href, sourceFile, type) {
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return; // Skip anchors, javascript, mailto, and tel links
        }

        const linkInfo = {
            url: href,
            sourceFile: path.relative(this.publicDir, sourceFile),
            type: type,
            status: 'unknown',
            statusCode: null,
            error: null,
            timestamp: new Date().toISOString()
        };

        this.results.total++;

        try {
            // Check if we've already validated this URL
            if (this.checkedUrls.has(href)) {
                const cachedResult = this.checkedUrls.get(href);
                linkInfo.status = cachedResult.status;
                linkInfo.statusCode = cachedResult.statusCode;
                linkInfo.error = cachedResult.error;
            } else {
                // Validate the link
                const result = await this.validateUrl(href, sourceFile);
                linkInfo.status = result.status;
                linkInfo.statusCode = result.statusCode;
                linkInfo.error = result.error;
                
                // Cache the result
                this.checkedUrls.set(href, result);
            }

            // Update counters
            if (linkInfo.status === 'valid') {
                this.results.valid++;
            } else if (linkInfo.status === 'broken') {
                this.results.broken++;
            } else {
                this.results.warnings++;
            }

        } catch (error) {
            linkInfo.status = 'error';
            linkInfo.error = error.message;
            this.results.broken++;
        }

        this.results.links.push(linkInfo);
    }

    /**
     * Validate URL (internal or external)
     */
    async validateUrl(href, sourceFile) {
        // Handle relative URLs
        if (href.startsWith('./') || href.startsWith('../') || (!href.startsWith('http') && !href.startsWith('//'))) {
            return this.validateLocalFile(href, sourceFile);
        }

        // Handle absolute internal URLs
        if (href.startsWith('/')) {
            return this.validateLocalFile(href, sourceFile);
        }

        // Handle external URLs
        if (href.startsWith('http')) {
            return this.validateExternalUrl(href);
        }

        return { status: 'warning', statusCode: null, error: 'Unknown URL format' };
    }

    /**
     * Validate local file
     */
    validateLocalFile(href, sourceFile) {
        try {
            let targetPath;
            
            if (href.startsWith('/')) {
                // Absolute path from public root
                targetPath = path.join(this.publicDir, href);
            } else {
                // Relative path from current file
                const sourceDir = path.dirname(sourceFile);
                targetPath = path.resolve(sourceDir, href);
            }

            // Remove query parameters and fragments
            const cleanPath = targetPath.split('?')[0].split('#')[0];

            if (fs.existsSync(cleanPath)) {
                return { status: 'valid', statusCode: 200, error: null };
            } else {
                return { status: 'broken', statusCode: 404, error: 'File not found' };
            }
        } catch (error) {
            return { status: 'broken', statusCode: null, error: error.message };
        }
    }

    /**
     * Validate external URL
     */
    async validateExternalUrl(href) {
        return new Promise((resolve) => {
            const urlObj = url.parse(href);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.path,
                method: 'HEAD',
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'Stone OnePoint Solutions Link Checker/1.0'
                }
            };

            const req = client.request(options, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    resolve({ status: 'valid', statusCode: res.statusCode, error: null });
                } else if (res.statusCode >= 400 && res.statusCode < 500) {
                    resolve({ status: 'broken', statusCode: res.statusCode, error: `Client error: ${res.statusCode}` });
                } else {
                    resolve({ status: 'warning', statusCode: res.statusCode, error: `Server error: ${res.statusCode}` });
                }
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({ status: 'warning', statusCode: null, error: 'Request timeout' });
            });

            req.on('error', (error) => {
                resolve({ status: 'broken', statusCode: null, error: error.message });
            });

            req.end();
        });
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportDir = path.join(__dirname, '../reports');
        
        // Ensure reports directory exists
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        // Generate JSON report
        const jsonReport = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                valid: this.results.valid,
                broken: this.results.broken,
                warnings: this.results.warnings,
                successRate: ((this.results.valid / this.results.total) * 100).toFixed(2) + '%'
            },
            links: this.results.links
        };

        const jsonPath = path.join(reportDir, `link-check-${timestamp}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

        // Generate HTML report
        const htmlReport = this.generateHtmlReport(jsonReport);
        const htmlPath = path.join(reportDir, `link-check-${timestamp}.html`);
        fs.writeFileSync(htmlPath, htmlReport);

        // Generate latest report (overwrite)
        fs.writeFileSync(path.join(reportDir, 'link-check-latest.json'), JSON.stringify(jsonReport, null, 2));
        fs.writeFileSync(path.join(reportDir, 'link-check-latest.html'), htmlReport);

        console.log('\n📊 Link Check Results:');
        console.log(`✅ Valid links: ${this.results.valid}`);
        console.log(`❌ Broken links: ${this.results.broken}`);
        console.log(`⚠️  Warnings: ${this.results.warnings}`);
        console.log(`📈 Success rate: ${jsonReport.summary.successRate}`);
        console.log(`📄 Report saved to: ${htmlPath}`);

        if (this.results.broken > 0) {
            console.log('\n🔧 Broken Links Found:');
            this.results.links
                .filter(link => link.status === 'broken')
                .forEach(link => {
                    console.log(`   ${link.url} (in ${link.sourceFile})`);
                });
        }
    }

    /**
     * Generate HTML report
     */
    generateHtmlReport(data) {
        const brokenLinks = data.links.filter(link => link.status === 'broken');
        const warningLinks = data.links.filter(link => link.status === 'warning');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Link Check Report - Stone OnePoint Solutions</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .stat-card.success { border-left-color: #28a745; }
        .stat-card.error { border-left-color: #dc3545; }
        .stat-card.warning { border-left-color: #ffc107; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #666; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .status-valid { color: #28a745; font-weight: bold; }
        .status-broken { color: #dc3545; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
        .url-cell { max-width: 300px; word-break: break-all; }
        .error-cell { max-width: 200px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔗 Link Check Report</h1>
            <p>Generated on: ${data.timestamp}</p>
        </div>

        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${data.summary.total}</div>
                <div class="stat-label">Total Links</div>
            </div>
            <div class="stat-card success">
                <div class="stat-number">${data.summary.valid}</div>
                <div class="stat-label">Valid Links</div>
            </div>
            <div class="stat-card error">
                <div class="stat-number">${data.summary.broken}</div>
                <div class="stat-label">Broken Links</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-number">${data.summary.warnings}</div>
                <div class="stat-label">Warnings</div>
            </div>
        </div>

        <div class="section">
            <h2>📈 Success Rate: ${data.summary.successRate}</h2>
        </div>

        ${brokenLinks.length > 0 ? `
        <div class="section">
            <h2>❌ Broken Links (${brokenLinks.length})</h2>
            <table>
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Source File</th>
                        <th>Type</th>
                        <th>Status Code</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    ${brokenLinks.map(link => `
                    <tr>
                        <td class="url-cell">${link.url}</td>
                        <td>${link.sourceFile}</td>
                        <td>${link.type}</td>
                        <td>${link.statusCode || 'N/A'}</td>
                        <td class="error-cell">${link.error || 'N/A'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        ${warningLinks.length > 0 ? `
        <div class="section">
            <h2>⚠️ Warnings (${warningLinks.length})</h2>
            <table>
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Source File</th>
                        <th>Type</th>
                        <th>Status Code</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    ${warningLinks.map(link => `
                    <tr>
                        <td class="url-cell">${link.url}</td>
                        <td>${link.sourceFile}</td>
                        <td>${link.type}</td>
                        <td>${link.statusCode || 'N/A'}</td>
                        <td class="error-cell">${link.error || 'N/A'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="section">
            <h2>📋 Recommendations</h2>
            <ul>
                ${brokenLinks.length > 0 ? '<li>Fix broken links identified in the report above</li>' : ''}
                ${warningLinks.length > 0 ? '<li>Review warning links for potential issues</li>' : ''}
                <li>Run this check regularly (weekly recommended)</li>
                <li>Monitor external links as they may change over time</li>
                <li>Consider implementing automated link checking in CI/CD pipeline</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];
        options[key] = value;
    }

    const checker = new LinkChecker(options);
    
    checker.checkAllLinks()
        .then(() => {
            console.log('✅ Link check completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Link check failed:', error.message);
            process.exit(1);
        });
}

module.exports = LinkChecker;