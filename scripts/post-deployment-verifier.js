#!/usr/bin/env node

/**
 * Post-deployment Verification Script
 * Verifies website functionality after deployment
 * Requirements: 4.1, 6.1, 6.2, 6.3
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class PostDeploymentVerifier {
    constructor(baseUrl, options = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.timeout = options.timeout || 10000;
        this.userAgent = options.userAgent || 'PostDeploymentVerifier/1.0';
        this.results = {
            connectivity: [],
            security: [],
            performance: [],
            seo: [],
            functionality: [],
            errors: [],
            warnings: []
        };
    }

    async verifyAll() {
        console.log(`🚀 Starting post-deployment verification for: ${this.baseUrl}\n`);
        
        try {
            await this.verifyConnectivity();
            await this.verifySecurityHeaders();
            await this.verifyHTTPSRedirect();
            await this.verifyPageLoading();
            await this.verifySEOElements();
            await this.verifyForms();
            await this.verifyAssets();
            
            return this.generateReport();
        } catch (error) {
            this.results.errors.push(`Verification failed: ${error.message}`);
            return false;
        }
    }

    async verifyConnectivity() {
        console.log('🌐 Verifying connectivity...');
        
        try {
            const response = await this.makeRequest('/');
            
            if (response.statusCode === 200) {
                this.results.connectivity.push('✓ Website is accessible');
            } else {
                this.results.errors.push(`Website returned status code: ${response.statusCode}`);
            }
            
            // Check response time
            const startTime = Date.now();
            await this.makeRequest('/');
            const responseTime = Date.now() - startTime;
            
            if (responseTime < 3000) {
                this.results.performance.push(`✓ Good response time: ${responseTime}ms`);
            } else {
                this.results.warnings.push(`Slow response time: ${responseTime}ms`);
            }
            
        } catch (error) {
            this.results.errors.push(`Connectivity test failed: ${error.message}`);
        }
    }

    async verifySecurityHeaders() {
        console.log('🔒 Verifying security headers...');
        
        const requiredHeaders = [
            'x-frame-options',
            'x-content-type-options',
            'referrer-policy'
        ];
        
        const recommendedHeaders = [
            'content-security-policy',
            'strict-transport-security',
            'permissions-policy'
        ];
        
        try {
            const response = await this.makeRequest('/');
            const headers = response.headers;
            
            // Check required headers
            for (const header of requiredHeaders) {
                if (headers[header]) {
                    this.results.security.push(`✓ ${header}: ${headers[header]}`);
                } else {
                    this.results.errors.push(`Missing required security header: ${header}`);
                }
            }
            
            // Check recommended headers
            for (const header of recommendedHeaders) {
                if (headers[header]) {
                    this.results.security.push(`✓ ${header}: ${headers[header]}`);
                } else {
                    this.results.warnings.push(`Missing recommended security header: ${header}`);
                }
            }
            
        } catch (error) {
            this.results.errors.push(`Security headers check failed: ${error.message}`);
        }
    }

    async verifyHTTPSRedirect() {
        console.log('🔐 Verifying HTTPS redirect...');
        
        if (this.baseUrl.startsWith('https://')) {
            const httpUrl = this.baseUrl.replace('https://', 'http://');
            
            try {
                const response = await this.makeRequest('/', { baseUrl: httpUrl, followRedirects: false });
                
                if (response.statusCode >= 300 && response.statusCode < 400) {
                    const location = response.headers.location;
                    if (location && location.startsWith('https://')) {
                        this.results.security.push('✓ HTTP to HTTPS redirect working');
                    } else {
                        this.results.errors.push('HTTP redirect not pointing to HTTPS');
                    }
                } else {
                    this.results.warnings.push('No HTTP to HTTPS redirect detected');
                }
                
            } catch (error) {
                this.results.warnings.push(`HTTPS redirect test failed: ${error.message}`);
            }
        } else {
            this.results.warnings.push('Website not using HTTPS');
        }
    }

    async verifyPageLoading() {
        console.log('📄 Verifying page loading...');
        
        const testPages = [
            '/',
            '/about.html',
            '/services.html',
            '/contact.html',
            '/careers.html'
        ];
        
        for (const page of testPages) {
            try {
                const response = await this.makeRequest(page);
                
                if (response.statusCode === 200) {
                    this.results.functionality.push(`✓ ${page} loads successfully`);
                    
                    // Check if page contains expected content
                    if (response.body.includes('<title>') && response.body.includes('</html>')) {
                        this.results.functionality.push(`✓ ${page} has valid HTML structure`);
                    } else {
                        this.results.warnings.push(`${page} may have incomplete HTML`);
                    }
                    
                } else if (response.statusCode === 404) {
                    this.results.warnings.push(`${page} not found (404) - may be expected`);
                } else {
                    this.results.errors.push(`${page} returned status code: ${response.statusCode}`);
                }
                
            } catch (error) {
                this.results.errors.push(`Failed to load ${page}: ${error.message}`);
            }
        }
    }

    async verifySEOElements() {
        console.log('🔍 Verifying SEO elements...');
        
        try {
            const response = await this.makeRequest('/');
            const html = response.body;
            
            // Check for title tag
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch && titleMatch[1].trim().length > 0) {
                this.results.seo.push(`✓ Title tag present: "${titleMatch[1].trim()}"`);
            } else {
                this.results.errors.push('Missing or empty title tag');
            }
            
            // Check for meta description
            const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
            if (descMatch && descMatch[1].trim().length > 0) {
                this.results.seo.push(`✓ Meta description present (${descMatch[1].length} chars)`);
            } else {
                this.results.errors.push('Missing meta description');
            }
            
            // Check for H1 tag
            const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
            if (h1Match) {
                this.results.seo.push('✓ H1 tag present');
            } else {
                this.results.errors.push('Missing H1 tag');
            }
            
            // Check for canonical URL
            const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
            if (canonicalMatch) {
                this.results.seo.push('✓ Canonical URL present');
            } else {
                this.results.warnings.push('Missing canonical URL');
            }
            
        } catch (error) {
            this.results.errors.push(`SEO verification failed: ${error.message}`);
        }
        
        // Check sitemap.xml
        try {
            const sitemapResponse = await this.makeRequest('/sitemap.xml');
            if (sitemapResponse.statusCode === 200) {
                this.results.seo.push('✓ sitemap.xml accessible');
            } else {
                this.results.warnings.push('sitemap.xml not accessible');
            }
        } catch (error) {
            this.results.warnings.push('sitemap.xml check failed');
        }
        
        // Check robots.txt
        try {
            const robotsResponse = await this.makeRequest('/robots.txt');
            if (robotsResponse.statusCode === 200) {
                this.results.seo.push('✓ robots.txt accessible');
            } else {
                this.results.warnings.push('robots.txt not accessible');
            }
        } catch (error) {
            this.results.warnings.push('robots.txt check failed');
        }
    }

    async verifyForms() {
        console.log('📝 Verifying forms...');
        
        try {
            const response = await this.makeRequest('/contact.html');
            const html = response.body;
            
            // Check for contact form
            if (html.includes('<form') && html.includes('</form>')) {
                this.results.functionality.push('✓ Contact form present');
                
                // Check for required form fields
                const requiredFields = ['name', 'email', 'message'];
                for (const field of requiredFields) {
                    if (html.includes(`name="${field}"`) || html.includes(`id="${field}"`)) {
                        this.results.functionality.push(`✓ Form has ${field} field`);
                    } else {
                        this.results.warnings.push(`Form missing ${field} field`);
                    }
                }
                
                // Check for form validation
                if (html.includes('required') || html.includes('validation')) {
                    this.results.functionality.push('✓ Form has validation attributes');
                } else {
                    this.results.warnings.push('Form may lack validation');
                }
                
            } else {
                this.results.warnings.push('No contact form found');
            }
            
        } catch (error) {
            this.results.warnings.push(`Form verification failed: ${error.message}`);
        }
    }

    async verifyAssets() {
        console.log('🎨 Verifying assets...');
        
        const assetPaths = [
            '/assets/css/bootstrap.min.css',
            '/assets/css/style.css',
            '/assets/js/jquery.min.js',
            '/assets/js/bootstrap.bundle.min.js',
            '/assets/images/logo.png',
            '/favicon.ico'
        ];
        
        for (const assetPath of assetPaths) {
            try {
                const response = await this.makeRequest(assetPath);
                
                if (response.statusCode === 200) {
                    this.results.functionality.push(`✓ Asset accessible: ${assetPath}`);
                } else if (response.statusCode === 404) {
                    this.results.warnings.push(`Asset not found (${response.statusCode}): ${assetPath}`);
                } else {
                    this.results.warnings.push(`Asset issue (${response.statusCode}): ${assetPath}`);
                }
                
            } catch (error) {
                this.results.warnings.push(`Asset check failed for ${assetPath}: ${error.message}`);
            }
        }
    }

    generateReport() {
        console.log('\n📊 Post-deployment Verification Report');
        console.log('=====================================\n');
        
        const totalErrors = this.results.errors.length;
        const totalWarnings = this.results.warnings.length;
        
        // Display results by category
        Object.entries(this.results).forEach(([category, items]) => {
            if (Array.isArray(items) && items.length > 0 && category !== 'errors' && category !== 'warnings') {
                console.log(`${this.getCategoryIcon(category)} ${this.getCategoryTitle(category)}:`);
                items.forEach(item => console.log(`  ${item}`));
                console.log('');
            }
        });
        
        // Display errors and warnings
        if (totalErrors > 0) {
            console.log('❌ Errors:');
            this.results.errors.forEach(error => console.log(`  ${error}`));
            console.log('');
        }
        
        if (totalWarnings > 0) {
            console.log('⚠️  Warnings:');
            this.results.warnings.forEach(warning => console.log(`  ${warning}`));
            console.log('');
        }
        
        // Summary
        const isHealthy = totalErrors === 0;
        console.log('📋 Summary:');
        console.log(`  Errors: ${totalErrors}`);
        console.log(`  Warnings: ${totalWarnings}`);
        console.log(`  Deployment Status: ${isHealthy ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
        
        if (isHealthy) {
            console.log('\n🎉 Website is running successfully!');
        } else {
            console.log('\n🚨 Please investigate and fix the detected issues.');
        }
        
        return isHealthy;
    }

    getCategoryIcon(category) {
        const icons = {
            connectivity: '🌐',
            security: '🔒',
            performance: '⚡',
            seo: '🔍',
            functionality: '⚙️'
        };
        return icons[category] || '📊';
    }

    getCategoryTitle(category) {
        const titles = {
            connectivity: 'Connectivity',
            security: 'Security',
            performance: 'Performance',
            seo: 'SEO',
            functionality: 'Functionality'
        };
        return titles[category] || category;
    }

    /**
     * Make HTTP request with timeout and error handling
     */
    makeRequest(path, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, options.baseUrl || this.baseUrl);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: 'GET',
                timeout: this.timeout,
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            };
            
            const req = client.request(requestOptions, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
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
}

// CLI Usage
if (require.main === module) {
    const baseUrl = process.argv[2];
    
    if (!baseUrl) {
        console.error('Usage: node post-deployment-verifier.js <base-url>');
        console.error('Example: node post-deployment-verifier.js https://www.stoneonepointsolutions.in');
        process.exit(1);
    }
    
    const verifier = new PostDeploymentVerifier(baseUrl);
    
    verifier.verifyAll()
        .then(isHealthy => {
            process.exit(isHealthy ? 0 : 1);
        })
        .catch(error => {
            console.error('Verification failed:', error.message);
            process.exit(1);
        });
}

module.exports = PostDeploymentVerifier;