# Configuration Guide

This directory contains all configuration files for the Stone OnePoint Solutions website deployment across different environments.

## Directory Structure

```
config/
├── apache/                 # Apache web server configurations
│   ├── .htaccess          # Main Apache configuration with security and performance rules
│   └── virtual-host.conf  # Virtual host configuration template
├── nginx/                 # Nginx web server configurations
│   └── nginx.conf         # Nginx server configuration with security and performance rules
├── environments/          # Environment-specific configurations
│   ├── development.json   # Development environment settings
│   ├── staging.json       # Staging environment settings
│   ├── production.json    # Production environment settings
│   ├── .env.template      # Environment variables template
│   ├── .env.development   # Development environment variables
│   ├── .env.staging       # Staging environment variables
│   └── .env.production    # Production environment variables
├── config-loader.js       # Node.js configuration loader
├── config.php            # PHP configuration loader
└── README.md             # This documentation file
```

## Environment Configuration

### JSON Configuration Files

Each environment has a corresponding JSON configuration file that defines:

- **Environment settings**: Debug mode, minification, compression
- **Analytics**: Google Analytics, Tag Manager, Facebook Pixel
- **Security**: Security headers, HTTPS enforcement, CSRF protection
- **Performance**: Image optimization, CSS/JS minification, caching
- **SEO**: Meta tags, structured data, sitemap generation
- **Contact**: Form processing, email delivery configuration
- **Features**: Feature flags for different functionality

### Environment Variables

Environment variables are used for sensitive data and environment-specific values:

- **Database credentials** (if needed)
- **SMTP configuration** for email delivery
- **SSL certificate paths**
- **API keys and secrets**
- **Analytics tracking IDs**

## Usage Instructions

### For Node.js Applications

```javascript
// Load configuration
const config = require('./config/config-loader');

// Get configuration values
const baseUrl = config.getBaseUrl();
const isDebug = config.isDebugMode();
const emailConfig = config.getEmailConfig();

// Check feature flags
if (config.isFeatureEnabled('contactForm')) {
    // Enable contact form functionality
}
```

### For PHP Applications

```php
// Load configuration
$config = require_once 'config/config.php';

// Get configuration values
$baseUrl = $config->getBaseUrl();
$isDebug = $config->isDebugMode();
$emailConfig = $config->getEmailConfig();

// Check feature flags
if ($config->isFeatureEnabled('contactForm')) {
    // Enable contact form functionality
}
```

## Web Server Configuration

### Apache Configuration

1. **Copy `.htaccess`** to your website root directory
2. **Configure virtual host** using `virtual-host.conf` as template
3. **Update SSL paths** in the virtual host configuration
4. **Enable required Apache modules**:
   ```bash
   sudo a2enmod rewrite
   sudo a2enmod ssl
   sudo a2enmod headers
   sudo a2enmod deflate
   sudo a2enmod expires
   ```

### Nginx Configuration

1. **Copy `nginx.conf`** to your Nginx sites-available directory
2. **Update server name** and SSL certificate paths
3. **Create symbolic link** to sites-enabled:
   ```bash
   sudo ln -s /etc/nginx/sites-available/stoneonepointsolutions /etc/nginx/sites-enabled/
   ```
4. **Test and reload** Nginx configuration:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Environment Setup

### Development Environment

1. Copy `.env.development` to `.env`
2. Update any local-specific values
3. Set `NODE_ENV=development`
4. Features are configured for local development with debugging enabled

### Staging Environment

1. Copy `.env.staging` to `.env`
2. Update staging-specific values (database, SMTP, etc.)
3. Set `NODE_ENV=production` and `ENVIRONMENT=staging`
4. Configure staging domain and SSL certificates
5. Robots indexing is disabled to prevent search engine indexing

### Production Environment

1. Copy `.env.production` to `.env`
2. **IMPORTANT**: Update all `CHANGE_ME_*` values with actual production values
3. Set `NODE_ENV=production` and `ENVIRONMENT=production`
4. Configure production domain and SSL certificates
5. Enable all security features and performance optimizations

## Security Considerations

### Required Changes for Production

Before deploying to production, ensure you:

1. **Change all default passwords and secrets**
2. **Update SSL certificate paths**
3. **Configure proper SMTP credentials**
4. **Set strong secret keys for sessions and CSRF**
5. **Review and update security headers**
6. **Enable rate limiting and monitoring**

### Environment Variables Security

- Never commit `.env` files to version control
- Use strong, unique passwords for each environment
- Rotate secrets regularly
- Use environment-specific service accounts
- Enable two-factor authentication where possible

## Performance Configuration

### Caching Strategy

- **Development**: Caching disabled for easier development
- **Staging**: Moderate caching for testing
- **Production**: Aggressive caching for optimal performance

### Asset Optimization

- **CSS/JS Minification**: Enabled in staging and production
- **Image Optimization**: Enabled in staging and production
- **Compression**: Gzip/Brotli enabled for static assets
- **CDN Integration**: Configure CDN URLs in production environment

## Monitoring and Logging

### Log Levels

- **Development**: Debug level with console output
- **Staging**: Info level with file and console output
- **Production**: Error level with file output only

### Analytics Integration

Configure the following in your environment variables:
- Google Analytics tracking ID
- Google Tag Manager container ID (optional)
- Facebook Pixel ID (optional)

## Troubleshooting

### Common Issues

1. **Configuration not loading**: Check file paths and JSON syntax
2. **Environment variables not found**: Verify .env file exists and is readable
3. **SSL errors**: Check certificate paths and permissions
4. **Email not working**: Verify SMTP credentials and server settings
5. **Performance issues**: Check caching and compression settings

### Validation

Use the built-in validation methods:

```javascript
// Node.js
if (!config.validateEnvironment()) {
    console.error('Environment validation failed');
}
```

```php
// PHP
try {
    $config->validateEnvironment();
} catch (Exception $e) {
    error_log('Environment validation failed: ' . $e->getMessage());
}
```

## Support

For configuration support or questions:
- Email: hr@stoneonepointsolutions.in
- Phone: +91 8595378782

## Version History

- **v1.0**: Initial configuration setup with multi-environment support
- **v1.1**: Added comprehensive security headers and performance optimization
- **v1.2**: Enhanced environment variable management and validation