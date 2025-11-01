<?php
/**
 * PHP Configuration for Stone OnePoint Solutions Website
 * Environment-specific configuration loader
 */

class Config {
    private static $instance = null;
    private $config = [];
    private $environment;

    private function __construct() {
        $this->environment = $_ENV['ENVIRONMENT'] ?? 'production';
        $this->loadConfiguration();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Config();
        }
        return self::$instance;
    }

    private function loadConfiguration() {
        $configFile = __DIR__ . '/environments/' . $this->environment . '.json';
        
        if (file_exists($configFile)) {
            $configData = file_get_contents($configFile);
            $this->config = json_decode($configData, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON in configuration file: ' . json_last_error_msg());
            }
            
            // Replace environment variables
            $this->config = $this->replaceEnvironmentVariables($this->config);
        } else {
            throw new Exception("Configuration file not found for environment: {$this->environment}");
        }
    }

    private function replaceEnvironmentVariables($data) {
        if (is_string($data)) {
            return preg_replace_callback('/\$\{([^}]+)\}/', function($matches) {
                return $_ENV[$matches[1]] ?? $matches[0];
            }, $data);
        } elseif (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = $this->replaceEnvironmentVariables($value);
            }
        }
        return $data;
    }

    public function get($key, $default = null) {
        $keys = explode('.', $key);
        $value = $this->config;
        
        foreach ($keys as $k) {
            if (isset($value[$k])) {
                $value = $value[$k];
            } else {
                return $default;
            }
        }
        
        return $value;
    }

    public function getAll() {
        return $this->config;
    }

    public function getEnvironment() {
        return $this->environment;
    }

    public function isDebugMode() {
        return $this->get('debug', false);
    }

    public function getBaseUrl() {
        return $this->get('baseUrl', 'https://www.stoneonepointsolutions.in');
    }

    public function getEmailConfig() {
        return $this->get('contact', []);
    }

    public function getSecurityConfig() {
        return $this->get('security', []);
    }

    public function isFeatureEnabled($feature) {
        return $this->get("features.{$feature}", false);
    }

    public function getAnalyticsConfig() {
        return $this->get('analytics', []);
    }

    public function getSEOConfig() {
        return $this->get('seo', []);
    }

    public function getPerformanceConfig() {
        return $this->get('performance', []);
    }

    // Website-specific configuration methods
    public function getSiteName() {
        return $_ENV['SITE_NAME'] ?? 'Stone OnePoint Solutions Pvt. Ltd.';
    }

    public function getSiteDescription() {
        return $_ENV['SITE_DESCRIPTION'] ?? "India's premier HR solutions partner";
    }

    public function getContactEmail() {
        return $this->get('contact.fromEmail', 'hr@stoneonepointsolutions.in');
    }

    public function getContactPhone() {
        return '+91 8595378782';
    }

    public function getGoogleAnalyticsId() {
        return $this->get('analytics.googleAnalytics', '');
    }

    public function shouldIndexRobots() {
        return $this->get('seo.robotsIndex', true);
    }

    public function isHTTPSOnly() {
        return $this->get('security.httpsOnly', true);
    }

    public function validateEnvironment() {
        $requiredVars = [];
        
        if ($this->environment === 'production') {
            $requiredVars = [
                'SMTP_HOST',
                'SMTP_USER',
                'SMTP_PASSWORD',
                'SECRET_KEY'
            ];
        }

        $missing = [];
        foreach ($requiredVars as $var) {
            if (!isset($_ENV[$var]) || empty($_ENV[$var])) {
                $missing[] = $var;
            }
        }

        if (!empty($missing)) {
            throw new Exception('Missing required environment variables: ' . implode(', ', $missing));
        }

        return true;
    }
}

// Load environment variables from .env file if it exists
function loadEnvironmentFile($envFile = '.env') {
    $envPath = __DIR__ . '/../' . $envFile;
    
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line && strpos($line, '#') !== 0) {
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    $value = trim($parts[1], '"\'');
                    $_ENV[$key] = $value;
                    putenv("$key=$value");
                }
            }
        }
    }
}

// Auto-load environment file based on environment
$environment = $_ENV['ENVIRONMENT'] ?? 'production';
loadEnvironmentFile(".env.{$environment}");

// Export configuration instance
return Config::getInstance();
?>