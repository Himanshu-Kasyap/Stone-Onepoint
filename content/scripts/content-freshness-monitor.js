#!/usr/bin/env node

/**
 * Content Freshness Monitor
 * Monitors content age and suggests updates for outdated content
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class ContentFreshnessMonitor {
    constructor() {
        this.publicDir = path.join(__dirname, '../../public');
        this.contentDir = path.join(__dirname, '..');
        this.dataDir = path.join(this.contentDir, 'data');
        
        // Freshness thresholds (in days)
        this.thresholds = {
            critical: 365,    // 1 year - needs immediate update
            warning: 180,     // 6 months - should be reviewed
            notice: 90        // 3 months - consider updating
        };
        
        this.results = {
            critical: [],
            warning: [],
            notice: [],
            fresh: []
        };
    }

    async monitorFreshness() {
        console.log('📅 Starting content freshness monitoring...\n');
        
        // Check HTML files
        const htmlFiles = this.getHTMLFiles(this.publicDir);
        for (const file of htmlFiles) {
            this.checkFileFreshness(file);
        }
        
        // Check data files
        this.checkDataFilesFreshness();
        
        // Check for seasonal content
        this.checkSeasonalContent();
        
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

    checkFileFreshness(filePath) {
        try {
            const stat = fs.statSync(filePath);
            const fileName = path.basename(filePath);
            const lastModified = stat.mtime;
            const daysSinceModified = this.getDaysSince(lastModified);
            
            // Read file content to extract additional metadata
            const content = fs.readFileSync(filePath, 'utf8');
            const contentInfo = this.analyzeContent(content, fileName);
            
            const fileInfo = {
                file: fileName,
                path: filePath,
                lastModified: lastModified.toISOString(),
                daysSinceModified,
                size: stat.size,
                ...contentInfo
            };
            
            // Categorize based on age
            if (daysSinceModified >= this.thresholds.critical) {
                this.results.critical.push(fileInfo);
            } else if (daysSinceModified >= this.thresholds.warning) {
                this.results.warning.push(fileInfo);
            } else if (daysSinceModified >= this.thresholds.notice) {
                this.results.notice.push(fileInfo);
            } else {
                this.results.fresh.push(fileInfo);
            }
            
        } catch (error) {
            console.error(`Error checking freshness for ${filePath}:`, error.message);
        }
    }

    analyzeContent(content, fileName) {
        try {
            const dom = new JSDOM(content);
            const document = dom.window.document;
            
            // Extract metadata
            const title = document.querySelector('title')?.textContent || 'No title';
            const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
            const lastModifiedMeta = document.querySelector('meta[name="last-modified"]')?.getAttribute('content');
            
            // Check for date-sensitive content
            const hasDateReferences = this.checkForDateReferences(content);
            const hasContactInfo = this.checkForContactInfo(content);
            const hasServiceInfo = this.checkForServiceInfo(content);
            const hasPricing = this.checkForPricing(content);
            
            // Calculate content score (higher = more likely to need updates)
            let contentScore = 0;
            if (hasDateReferences) contentScore += 3;
            if (hasContactInfo) contentScore += 2;
            if (hasServiceInfo) contentScore += 2;
            if (hasPricing) contentScore += 4;
            
            // Check for specific outdated patterns
            const outdatedPatterns = this.checkOutdatedPatterns(content);
            
            return {
                title,
                metaDescription: metaDesc,
                lastModifiedMeta,
                hasDateReferences,
                hasContactInfo,
                hasServiceInfo,
                hasPricing,
                contentScore,
                outdatedPatterns,
                wordCount: this.getWordCount(content)
            };
            
        } catch (error) {
            return {
                title: 'Error parsing content',
                contentScore: 0,
                outdatedPatterns: []
            };
        }
    }

    checkForDateReferences(content) {
        const datePatterns = [
            /\b20\d{2}\b/g,           // Years like 2023, 2024
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2}\b/gi,
            /\b\d{1,2}\/\d{1,2}\/20\d{2}\b/g,  // MM/DD/YYYY
            /\bcopyright\s+©?\s*20\d{2}/gi
        ];
        
        return datePatterns.some(pattern => pattern.test(content));
    }

    checkForContactInfo(content) {
        const contactPatterns = [
            /\+91\s*\d{10}/g,         // Indian phone numbers
            /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,  // Phone numbers
            /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,  // Email addresses
            /\baddress\b/gi,
            /\bphone\b/gi,
            /\bemail\b/gi
        ];
        
        return contactPatterns.some(pattern => pattern.test(content));
    }

    checkForServiceInfo(content) {
        const servicePatterns = [
            /\bservice[s]?\b/gi,
            /\bpricing\b/gi,
            /\bpackage[s]?\b/gi,
            /\boffer[s]?\b/gi,
            /\bplan[s]?\b/gi
        ];
        
        return servicePatterns.some(pattern => pattern.test(content));
    }

    checkForPricing(content) {
        const pricingPatterns = [
            /\$\d+/g,
            /₹\d+/g,
            /\bprice[s]?\b/gi,
            /\bcost[s]?\b/gi,
            /\bfee[s]?\b/gi,
            /\brate[s]?\b/gi
        ];
        
        return pricingPatterns.some(pattern => pattern.test(content));
    }

    checkOutdatedPatterns(content) {
        const outdatedPatterns = [];
        
        // Check for old company names or references
        if (content.includes('Bayleaf')) {
            outdatedPatterns.push('Contains legacy "Bayleaf" reference');
        }
        
        // Check for old copyright years
        const currentYear = new Date().getFullYear();
        const copyrightMatch = content.match(/copyright\s+©?\s*(\d{4})/gi);
        if (copyrightMatch) {
            copyrightMatch.forEach(match => {
                const year = parseInt(match.match(/\d{4}/)[0]);
                if (year < currentYear) {
                    outdatedPatterns.push(`Outdated copyright year: ${year}`);
                }
            });
        }
        
        // Check for old technology references
        const oldTechPatterns = [
            { pattern: /internet explorer/gi, message: 'References Internet Explorer' },
            { pattern: /flash player/gi, message: 'References Flash Player' },
            { pattern: /jquery\s+1\./gi, message: 'Uses old jQuery version' }
        ];
        
        oldTechPatterns.forEach(({ pattern, message }) => {
            if (pattern.test(content)) {
                outdatedPatterns.push(message);
            }
        });
        
        return outdatedPatterns;
    }

    getWordCount(content) {
        // Remove HTML tags and count words
        const textContent = content.replace(/<[^>]*>/g, ' ');
        const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    }

    checkDataFilesFreshness() {
        console.log('Checking data files freshness...');
        
        const dataFiles = ['site-config.json', 'services.json', 'pages.json'];
        
        dataFiles.forEach(fileName => {
            const filePath = path.join(this.dataDir, fileName);
            if (fs.existsSync(filePath)) {
                this.checkFileFreshness(filePath);
            }
        });
    }

    checkSeasonalContent() {
        console.log('Checking for seasonal content...');
        
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();
        
        // Check for holiday/seasonal references that might be outdated
        const seasonalPatterns = [
            { pattern: /new year/gi, relevantMonths: [12, 1], message: 'New Year content' },
            { pattern: /christmas/gi, relevantMonths: [11, 12], message: 'Christmas content' },
            { pattern: /diwali/gi, relevantMonths: [10, 11], message: 'Diwali content' },
            { pattern: /summer/gi, relevantMonths: [4, 5, 6], message: 'Summer content' },
            { pattern: /winter/gi, relevantMonths: [11, 12, 1, 2], message: 'Winter content' }
        ];
        
        this.results.critical.forEach(file => {
            if (file.path.endsWith('.html')) {
                try {
                    const content = fs.readFileSync(file.path, 'utf8');
                    seasonalPatterns.forEach(({ pattern, relevantMonths, message }) => {
                        if (pattern.test(content) && !relevantMonths.includes(currentMonth)) {
                            file.seasonalIssues = file.seasonalIssues || [];
                            file.seasonalIssues.push(`${message} may be out of season`);
                        }
                    });
                } catch (error) {
                    // Ignore errors
                }
            }
        });
    }

    getDaysSince(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    generateReport() {
        console.log('\n📅 Content Freshness Report');
        console.log('='.repeat(50));
        
        const totalFiles = this.results.critical.length + this.results.warning.length + 
                          this.results.notice.length + this.results.fresh.length;
        
        console.log(`\n📊 Summary:`);
        console.log(`   Total files analyzed: ${totalFiles}`);
        console.log(`   🔴 Critical (>1 year): ${this.results.critical.length}`);
        console.log(`   🟡 Warning (>6 months): ${this.results.warning.length}`);
        console.log(`   🟠 Notice (>3 months): ${this.results.notice.length}`);
        console.log(`   🟢 Fresh (<3 months): ${this.results.fresh.length}`);
        
        // Show critical files that need immediate attention
        if (this.results.critical.length > 0) {
            console.log(`\n🔴 Critical - Needs Immediate Update (${this.results.critical.length}):`);
            this.results.critical.forEach((file, index) => {
                console.log(`\n${index + 1}. ${file.file}`);
                console.log(`   Last modified: ${new Date(file.lastModified).toLocaleDateString()}`);
                console.log(`   Days old: ${file.daysSinceModified}`);
                console.log(`   Content score: ${file.contentScore}/10`);
                if (file.outdatedPatterns.length > 0) {
                    console.log(`   Issues: ${file.outdatedPatterns.join(', ')}`);
                }
                if (file.seasonalIssues && file.seasonalIssues.length > 0) {
                    console.log(`   Seasonal: ${file.seasonalIssues.join(', ')}`);
                }
            });
        }
        
        // Show warning files
        if (this.results.warning.length > 0) {
            console.log(`\n🟡 Warning - Should Be Reviewed (${this.results.warning.length}):`);
            this.results.warning.slice(0, 5).forEach((file, index) => {
                console.log(`${index + 1}. ${file.file} (${file.daysSinceModified} days old)`);
            });
            if (this.results.warning.length > 5) {
                console.log(`   ... and ${this.results.warning.length - 5} more`);
            }
        }
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        
        if (this.results.critical.length > 0) {
            console.log('   • Update critical files immediately');
            console.log('   • Review and update contact information');
            console.log('   • Check for outdated service descriptions');
        }
        
        if (this.results.warning.length > 0) {
            console.log('   • Schedule review of warning files');
            console.log('   • Update copyright years');
            console.log('   • Refresh content with current information');
        }
        
        console.log('   • Set up regular content review schedule');
        console.log('   • Consider adding "last updated" dates to pages');
        console.log('   • Implement content calendar for regular updates');
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles,
                critical: this.results.critical.length,
                warning: this.results.warning.length,
                notice: this.results.notice.length,
                fresh: this.results.fresh.length
            },
            thresholds: this.thresholds,
            results: this.results
        };
        
        const reportPath = path.join(this.contentDir, 'validation/freshness-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Generate content update schedule
        this.generateUpdateSchedule();
    }

    generateUpdateSchedule() {
        const schedule = {
            immediate: this.results.critical.map(f => ({
                file: f.file,
                priority: 'High',
                reason: `${f.daysSinceModified} days old`,
                issues: f.outdatedPatterns
            })),
            thisMonth: this.results.warning.map(f => ({
                file: f.file,
                priority: 'Medium',
                reason: `${f.daysSinceModified} days old`
            })),
            nextMonth: this.results.notice.map(f => ({
                file: f.file,
                priority: 'Low',
                reason: `${f.daysSinceModified} days old`
            }))
        };
        
        const schedulePath = path.join(this.contentDir, 'validation/update-schedule.json');
        fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));
        
        console.log(`📅 Update schedule saved to: ${schedulePath}`);
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new ContentFreshnessMonitor();
    monitor.monitorFreshness();
}

module.exports = ContentFreshnessMonitor;