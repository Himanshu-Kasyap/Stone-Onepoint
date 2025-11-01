#!/usr/bin/env node

/**
 * Simple CLI wrapper for deployment validation
 * Provides an easy-to-use interface for running deployment validation
 */

const DeploymentValidationChecklist = require('./deployment-validation-checklist');

async function main() {
    const args = process.argv.slice(2);
    
    // Show help if no arguments or help requested
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    // Parse arguments
    const options = parseArguments(args);
    
    console.log('🚀 Stone OnePoint Solutions - Deployment Validation');
    console.log('='.repeat(60));
    
    try {
        const validator = new DeploymentValidationChecklist(options);
        const results = await validator.runCompleteValidation();
        
        // Exit with appropriate code
        process.exit(results.overall.readyForDeployment ? 0 : 1);
        
    } catch (error) {
        console.error('\n❌ Validation failed:', error.message);
        process.exit(1);
    }
}

function parseArguments(args) {
    const options = {
        environment: 'production',
        publicDir: './public',
        configDir: './config',
        outputDir: './reports',
        skipPostDeployment: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--env':
            case '-e':
                options.environment = args[++i];
                break;
            case '--public':
            case '-p':
                options.publicDir = args[++i];
                break;
            case '--config':
            case '-c':
                options.configDir = args[++i];
                break;
            case '--output':
            case '-o':
                options.outputDir = args[++i];
                break;
            case '--skip-post':
            case '-s':
                options.skipPostDeployment = true;
                break;
            case '--url':
            case '-u':
                options.baseUrl = args[++i];
                break;
            default:
                // If it looks like a URL, use it as baseUrl
                if (arg.startsWith('http')) {
                    options.baseUrl = arg;
                }
                break;
        }
    }
    
    return options;
}

function showHelp() {
    console.log('🚀 Stone OnePoint Solutions - Deployment Validation');
    console.log('='.repeat(60));
    console.log('');
    console.log('USAGE:');
    console.log('  node validate-deployment.js [options] [url]');
    console.log('');
    console.log('OPTIONS:');
    console.log('  -e, --env <environment>     Target environment (production, staging, development)');
    console.log('  -p, --public <directory>    Public files directory (default: ./public)');
    console.log('  -c, --config <directory>    Configuration directory (default: ./config)');
    console.log('  -o, --output <directory>    Reports output directory (default: ./reports)');
    console.log('  -u, --url <url>             Website URL for post-deployment validation');
    console.log('  -s, --skip-post             Skip post-deployment validation');
    console.log('  -h, --help                  Show this help message');
    console.log('');
    console.log('EXAMPLES:');
    console.log('  # Basic pre-deployment validation');
    console.log('  node validate-deployment.js');
    console.log('');
    console.log('  # Full validation including live website check');
    console.log('  node validate-deployment.js https://www.stoneonepointsolutions.in');
    console.log('');
    console.log('  # Staging environment validation');
    console.log('  node validate-deployment.js --env staging');
    console.log('');
    console.log('  # Custom directories');
    console.log('  node validate-deployment.js --public ./dist --config ./server-config');
    console.log('');
    console.log('VALIDATION PHASES:');
    console.log('  1. 📋 Pre-deployment validation (structure, SEO, performance)');
    console.log('  2. 🔒 Security scanning (vulnerabilities, configurations)');
    console.log('  3. 🌐 Post-deployment verification (live website testing)');
    console.log('  4. 📊 Comprehensive reporting (JSON + Markdown reports)');
    console.log('');
    console.log('EXIT CODES:');
    console.log('  0 = Ready for deployment');
    console.log('  1 = Issues found, not ready for deployment');
    console.log('');
}

// Run the main function
if (require.main === module) {
    main().catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = { main, parseArguments, showHelp };