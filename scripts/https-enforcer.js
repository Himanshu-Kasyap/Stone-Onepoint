#!/usr/bin/env node

/**
 * HTTPS Enforcer Script
 * Updates all HTTP URLs to HTTPS and validates secure protocols
 * Stone OnePoint Solutions Website
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class HTTPSEnforcer {
    constructor() {
        this.publicDir = path.join(__dirname, '../public');
        this.configDir = path.join(__dirname, '../config');
        this.results = {
            filesProcessed: 0,
            urlsUpdated: 0,
            errors: [],
            warnings: []
        };
        
        // URLs that should remain HTTP (if any)
        this.httpExceptions = [
            // Add any URLs that must remain HTTP here
        ];
        
        // Known secure CDN and external services
        this.trustedHttpsServices = [
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'cdnjs.cloudflare.com',
            'cdn.jsdelivr.net',
            'www.google-analytics.com',
            'www.googletagmanager.com',
            'analytics.google.com'
        ];
    }

    /**
     * Main execution method
     */
    async run() {
        console.log('🔒 Starting HTTPS enforcement...\n');
        
        try {
            // Update HTML files
            await this.updateHTMLFiles();
            
            // Update CSS files
            await this.updateCSSFiles();
            
            // Update JavaScript files
            await this.updateJSFiles();
            
            // Update server configuration files
            await this.updateServerConfigs();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Error during HTTPS enforcement:', error.message);
            process.exit(1);
        }
    }

    /**
     * Update HTML files to use HTTPS
     */
    async updateHTMLFiles() {
        console.log('📄 Updating HTML files...');
        
        const htmlFiles = glob.sync('**/*.html', { cwd: this.publicDir });
        
        for (const file of htmlFiles) {
            const filePath = path.join(this.publicDir, file);
            await this.processFile(filePath, 'html');
        }
        
        console.log(`✅ Processed ${htmlFiles.length} HTML files\n`);
    }

    /**
     * Update CSS files to use HTTPS
     */
    async updateCSSFiles() {
        console.log('🎨 Updating CSS files...');
        
        const cssFiles = glob.sync('**/*.css', { cwd: this.publicDir });
        
        for (const file of cssFiles) {
            const filePath = path.join(this.publicDir, file);
            await this.processFile(filePath, 'css');
        }
        
        console.log(`✅ Processed ${cssFiles.length} CSS files\n`);
    }

    /**
     * Update JavaScript files to use HTTPS
     */
    async updateJSFiles() {
        console.log('📜 Updating JavaScript files...');
        
        const jsFiles = glob.sync('**/*.js', { 
            cwd: this.publicDir,
            ignore: ['**/node_modules/**', '**/vendor/**']
        });
        
        for (const file of jsFiles) {
            const filePath = path.join(this.publicDir, file);
            await this.processFile(filePath, 'js');
        }
        
        console.log(`✅ Processed ${jsFiles.length} JavaScript files\n`);
    }

    /**
     * Update server configuration files
     */
    async updateServerConfigs() {
        console.log('⚙️  Updating server configuration files...');
        
        // Update Apache .htaccess
        const htaccessPath = path.join(this.configDir, 'apache/.htaccess');
        if (fs.existsSync(htaccessPath)) {
            await this.processFile(htaccessPath, 'apache');
        }
        
        // Update Nginx config
        const nginxPath = path.join(this.configDir, 'nginx/nginx.conf');
        if (fs.existsSync(nginxPath)) {
            await this.processFile(nginxPath, 'nginx');
        }
        
        console.log('✅ Updated server configuration files\n');
    }

    /**
     * Process individual file
     */
    async processFile(filePath, fileType) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;
            
            // Update HTTP URLs to HTTPS
            content = this.updateHttpUrls(content, filePath);
            
            // Add HTTPS enforcement rules for server configs
            if (fileType === 'apache' || fileType === 'nginx') {
                content = this.addHttpsEnforcement(content, fileType);
            }
            
            // Write back if changed
            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                this.results.filesProcessed++;
            }
            
        } catch (error) {
            this.results.errors.push(`Error processing ${filePath}: ${error.message}`);
        }
    }

    /**
     * Update HTTP URLs to HTTPS
     */
    updateHttpUrls(content, filePath) {
        // Pattern to match HTTP URLs
        const httpPattern = /http:\/\/([^\s"'<>]+)/gi;
        
        return content.replace(httpPattern, (match, url) => {
            // Check if URL is in exceptions
            if (this.httpExceptions.some(exception => url.includes(exception))) {
                this.results.warnings.push(`Skipped HTTP URL (exception): ${match} in ${filePath}`);
                return match;
            }
            
            // Check if it's a known insecure service that should be updated
            const domain = url.split('/')[0];
            
            // Special handling for known services
            if (this.trustedHttpsServices.includes(domain)) {
                this.results.urlsUpdated++;
                return `https://${url}`;
            }
            
            // Default: convert to HTTPS
            this.results.urlsUpdated++;
            return `https://${url}`;
        });
    }

    /**
     * Add HTTPS enforcement to server configurations
     */
    addHttpsEnforcement(content, serverType) {
        if (serverType === 'apache') {
            return this.addApacheHttpsEnforcement(content);
        } else if (serverType === 'nginx') {
            return this.addNginxHttpsEnforcement(content);
        }
        return content;
    }

    /**
     * Add HTTPS enforcement to Apache configuration
     */
    addApacheHttpsEnforcement(content) {
        // Check if HTTPS redirect already exists
        if (content.includes('RewriteRule ^(.*)$ https://')) {
            return content;
        }

        // Add HTTPS enforcement rules
        const httpsRules = `
# Enhanced HTTPS Enforcement
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Force HTTPS for all requests
    RewriteCond %{HTTPS} off
    RewriteCond %{HTTP:X-Forwarded-Proto} !https
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    
    # Force HTTPS for specific headers
    RewriteCond %{HTTP:X-Forwarded-SSL} !on
    RewriteCond %{HTTP:X-Forwarded-Proto} !https
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Upgrade Insecure Requests
<IfModule mod_headers.c>
    Header always set Content-Security-Policy "upgrade-insecure-requests"
</IfModule>
`;

        // Insert after the first RewriteEngine On
        const rewriteEngineIndex = content.indexOf('RewriteEngine On');
        if (rewriteEngineIndex !== -1) {
            const insertIndex = content.indexOf('\n', rewriteEngineIndex) + 1;
            return content.slice(0, insertIndex) + httpsRules + content.slice(insertIndex);
        }

        // If no RewriteEngine found, add at the end
        return content + httpsRules;
    }

    /**
     * Add HTTPS enforcement to Nginx configuration
     */
    addNginxHttpsEnforcement(content) {
        // Check if HTTPS redirect already exists
        if (content.includes('return 301 https://')) {
            return content;
        }

        // The Nginx config should already have HTTPS enforcement
        // Just ensure it's properly configured
        return content;
    }

    /**
     * Validate HTTPS implementation
     */
    validateHttpsImplementation() {
        const validationResults = {
            httpsRedirects: false,
            hstsHeaders: false,
            secureProtocols: false,
            mixedContentPrevention: false
        };

        // Check Apache configuration
        const htaccessPath = path.join(this.configDir, 'apache/.htaccess');
        if (fs.existsSync(htaccessPath)) {
            const content = fs.readFileSync(htaccessPath, 'utf8');
            
            validationResults.httpsRedirects = content.includes('RewriteRule ^(.*)$ https://');
            validationResults.hstsHeaders = content.includes('Strict-Transport-Security');
            validationResults.mixedContentPrevention = content.includes('upgrade-insecure-requests');
        }

        // Check Nginx configuration
        const nginxPath = path.join(this.configDir, 'nginx/nginx.conf');
        if (fs.existsSync(nginxPath)) {
            const content = fs.readFileSync(nginxPath, 'utf8');
            
            validationResults.httpsRedirects = content.includes('return 301 https://');
            validationResults.hstsHeaders = content.includes('Strict-Transport-Security');
            validationResults.secureProtocols = content.includes('ssl_protocols TLSv1.2 TLSv1.3');
        }

        return validationResults;
    }

    /**
     * Generate and display report
     */
    generateReport() {
        console.log('📊 HTTPS Enforcement Report');
        console.log('=' .repeat(50));
        console.log(`Files processed: ${this.results.filesProcessed}`);
        console.log(`URLs updated: ${this.results.urlsUpdated}`);
        console.log(`Errors: ${this.results.errors.length}`);
        console.log(`Warnings: ${this.results.warnings.length}`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.results.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (this.results.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.results.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        // Validation results
        const validation = this.validateHttpsImplementation();
        console.log('\n🔍 HTTPS Implementation Validation:');
        console.log(`  HTTPS Redirects: ${validation.httpsRedirects ? '✅' : '❌'}`);
        console.log(`  HSTS Headers: ${validation.hstsHeaders ? '✅' : '❌'}`);
        console.log(`  Secure Protocols: ${validation.secureProtocols ? '✅' : '❌'}`);
        console.log(`  Mixed Content Prevention: ${validation.mixedContentPrevention ? '✅' : '❌'}`);

        // Recommendations
        console.log('\n💡 Recommendations:');
        if (!validation.httpsRedirects) {
            console.log('  - Configure HTTPS redirects in your web server');
        }
        if (!validation.hstsHeaders) {
            console.log('  - Enable HSTS headers for enhanced security');
        }
        if (!validation.secureProtocols) {
            console.log('  - Configure secure TLS protocols (TLSv1.2+)');
        }
        if (this.results.urlsUpdated > 0) {
            console.log('  - Test all updated URLs to ensure they work with HTTPS');
        }
        
        console.log('\n✅ HTTPS enforcement completed successfully!');
    }

    /**
     * Create HTTPS validation script
     */
    createValidationScript() {
        const validationScript = `#!/usr/bin/env node

/**
 * HTTPS Validation Script
 * Validates that all resources are loaded over HTTPS
 */

const https = require('https');
const http = require('http');
const url = require('url');

class HTTPSValidator {
    constructor() {
        this.results = {
            tested: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async validateUrl(testUrl) {
        return new Promise((resolve) => {
            const parsedUrl = url.parse(testUrl);
            const client = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: parsedUrl.path || '/',
                method: 'HEAD',
                timeout: 5000
            };

            const req = client.request(options, (res) => {
                this.results.tested++;
                
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    this.results.passed++;
                    resolve({ success: true, status: res.statusCode });
                } else {
                    this.results.failed++;
                    resolve({ success: false, status: res.statusCode });
                }
            });

            req.on('error', (error) => {
                this.results.tested++;
                this.results.failed++;
                this.results.errors.push(\`\${testUrl}: \${error.message}\`);
                resolve({ success: false, error: error.message });
            });

            req.on('timeout', () => {
                req.destroy();
                this.results.tested++;
                this.results.failed++;
                resolve({ success: false, error: 'Timeout' });
            });

            req.end();
        });
    }

    generateReport() {
        console.log('HTTPS Validation Report');
        console.log('='.repeat(30));
        console.log(\`URLs tested: \${this.results.tested}\`);
        console.log(\`Passed: \${this.results.passed}\`);
        console.log(\`Failed: \${this.results.failed}\`);
        
        if (this.results.errors.length > 0) {
            console.log('\\nErrors:');
            this.results.errors.forEach(error => console.log(\`  - \${error}\`));
        }
    }
}

// Usage example
if (require.main === module) {
    const validator = new HTTPSValidator();
    
    // Add URLs to test
    const urlsToTest = [
        'https://www.stoneonepointsolutions.in',
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com'
    ];
    
    Promise.all(urlsToTest.map(url => validator.validateUrl(url)))
        .then(() => validator.generateReport());
}

module.exports = HTTPSValidator;`;

        fs.writeFileSync(
            path.join(__dirname, 'https-validator.js'),
            validationScript,
            'utf8'
        );
    }
}

// CLI Usage
if (require.main === module) {
    const enforcer = new HTTPSEnforcer();
    
    // Check if glob is available
    try {
        require('glob');
    } catch (error) {
        console.error('❌ Error: glob package is required. Install it with: npm install glob');
        process.exit(1);
    }
    
    enforcer.run().then(() => {
        enforcer.createValidationScript();
        console.log('\\n📝 Created HTTPS validation script: scripts/https-validator.js');
    });
}

module.exports = HTTPSEnforcer;`;

        fs.writeFileSync(path.join(__dirname, 'https-enforcer.js'), httpsEnforcerScript, 'utf8');
    }
}

// CLI Usage
if (require.main === module) {
    const enforcer = new HTTPSEnforcer();
    enforcer.run().then(() => {
        enforcer.createValidationScript();
        console.log('\n📝 Created HTTPS validation script: scripts/https-validator.js');
    });
}

module.exports = HTTPSEnforcer;