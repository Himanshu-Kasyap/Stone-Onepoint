#!/usr/bin/env node

/**
 * Simple HTTP to HTTPS URL Updater
 * Updates HTTP URLs to HTTPS in HTML files
 * Stone OnePoint Solutions Website
 */

const fs = require('fs');
const path = require('path');

class HTTPSUpdater {
    constructor() {
        this.publicDir = path.join(__dirname, '../public');
        this.results = {
            filesProcessed: 0,
            urlsUpdated: 0,
            errors: []
        };
    }

    /**
     * Get all HTML files in directory
     */
    getHtmlFiles(dir) {
        const files = [];
        
        function scanDirectory(currentDir) {
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (item.endsWith('.html')) {
                    files.push(fullPath);
                }
            }
        }
        
        scanDirectory(dir);
        return files;
    }

    /**
     * Update HTTP URLs to HTTPS in content
     */
    updateHttpUrls(content) {
        let updatedContent = content;
        let updateCount = 0;

        // Update the specific HTTP URL found in the files
        const httpPattern = /http:\/\/www\.hubtechmediasolutions\.com\//g;
        const matches = content.match(httpPattern);
        
        if (matches) {
            updateCount = matches.length;
            updatedContent = content.replace(httpPattern, 'https://www.hubtechmediasolutions.com/');
        }

        return { content: updatedContent, updateCount };
    }

    /**
     * Process all HTML files
     */
    processFiles() {
        console.log('🔒 Starting HTTP to HTTPS URL updates...\n');
        
        const htmlFiles = this.getHtmlFiles(this.publicDir);
        console.log(`Found ${htmlFiles.length} HTML files to process\n`);

        for (const filePath of htmlFiles) {
            try {
                const originalContent = fs.readFileSync(filePath, 'utf8');
                const { content: updatedContent, updateCount } = this.updateHttpUrls(originalContent);

                if (updateCount > 0) {
                    fs.writeFileSync(filePath, updatedContent, 'utf8');
                    this.results.filesProcessed++;
                    this.results.urlsUpdated += updateCount;
                    
                    const relativePath = path.relative(this.publicDir, filePath);
                    console.log(`✅ Updated ${updateCount} URL(s) in: ${relativePath}`);
                }

            } catch (error) {
                this.results.errors.push(`Error processing ${filePath}: ${error.message}`);
                console.error(`❌ Error processing ${filePath}: ${error.message}`);
            }
        }

        this.generateReport();
    }

    /**
     * Generate report
     */
    generateReport() {
        console.log('\n📊 HTTP to HTTPS Update Report');
        console.log('=' .repeat(40));
        console.log(`Files updated: ${this.results.filesProcessed}`);
        console.log(`URLs updated: ${this.results.urlsUpdated}`);
        console.log(`Errors: ${this.results.errors.length}`);

        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.results.errors.forEach(error => console.log(`  - ${error}`));
        }

        if (this.results.urlsUpdated > 0) {
            console.log('\n✅ Successfully updated HTTP URLs to HTTPS!');
            console.log('💡 Recommendation: Test the updated URLs to ensure they work correctly.');
        } else {
            console.log('\n✅ No HTTP URLs found that needed updating.');
        }
    }
}

// Run the updater
if (require.main === module) {
    const updater = new HTTPSUpdater();
    updater.processFiles();
}

module.exports = HTTPSUpdater;