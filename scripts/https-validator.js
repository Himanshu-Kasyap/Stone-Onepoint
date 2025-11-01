#!/usr/bin/env node

/**
 * HTTPS Validation Script
 * Validates HTTPS implementation and secure protocols
 * Stone OnePoint Solutions Website
 */

const https = require('https');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

class HTTPSValidator {
    constructor() {
        this.results = {
            urlTests: {
                tested: 0,
                passed: 0,
                failed: 0,
                errors: []
            },
            configTests: {
                apache: { exists: false, httpsRedirect: false, hsts: false, csp: false },
                nginx: { exists: false, httpsRedirect: false, hsts: false, ssl: false }
            },
            securityHeaders: {
                tested: 0,
                passed: 0,
                failed: 0,
                missing: []
            }
        };
        
        this.requiredSecurityHeaders = [
            'strict-transport-security',
            'x-frame-options',
            'x-content-type-options',
            'content-security-policy'
        ];
    }

    /**
     * Validate URL accessibility over HTTPS
     */
    async validateUrl(testUrl, timeout = 10000) {
        return new Promise((resolve) => {
            const parsedUrl = url.parse(testUrl);
            
            if (parsedUrl.protocol !== 'https:') {
                resolve({ 
                    success: false, 
                    error: 'URL is not HTTPS',
                    url: testUrl
                });
                return;
            }

            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.path || '/',
                method: 'HEAD',
                timeout: timeout,
                rejectUnauthorized: false // For testing purposes
            };

            const req = https.request(options, (res) => {
                this.results.urlTests.tested++;
                
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    this.results.urlTests.passed++;
                    resolve({ 
                        success: true, 
                        status: res.statusCode,
                        headers: res.headers,
                        url: testUrl
                    });
                } else {
                    this.results.urlTests.failed++;
                    resolve({ 
                        success: false, 
                        status: res.statusCode,
                        url: testUrl
                    });
                }
            });

            req.on('error', (error) => {
                this.results.urlTests.tested++;
                this.results.urlTests.failed++;
                this.results.urlTests.errors.push(`${testUrl}: ${error.message}`);
                resolve({ 
                    success: false, 
                    error: error.message,
                    url: testUrl
                });
            });

            req.on('timeout', () => {
                req.destroy();
                this.results.urlTests.tested++;
                this.results.urlTests.failed++;
                resolve({ 
                    success: false, 
                    error: 'Request timeout',
                    url: testUrl
                });
            });

            req.end();
        });
    }

    /**
     * Test HTTP to HTTPS redirect
     */
    async testHttpRedirect(domain) {
        return new Promise((resolve) => {
            const options = {
                hostname: domain,
                port: 80,
                path: '/',
                method: 'HEAD',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                const isRedirect = res.statusCode >= 300 && res.statusCode < 400;
                const location = res.headers.location;
                const redirectsToHttps = location && location.startsWith('https://');
                
                resolve({
                    success: isRedirect && redirectsToHttps,
                    statusCode: res.statusCode,
                    location: location,
                    redirectsToHttps: redirectsToHttps
                });
            });

            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Timeout'
                });
            });

            req.end();
        });
    }

    /**
     * Validate security headers
     */
    validateSecurityHeaders(headers) {
        const headerResults = {
            passed: [],
            failed: [],
            missing: []
        };

        this.requiredSecurityHeaders.forEach(headerName => {
            this.results.securityHeaders.tested++;
            
            const headerValue = headers[headerName.toLowerCase()];
            
            if (!headerValue) {
                headerResults.missing.push(headerName);
                this.results.securityHeaders.failed++;
                this.results.securityHeaders.missing.push(headerName);
            } else {
                // Validate specific header values
                let isValid = true;
                
                switch (headerName) {
                    case 'strict-transport-security':
                        isValid = headerValue.includes('max-age=') && 
                                 parseInt(headerValue.match(/max-age=(\d+)/)?.[1] || 0) >= 31536000;
                        break;
                    case 'x-frame-options':
                        isValid = ['DENY', 'SAMEORIGIN'].includes(headerValue.toUpperCase());
                        break;
                    case 'x-content-type-options':
                        isValid = headerValue.toLowerCase() === 'nosniff';
                        break;
                    case 'content-security-policy':
                        isValid = headerValue.includes('upgrade-insecure-requests');
                        break;
                }
                
                if (isValid) {
                    headerResults.passed.push({ header: headerName, value: headerValue });
                    this.results.securityHeaders.passed++;
                } else {
                    headerResults.failed.push({ header: headerName, value: headerValue });
                    this.results.securityHeaders.failed++;
                }
            }
        });

        return headerResults;
    }

    /**
     * Validate server configuration files
     */
    validateServerConfigs() {
        const configDir = path.join(__dirname, '../config');
        
        // Check Apache configuration
        const htaccessPath = path.join(configDir, 'apache/.htaccess');
        if (fs.existsSync(htaccessPath)) {
            this.results.configTests.apache.exists = true;
            const content = fs.readFileSync(htaccessPath, 'utf8');
            
            this.results.configTests.apache.httpsRedirect = 
                content.includes('RewriteRule ^(.*)$ https://') ||
                content.includes('RewriteRule (.*) https://');
            
            this.results.configTests.apache.hsts = 
                content.includes('Strict-Transport-Security');
            
            this.results.configTests.apache.csp = 
                content.includes('Content-Security-Policy') &&
                content.includes('upgrade-insecure-requests');
        }

        // Check Nginx configuration
        const nginxPath = path.join(configDir, 'nginx/nginx.conf');
        if (fs.existsSync(nginxPath)) {
            this.results.configTests.nginx.exists = true;
            const content = fs.readFileSync(nginxPath, 'utf8');
            
            this.results.configTests.nginx.httpsRedirect = 
                content.includes('return 301 https://');
            
            this.results.configTests.nginx.hsts = 
                content.includes('Strict-Transport-Security');
            
            this.results.configTests.nginx.ssl = 
                content.includes('ssl_protocols TLSv1.2 TLSv1.3') ||
                content.includes('ssl_protocols TLSv1.3');
        }
    }

    /**
     * Run comprehensive HTTPS validation
     */
    async runValidation(options = {}) {
        console.log('🔒 Starting HTTPS Validation...\n');

        // Test URLs
        const urlsToTest = options.urls || [
            'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
            'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css',
            'https://www.google-analytics.com/analytics.js'
        ];

        console.log('📡 Testing HTTPS URLs...');
        for (const testUrl of urlsToTest) {
            const result = await this.validateUrl(testUrl);
            if (result.success) {
                console.log(`✅ ${testUrl}`);
                
                // Test security headers if we got headers
                if (result.headers) {
                    const headerResults = this.validateSecurityHeaders(result.headers);
                    if (headerResults.missing.length > 0) {
                        console.log(`   ⚠️  Missing headers: ${headerResults.missing.join(', ')}`);
                    }
                }
            } else {
                console.log(`❌ ${testUrl} - ${result.error || result.status}`);
            }
        }

        // Test HTTP to HTTPS redirect
        console.log('\n🔄 Testing HTTP to HTTPS redirects...');
        const domainsToTest = options.domains || ['www.stoneonepointsolutions.in'];
        
        for (const domain of domainsToTest) {
            const redirectResult = await this.testHttpRedirect(domain);
            if (redirectResult.success) {
                console.log(`✅ ${domain} redirects to HTTPS`);
            } else {
                console.log(`❌ ${domain} - ${redirectResult.error || 'No HTTPS redirect'}`);
            }
        }

        // Validate server configurations
        console.log('\n⚙️  Validating server configurations...');
        this.validateServerConfigs();

        // Generate report
        this.generateReport();
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        console.log('\n📊 HTTPS Validation Report');
        console.log('=' .repeat(50));

        // URL Tests
        console.log('\n🌐 URL Tests:');
        console.log(`  Tested: ${this.results.urlTests.tested}`);
        console.log(`  Passed: ${this.results.urlTests.passed}`);
        console.log(`  Failed: ${this.results.urlTests.failed}`);
        
        if (this.results.urlTests.errors.length > 0) {
            console.log('  Errors:');
            this.results.urlTests.errors.forEach(error => 
                console.log(`    - ${error}`)
            );
        }

        // Security Headers
        console.log('\n🛡️  Security Headers:');
        console.log(`  Tested: ${this.results.securityHeaders.tested}`);
        console.log(`  Passed: ${this.results.securityHeaders.passed}`);
        console.log(`  Failed: ${this.results.securityHeaders.failed}`);
        
        if (this.results.securityHeaders.missing.length > 0) {
            console.log('  Missing Headers:');
            this.results.securityHeaders.missing.forEach(header => 
                console.log(`    - ${header}`)
            );
        }

        // Configuration Tests
        console.log('\n⚙️  Server Configuration:');
        
        console.log('  Apache (.htaccess):');
        console.log(`    Exists: ${this.results.configTests.apache.exists ? '✅' : '❌'}`);
        console.log(`    HTTPS Redirect: ${this.results.configTests.apache.httpsRedirect ? '✅' : '❌'}`);
        console.log(`    HSTS Header: ${this.results.configTests.apache.hsts ? '✅' : '❌'}`);
        console.log(`    CSP with upgrade-insecure-requests: ${this.results.configTests.apache.csp ? '✅' : '❌'}`);
        
        console.log('  Nginx:');
        console.log(`    Exists: ${this.results.configTests.nginx.exists ? '✅' : '❌'}`);
        console.log(`    HTTPS Redirect: ${this.results.configTests.nginx.httpsRedirect ? '✅' : '❌'}`);
        console.log(`    HSTS Header: ${this.results.configTests.nginx.hsts ? '✅' : '❌'}`);
        console.log(`    Secure SSL Protocols: ${this.results.configTests.nginx.ssl ? '✅' : '❌'}`);

        // Overall Score
        const totalTests = this.results.urlTests.tested + this.results.securityHeaders.tested + 8; // 8 config tests
        const passedTests = this.results.urlTests.passed + this.results.securityHeaders.passed + 
                           Object.values(this.results.configTests.apache).filter(Boolean).length +
                           Object.values(this.results.configTests.nginx).filter(Boolean).length - 2; // Subtract 2 for 'exists' flags
        
        const score = Math.round((passedTests / totalTests) * 100);
        
        console.log(`\n🎯 Overall HTTPS Security Score: ${score}%`);

        // Recommendations
        console.log('\n💡 Recommendations:');
        
        if (!this.results.configTests.apache.httpsRedirect && !this.results.configTests.nginx.httpsRedirect) {
            console.log('  - Configure HTTPS redirects in your web server');
        }
        
        if (!this.results.configTests.apache.hsts && !this.results.configTests.nginx.hsts) {
            console.log('  - Enable HSTS headers for enhanced security');
        }
        
        if (this.results.securityHeaders.missing.length > 0) {
            console.log('  - Add missing security headers to your server configuration');
        }
        
        if (this.results.urlTests.failed > 0) {
            console.log('  - Fix failed HTTPS URLs to ensure secure resource loading');
        }
        
        if (score >= 90) {
            console.log('  - Excellent HTTPS implementation! Consider regular security audits');
        } else if (score >= 70) {
            console.log('  - Good HTTPS foundation, address remaining issues for better security');
        } else {
            console.log('  - Critical HTTPS improvements needed for proper security');
        }

        console.log('\n✅ HTTPS validation completed!');
    }

    /**
     * Create SSL/TLS configuration guide
     */
    createSSLGuide() {
        const sslGuide = `# SSL/TLS Configuration Guide

## Overview
This guide provides recommendations for secure SSL/TLS configuration for the Stone OnePoint Solutions website.

## Recommended SSL/TLS Settings

### Apache Configuration
\`\`\`apache
# Enable SSL module
LoadModule ssl_module modules/mod_ssl.so

# SSL Configuration
<VirtualHost *:443>
    ServerName www.stoneonepointsolutions.in
    DocumentRoot /var/www/html
    
    # SSL Engine
    SSLEngine on
    
    # Certificate files (update paths)
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    SSLCertificateChainFile /path/to/chain.crt
    
    # Secure protocols (TLS 1.2 and 1.3 only)
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    
    # Secure cipher suites
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
    
    # Prefer server ciphers
    SSLHonorCipherOrder off
    
    # Session configuration
    SSLSessionCache shmcb:/var/cache/mod_ssl/scache(512000)
    SSLSessionCacheTimeout 300
    
    # OCSP Stapling
    SSLUseStapling on
    SSLStaplingCache shmcb:/var/run/ocsp(128000)
</VirtualHost>
\`\`\`

### Nginx Configuration
\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name www.stoneonepointsolutions.in;
    
    # Certificate files (update paths)
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Secure protocols
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Secure ciphers
    ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    
    # Prefer server ciphers
    ssl_prefer_server_ciphers off;
    
    # Session configuration
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /path/to/chain.crt;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
}
\`\`\`

## Certificate Management

### Let's Encrypt (Recommended for free certificates)
\`\`\`bash
# Install Certbot
sudo apt-get install certbot python3-certbot-apache

# Obtain certificate
sudo certbot --apache -d www.stoneonepointsolutions.in

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

### Commercial SSL Certificates
1. Generate CSR (Certificate Signing Request)
2. Purchase certificate from trusted CA
3. Install certificate files
4. Configure web server

## Security Best Practices

1. **Use Strong Protocols**: Only TLS 1.2 and 1.3
2. **Secure Ciphers**: Use modern, secure cipher suites
3. **HSTS**: Enable HTTP Strict Transport Security
4. **OCSP Stapling**: Improve certificate validation performance
5. **Regular Updates**: Keep SSL/TLS libraries updated
6. **Certificate Monitoring**: Monitor certificate expiration

## Testing Tools

- SSL Labs Test: https://www.ssllabs.com/ssltest/
- Mozilla Observatory: https://observatory.mozilla.org/
- Security Headers: https://securityheaders.com/

## Troubleshooting

### Common Issues
1. **Mixed Content**: Ensure all resources use HTTPS
2. **Certificate Errors**: Verify certificate chain
3. **Cipher Mismatches**: Update cipher suites
4. **Protocol Issues**: Disable insecure protocols

### Monitoring
- Set up certificate expiration alerts
- Monitor SSL/TLS configuration changes
- Regular security assessments
`;

        fs.writeFileSync(
            path.join(__dirname, '../docs/ssl-tls-guide.md'),
            sslGuide,
            'utf8'
        );
        
        console.log('📝 Created SSL/TLS configuration guide: docs/ssl-tls-guide.md');
    }
}

// CLI Usage
if (require.main === module) {
    const validator = new HTTPSValidator();
    
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    if (args.includes('--help')) {
        console.log('HTTPS Validator');
        console.log('Usage: node https-validator.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --help     Show this help message');
        console.log('  --guide    Create SSL/TLS configuration guide');
        console.log('');
        process.exit(0);
    }
    
    if (args.includes('--guide')) {
        validator.createSSLGuide();
        process.exit(0);
    }
    
    // Run validation
    validator.runValidation(options);
}

module.exports = HTTPSValidator;