#!/usr/bin/env node

/**
 * Security Headers Validator
 * Validates that all required security headers are properly configured
 * Stone OnePoint Solutions Website
 */

const https = require('https');
const http = require('http');
const url = require('url');

class SecurityHeadersValidator {
    constructor() {
        this.requiredHeaders = {
            'x-frame-options': {
                expected: 'DENY',
                description: 'Prevents clickjacking attacks'
            },
            'x-content-type-options': {
                expected: 'nosniff',
                description: 'Prevents MIME type sniffing'
            },
            'x-xss-protection': {
                expected: '1; mode=block',
                description: 'Enables XSS protection in legacy browsers'
            },
            'referrer-policy': {
                expected: 'strict-origin-when-cross-origin',
                description: 'Controls referrer information'
            },
            'permissions-policy': {
                expected: /geolocation=\(\)/,
                description: 'Controls browser features and APIs'
            },
            'strict-transport-security': {
                expected: /max-age=31536000/,
                description: 'Enforces HTTPS connections'
            },
            'content-security-policy': {
                expected: /default-src 'self'/,
                description: 'Prevents XSS and injection attacks'
            },
            'cross-origin-embedder-policy': {
                expected: 'require-corp',
                description: 'Controls cross-origin resource embedding'
            },
            'cross-origin-opener-policy': {
                expected: 'same-origin',
                description: 'Controls cross-origin window interactions'
            },
            'cross-origin-resource-policy': {
                expected: 'same-origin',
                description: 'Controls cross-origin resource access'
            }
        };
    }

    /**
     * Validate security headers for a given URL
     * @param {string} targetUrl - URL to test
     * @returns {Promise<Object>} Validation results
     */
    async validateHeaders(targetUrl) {
        return new Promise((resolve, reject) => {
            const parsedUrl = url.parse(targetUrl);
            const client = parsedUrl.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: parsedUrl.path || '/',
                method: 'HEAD',
                timeout: 10000
            };

            const req = client.request(options, (res) => {
                const results = {
                    url: targetUrl,
                    status: res.statusCode,
                    headers: res.headers,
                    security: {
                        passed: [],
                        failed: [],
                        missing: [],
                        score: 0
                    }
                };

                // Check each required security header
                Object.entries(this.requiredHeaders).forEach(([headerName, config]) => {
                    const headerValue = res.headers[headerName.toLowerCase()];
                    
                    if (!headerValue) {
                        results.security.missing.push({
                            header: headerName,
                            description: config.description,
                            expected: config.expected
                        });
                    } else {
                        const isValid = this.validateHeaderValue(headerValue, config.expected);
                        
                        if (isValid) {
                            results.security.passed.push({
                                header: headerName,
                                value: headerValue,
                                description: config.description
                            });
                        } else {
                            results.security.failed.push({
                                header: headerName,
                                value: headerValue,
                                expected: config.expected,
                                description: config.description
                            });
                        }
                    }
                });

                // Calculate security score
                const totalHeaders = Object.keys(this.requiredHeaders).length;
                const passedHeaders = results.security.passed.length;
                results.security.score = Math.round((passedHeaders / totalHeaders) * 100);

                resolve(results);
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    /**
     * Validate header value against expected value
     * @param {string} actual - Actual header value
     * @param {string|RegExp} expected - Expected value or pattern
     * @returns {boolean} Whether the header value is valid
     */
    validateHeaderValue(actual, expected) {
        if (expected instanceof RegExp) {
            return expected.test(actual);
        }
        return actual.toLowerCase() === expected.toLowerCase();
    }

    /**
     * Generate security headers report
     * @param {Object} results - Validation results
     * @returns {string} Formatted report
     */
    generateReport(results) {
        let report = `\n=== Security Headers Validation Report ===\n`;
        report += `URL: ${results.url}\n`;
        report += `Status: ${results.status}\n`;
        report += `Security Score: ${results.security.score}%\n\n`;

        if (results.security.passed.length > 0) {
            report += `✅ PASSED HEADERS (${results.security.passed.length}):\n`;
            results.security.passed.forEach(header => {
                report += `  ✓ ${header.header}: ${header.value}\n`;
                report += `    ${header.description}\n\n`;
            });
        }

        if (results.security.failed.length > 0) {
            report += `❌ FAILED HEADERS (${results.security.failed.length}):\n`;
            results.security.failed.forEach(header => {
                report += `  ✗ ${header.header}: ${header.value}\n`;
                report += `    Expected: ${header.expected}\n`;
                report += `    ${header.description}\n\n`;
            });
        }

        if (results.security.missing.length > 0) {
            report += `⚠️  MISSING HEADERS (${results.security.missing.length}):\n`;
            results.security.missing.forEach(header => {
                report += `  - ${header.header}\n`;
                report += `    Expected: ${header.expected}\n`;
                report += `    ${header.description}\n\n`;
            });
        }

        // Security recommendations
        report += `\n=== SECURITY RECOMMENDATIONS ===\n`;
        
        if (results.security.score < 100) {
            report += `• Fix missing or failed security headers to achieve 100% score\n`;
        }
        
        if (results.security.missing.some(h => h.header === 'strict-transport-security')) {
            report += `• Implement HSTS to enforce HTTPS connections\n`;
        }
        
        if (results.security.missing.some(h => h.header === 'content-security-policy')) {
            report += `• Implement CSP to prevent XSS and injection attacks\n`;
        }
        
        if (results.security.score >= 90) {
            report += `• Excellent security posture! Consider regular security audits\n`;
        } else if (results.security.score >= 70) {
            report += `• Good security foundation, address remaining issues\n`;
        } else {
            report += `• Critical security improvements needed\n`;
        }

        return report;
    }

    /**
     * Test local configuration files
     * @returns {Object} Configuration validation results
     */
    validateLocalConfig() {
        const fs = require('fs');
        const path = require('path');
        
        const results = {
            apache: { exists: false, valid: false, issues: [] },
            nginx: { exists: false, valid: false, issues: [] }
        };

        // Check Apache .htaccess
        const htaccessPath = path.join(__dirname, '../config/apache/.htaccess');
        if (fs.existsSync(htaccessPath)) {
            results.apache.exists = true;
            const content = fs.readFileSync(htaccessPath, 'utf8');
            
            // Check for required security headers
            const requiredApacheHeaders = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'Referrer-Policy',
                'Permissions-Policy',
                'Content-Security-Policy',
                'Strict-Transport-Security'
            ];
            
            requiredApacheHeaders.forEach(header => {
                if (!content.includes(header)) {
                    results.apache.issues.push(`Missing ${header} header`);
                }
            });
            
            results.apache.valid = results.apache.issues.length === 0;
        }

        // Check Nginx configuration
        const nginxPath = path.join(__dirname, '../config/nginx/nginx.conf');
        if (fs.existsSync(nginxPath)) {
            results.nginx.exists = true;
            const content = fs.readFileSync(nginxPath, 'utf8');
            
            // Check for required security headers
            const requiredNginxHeaders = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'Referrer-Policy',
                'Permissions-Policy',
                'Content-Security-Policy',
                'Strict-Transport-Security'
            ];
            
            requiredNginxHeaders.forEach(header => {
                if (!content.includes(header)) {
                    results.nginx.issues.push(`Missing ${header} header`);
                }
            });
            
            results.nginx.valid = results.nginx.issues.length === 0;
        }

        return results;
    }
}

// CLI Usage
if (require.main === module) {
    const validator = new SecurityHeadersValidator();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Security Headers Validator');
        console.log('Usage: node security-headers-validator.js [URL] [--local]');
        console.log('');
        console.log('Options:');
        console.log('  URL      Test security headers for a specific URL');
        console.log('  --local  Validate local configuration files');
        console.log('');
        console.log('Examples:');
        console.log('  node security-headers-validator.js https://example.com');
        console.log('  node security-headers-validator.js --local');
        process.exit(0);
    }

    if (args[0] === '--local') {
        console.log('Validating local configuration files...\n');
        const results = validator.validateLocalConfig();
        
        console.log('=== Local Configuration Validation ===\n');
        
        // Apache results
        console.log(`Apache .htaccess:`);
        console.log(`  Exists: ${results.apache.exists ? '✅' : '❌'}`);
        console.log(`  Valid: ${results.apache.valid ? '✅' : '❌'}`);
        if (results.apache.issues.length > 0) {
            console.log(`  Issues:`);
            results.apache.issues.forEach(issue => console.log(`    - ${issue}`));
        }
        console.log('');
        
        // Nginx results
        console.log(`Nginx configuration:`);
        console.log(`  Exists: ${results.nginx.exists ? '✅' : '❌'}`);
        console.log(`  Valid: ${results.nginx.valid ? '✅' : '❌'}`);
        if (results.nginx.issues.length > 0) {
            console.log(`  Issues:`);
            results.nginx.issues.forEach(issue => console.log(`    - ${issue}`));
        }
        
    } else {
        const testUrl = args[0];
        console.log(`Testing security headers for: ${testUrl}\n`);
        
        validator.validateHeaders(testUrl)
            .then(results => {
                console.log(validator.generateReport(results));
            })
            .catch(error => {
                console.error('Error testing security headers:', error.message);
                process.exit(1);
            });
    }
}

module.exports = SecurityHeadersValidator;