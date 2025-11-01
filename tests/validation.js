#!/usr/bin/env node

/**
 * Validation Script for Stone OnePoint Solutions Website
 * This script validates the deployment-ready website for common issues
 */

const fs = require('fs');
const path = require('path');

class WebsiteValidator {
    constructor(publicDir = './public') {
        this.publicDir = publicDir;
        this.errors = [];
        this.warnings = [];
        this.passed = [];
    }

    async validate() {
        console.log('=== Stone OnePoint Solutions Website Validation ===\n');
        
        // Run all validation checks
        this.validateDirectoryStructure();
        this.validateRequiredFiles();
        this.validateConfiguration();
        
        // Display results
        this.displayResults();
        
        return {
            errors: this.errors,
            warnings: this.warnings,
            passed: this.passed,
            success: this.errors.length === 0
        };
    }

    validateDirectoryStructure() {
        console.log('Checking directory structure...');
        
        const requiredDirs = [
            'assets',
            'assets/css',
            'assets/js',
            'assets/img',
            'assets/fonts'
        ];

        requiredDirs.forEach(dir => {
            const fullPath = path.join(this.publicDir, dir);
            if (fs.existsSync(fullPath)) {
                this.passed.push(`Directory exists: ${dir}`);
            } else {
                this.errors.push(`Missing directory: ${dir}`);
            }
        });
    }

    validateRequiredFiles() {
        console.log('Checking required files...');
        
        const requiredFiles = [
            'index.html',
            'contact.html',
            'company-profile.html'
        ];

        requiredFiles.forEach(file => {
            const fullPath = path.join(this.publicDir, file);
            if (fs.existsSync(fullPath)) {
                this.passed.push(`Required file exists: ${file}`);
                this.validateHTMLFile(fullPath, file);
            } else {
                this.errors.push(`Missing required file: ${file}`);
            }
        });
    }

    validateHTMLFile(filePath, fileName) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for HTTrack artifacts
            if (content.includes('HTTrack') || content.includes('Mirror and index made by')) {
                this.errors.push(`HTTrack artifacts found in ${fileName}`);
            } else {
                this.passed.push(`No HTTrack artifacts in ${fileName}`);
            }
            
            // Check for proper title tag
            const titleMatch = content.match(/<title>(.*?)<\/title>/i);
            if (titleMatch && titleMatch[1].trim().length > 0) {
                this.passed.push(`Title tag present in ${fileName}`);
            } else {
                this.errors.push(`Missing or empty title tag in ${fileName}`);
            }
            
            // Check for meta description
            if (content.includes('name="description"')) {
                this.passed.push(`Meta description present in ${fileName}`);
            } else {
                this.warnings.push(`Missing meta description in ${fileName}`);
            }
            
            // Check for viewport meta tag
            if (content.includes('name="viewport"')) {
                this.passed.push(`Viewport meta tag present in ${fileName}`);
            } else {
                this.warnings.push(`Missing viewport meta tag in ${fileName}`);
            }
            
        } catch (error) {
            this.errors.push(`Error reading ${fileName}: ${error.message}`);
        }
    }

    validateConfiguration() {
        console.log('Checking configuration files...');
        
        const configFiles = [
            '../config/environments/production.json',
            '../config/environments/staging.json',
            '../config/environments/development.json'
        ];

        configFiles.forEach(configFile => {
            const fullPath = path.join(__dirname, configFile);
            if (fs.existsSync(fullPath)) {
                this.passed.push(`Configuration file exists: ${path.basename(configFile)}`);
                this.validateConfigFile(fullPath, path.basename(configFile));
            } else {
                this.errors.push(`Missing configuration file: ${path.basename(configFile)}`);
            }
        });
    }

    validateConfigFile(filePath, fileName) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const config = JSON.parse(content);
            
            // Check required configuration properties
            const requiredProps = ['environment', 'analytics', 'security', 'performance'];
            requiredProps.forEach(prop => {
                if (config.hasOwnProperty(prop)) {
                    this.passed.push(`${fileName} has ${prop} configuration`);
                } else {
                    this.errors.push(`${fileName} missing ${prop} configuration`);
                }
            });
            
        } catch (error) {
            this.errors.push(`Error parsing ${fileName}: ${error.message}`);
        }
    }

    displayResults() {
        console.log('\n=== Validation Results ===\n');
        
        if (this.passed.length > 0) {
            console.log('✅ PASSED CHECKS:');
            this.passed.forEach(check => console.log(`  ✓ ${check}`));
            console.log('');
        }
        
        if (this.warnings.length > 0) {
            console.log('⚠️  WARNINGS:');
            this.warnings.forEach(warning => console.log(`  ⚠ ${warning}`));
            console.log('');
        }
        
        if (this.errors.length > 0) {
            console.log('❌ ERRORS:');
            this.errors.forEach(error => console.log(`  ✗ ${error}`));
            console.log('');
        }
        
        console.log('=== Summary ===');
        console.log(`Passed: ${this.passed.length}`);
        console.log(`Warnings: ${this.warnings.length}`);
        console.log(`Errors: ${this.errors.length}`);
        
        if (this.errors.length === 0) {
            console.log('\n🎉 All validation checks passed! Website is ready for deployment.');
        } else {
            console.log('\n❌ Validation failed. Please fix the errors above before deployment.');
        }
    }
}

// Command line interface
if (require.main === module) {
    const publicDir = process.argv[2] || './public';
    const validator = new WebsiteValidator(publicDir);
    
    validator.validate().then(result => {
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error('Validation error:', error);
        process.exit(1);
    });
}

module.exports = WebsiteValidator;