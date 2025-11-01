#!/usr/bin/env node

/**
 * Test Suite for Deployment Validation System
 * Tests all components of the deployment validation checklist
 */

const fs = require('fs');
const path = require('path');
const DeploymentValidationChecklist = require('../scripts/deployment-validation-checklist');
const PreDeploymentValidator = require('../scripts/pre-deployment-validator');
const SecurityScanner = require('../scripts/security-scanner');

class DeploymentValidationTest {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
    }

    /**
     * Run all deployment validation tests
     */
    async runAllTests() {
        console.log('🧪 Running Deployment Validation Tests\n');
        
        try {
            await this.testPreDeploymentValidator();
            await this.testSecurityScanner();
            await this.testDeploymentChecklist();
            await this.testReportGeneration();
            
            this.displayTestResults();
            return this.testResults.failed === 0;
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            return false;
        }
    }

    /**
     * Test pre-deployment validator
     */
    async testPreDeploymentValidator() {
        console.log('📋 Testing Pre-deployment Validator...');
        
        try {
            const validator = new PreDeploymentValidator('./public');
            
            // Test validator initialization
            this.assert(
                validator instanceof PreDeploymentValidator,
                'Pre-deployment validator should initialize correctly'
            );
            
            // Test validation methods exist
            this.assert(
                typeof validator.validateAll === 'function',
                'Validator should have validateAll method'
            );
            
            this.assert(
                typeof validator.validateProjectStructure === 'function',
                'Validator should have validateProjectStructure method'
            );
            
            this.assert(
                typeof validator.validateSecurityHeaders === 'function',
                'Validator should have validateSecurityHeaders method'
            );
            
            // Test validation results structure
            this.assert(
                validator.validationResults && typeof validator.validationResults === 'object',
                'Validator should have validationResults object'
            );
            
            console.log('  ✅ Pre-deployment validator tests passed\n');
            
        } catch (error) {
            this.assert(false, `Pre-deployment validator test failed: ${error.message}`);
        }
    }

    /**
     * Test security scanner
     */
    async testSecurityScanner() {
        console.log('🔒 Testing Security Scanner...');
        
        try {
            const scanner = new SecurityScanner({
                publicDir: './public',
                configDir: './config'
            });
            
            // Test scanner initialization
            this.assert(
                scanner instanceof SecurityScanner,
                'Security scanner should initialize correctly'
            );
            
            // Test scanner methods exist
            this.assert(
                typeof scanner.runSecurityScan === 'function',
                'Scanner should have runSecurityScan method'
            );
            
            this.assert(
                typeof scanner.scanFilePermissions === 'function',
                'Scanner should have scanFilePermissions method'
            );
            
            this.assert(
                typeof scanner.scanConfigurationFiles === 'function',
                'Scanner should have scanConfigurationFiles method'
            );
            
            // Test scan results structure
            this.assert(
                scanner.scanResults && typeof scanner.scanResults === 'object',
                'Scanner should have scanResults object'
            );
            
            this.assert(
                Array.isArray(scanner.scanResults.vulnerabilities),
                'Scanner should have vulnerabilities array'
            );
            
            console.log('  ✅ Security scanner tests passed\n');
            
        } catch (error) {
            this.assert(false, `Security scanner test failed: ${error.message}`);
        }
    }

    /**
     * Test deployment validation checklist
     */
    async testDeploymentChecklist() {
        console.log('📊 Testing Deployment Validation Checklist...');
        
        try {
            const checklist = new DeploymentValidationChecklist({
                environment: 'test',
                publicDir: './public',
                configDir: './config',
                skipPostDeployment: true
            });
            
            // Test checklist initialization
            this.assert(
                checklist instanceof DeploymentValidationChecklist,
                'Deployment checklist should initialize correctly'
            );
            
            // Test checklist structure
            this.assert(
                checklist.checklist && typeof checklist.checklist === 'object',
                'Checklist should have checklist object'
            );
            
            this.assert(
                Array.isArray(checklist.checklist.preDeployment),
                'Checklist should have preDeployment array'
            );
            
            this.assert(
                Array.isArray(checklist.checklist.security),
                'Checklist should have security array'
            );
            
            this.assert(
                Array.isArray(checklist.checklist.postDeployment),
                'Checklist should have postDeployment array'
            );
            
            // Test checklist methods
            this.assert(
                typeof checklist.runCompleteValidation === 'function',
                'Checklist should have runCompleteValidation method'
            );
            
            this.assert(
                typeof checklist.calculateOverallStatus === 'function',
                'Checklist should have calculateOverallStatus method'
            );
            
            // Test helper methods
            this.assert(
                typeof checklist.getTotalChecklistItems === 'function',
                'Checklist should have getTotalChecklistItems method'
            );
            
            const totalItems = checklist.getTotalChecklistItems();
            this.assert(
                totalItems > 0,
                'Checklist should have items'
            );
            
            console.log('  ✅ Deployment checklist tests passed\n');
            
        } catch (error) {
            this.assert(false, `Deployment checklist test failed: ${error.message}`);
        }
    }

    /**
     * Test report generation
     */
    async testReportGeneration() {
        console.log('📄 Testing Report Generation...');
        
        try {
            // Create test reports directory
            const testReportsDir = './test-reports';
            if (!fs.existsSync(testReportsDir)) {
                fs.mkdirSync(testReportsDir, { recursive: true });
            }
            
            const checklist = new DeploymentValidationChecklist({
                environment: 'test',
                outputDir: testReportsDir,
                skipPostDeployment: true
            });
            
            // Test report generation methods
            this.assert(
                typeof checklist.generateChecklistReport === 'function',
                'Checklist should have generateChecklistReport method'
            );
            
            this.assert(
                typeof checklist.generateMarkdownReport === 'function',
                'Checklist should have generateMarkdownReport method'
            );
            
            // Test that reports directory can be created
            this.assert(
                fs.existsSync(testReportsDir),
                'Reports directory should be created'
            );
            
            // Clean up test directory
            if (fs.existsSync(testReportsDir)) {
                fs.rmSync(testReportsDir, { recursive: true, force: true });
            }
            
            console.log('  ✅ Report generation tests passed\n');
            
        } catch (error) {
            this.assert(false, `Report generation test failed: ${error.message}`);
        }
    }

    /**
     * Test file structure validation
     */
    async testFileStructure() {
        console.log('📁 Testing File Structure...');
        
        const requiredFiles = [
            'scripts/deployment-validation-checklist.js',
            'scripts/validate-deployment.js',
            'scripts/pre-deployment-validator.js',
            'scripts/post-deployment-verifier.js',
            'scripts/security-scanner.js',
            'scripts/deployment-readiness-report.js'
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, '..', file);
            this.assert(
                fs.existsSync(filePath),
                `Required file should exist: ${file}`
            );
        }
        
        console.log('  ✅ File structure tests passed\n');
    }

    /**
     * Test configuration validation
     */
    async testConfigurationValidation() {
        console.log('⚙️ Testing Configuration Validation...');
        
        try {
            // Test that configuration directories exist
            const configDirs = ['./config', './public'];
            
            for (const dir of configDirs) {
                if (fs.existsSync(dir)) {
                    this.assert(
                        fs.statSync(dir).isDirectory(),
                        `${dir} should be a directory`
                    );
                }
            }
            
            console.log('  ✅ Configuration validation tests passed\n');
            
        } catch (error) {
            this.assert(false, `Configuration validation test failed: ${error.message}`);
        }
    }

    /**
     * Assert helper method
     */
    assert(condition, message) {
        this.testResults.total++;
        
        if (condition) {
            this.testResults.passed++;
            this.testResults.details.push({ status: 'PASS', message });
        } else {
            this.testResults.failed++;
            this.testResults.details.push({ status: 'FAIL', message });
            console.log(`  ❌ ${message}`);
        }
    }

    /**
     * Display test results
     */
    displayTestResults() {
        console.log('='.repeat(60));
        console.log('🧪 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\nTotal Tests: ${this.testResults.total}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
        
        if (this.testResults.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.details
                .filter(test => test.status === 'FAIL')
                .forEach(test => console.log(`  - ${test.message}`));
        }
        
        const overallStatus = this.testResults.failed === 0 ? 'PASSED' : 'FAILED';
        console.log(`\nOverall Status: ${overallStatus}`);
        
        if (overallStatus === 'PASSED') {
            console.log('\n🎉 All deployment validation tests passed!');
            console.log('✅ The deployment validation system is ready to use.');
        } else {
            console.log('\n🚨 Some tests failed. Please review and fix the issues.');
        }
        
        console.log('\n' + '='.repeat(60));
    }
}

// CLI Usage
if (require.main === module) {
    const tester = new DeploymentValidationTest();
    
    tester.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Test execution failed:', error.message);
            process.exit(1);
        });
}

module.exports = DeploymentValidationTest;