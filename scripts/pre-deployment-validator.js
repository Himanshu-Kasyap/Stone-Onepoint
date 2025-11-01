#!/usr/bin/env node

/**
 * Pre-deployment Validation Script
 * Validates website readiness before deployment
 * Requirements: 4.1, 6.1, 6.2, 6.3
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PreDeploymentValidator {
    constructor(publicDir = './public') {
        this.publicDir = publicDir;
        this.validationResults = {
            security: [],
            performance: [],
            seo: [],
            accessibility: [],
            structure: [],
            errors: [],
            warnings: []
        };
    }

    async validateAll() {
        console.log('🚀 Starting pre-deployment validation...\n');
        
        try {
            await this.validateProjectStructure();
            await this.validateSecurityHeaders();
            await this.validateHTTPS();
            await this.validateSEO();
            await this.validateAccessibility();
            await this.validatePerformance();
            await this.validateConfiguration();
            
            return this.generateReport();
        } catch (error) {
            this.validationResults.errors.push(`Validation failed: ${error.message}`);
            return false;
        }
    }

    async validateProjectStructure() {
        console.log('📁 Validating project structure...');
        
        const requiredFiles = [
            'index.html',
            'assets/css',
            'assets/js',
            'assets/images',
            'sitemap.xml',
            'robots.txt'
        ];

        const requiredConfigFiles = [
            '../config/.htaccess',
            '../config/nginx.conf',
            '../config/security-headers.conf'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.publicDir, file);
            if (!fs.existsSync(filePath)) {
                this.validationResults.errors.push(`Missing required file/directory: ${file}`);
            } else {
                this.validationResults.structure.push(`✓ Found: ${file}`);
            }
        }

        for (const configFile of requiredConfigFiles) {
            const configPath = path.join(__dirname, configFile);
            if (!fs.existsSync(configPath)) {
                this.validationResults.warnings.push(`Missing config file: ${configFile}`);
            } else {
                this.validationResults.structure.push(`✓ Config found: ${configFile}`);
            }
        }
    }

    async validateSecurityHeaders() {
        console.log('🔒 Validating security configuration...');
        
        const htaccessPath = path.join(__dirname, '../config/.htaccess');
        const nginxPath = path.join(__dirname, '../config/nginx.conf');
        
        const requiredSecurityHeaders = [
            'Content-Security-Policy',
            'X-Frame-Options',
            'X-Content-Type-Options',
            'Referrer-Policy',
            'Permissions-Policy'
        ];

        // Check .htaccess file
        if (fs.existsSync(htaccessPath)) {
            const htaccessContent = fs.readFileSync(htaccessPath, 'utf8');
            for (const header of requiredSecurityHeaders) {
                if (htaccessContent.includes(header)) {
                    this.validationResults.security.push(`✓ .htaccess contains ${header}`);
                } else {
                    this.validationResults.errors.push(`Missing security header in .htaccess: ${header}`);
                }
            }
        }

        // Check nginx config
        if (fs.existsSync(nginxPath)) {
            const nginxContent = fs.readFileSync(nginxPath, 'utf8');
            for (const header of requiredSecurityHeaders) {
                if (nginxContent.includes(header)) {
                    this.validationResults.security.push(`✓ nginx.conf contains ${header}`);
                } else {
                    this.validationResults.warnings.push(`Consider adding ${header} to nginx.conf`);
                }
            }
        }
    }

    async validateHTTPS() {
        console.log('🔐 Validating HTTPS enforcement...');
        
        const htmlFiles = this.getHtmlFiles();
        
        for (const file of htmlFiles) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check for HTTP URLs (should be HTTPS)
            const httpUrls = content.match(/http:\/\/(?!localhost|127\.0\.0\.1)[^\s"'<>]+/g);
            if (httpUrls && httpUrls.length > 0) {
                this.validationResults.errors.push(`HTTP URLs found in ${path.basename(file)}: ${httpUrls.join(', ')}`);
            } else {
                this.validationResults.security.push(`✓ No HTTP URLs in ${path.basename(file)}`);
            }
        }
    }

    async validateSEO() {
        console.log('🔍 Validating SEO elements...');
        
        const htmlFiles = this.getHtmlFiles();
        
        for (const file of htmlFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const fileName = path.basename(file);
            
            // Check for title tag
            const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch) {
                const title = titleMatch[1].trim();
                if (title.length > 0 && title.length <= 60) {
                    this.validationResults.seo.push(`✓ ${fileName}: Good title length (${title.length} chars)`);
                } else if (title.length > 60) {
                    this.validationResults.warnings.push(`${fileName}: Title too long (${title.length} chars)`);
                } else {
                    this.validationResults.errors.push(`${fileName}: Empty title tag`);
                }
            } else {
                this.validationResults.errors.push(`${fileName}: Missing title tag`);
            }
            
            // Check for meta description
            const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
            if (descMatch) {
                const desc = descMatch[1].trim();
                if (desc.length >= 120 && desc.length <= 160) {
                    this.validationResults.seo.push(`✓ ${fileName}: Good meta description length (${desc.length} chars)`);
                } else {
                    this.validationResults.warnings.push(`${fileName}: Meta description length not optimal (${desc.length} chars)`);
                }
            } else {
                this.validationResults.errors.push(`${fileName}: Missing meta description`);
            }
            
            // Check for H1 tag
            const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
            if (h1Match) {
                this.validationResults.seo.push(`✓ ${fileName}: Has H1 tag`);
            } else {
                this.validationResults.errors.push(`${fileName}: Missing H1 tag`);
            }
        }
        
        // Check sitemap.xml
        const sitemapPath = path.join(this.publicDir, 'sitemap.xml');
        if (fs.existsSync(sitemapPath)) {
            this.validationResults.seo.push('✓ sitemap.xml exists');
        } else {
            this.validationResults.errors.push('Missing sitemap.xml');
        }
        
        // Check robots.txt
        const robotsPath = path.join(this.publicDir, 'robots.txt');
        if (fs.existsSync(robotsPath)) {
            this.validationResults.seo.push('✓ robots.txt exists');
        } else {
            this.validationResults.errors.push('Missing robots.txt');
        }
    }

    async validateAccessibility() {
        console.log('♿ Validating accessibility features...');
        
        const htmlFiles = this.getHtmlFiles();
        
        for (const file of htmlFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const fileName = path.basename(file);
            
            // Check for alt attributes on images
            const imgTags = content.match(/<img[^>]*>/gi) || [];
            let missingAlt = 0;
            
            for (const img of imgTags) {
                if (!img.includes('alt=')) {
                    missingAlt++;
                }
            }
            
            if (missingAlt === 0 && imgTags.length > 0) {
                this.validationResults.accessibility.push(`✓ ${fileName}: All images have alt attributes`);
            } else if (missingAlt > 0) {
                this.validationResults.errors.push(`${fileName}: ${missingAlt} images missing alt attributes`);
            }
            
            // Check for skip navigation links
            if (content.includes('skip-navigation') || content.includes('skip-to-content')) {
                this.validationResults.accessibility.push(`✓ ${fileName}: Has skip navigation`);
            } else {
                this.validationResults.warnings.push(`${fileName}: Consider adding skip navigation`);
            }
            
            // Check for ARIA labels on interactive elements
            const interactiveElements = content.match(/<(button|input|select|textarea)[^>]*>/gi) || [];
            let missingAria = 0;
            
            for (const element of interactiveElements) {
                if (!element.includes('aria-label') && !element.includes('aria-labelledby')) {
                    missingAria++;
                }
            }
            
            if (missingAria === 0 && interactiveElements.length > 0) {
                this.validationResults.accessibility.push(`✓ ${fileName}: Interactive elements have ARIA labels`);
            } else if (missingAria > 0) {
                this.validationResults.warnings.push(`${fileName}: ${missingAria} interactive elements could use ARIA labels`);
            }
        }
    }

    async validatePerformance() {
        console.log('⚡ Validating performance optimizations...');
        
        // Check for minified CSS files
        const cssDir = path.join(this.publicDir, 'assets/css');
        if (fs.existsSync(cssDir)) {
            const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
            const minifiedCss = cssFiles.filter(f => f.includes('.min.'));
            
            if (minifiedCss.length > 0) {
                this.validationResults.performance.push(`✓ Found ${minifiedCss.length} minified CSS files`);
            } else {
                this.validationResults.warnings.push('No minified CSS files found');
            }
        }
        
        // Check for minified JS files
        const jsDir = path.join(this.publicDir, 'assets/js');
        if (fs.existsSync(jsDir)) {
            const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
            const minifiedJs = jsFiles.filter(f => f.includes('.min.'));
            
            if (minifiedJs.length > 0) {
                this.validationResults.performance.push(`✓ Found ${minifiedJs.length} minified JS files`);
            } else {
                this.validationResults.warnings.push('No minified JS files found');
            }
        }
        
        // Check for WebP images
        const imgDir = path.join(this.publicDir, 'assets/images');
        if (fs.existsSync(imgDir)) {
            const webpFiles = this.getAllFiles(imgDir).filter(f => f.endsWith('.webp'));
            
            if (webpFiles.length > 0) {
                this.validationResults.performance.push(`✓ Found ${webpFiles.length} WebP images`);
            } else {
                this.validationResults.warnings.push('No WebP images found - consider converting for better performance');
            }
        }
    }

    async validateConfiguration() {
        console.log('⚙️ Validating deployment configuration...');
        
        // Check package.json
        const packagePath = path.join(__dirname, '../package.json');
        if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            if (packageJson.scripts && packageJson.scripts.build) {
                this.validationResults.structure.push('✓ Build script configured');
            } else {
                this.validationResults.warnings.push('No build script found in package.json');
            }
            
            if (packageJson.scripts && packageJson.scripts.deploy) {
                this.validationResults.structure.push('✓ Deploy script configured');
            } else {
                this.validationResults.warnings.push('No deploy script found in package.json');
            }
        }
        
        // Check for environment configurations
        const configDir = path.join(__dirname, '../config');
        if (fs.existsSync(configDir)) {
            const configFiles = fs.readdirSync(configDir);
            this.validationResults.structure.push(`✓ Found ${configFiles.length} configuration files`);
        }
    }

    getHtmlFiles() {
        const htmlFiles = [];
        const publicDir = this.publicDir;
        
        if (fs.existsSync(publicDir)) {
            const files = this.getAllFiles(publicDir);
            htmlFiles.push(...files.filter(f => f.endsWith('.html')));
        }
        
        return htmlFiles;
    }

    getAllFiles(dir) {
        const files = [];
        
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

    generateReport() {
        console.log('\n📊 Pre-deployment Validation Report');
        console.log('=====================================\n');
        
        const totalErrors = this.validationResults.errors.length;
        const totalWarnings = this.validationResults.warnings.length;
        
        // Security validation results
        if (this.validationResults.security.length > 0) {
            console.log('🔒 Security Validation:');
            this.validationResults.security.forEach(item => console.log(`  ${item}`));
            console.log('');
        }
        
        // SEO validation results
        if (this.validationResults.seo.length > 0) {
            console.log('🔍 SEO Validation:');
            this.validationResults.seo.forEach(item => console.log(`  ${item}`));
            console.log('');
        }
        
        // Accessibility validation results
        if (this.validationResults.accessibility.length > 0) {
            console.log('♿ Accessibility Validation:');
            this.validationResults.accessibility.forEach(item => console.log(`  ${item}`));
            console.log('');
        }
        
        // Performance validation results
        if (this.validationResults.performance.length > 0) {
            console.log('⚡ Performance Validation:');
            this.validationResults.performance.forEach(item => console.log(`  ${item}`));
            console.log('');
        }
        
        // Structure validation results
        if (this.validationResults.structure.length > 0) {
            console.log('📁 Structure Validation:');
            this.validationResults.structure.forEach(item => console.log(`  ${item}`));
            console.log('');
        }
        
        // Errors
        if (totalErrors > 0) {
            console.log('❌ Errors (must fix before deployment):');
            this.validationResults.errors.forEach(error => console.log(`  ${error}`));
            console.log('');
        }
        
        // Warnings
        if (totalWarnings > 0) {
            console.log('⚠️  Warnings (recommended to fix):');
            this.validationResults.warnings.forEach(warning => console.log(`  ${warning}`));
            console.log('');
        }
        
        // Summary
        console.log('📋 Summary:');
        console.log(`  Errors: ${totalErrors}`);
        console.log(`  Warnings: ${totalWarnings}`);
        
        const isReady = totalErrors === 0;
        console.log(`  Deployment Ready: ${isReady ? '✅ YES' : '❌ NO'}`);
        
        if (isReady) {
            console.log('\n🎉 Website is ready for deployment!');
        } else {
            console.log('\n🚫 Please fix all errors before deploying.');
        }
        
        return isReady;
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new PreDeploymentValidator();
    validator.validateAll().then(isReady => {
        process.exit(isReady ? 0 : 1);
    }).catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = PreDeploymentValidator;