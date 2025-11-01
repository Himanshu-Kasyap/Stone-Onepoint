# Comprehensive Deployment Guide - Stone OnePoint Solutions Website

This comprehensive guide provides detailed step-by-step instructions for deploying the Stone OnePoint Solutions website to various hosting environments, including shared hosting, VPS, cloud platforms, and CDN integration.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Hosting Provider Specific Instructions](#hosting-provider-specific-instructions)
3. [Server Configuration](#server-configuration)
4. [Environment Setup](#environment-setup)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance Procedures](#maintenance-procedures)

## Pre-Deployment Checklist

### Required Files and Configuration

Before deploying, ensure you have the following files ready:

```
deployment-ready/
├── public/                 # Website files ready for deployment
├── config/                 # Server configuration files
│   ├── apache/            # Apache .htaccess templates
│   ├── nginx/             # Nginx configuration templates
│   └── environments/      # Environment-specific configs
├── scripts/               # Deployment and maintenance scripts
└── docs/                  # Documentation files
```

### Pre-Deployment Validation

Run the pre-deployment validation script:

```bash
cd deployment-ready
node scripts/pre-deployment-validator.js --environment production
```

This script checks:
- ✅ All required files are present
- ✅ HTML validation passes
- ✅ All internal links are functional
- ✅ Images are optimized
- ✅ Security headers are configured
- ✅ SEO elements are properly set

### Domain and SSL Preparation

1. **Domain Configuration**
   - Ensure domain is registered and active
   - Configure DNS A records to point to your server IP
   - Set up www and non-www redirects

2. **SSL Certificate**
   - Obtain SSL certificate (Let's Encrypt, commercial, or hosting provider)
   - Prepare certificate files: certificate.crt, private.key, ca-bundle.crt

## Hosting Provider Specific Instructions

### 1. Shared Hosting Providers

#### cPanel-based Hosting (Hostinger, Bluehost, SiteGround)

**Step 1: File Upload**

1. **Via File Manager:**
   ```
   1. Login to cPanel
   2. Open File Manager
   3. Navigate to public_html/
   4. Upload deployment-ready/public/ contents
   5. Extract files to root directory
   ```

2. **Via FTP/SFTP:**
   ```bash
   # Upload files via FTP
   ftp your-domain.com
   # Login with credentials
   cd public_html
   put -r public/* .
   ```

**Step 2: Configure .htaccess**

```bash
# Copy Apache configuration
cp config/apache/.htaccess.production public_html/.htaccess
```

Edit the .htaccess file for your specific domain:

```apache
# Replace example.com with your actual domain
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://www.stoneonepointsolutions.in/$1 [R=301,L]

# Security Headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Caching Rules
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
</IfModule>
```

**Step 3: Email Configuration**

1. **Create Email Accounts:**
   - hr@stoneonepointsolutions.in
   - info@stoneonepointsolutions.in
   - admin@stoneonepointsolutions.in

2. **Configure Contact Form:**
   ```php
   // Edit contact-form-handler.php
   $to_email = "hr@stoneonepointsolutions.in";
   $smtp_host = "mail.stoneonepointsolutions.in";
   $smtp_username = "hr@stoneonepointsolutions.in";
   $smtp_password = "your-email-password";
   ```

**Step 4: SSL Setup**

1. **Enable SSL in cPanel:**
   - Go to SSL/TLS section
   - Enable "Force HTTPS Redirect"
   - Install SSL certificate if not auto-installed

#### DirectAdmin-based Hosting

**File Upload Process:**
```
1. Login to DirectAdmin
2. Go to File Manager
3. Navigate to public_html/
4. Upload and extract website files
5. Set file permissions: 644 for files, 755 for directories
```

**Configuration:**
```bash
# Set proper permissions
find public_html/ -type f -exec chmod 644 {} \;
find public_html/ -type d -exec chmod 755 {} \;
```

### 2. VPS and Dedicated Server Deployment

#### Ubuntu/Debian Server Setup

**Step 1: Server Preparation**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install apache2 php7.4 php7.4-curl php7.4-json php7.4-mbstring php7.4-openssl -y

# Enable Apache modules
sudo a2enmod rewrite headers expires deflate ssl
```

**Step 2: Virtual Host Configuration**

Create Apache virtual host:

```bash
sudo nano /etc/apache2/sites-available/stoneonepointsolutions.conf
```

```apache
<VirtualHost *:80>
    ServerName stoneonepointsolutions.in
    ServerAlias www.stoneonepointsolutions.in
    DocumentRoot /var/www/stoneonepointsolutions
    
    # Redirect to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName stoneonepointsolutions.in
    ServerAlias www.stoneonepointsolutions.in
    DocumentRoot /var/www/stoneonepointsolutions
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/stoneonepointsolutions.crt
    SSLCertificateKeyFile /etc/ssl/private/stoneonepointsolutions.key
    SSLCertificateChainFile /etc/ssl/certs/ca-bundle.crt
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/stoneonepointsolutions_error.log
    CustomLog ${APACHE_LOG_DIR}/stoneonepointsolutions_access.log combined
</VirtualHost>
```

**Step 3: Deploy Website Files**

```bash
# Create web directory
sudo mkdir -p /var/www/stoneonepointsolutions

# Upload files (via SCP/SFTP)
scp -r deployment-ready/public/* user@server:/tmp/website/

# Move files to web directory
sudo mv /tmp/website/* /var/www/stoneonepointsolutions/

# Set ownership and permissions
sudo chown -R www-data:www-data /var/www/stoneonepointsolutions
sudo chmod -R 644 /var/www/stoneonepointsolutions
sudo find /var/www/stoneonepointsolutions -type d -exec chmod 755 {} \;
```

**Step 4: Enable Site and Restart Apache**

```bash
# Enable the site
sudo a2ensite stoneonepointsolutions.conf

# Disable default site
sudo a2dissite 000-default.conf

# Test configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
```

#### CentOS/RHEL Server Setup

**Step 1: Install Required Packages**

```bash
# Install EPEL repository
sudo yum install epel-release -y

# Install Apache and PHP
sudo yum install httpd php php-curl php-json php-mbstring php-openssl -y

# Start and enable services
sudo systemctl start httpd
sudo systemctl enable httpd
```

**Step 2: Configure Firewall**

```bash
# Open HTTP and HTTPS ports
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**Step 3: SELinux Configuration**

```bash
# Set SELinux context for web files
sudo setsebool -P httpd_can_network_connect 1
sudo semanage fcontext -a -t httpd_exec_t "/var/www/stoneonepointsolutions(/.*)?"
sudo restorecon -R /var/www/stoneonepointsolutions
```

### 3. Nginx Server Configuration

#### Nginx Virtual Host Setup

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/stoneonepointsolutions
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name stoneonepointsolutions.in www.stoneonepointsolutions.in;
    return 301 https://www.stoneonepointsolutions.in$request_uri;
}

# HTTPS Server Block
server {
    listen 443 ssl http2;
    server_name stoneonepointsolutions.in www.stoneonepointsolutions.in;
    
    root /var/www/stoneonepointsolutions;
    index index.html index.htm;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/stoneonepointsolutions.crt;
    ssl_certificate_key /etc/ssl/private/stoneonepointsolutions.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Caching Rules
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # PHP Processing (if needed)
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # Error Pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /500.html;
    
    # Logging
    access_log /var/log/nginx/stoneonepointsolutions_access.log;
    error_log /var/log/nginx/stoneonepointsolutions_error.log;
}
```

**Enable Site:**

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/stoneonepointsolutions /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 4. Cloud Platform Deployment

#### AWS Deployment

**Option A: EC2 Instance**

1. **Launch EC2 Instance:**
   ```bash
   # Launch Ubuntu 20.04 LTS instance (t3.micro or larger)
   # Configure security groups: HTTP (80), HTTPS (443), SSH (22)
   ```

2. **Install and Configure:**
   ```bash
   # Connect via SSH
   ssh -i your-key.pem ubuntu@your-ec2-ip
   
   # Follow Ubuntu server setup instructions above
   ```

3. **Elastic IP and Route 53:**
   ```bash
   # Allocate Elastic IP and associate with instance
   # Configure Route 53 DNS records
   ```

**Option B: S3 + CloudFront (Static Hosting)**

1. **S3 Bucket Setup:**
   ```bash
   # Create S3 bucket
   aws s3 mb s3://stoneonepointsolutions-website
   
   # Upload website files
   aws s3 sync deployment-ready/public/ s3://stoneonepointsolutions-website/ --delete
   
   # Configure bucket for static website hosting
   aws s3 website s3://stoneonepointsolutions-website --index-document index.html --error-document 404.html
   ```

2. **CloudFront Distribution:**
   ```json
   {
     "CallerReference": "stoneonepointsolutions-2024",
     "Origins": {
       "Items": [{
         "Id": "S3-stoneonepointsolutions-website",
         "DomainName": "stoneonepointsolutions-website.s3.amazonaws.com",
         "S3OriginConfig": {
           "OriginAccessIdentity": ""
         }
       }]
     },
     "DefaultCacheBehavior": {
       "TargetOriginId": "S3-stoneonepointsolutions-website",
       "ViewerProtocolPolicy": "redirect-to-https",
       "Compress": true
     }
   }
   ```

#### Google Cloud Platform

**Compute Engine Deployment:**

1. **Create VM Instance:**
   ```bash
   gcloud compute instances create stoneonepointsolutions-vm \
     --image-family=ubuntu-2004-lts \
     --image-project=ubuntu-os-cloud \
     --machine-type=e2-micro \
     --tags=http-server,https-server
   ```

2. **Configure Firewall:**
   ```bash
   gcloud compute firewall-rules create allow-http \
     --allow tcp:80 \
     --source-ranges 0.0.0.0/0 \
     --target-tags http-server
   
   gcloud compute firewall-rules create allow-https \
     --allow tcp:443 \
     --source-ranges 0.0.0.0/0 \
     --target-tags https-server
   ```

**Cloud Storage + CDN:**

1. **Create Storage Bucket:**
   ```bash
   gsutil mb gs://stoneonepointsolutions-website
   gsutil -m rsync -r -d deployment-ready/public/ gs://stoneonepointsolutions-website/
   ```

2. **Configure CDN:**
   ```bash
   gcloud compute backend-buckets create stoneonepointsolutions-backend \
     --gcs-bucket-name=stoneonepointsolutions-website
   ```

#### Microsoft Azure

**Virtual Machine Deployment:**

1. **Create Resource Group:**
   ```bash
   az group create --name stoneonepointsolutions-rg --location eastus
   ```

2. **Create VM:**
   ```bash
   az vm create \
     --resource-group stoneonepointsolutions-rg \
     --name stoneonepointsolutions-vm \
     --image UbuntuLTS \
     --admin-username azureuser \
     --generate-ssh-keys
   ```

3. **Open Ports:**
   ```bash
   az vm open-port --port 80 --resource-group stoneonepointsolutions-rg --name stoneonepointsolutions-vm
   az vm open-port --port 443 --resource-group stoneonepointsolutions-rg --name stoneonepointsolutions-vm
   ```

## Environment-Specific Configuration

### Development Environment

**Configuration File: `config/environments/development.json`**

```json
{
  "environment": "development",
  "debug": true,
  "minification": false,
  "caching": false,
  "analytics": {
    "enabled": false,
    "google_analytics": ""
  },
  "email": {
    "smtp_host": "localhost",
    "smtp_port": 1025,
    "smtp_user": "",
    "smtp_pass": ""
  },
  "security": {
    "force_https": false,
    "hsts": false
  }
}
```

**Setup Instructions:**

```bash
# Use development configuration
cp config/environments/development.json config/config.json

# Disable caching in .htaccess
# Comment out caching rules for development
```

### Staging Environment

**Configuration File: `config/environments/staging.json`**

```json
{
  "environment": "staging",
  "debug": false,
  "minification": true,
  "caching": true,
  "analytics": {
    "enabled": false,
    "google_analytics": ""
  },
  "email": {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_user": "staging@stoneonepointsolutions.in",
    "smtp_pass": "staging-password"
  },
  "security": {
    "force_https": true,
    "hsts": true
  },
  "robots": {
    "disallow_all": true
  }
}
```

**Setup Instructions:**

```bash
# Use staging subdomain: staging.stoneonepointsolutions.in
# Password protect staging environment
# Add robots.txt to prevent indexing
```

### Production Environment

**Configuration File: `config/environments/production.json`**

```json
{
  "environment": "production",
  "debug": false,
  "minification": true,
  "caching": true,
  "analytics": {
    "enabled": true,
    "google_analytics": "UA-252401001-1"
  },
  "email": {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_user": "hr@stoneonepointsolutions.in",
    "smtp_pass": "production-app-password"
  },
  "security": {
    "force_https": true,
    "hsts": true,
    "csp": true
  },
  "monitoring": {
    "uptime_monitoring": true,
    "performance_monitoring": true,
    "error_tracking": true
  }
}
```

## Post-Deployment Verification

### Automated Verification Script

Run the post-deployment verification:

```bash
cd deployment-ready
node scripts/post-deployment-verifier.js --url https://www.stoneonepointsolutions.in
```

### Manual Verification Checklist

#### ✅ Website Functionality
- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Contact form submits successfully
- [ ] All service pages are accessible
- [ ] Images load properly
- [ ] Mobile responsiveness works

#### ✅ Performance Verification
- [ ] Page load time < 3 seconds
- [ ] Images are optimized and compressed
- [ ] CSS and JS files are minified
- [ ] Gzip compression is enabled
- [ ] Browser caching headers are set

#### ✅ SEO Verification
- [ ] All pages have unique title tags
- [ ] Meta descriptions are present
- [ ] XML sitemap is accessible
- [ ] Robots.txt is configured correctly
- [ ] Structured data is implemented

#### ✅ Security Verification
- [ ] HTTPS redirect works
- [ ] Security headers are present
- [ ] SSL certificate is valid
- [ ] Contact form has CSRF protection
- [ ] No sensitive information exposed

#### ✅ Analytics and Monitoring
- [ ] Google Analytics is tracking
- [ ] Uptime monitoring is configured
- [ ] Error logging is working
- [ ] Performance monitoring is active

### Testing Tools and Commands

**Performance Testing:**
```bash
# Lighthouse audit
lighthouse https://www.stoneonepointsolutions.in --output html --output-path ./lighthouse-report.html

# GTmetrix API test
curl -X POST "https://gtmetrix.com/api/0.1/test" \
  -u "your-email:your-api-key" \
  -d "url=https://www.stoneonepointsolutions.in"
```

**Security Testing:**
```bash
# SSL Labs test
curl -s "https://api.ssllabs.com/api/v3/analyze?host=stoneonepointsolutions.in"

# Security headers check
curl -I https://www.stoneonepointsolutions.in
```

**SEO Testing:**
```bash
# Check robots.txt
curl https://www.stoneonepointsolutions.in/robots.txt

# Check sitemap
curl https://www.stoneonepointsolutions.in/sitemap.xml

# Validate structured data
curl -s "https://search.google.com/structured-data/testing-tool/u/0/"
```

This comprehensive deployment guide covers all major hosting scenarios and provides detailed instructions for successful deployment. The next section will cover troubleshooting common deployment issues.