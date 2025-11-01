#!/usr/bin/env node

/**
 * Deployment Validation Checklist
 * Comprehensive deployment validation system that orchestrates all validation components
 * Requirements: 4.1, 6.1, 6.2, 6.3
 */

const fs = require('fs');
const path = require('path');
const PreDeploymentValidator = require('./pre-deployment-validator');
const PostDeploymentVerifier = require('./post-deployment-verifier');
const SecurityScanner = require('./security-scanner');
const DeploymentReadinessReport = require('./deployment-readiness-report');

class DeploymentValidationChecklist {
    constructor(options = {}) {
        this.environment = options.environment || 'production';
        this.baseUrl = options.baseUrl || null;
        this.publicDir = options.publicDir || './public';
        this.configDir = options.configDir || './config';
        this.outputDir = options.outputDir || './reports';
        this.skipPostDeployment = options.skipPostDeployment || false;
        
        this.validationResults = {
            preDeployment: null,
            security: null,
            postDeployment: null,
            overall: {
                status: 'UNKNOWN',
                score: 0,
                readyForDeployment: false,
                criticalIssues: [],
                warnings: [],
                recommendations: []
            }
        };
        
        this.checklist = this.initializeChecklist();
    }

    /**
     * Initialize the deployment validation checklist
     */
    initializeChecklist() {
        return {
            preDeployment: [
                { id: 'structure', name: 'Project Structure Validation', status: 'pending', required: true },
                { id: 'security_headers', name: 'Security Headers Configuration', status: 'pending', required: true },
                { id: 'https_enforcement', name: 'HTTPS Enforcement', status: 'pending', required: true },
                { id: 'seo_optimization', name: 'SEO Optimization', status: 'pending', required: true },
                { id: 'accessibility', name: 'Accessibility Compliance', status: 'pending', required: true },
                { id: 'performance', name: 'Performance Optimization', status: 'pending', required: false },
                { id: 'configuration', name: 'Deployment Configuration', status: 'pending', required: true }
            ],
            security: [
                { id: 'file_permissions', name: 'File Permissions & Sensitive Files', status: 'pending', required: true },
                { id: 'server_config', name: 'Server Configuration Security', status: 'pending', required: true },
                { id: 'content_security', name: 'Content Security Analysis', status: 'pending', required: true },
                { id: 'form_security', name: 'Form Security Implementation', status: 'pending', required: true },
                { id: 'external_resources', name: 'External Resources Security', status: 'pending', required: false },
                { id: 'vulnerability_scan', name: 'Vulnerability Assessment', status: 'pending', required: true }
            ],
            postDeployment: [
                { id: 'connectivity', name: 'Website Connectivity', status: 'pending', required: true },
                { id: 'security_headers_live', name: 'Live Security Headers', status: 'pending', required: true },
                { id: 'https_redirect', name: 'HTTPS Redirect Functionality', status: 'pending', required: true },
                { id: 'page_loading', name: 'Page Loading Performance', status: 'pending', required: true },
                { id: 'seo_elements_live', name: 'Live SEO Elements', status: 'pending', required: true },
                { id: 'forms_functionality', name: 'Forms Functionality', status: 'pending', required: true },
                { id: 'assets_loading', name: 'Assets Loading', status: 'pending', required: false }
            ]
        };
    }

    /**
     * Run complete deployment validation
     */
    async runCompleteValidation() {
        console.log('🚀 Starting Complete Deployment Validation\n');
        console.log(`Environment: ${this.environment}`);
        console.log(`Public Directory: ${this.publicDir}`);
        console.log(`Config Directory: ${this.configDir}`);
        if (this.baseUrl) {
            console.log(`Target URL: ${this.baseUrl}`);
        }
        console.log('\n' + '='.repeat(60) + '\n');

        try {
            // Phase 1: Pre-deployment validation
            await this.runPreDeploymentValidation();
            
            // Phase 2: Security scanning
            await this.runSecurityValidation();
            
            // Phase 3: Post-deployment verification (if URL provided)
            if (this.baseUrl && !this.skipPostDeployment) {
                await this.runPostDeploymentValidation();
            }
            
            // Phase 4: Generate comprehensive report
            await this.generateFinalReport();
            
            return this.validationResults;
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            this.validationResults.overall.criticalIssues.push(`Validation process failed: ${error.message}`);
            return this.validationResults;
        }
    }

    /**
     * Run pre-deployment validation
     */
    async runPreDeploymentValidation() {
        console.log('📋 PHASE 1: PRE-DEPLOYMENT VALIDATION');
        console.log('='.repeat(40));
        
        try {
            const validator = new PreDeploymentValidator(this.publicDir);
            const isReady = await validator.validateAll();
            
            this.validationResults.preDeployment = {
                status: isReady ? 'PASS' : 'FAIL',
                score: this.calculateScoreFromValidator(validator.validationResults),
                details: validator.validationResults,
                timestamp: new Date().toISOString()
            };
            
            // Update checklist items
            this.updateChecklistFromValidation('preDeployment', validator.validationResults);
            
            console.log(`\n✅ Pre-deployment validation completed`);
            console.log(`Status: ${this.validationResults.preDeployment.status}`);
            console.log(`Score: ${this.validationResults.preDeployment.score}%\n`);
            
        } catch (error) {
            console.error('❌ Pre-deployment validation failed:', error.message);
            this.validationResults.preDeployment = {
                status: 'ERROR',
                score: 0,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Run security validation
     */
    async runSecurityValidation() {
        console.log('🔒 PHASE 2: SECURITY VALIDATION');
        console.log('='.repeat(40));
        
        try {
            const scanner = new SecurityScanner({
                publicDir: this.publicDir,
                configDir: this.configDir
            });
            
            const scanResults = await scanner.runSecurityScan();
            
            this.validationResults.security = {
                status: scanResults.score >= 80 && scanResults.vulnerabilities.length === 0 ? 'PASS' : 'FAIL',
                score: scanResults.score,
                details: scanResults,
                timestamp: new Date().toISOString()
            };
            
            // Update checklist items
            this.updateChecklistFromSecurity(scanResults);
            
            console.log(`\n✅ Security validation completed`);
            console.log(`Status: ${this.validationResults.security.status}`);
            console.log(`Score: ${this.validationResults.security.score}%\n`);
            
        } catch (error) {
            console.error('❌ Security validation failed:', error.message);
            this.validationResults.security = {
                status: 'ERROR',
                score: 0,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Run post-deployment validation
     */
    async runPostDeploymentValidation() {
        console.log('🌐 PHASE 3: POST-DEPLOYMENT VALIDATION');
        console.log('='.repeat(40));
        
        try {
            const verifier = new PostDeploymentVerifier(this.baseUrl);
            const isHealthy = await verifier.verifyAll();
            
            this.validationResults.postDeployment = {
                status: isHealthy ? 'PASS' : 'FAIL',
                score: this.calculateScoreFromVerifier(verifier.results),
                details: verifier.results,
                timestamp: new Date().toISOString()
            };
            
            // Update checklist items
            this.updateChecklistFromVerification(verifier.results);
            
            console.log(`\n✅ Post-deployment validation completed`);
            console.log(`Status: ${this.validationResults.postDeployment.status}`);
            console.log(`Score: ${this.validationResults.postDeployment.score}%\n`);
            
        } catch (error) {
            console.error('❌ Post-deployment validation failed:', error.message);
            this.validationResults.postDeployment = {
                status: 'ERROR',
                score: 0,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Generate final comprehensive report
     */
    async generateFinalReport() {
        console.log('📊 PHASE 4: GENERATING FINAL REPORT');
        console.log('='.repeat(40));
        
        // Calculate overall status and score
        this.calculateOverallStatus();
        
        // Generate detailed checklist report
        await this.generateChecklistReport();
        
        // Generate deployment readiness report
        const reporter = new DeploymentReadinessReport({
            environment: this.environment,
            baseUrl: this.baseUrl,
            outputDir: this.outputDir
        });
        
        // Inject our validation results into the reporter
        reporter.reportData.sections = {
            preDeployment: this.validationResults.preDeployment,
            security: this.validationResults.security,
            postDeployment: this.validationResults.postDeployment
        };
        
        await reporter.generateReport();
        
        // Display final summary
        this.displayFinalSummary();
    }

    /**
     * Calculate overall validation status
     */
    calculateOverallStatus() {
        const results = this.validationResults;
        let totalScore = 0;
        let validSections = 0;
        let criticalFailures = 0;
        
        // Calculate weighted average score
        if (results.preDeployment && results.preDeployment.status !== 'ERROR') {
            totalScore += results.preDeployment.score * 0.4; // 40% weight
            validSections++;
            if (results.preDeployment.status === 'FAIL') criticalFailures++;
        }
        
        if (results.security && results.security.status !== 'ERROR') {
            totalScore += results.security.score * 0.4; // 40% weight
            validSections++;
            if (results.security.status === 'FAIL') criticalFailures++;
        }
        
        if (results.postDeployment && results.postDeployment.status !== 'ERROR') {
            totalScore += results.postDeployment.score * 0.2; // 20% weight
            validSections++;
            if (results.postDeployment.status === 'FAIL') criticalFailures++;
        }
        
        const finalScore = validSections > 0 ? Math.round(totalScore / validSections * 100) : 0;
        
        // Determine overall status
        let overallStatus;
        let readyForDeployment = false;
        
        if (criticalFailures === 0 && finalScore >= 90) {
            overallStatus = 'EXCELLENT';
            readyForDeployment = true;
        } else if (criticalFailures === 0 && finalScore >= 80) {
            overallStatus = 'GOOD';
            readyForDeployment = true;
        } else if (criticalFailures === 0 && finalScore >= 70) {
            overallStatus = 'ACCEPTABLE';
            readyForDeployment = true;
        } else if (criticalFailures === 0 && finalScore >= 60) {
            overallStatus = 'NEEDS_IMPROVEMENT';
            readyForDeployment = false;
        } else {
            overallStatus = 'CRITICAL_ISSUES';
            readyForDeployment = false;
        }
        
        // Collect issues and recommendations
        const criticalIssues = [];
        const warnings = [];
        const recommendations = [];
        
        Object.values(results).forEach(result => {
            if (result && result.details) {
                if (result.details.errors) {
                    criticalIssues.push(...result.details.errors);
                }
                if (result.details.warnings) {
                    warnings.push(...result.details.warnings);
                }
                if (result.details.recommendations) {
                    recommendations.push(...result.details.recommendations);
                }
                if (result.details.vulnerabilities) {
                    criticalIssues.push(...result.details.vulnerabilities);
                }
            }
        });
        
        this.validationResults.overall = {
            status: overallStatus,
            score: finalScore,
            readyForDeployment,
            criticalIssues: [...new Set(criticalIssues)], // Remove duplicates
            warnings: [...new Set(warnings)],
            recommendations: [...new Set(recommendations)]
        };
    }

    /**
     * Generate detailed checklist report
     */
    async generateChecklistReport() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.outputDir, `deployment-validation-checklist-${timestamp}.json`);
        
        const checklistReport = {
            metadata: {
                timestamp: new Date().toISOString(),
                environment: this.environment,
                baseUrl: this.baseUrl,
                version: '1.0.0'
            },
            checklist: this.checklist,
            validationResults: this.validationResults,
            summary: {
                totalItems: this.getTotalChecklistItems(),
                passedItems: this.getPassedChecklistItems(),
                failedItems: this.getFailedChecklistItems(),
                pendingItems: this.getPendingChecklistItems()
            }
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(checklistReport, null, 2));
        console.log(`📋 Checklist report saved: ${reportPath}`);
        
        // Also generate a human-readable markdown report
        await this.generateMarkdownReport(checklistReport, timestamp);
    }

    /**
     * Generate markdown report
     */
    async generateMarkdownReport(checklistReport, timestamp) {
        const markdownPath = path.join(this.outputDir, `deployment-validation-report-${timestamp}.md`);
        
        let markdown = `# Deployment Validation Report\n\n`;
        markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
        markdown += `**Environment:** ${this.environment}\n`;
        if (this.baseUrl) {
            markdown += `**Target URL:** ${this.baseUrl}\n`;
        }
        markdown += `**Overall Status:** ${this.validationResults.overall.status}\n`;
        markdown += `**Readiness Score:** ${this.validationResults.overall.score}%\n`;
        markdown += `**Ready for Deployment:** ${this.validationResults.overall.readyForDeployment ? '✅ YES' : '❌ NO'}\n\n`;
        
        // Checklist sections
        Object.entries(this.checklist).forEach(([sectionName, items]) => {
            markdown += `## ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Validation\n\n`;
            
            items.forEach(item => {
                const statusIcon = {
                    'passed': '✅',
                    'failed': '❌',
                    'warning': '⚠️',
                    'pending': '⏳'
                }[item.status] || '❓';
                
                const requiredText = item.required ? ' (Required)' : ' (Optional)';
                markdown += `- ${statusIcon} **${item.name}**${requiredText}\n`;
            });
            
            markdown += '\n';
        });
        
        // Issues and recommendations
        if (this.validationResults.overall.criticalIssues.length > 0) {
            markdown += `## ❌ Critical Issues\n\n`;
            this.validationResults.overall.criticalIssues.forEach(issue => {
                markdown += `- ${issue}\n`;
            });
            markdown += '\n';
        }
        
        if (this.validationResults.overall.warnings.length > 0) {
            markdown += `## ⚠️ Warnings\n\n`;
            this.validationResults.overall.warnings.forEach(warning => {
                markdown += `- ${warning}\n`;
            });
            markdown += '\n';
        }
        
        if (this.validationResults.overall.recommendations.length > 0) {
            markdown += `## 💡 Recommendations\n\n`;
            this.validationResults.overall.recommendations.forEach(rec => {
                markdown += `- ${rec}\n`;
            });
            markdown += '\n';
        }
        
        fs.writeFileSync(markdownPath, markdown);
        console.log(`📄 Markdown report saved: ${markdownPath}`);
    }

    /**
     * Display final summary
     */
    displayFinalSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('🎯 DEPLOYMENT VALIDATION SUMMARY');
        console.log('='.repeat(80));
        
        const statusEmojis = {
            'EXCELLENT': '🟢',
            'GOOD': '🟡',
            'ACCEPTABLE': '🟠',
            'NEEDS_IMPROVEMENT': '🔴',
            'CRITICAL_ISSUES': '🚨'
        };
        
        console.log(`\nOverall Status: ${statusEmojis[this.validationResults.overall.status]} ${this.validationResults.overall.status}`);
        console.log(`Readiness Score: ${this.validationResults.overall.score}%`);
        console.log(`Ready for Deployment: ${this.validationResults.overall.readyForDeployment ? '✅ YES' : '❌ NO'}`);
        
        console.log('\n📊 Validation Phases:');
        if (this.validationResults.preDeployment) {
            console.log(`  Pre-deployment: ${this.validationResults.preDeployment.status} (${this.validationResults.preDeployment.score}%)`);
        }
        if (this.validationResults.security) {
            console.log(`  Security: ${this.validationResults.security.status} (${this.validationResults.security.score}%)`);
        }
        if (this.validationResults.postDeployment) {
            console.log(`  Post-deployment: ${this.validationResults.postDeployment.status} (${this.validationResults.postDeployment.score}%)`);
        }
        
        console.log('\n📋 Checklist Summary:');
        console.log(`  Total Items: ${this.getTotalChecklistItems()}`);
        console.log(`  Passed: ${this.getPassedChecklistItems()}`);
        console.log(`  Failed: ${this.getFailedChecklistItems()}`);
        console.log(`  Pending: ${this.getPendingChecklistItems()}`);
        
        if (this.validationResults.overall.criticalIssues.length > 0) {
            console.log(`\n❌ Critical Issues: ${this.validationResults.overall.criticalIssues.length}`);
        }
        
        if (this.validationResults.overall.warnings.length > 0) {
            console.log(`⚠️  Warnings: ${this.validationResults.overall.warnings.length}`);
        }
        
        if (this.validationResults.overall.recommendations.length > 0) {
            console.log(`💡 Recommendations: ${this.validationResults.overall.recommendations.length}`);
        }
        
        console.log('\n🎯 Next Steps:');
        if (this.validationResults.overall.readyForDeployment) {
            console.log('  ✅ Website is ready for deployment');
            console.log('  📊 Monitor performance after deployment');
            console.log('  🔍 Run post-deployment verification');
        } else {
            console.log('  🔧 Address critical issues before deployment');
            console.log('  📋 Re-run validation after fixes');
            console.log('  👥 Consider additional code review');
        }
        
        console.log('\n' + '='.repeat(80));
    }

    // Helper methods for checklist management
    updateChecklistFromValidation(section, results) {
        // Implementation would map validation results to checklist items
        // This is a simplified version
        if (results.errors && results.errors.length === 0) {
            this.checklist[section].forEach(item => {
                if (item.required) {
                    item.status = 'passed';
                }
            });
        }
    }

    updateChecklistFromSecurity(results) {
        // Map security scan results to checklist items
        this.checklist.security.forEach(item => {
            if (results.vulnerabilities.length === 0) {
                item.status = 'passed';
            } else {
                item.status = 'failed';
            }
        });
    }

    updateChecklistFromVerification(results) {
        // Map verification results to checklist items
        this.checklist.postDeployment.forEach(item => {
            if (results.errors.length === 0) {
                item.status = 'passed';
            } else {
                item.status = 'failed';
            }
        });
    }

    calculateScoreFromValidator(results) {
        const totalIssues = (results.errors?.length || 0) + (results.warnings?.length || 0);
        return Math.max(0, 100 - (totalIssues * 5));
    }

    calculateScoreFromVerifier(results) {
        const totalIssues = (results.errors?.length || 0) + (results.warnings?.length || 0);
        return Math.max(0, 100 - (totalIssues * 5));
    }

    getTotalChecklistItems() {
        return Object.values(this.checklist).reduce((total, items) => total + items.length, 0);
    }

    getPassedChecklistItems() {
        return Object.values(this.checklist).reduce((total, items) => 
            total + items.filter(item => item.status === 'passed').length, 0);
    }

    getFailedChecklistItems() {
        return Object.values(this.checklist).reduce((total, items) => 
            total + items.filter(item => item.status === 'failed').length, 0);
    }

    getPendingChecklistItems() {
        return Object.values(this.checklist).reduce((total, items) => 
            total + items.filter(item => item.status === 'pending').length, 0);
    }
}

// CLI Usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    const options = {
        environment: 'production',
        publicDir: './public',
        configDir: './config',
        outputDir: './reports',
        skipPostDeployment: false
    };
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--help' || arg === '-h') {
            console.log('Deployment Validation Checklist');
            console.log('Usage: node deployment-validation-checklist.js [options] [url]');
            console.log('');
            console.log('Options:');
            console.log('  --env <environment>     Target environment (default: production)');
            console.log('  --public <dir>          Public directory path (default: ./public)');
            console.log('  --config <dir>          Config directory path (default: ./config)');
            console.log('  --output <dir>          Output directory for reports (default: ./reports)');
            console.log('  --skip-post             Skip post-deployment validation');
            console.log('  --help, -h              Show this help message');
            console.log('');
            console.log('Examples:');
            console.log('  node deployment-validation-checklist.js');
            console.log('  node deployment-validation-checklist.js --env staging');
            console.log('  node deployment-validation-checklist.js https://www.example.com');
            console.log('  node deployment-validation-checklist.js --skip-post --env development');
            process.exit(0);
        } else if (arg === '--env') {
            options.environment = args[++i];
        } else if (arg === '--public') {
            options.publicDir = args[++i];
        } else if (arg === '--config') {
            options.configDir = args[++i];
        } else if (arg === '--output') {
            options.outputDir = args[++i];
        } else if (arg === '--skip-post') {
            options.skipPostDeployment = true;
        } else if (arg.startsWith('http')) {
            options.baseUrl = arg;
        }
    }
    
    const validator = new DeploymentValidationChecklist(options);
    
    validator.runCompleteValidation()
        .then(results => {
            const exitCode = results.overall.readyForDeployment ? 0 : 1;
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('❌ Validation process failed:', error.message);
            process.exit(1);
        });
}

module.exports = DeploymentValidationChecklist;