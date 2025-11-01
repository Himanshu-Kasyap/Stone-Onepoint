/**
 * Configuration Loader for Stone OnePoint Solutions Website
 * Loads environment-specific configuration and environment variables
 */

const fs = require('fs');
const path = require('path');

class ConfigLoader {
    constructor() {
        this.environment = process.env.NODE_ENV || 'development';
        this.config = null;
        this.loadConfiguration();
    }

    /**
     * Load configuration based on current environment
     */
    loadConfiguration() {
        try {
            // Load environment-specific JSON configuration
            const configPath = path.join(__dirname, 'environments', `${this.environment}.json`);
            
            if (fs.existsSync(configPath)) {
                const configData = fs.readFileSync(configPath, 'utf8');
                this.config = JSON.parse(configData);
                
                // Replace environment variables in configuration
                this.config = this.replaceEnvironmentVariables(this.config);
                
                console.log(`Configuration loaded for environment: ${this.environment}`);
            } else {
                throw new Error(`Configuration file not found for environment: ${this.environment}`);
            }
        } catch (error) {
            console.error('Error loading configuration:', error.message);
            process.exit(1);
        }
    }

    /**
     * Replace ${VARIABLE} placeholders with actual environment variables
     */
    replaceEnvironmentVariables(obj) {
        if (typeof obj === 'string') {
            return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
                return process.env[varName] || match;
            });
        } else if (Array.isArray(obj)) {
            return obj.map(item => this.replaceEnvironmentVariables(item));
        } else if (obj !== null && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.replaceEnvironmentVariables(value);
            }
            return result;
        }
        return obj;
    }

    /**
     * Get configuration value by key path (e.g., 'analytics.googleAnalytics')
     */
    get(keyPath, defaultValue = null) {
        const keys = keyPath.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    /**
     * Get all configuration
     */
    getAll() {
        return this.config;
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(featureName) {
        return this.get(`features.${featureName}`, false);
    }

    /**
     * Get database configuration
     */
    getDatabaseConfig() {
        return this.get('database', {});
    }

    /**
     * Get email configuration
     */
    getEmailConfig() {
        return this.get('contact', {});
    }

    /**
     * Get analytics configuration
     */
    getAnalyticsConfig() {
        return this.get('analytics', {});
    }

    /**
     * Get security configuration
     */
    getSecurityConfig() {
        return this.get('security', {});
    }

    /**
     * Get performance configuration
     */
    getPerformanceConfig() {
        return this.get('performance', {});
    }

    /**
     * Get SEO configuration
     */
    getSEOConfig() {
        return this.get('seo', {});
    }

    /**
     * Check if debug mode is enabled
     */
    isDebugMode() {
        return this.get('debug', false);
    }

    /**
     * Get base URL
     */
    getBaseUrl() {
        return this.get('baseUrl', 'http://localhost:3000');
    }

    /**
     * Validate required environment variables
     */
    validateEnvironment() {
        const requiredVars = [];
        
        if (this.environment === 'production') {
            requiredVars.push(
                'SMTP_HOST',
                'SMTP_USER', 
                'SMTP_PASSWORD',
                'SECRET_KEY',
                'SSL_CERT_PATH',
                'SSL_KEY_PATH'
            );
        }

        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error('Missing required environment variables:', missingVars.join(', '));
            console.error('Please check your .env file or environment configuration.');
            return false;
        }
        
        return true;
    }

    /**
     * Load environment variables from .env file
     */
    static loadEnvironmentFile(envFile = '.env') {
        const envPath = path.join(process.cwd(), envFile);
        
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            
            lines.forEach(line => {
                line = line.trim();
                if (line && !line.startsWith('#')) {
                    const [key, ...valueParts] = line.split('=');
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                        process.env[key.trim()] = value;
                    }
                }
            });
            
            console.log(`Environment variables loaded from: ${envFile}`);
        } else {
            console.warn(`Environment file not found: ${envFile}`);
        }
    }
}

// Export singleton instance
const configLoader = new ConfigLoader();

module.exports = configLoader;