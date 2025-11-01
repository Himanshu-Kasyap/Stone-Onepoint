#!/usr/bin/env node

/**
 * Comprehensive Security Scanner
 * Performs security scanning and validation for deployment readiness
 * Requirements: 4.1, 6.1, 6.2, 6.3
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityScanner {
    constructor(options = {}) {
        this.publicDir = options.publicDir || './public';
        this.configDir = options.configDir || './config';
        this.scanResults = {
            vulnerabilities: [],
            warnings: [],
            recommendations: [],
            score: 0,
            details: {
                files: [],
                configurations: [],
                headers: [],
                content: []
            }
        };
    }

    /**
     * Run comprehensive security scan
     */
    async runSecurityScan() {
        console.log('🔒 Starting Comprehensive Security Scan\n');
        
        try {
            await this.scanFilePermissions();
            await this.scanConfigurationFiles();
            await this.scanHTMLContent();
            await this.scanJavaScriptFiles();
            await this.scanCSSFiles();
            await this.scanFormSecurity();
            await this.scanExternalResources();
            await this.scanServerConfiguration();
            await this.calculateSecurityScore();
            
            return this.generateSecurityReport();
            
        } catch (error) {
            console.error('❌ Security scan failed:', error.message);
            this.scanResults.vulnerabilities.push(`Security scan failed: ${error.message}`);
            return this.scanResults;
        }
    }

    /**
     * Scan file permissions and sensitive files
     */
    async scanFilePermissions() {
        console.log('📁 Scanning file permissions and sensitive files...');
        
        const sensitiveFiles = [
            '.env',
            '.env.local',
            '.env.production',
            'config.php',
            'wp-config.php',
            'database.php',
            '.htpasswd',
            'id_rsa',
            'id_dsa',
            'private.key',
            'server.key'
        ];
        
        const publicFiles = this.getAllFiles(this.publicDir);
        
        // Check for sensitive files in public directory
        for (const file of publicFiles) {
            const fileName = path.basename(file);
            
            if (sensitiveFiles.includes(fileName)) {
                this.scanResults.vulnerabilities.push(`Sensitive file exposed in public directory: ${file}`);
            }
            
            // Check for backup files
            if (fileName.endsWith('.bak') || fileName.endsWith('.backup') || fileName.endsWith('~')) {
                this.scanResults.warnings.push(`Backup file found in public directory: ${file}`);
            }
            
            // Check for development files
            if (fileName.includes('test') || fileName.includes('debug') || fileName.includes('dev')) {
                this.scanResults.warnings.push(`Development file found in public directory: ${file}`);
            }
        }
        
        this.scanResults.details.files.push({
            type: 'file_permissions',
            scanned: publicFiles.length,
            issues: this.scanResults.vulnerabilities.length + this.scanResults.warnings.length
        });
    }

    /**
     * Scan configuration files for security issues
     */
    async scanConfigurationFiles() {
        console.log('⚙️ Scanning configuration files...');
        
        // Check .htaccess file
        const htaccessPath = path.join(this.configDir, 'apache', '.htaccess');
        if (fs.existsSync(htaccessPath)) {
            const content = fs.readFileSync(htaccessPath, 'utf8');
            
            // Check for security headers
            const requiredHeaders = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'X-XSS-Protection',
                'Referrer-Policy',
                'Content-Security-Policy'
            ];
            
            const missingHeaders = requiredHeaders.filter(header => !content.includes(header));
            if (missingHeaders.length > 0) {
                this.scanResults.warnings.push(`Missing security headers in .htaccess: ${missingHeaders.join(', ')}`);
            }
            
            // Check for directory browsing protection
            if (!content.includes('Options -Indexes')) {
                this.scanResults.vulnerabilities.push('Directory browsing not disabled in .htaccess');
            }
            
            // Check for server signature hiding
            if (!content.includes('ServerTokens') && !content.includes('ServerSignature')) {
                this.scanResults.recommendations.push('Consider hiding server signature in .htaccess');
            }
            
        } else {
            this.scanResults.warnings.push('.htaccess file not found');
        }
        
        // Check nginx configuration
        const nginxPath = path.join(this.configDir, 'nginx', 'nginx.conf');
        if (fs.existsSync(nginxPath)) {
            const content = fs.readFileSync(nginxPath, 'utf8');
            
            // Check for security headers
            if (!content.includes('add_header X-Frame-Options')) {
                this.scanResults.warnings.push('X-Frame-Options header not configured in nginx');
            }
            
            // Check for server tokens
            if (!content.includes('server_tokens off')) {
                this.scanResults.recommendations.push('Consider disabling server tokens in nginx');
            }
        }
        
        this.scanResults.details.configurations.push({
            type: 'server_config',
            apache: fs.existsSync(htaccessPath),
            nginx: fs.existsSync(nginxPath)
        });
    }

    /**
     * Scan HTML content for security issues
     */
    async scanHTMLContent() {
        console.log('📄 Scanning HTML content for security issues...');
        
        const htmlFiles = this.getAllFiles(this.publicDir).filter(f => f.endsWith('.html'));
        
        for (const file of htmlFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const fileName = path.basename(file);
            
            // Check for inline JavaScript
            const inlineScripts = content.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
            const inlineScriptCount = inlineScripts.filter(script => 
                !script.includes('src=') && script.includes('>')
            ).length;
            
            if (inlineScriptCount > 0) {
                this.scanResults.warnings.push(`${fileName}: ${inlineScriptCount} inline script(s) found - consider using CSP`);
            }
            
            // Check for inline styles
            const inlineStyles = content.match(/style\s*=\s*["'][^"']*["']/gi) || [];
            if (inlineStyles.length > 5) {
                this.scanResults.recommendations.push(`${fileName}: Many inline styles found (${inlineStyles.length}) - consider external CSS`);
            }
            
            // Check for external resources without integrity
            const externalScripts = content.match(/<script[^>]*src\s*=\s*["']https?:\/\/[^"']*["'][^>]*>/gi) || [];
            for (const script of externalScripts) {
                if (!script.includes('integrity=')) {
                    this.scanResults.warnings.push(`${fileName}: External script without integrity check: ${script.match(/src\s*=\s*["']([^"']*)["']/)?.[1]}`);
                }
            }
            
            // Check for mixed content
            const httpResources = content.match(/(?:src|href|action)\s*=\s*["']http:\/\/[^"']*["']/gi) || [];
            if (httpResources.length > 0) {
                this.scanResults.vulnerabilities.push(`${fileName}: Mixed content detected - HTTP resources on HTTPS page`);
            }
            
            // Check for potential XSS vulnerabilities
            const suspiciousPatterns = [
                /javascript:/gi,
                /vbscript:/gi,
                /data:text\/html/gi,
                /eval\s*\(/gi,
                /innerHTML\s*=/gi
            ];
            
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(content)) {
                    this.scanResults.warnings.push(`${fileName}: Potentially unsafe pattern detected: ${pattern.source}`);
                }
            }
            
            // Check for form security
            const forms = content.match(/<form[^>]*>/gi) || [];
            for (const form of forms) {
                if (!form.includes('method=') || form.includes('method="get"')) {
                    this.scanResults.warnings.push(`${fileName}: Form without POST method or using GET for sensitive data`);
                }
            }
        }
        
        this.scanResults.details.content.push({
            type: 'html_security',
            files_scanned: htmlFiles.length,
            issues_found: this.scanResults.vulnerabilities.length + this.scanResults.warnings.length
        });
    }

    /**
     * Scan JavaScript files for security issues
     */
    async scanJavaScriptFiles() {
        console.log('📜 Scanning JavaScript files for security issues...');
        
        const jsFiles = this.getAllFiles(this.publicDir).filter(f => f.endsWith('.js'));
        
        for (const file of jsFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const fileName = path.basename(file);
            
            // Check for dangerous functions
            const dangerousFunctions = [
                'eval(',
                'Function(',
                'setTimeout(',
                'setInterval(',
                'document.write(',
                'innerHTML =',
                'outerHTML ='
            ];
            
            for (const func of dangerousFunctions) {
                if (content.includes(func)) {
                    this.scanResults.warnings.push(`${fileName}: Potentially dangerous function used: ${func}`);
                }
            }
            
            // Check for console.log statements (should be removed in production)
            const consoleStatements = (content.match(/console\.(log|debug|info|warn|error)/g) || []).length;
            if (consoleStatements > 0) {
                this.scanResults.recommendations.push(`${fileName}: ${consoleStatements} console statement(s) found - consider removing for production`);
            }
            
            // Check for hardcoded credentials or API keys
            const credentialPatterns = [
                /password\s*[:=]\s*["'][^"']+["']/gi,
                /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
                /secret\s*[:=]\s*["'][^"']+["']/gi,
                /token\s*[:=]\s*["'][^"']+["']/gi
            ];
            
            for (const pattern of credentialPatterns) {
                if (pattern.test(content)) {
                    this.scanResults.vulnerabilities.push(`${fileName}: Potential hardcoded credentials detected`);
                }
            }
            
            // Check for AJAX requests without CSRF protection
            const ajaxPatterns = [
                /\$\.ajax\(/gi,
                /\$\.post\(/gi,
                /fetch\(/gi,
                /XMLHttpRequest/gi
            ];
            
            for (const pattern of ajaxPatterns) {
                if (pattern.test(content) && !content.includes('csrf') && !content.includes('token')) {
                    this.scanResults.warnings.push(`${fileName}: AJAX request without apparent CSRF protection`);
                }
            }
        }
    }

    /**
     * Scan CSS files for security issues
     */
    async scanCSSFiles() {
        console.log('🎨 Scanning CSS files for security issues...');
        
        const cssFiles = this.getAllFiles(this.publicDir).filter(f => f.endsWith('.css'));
        
        for (const file of cssFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const fileName = path.basename(file);
            
            // Check for external resources
            const externalResources = content.match(/@import\s+url\(["']?https?:\/\/[^"')]+["']?\)/gi) || [];
            if (externalResources.length > 0) {
                this.scanResults.recommendations.push(`${fileName}: External CSS imports found - consider hosting locally for better security`);
            }
            
            // Check for data URIs
            const dataUris = content.match(/url\(["']?data:[^"')]+["']?\)/gi) || [];
            if (dataUris.length > 10) {
                this.scanResults.recommendations.push(`${fileName}: Many data URIs found (${dataUris.length}) - monitor for potential data exfiltration`);
            }
        }
    }

    /**
     * Scan form security implementations
     */
    async scanFormSecurity() {
        console.log('📝 Scanning form security implementations...');
        
        // Check for contact form handler
        const contactFormPath = path.join(this.publicDir, 'contact-form-handler.php');
        if (fs.existsSync(contactFormPath)) {
            const content = fs.readFileSync(contactFormPath, 'utf8');
            
            // Check for input validation
            if (!content.includes('filter_var') && !content.includes('htmlspecialchars')) {
                this.scanResults.vulnerabilities.push('Contact form lacks proper input validation');
            }
            
            // Check for CSRF protection
            if (!content.includes('csrf') && !content.includes('token')) {
                this.scanResults.vulnerabilities.push('Contact form lacks CSRF protection');
            }
            
            // Check for rate limiting
            if (!content.includes('rate') && !content.includes('limit')) {
                this.scanResults.warnings.push('Contact form lacks rate limiting');
            }
            
            // Check for email header injection protection
            if (!content.includes('strip') && !content.includes('filter')) {
                this.scanResults.warnings.push('Contact form may be vulnerable to email header injection');
            }
            
        } else {
            this.scanResults.recommendations.push('Contact form handler not found - ensure forms are properly secured');
        }
    }

    /**
     * Scan external resources and dependencies
     */
    async scanExternalResources() {
        console.log('🌐 Scanning external resources and dependencies...');
        
        const htmlFiles = this.getAllFiles(this.publicDir).filter(f => f.endsWith('.html'));
        const externalResources = new Set();
        
        for (const file of htmlFiles) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Extract external resources
            const resources = [
                ...(content.match(/src\s*=\s*["']https?:\/\/[^"']*["']/gi) || []),
                ...(content.match(/href\s*=\s*["']https?:\/\/[^"']*["']/gi) || [])
            ];
            
            resources.forEach(resource => {
                const url = resource.match(/["']([^"']*)["']/)?.[1];
                if (url) externalResources.add(url);
            });
        }
        
        // Check external resources
        for (const resource of externalResources) {
            const domain = new URL(resource).hostname;
            
            // Check for known CDNs
            const trustedCDNs = [
                'cdnjs.cloudflare.com',
                'cdn.jsdelivr.net',
                'unpkg.com',
                'code.jquery.com',
                'stackpath.bootstrapcdn.com',
                'maxcdn.bootstrapcdn.com',
                'fonts.googleapis.com',
                'fonts.gstatic.com'
            ];
            
            if (!trustedCDNs.includes(domain)) {
                this.scanResults.warnings.push(`External resource from untrusted domain: ${domain}`);
            }
        }
        
        this.scanResults.details.content.push({
            type: 'external_resources',
            total_resources: externalResources.size,
            unique_domains: new Set([...externalResources].map(url => new URL(url).hostname)).size
        });
    }

    /**
     * Scan server configuration for security
     */
    async scanServerConfiguration() {
        console.log('🖥️ Scanning server configuration...');
        
        // Check for robots.txt
        const robotsPath = path.join(this.publicDir, 'robots.txt');
        if (fs.existsSync(robotsPath)) {
            const content = fs.readFileSync(robotsPath, 'utf8');
            
            // Check for sensitive paths in robots.txt
            const sensitivePaths = [
                '/admin',
                '/wp-admin',
                '/config',
                '/database',
                '/backup'
            ];
            
            for (const sensitivePath of sensitivePaths) {
                if (content.includes(sensitivePath)) {
                    this.scanResults.warnings.push(`robots.txt reveals sensitive path: ${sensitivePath}`);
                }
            }
        }
        
        // Check for sitemap.xml
        const sitemapPath = path.join(this.publicDir, 'sitemap.xml');
        if (fs.existsSync(sitemapPath)) {
            const content = fs.readFileSync(sitemapPath, 'utf8');
            
            // Check for sensitive URLs in sitemap
            if (content.includes('/admin') || content.includes('/private')) {
                this.scanResults.warnings.push('Sitemap may contain sensitive URLs');
            }
        }
        
        // Check error pages
        const errorPages = ['404.html', '403.html', '500.html'];
        for (const errorPage of errorPages) {
            const errorPath = path.join(this.publicDir, errorPage);
            if (!fs.existsSync(errorPath)) {
                this.scanResults.recommendations.push(`Custom error page missing: ${errorPage}`);
            }
        }
    }

    /**
     * Calculate overall security score
     */
    async calculateSecurityScore() {
        console.log('📊 Calculating security score...');
        
        let score = 100;
        
        // Deduct points for vulnerabilities (critical issues)
        score -= this.scanResults.vulnerabilities.length * 15;
        
        // Deduct points for warnings (moderate issues)
        score -= this.scanResults.warnings.length * 5;
        
        // Deduct points for missing recommendations (minor issues)
        score -= this.scanResults.recommendations.length * 2;
        
        // Ensure score doesn't go below 0
        score = Math.max(0, score);
        
        this.scanResults.score = score;
        
        // Add security level classification
        if (score >= 90) {
            this.scanResults.level = 'EXCELLENT';
        } else if (score >= 80) {
            this.scanResults.level = 'GOOD';
        } else if (score >= 70) {
            this.scanResults.level = 'FAIR';
        } else if (score >= 60) {
            this.scanResults.level = 'POOR';
        } else {
            this.scanResults.level = 'CRITICAL';
        }
    }

    /**
     * Generate comprehensive security report
     */
    generateSecurityReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🔒 SECURITY SCAN REPORT');
        console.log('='.repeat(60));
        
        console.log(`\nSecurity Score: ${this.scanResults.score}% (${this.scanResults.level})`);
        console.log(`Vulnerabilities: ${this.scanResults.vulnerabilities.length}`);
        console.log(`Warnings: ${this.scanResults.warnings.length}`);
        console.log(`Recommendations: ${this.scanResults.recommendations.length}`);
        
        // Display vulnerabilities
        if (this.scanResults.vulnerabilities.length > 0) {
            console.log('\n❌ CRITICAL VULNERABILITIES:');
            this.scanResults.vulnerabilities.forEach((vuln, index) => {
                console.log(`  ${index + 1}. ${vuln}`);
            });
        }
        
        // Display warnings
        if (this.scanResults.warnings.length > 0) {
            console.log('\n⚠️  SECURITY WARNINGS:');
            this.scanResults.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning}`);
            });
        }
        
        // Display recommendations
        if (this.scanResults.recommendations.length > 0) {
            console.log('\n💡 SECURITY RECOMMENDATIONS:');
            this.scanResults.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec}`);
            });
        }
        
        // Security summary
        console.log('\n📋 SECURITY SUMMARY:');
        if (this.scanResults.score >= 90) {
            console.log('  ✅ Excellent security posture');
            console.log('  🛡️ Website is well-protected against common threats');
        } else if (this.scanResults.score >= 80) {
            console.log('  ✅ Good security posture');
            console.log('  🔧 Address warnings for optimal security');
        } else if (this.scanResults.score >= 70) {
            console.log('  ⚠️  Fair security posture');
            console.log('  🔧 Several security improvements needed');
        } else {
            console.log('  ❌ Poor security posture');
            console.log('  🚨 Immediate security improvements required');
        }
        
        console.log('\n' + '='.repeat(60));
        
        return this.scanResults;
    }

    /**
     * Get all files recursively from a directory
     */
    getAllFiles(dir) {
        const files = [];
        
        if (!fs.existsSync(dir)) {
            return files;
        }
        
        function traverse(currentDir) {
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    traverse(fullPath);
                } else {
                    files.push(fullPath);
                }
            }
        }
        
        traverse(dir);
        return files;
    }
}

// CLI Usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    const options = {
        publicDir: './public',
        configDir: './config'
    };
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--help' || arg === '-h') {
            console.log('Security Scanner');
            console.log('Usage: node security-scanner.js [options]');
            console.log('');
            console.log('Options:');
            console.log('  --public <dir>   Public directory path (default: ./public)');
            console.log('  --config <dir>   Config directory path (default: ./config)');
            console.log('  --help, -h       Show this help message');
            console.log('');
            console.log('Examples:');
            console.log('  node security-scanner.js');
            console.log('  node security-scanner.js --public ./dist --config ./config');
            process.exit(0);
        } else if (arg === '--public') {
            options.publicDir = args[++i];
        } else if (arg === '--config') {
            options.configDir = args[++i];
        }
    }
    
    const scanner = new SecurityScanner(options);
    
    scanner.runSecurityScan()
        .then(results => {
            const isSecure = results.score >= 80 && results.vulnerabilities.length === 0;
            process.exit(isSecure ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Security scan failed:', error.message);
            process.exit(1);
        });
}

module.exports = SecurityScanner;