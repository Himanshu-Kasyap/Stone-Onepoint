# Hosting Provider Specific Deployment Guides

This document provides detailed, step-by-step deployment instructions for popular hosting providers, tailored specifically for the Stone OnePoint Solutions website.

## Table of Contents

1. [Shared Hosting Providers](#shared-hosting-providers)
2. [VPS Providers](#vps-providers)
3. [Cloud Platform Providers](#cloud-platform-providers)
4. [CDN and Performance Services](#cdn-and-performance-services)

## Shared Hosting Providers

### Hostinger Deployment

#### Prerequisites
- Hostinger hosting account with PHP 7.4+ support
- Domain configured in Hostinger panel
- SSL certificate (auto-installed by Hostinger)

#### Step-by-Step Deployment

**Step 1: Prepare Files**
```bash
# Navigate to deployment-ready directory
cd deployment-ready

# Create deployment package
zip -r stoneonepointsolutions-website.zip public/*
```

**Step 2: Upload via File Manager**
1. Login to Hostinger hPanel
2. Navigate to "File Manager"
3. Go to `public_html` directory
4. Upload `stoneonepointsolutions-website.zip`
5. Extract files to root directory
6. Delete the zip file

**Step 3: Configure .htaccess**
```bash
# Copy the Hostinger-optimized .htaccess
cp config/apache/hostinger.htaccess public_html/.htaccess
```

**Step 4: Email Configuration**
1. Create email account: `hr@stoneonepointsolutions.in`
2. Update contact form configuration:
```php
// In contact-form-handler.php
$smtp_host = "smtp.hostinger.com";
$smtp_port = 587;
$smtp_user = "hr@stoneonepointsolutions.in";
$smtp_pass = "your-email-password";
```

**Step 5: SSL and Domain Setup**
1. In hPanel, go to "SSL" section
2. Enable "Force HTTPS" for your domain
3. Verify SSL certificate is active

**Hostinger-Specific Optimizations:**
```apache
# Add to .htaccess for Hostinger
# Hostinger-specific caching rules
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/webp "access plus 1 year"
</IfModule>

# Hostinger compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### Bluehost Deployment

#### Prerequisites
- Bluehost hosting account
- Domain added to account
- cPanel access

#### Step-by-Step Deployment

**Step 1: Access cPanel**
1. Login to Bluehost account
2. Click "Advanced" tab
3. Open "File Manager"

**Step 2: Upload Files**
1. Navigate to `public_html/yourdomain.com` (or main domain folder)
2. Upload website files via File Manager
3. Extract files to root directory

**Step 3: Database Setup (if needed)**
```sql
-- Create database in cPanel MySQL Databases
CREATE DATABASE bluehost_website;
CREATE USER 'website_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON bluehost_website.* TO 'website_user'@'localhost';
```

**Step 4: Email Configuration**
```php
// Bluehost SMTP settings
$smtp_host = "mail.yourdomain.com";
$smtp_port = 587;
$smtp_user = "hr@stoneonepointsolutions.in";
$smtp_pass = "email-password";
$smtp_secure = "tls";
```

**Step 5: SSL Setup**
1. In cPanel, go to "SSL/TLS"
2. Enable "Force HTTPS Redirect"
3. Install Let's Encrypt certificate if not auto-installed

### SiteGround Deployment

#### Prerequisites
- SiteGround hosting account
- Site Tools access
- Domain configured

#### Step-by-Step Deployment

**Step 1: Site Tools File Manager**
1. Login to SiteGround Customer Area
2. Go to "Site Tools"
3. Open "File Manager"
4. Navigate to `public_html`

**Step 2: Upload and Extract**
1. Upload compressed website files
2. Use built-in extractor to unzip files
3. Move files to root directory

**Step 3: SiteGround Optimizations**
```apache
# SiteGround-specific .htaccess optimizations
# Enable SiteGround caching
<IfModule mod_rewrite.c>
    RewriteEngine On
    # SiteGround SuperCacher compatibility
    RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
    RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
</IfModule>
```

**Step 4: Enable SiteGround Features**
1. Enable "SuperCacher" in Site Tools
2. Enable "CloudFlare" integration
3. Configure "Security" settings

## VPS Providers

### DigitalOcean Droplet Deployment

#### Prerequisites
- DigitalOcean account
- SSH key configured
- Domain DNS pointed to droplet IP

#### Step 1: Create Droplet
```bash
# Create Ubuntu 20.04 droplet
doctl compute droplet create stoneonepointsolutions \
  --size s-1vcpu-1gb \
  --image ubuntu-20-04-x64 \
  --region nyc1 \
  --ssh-keys your-ssh-key-id
```

#### Step 2: Initial Server Setup
```bash
# Connect to droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install LAMP stack
apt install apache2 mysql-server php7.4 php7.4-mysql php7.4-curl php7.4-json php7.4-mbstring -y

# Enable Apache modules
a2enmod rewrite headers expires deflate ssl
systemctl restart apache2
```

#### Step 3: Configure Virtual Host
```bash
# Create virtual host configuration
nano /etc/apache2/sites-available/stoneonepointsolutions.conf
```

```apache
<VirtualHost *:80>
    ServerName stoneonepointsolutions.in
    ServerAlias www.stoneonepointsolutions.in
    DocumentRoot /var/www/stoneonepointsolutions
    
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName stoneonepointsolutions.in
    ServerAlias www.stoneonepointsolutions.in
    DocumentRoot /var/www/stoneonepointsolutions
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/stoneonepointsolutions.in/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/stoneonepointsolutions.in/privkey.pem
    
    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    
    ErrorLog ${APACHE_LOG_DIR}/stoneonepointsolutions_error.log
    CustomLog ${APACHE_LOG_DIR}/stoneonepointsolutions_access.log combined
</VirtualHost>
```

#### Step 4: SSL Certificate with Let's Encrypt
```bash
# Install Certbot
apt install certbot python3-certbot-apache -y

# Obtain SSL certificate
certbot --apache -d stoneonepointsolutions.in -d www.stoneonepointsolutions.in

# Test auto-renewal
certbot renew --dry-run
```

#### Step 5: Deploy Website Files
```bash
# Create web directory
mkdir -p /var/www/stoneonepointsolutions

# Upload files (from local machine)
scp -r deployment-ready/public/* root@your-droplet-ip:/var/www/stoneonepointsolutions/

# Set permissions
chown -R www-data:www-data /var/www/stoneonepointsolutions
chmod -R 644 /var/www/stoneonepointsolutions
find /var/www/stoneonepointsolutions -type d -exec chmod 755 {} \;

# Enable site
a2ensite stoneonepointsolutions.conf
a2dissite 000-default.conf
systemctl reload apache2
```

### Linode Deployment

#### Step 1: Create Linode Instance
```bash
# Create Linode via CLI
linode-cli linodes create \
  --type g6-nanode-1 \
  --region us-east \
  --image linode/ubuntu20.04 \
  --label stoneonepointsolutions \
  --root_pass secure_root_password
```

#### Step 2: Configure Firewall
```bash
# Configure UFW firewall
ufw allow OpenSSH
ufw allow 'Apache Full'
ufw enable
```

#### Step 3: Follow DigitalOcean steps for server configuration
(Same LAMP stack installation and configuration as DigitalOcean)

### Vultr Deployment

#### Step 1: Deploy Server Instance
1. Login to Vultr control panel
2. Deploy new server: Ubuntu 20.04, $5/month plan
3. Configure SSH keys
4. Note server IP address

#### Step 2: Server Configuration
```bash
# Connect and configure (same as DigitalOcean process)
ssh root@vultr-server-ip

# Follow standard LAMP installation
# Configure virtual hosts
# Install SSL certificate
```

## Cloud Platform Providers

### AWS Comprehensive Deployment

#### Option A: EC2 + RDS + CloudFront

**Step 1: Launch EC2 Instance**
```bash
# Launch EC2 instance via AWS CLI
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 1 \
  --instance-type t3.micro \
  --key-name your-key-pair \
  --security-group-ids sg-your-security-group \
  --subnet-id subnet-your-subnet
```

**Step 2: Configure Security Groups**
```bash
# Create security group
aws ec2 create-security-group \
  --group-name stoneonepointsolutions-sg \
  --description "Security group for Stone OnePoint Solutions website"

# Add rules
aws ec2 authorize-security-group-ingress \
  --group-id sg-your-group-id \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-your-group-id \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

**Step 3: Install and Configure Web Server**
```bash
# Connect to EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Apache and PHP (Amazon Linux 2)
sudo yum update -y
sudo yum install httpd php php-mysql php-curl php-json php-mbstring -y
sudo systemctl start httpd
sudo systemctl enable httpd
```

**Step 4: Deploy Website Files**
```bash
# Upload files to EC2
scp -i your-key.pem -r deployment-ready/public/* ec2-user@your-ec2-ip:/tmp/

# Move to web directory
sudo mv /tmp/* /var/www/html/
sudo chown -R apache:apache /var/www/html
```

**Step 5: Configure CloudFront CDN**
```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

#### Option B: S3 Static Website + CloudFront

**Step 1: Create S3 Bucket**
```bash
# Create bucket
aws s3 mb s3://stoneonepointsolutions-website-static

# Upload website files
aws s3 sync deployment-ready/public/ s3://stoneonepointsolutions-website-static/ --delete

# Configure bucket for static website hosting
aws s3 website s3://stoneonepointsolutions-website-static \
  --index-document index.html \
  --error-document 404.html
```

**Step 2: Configure Bucket Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::stoneonepointsolutions-website-static/*"
    }
  ]
}
```

**Step 3: Set up CloudFront Distribution**
```bash
# Create distribution with custom domain
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "stoneonepointsolutions-'$(date +%s)'",
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "S3-stoneonepointsolutions-website-static",
          "DomainName": "stoneonepointsolutions-website-static.s3.amazonaws.com",
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-stoneonepointsolutions-website-static",
      "ViewerProtocolPolicy": "redirect-to-https",
      "MinTTL": 0,
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {
          "Forward": "none"
        }
      }
    },
    "Comment": "Stone OnePoint Solutions website CDN",
    "Enabled": true
  }'
```

### Google Cloud Platform Deployment

#### Compute Engine Deployment

**Step 1: Create VM Instance**
```bash
# Create VM instance
gcloud compute instances create stoneonepointsolutions-vm \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --subnet=default \
  --network-tier=PREMIUM \
  --maintenance-policy=MIGRATE \
  --image=ubuntu-2004-focal-v20210927 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=10GB \
  --boot-disk-type=pd-standard \
  --tags=http-server,https-server
```

**Step 2: Configure Firewall Rules**
```bash
# Allow HTTP traffic
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server

# Allow HTTPS traffic
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags https-server
```

**Step 3: Install Web Server**
```bash
# Connect to VM
gcloud compute ssh stoneonepointsolutions-vm --zone=us-central1-a

# Install LAMP stack
sudo apt update
sudo apt install apache2 php7.4 php7.4-mysql php7.4-curl php7.4-json php7.4-mbstring -y
sudo a2enmod rewrite headers expires deflate ssl
sudo systemctl restart apache2
```

#### Cloud Storage + CDN Deployment

**Step 1: Create Storage Bucket**
```bash
# Create bucket
gsutil mb gs://stoneonepointsolutions-website

# Upload files
gsutil -m rsync -r -d deployment-ready/public/ gs://stoneonepointsolutions-website/

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://stoneonepointsolutions-website
```

**Step 2: Configure Load Balancer and CDN**
```bash
# Create backend bucket
gcloud compute backend-buckets create stoneonepointsolutions-backend \
  --gcs-bucket-name=stoneonepointsolutions-website

# Create URL map
gcloud compute url-maps create stoneonepointsolutions-map \
  --default-backend-bucket=stoneonepointsolutions-backend

# Create HTTP(S) load balancer
gcloud compute target-http-proxies create stoneonepointsolutions-http-proxy \
  --url-map=stoneonepointsolutions-map

gcloud compute target-https-proxies create stoneonepointsolutions-https-proxy \
  --url-map=stoneonepointsolutions-map \
  --ssl-certificates=stoneonepointsolutions-ssl-cert
```

### Microsoft Azure Deployment

#### Virtual Machine Deployment

**Step 1: Create Resource Group**
```bash
# Create resource group
az group create \
  --name stoneonepointsolutions-rg \
  --location eastus
```

**Step 2: Create Virtual Machine**
```bash
# Create VM
az vm create \
  --resource-group stoneonepointsolutions-rg \
  --name stoneonepointsolutions-vm \
  --image UbuntuLTS \
  --admin-username azureuser \
  --generate-ssh-keys \
  --size Standard_B1s
```

**Step 3: Open Network Ports**
```bash
# Open HTTP port
az vm open-port \
  --port 80 \
  --resource-group stoneonepointsolutions-rg \
  --name stoneonepointsolutions-vm

# Open HTTPS port
az vm open-port \
  --port 443 \
  --resource-group stoneonepointsolutions-rg \
  --name stoneonepointsolutions-vm
```

#### Static Web Apps Deployment

**Step 1: Create Static Web App**
```bash
# Create static web app
az staticwebapp create \
  --name stoneonepointsolutions-static \
  --resource-group stoneonepointsolutions-rg \
  --source https://github.com/yourusername/stoneonepointsolutions-website \
  --location "Central US" \
  --branch main \
  --app-location "deployment-ready/public" \
  --login-with-github
```

## CDN and Performance Services

### CloudFlare Setup

#### Step 1: Add Domain to CloudFlare
1. Create CloudFlare account
2. Add domain: `stoneonepointsolutions.in`
3. Update nameservers at domain registrar

#### Step 2: Configure DNS Records
```
Type: A
Name: @
Content: your-server-ip
Proxy: Enabled (orange cloud)

Type: A
Name: www
Content: your-server-ip
Proxy: Enabled (orange cloud)
```

#### Step 3: Configure CloudFlare Settings
```bash
# Enable security features
- SSL/TLS: Full (strict)
- Always Use HTTPS: On
- Automatic HTTPS Rewrites: On
- Security Level: Medium
- Bot Fight Mode: On

# Performance optimizations
- Auto Minify: CSS, JavaScript, HTML
- Brotli: On
- Rocket Loader: On (test first)
- Polish: Lossless
```

### AWS CloudFront Configuration

#### Step 1: Create Distribution
```json
{
  "CallerReference": "stoneonepointsolutions-cdn",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "origin1",
        "DomainName": "www.stoneonepointsolutions.in",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "origin1",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
```

### Google Cloud CDN Setup

#### Step 1: Enable Cloud CDN
```bash
# Enable Cloud CDN for backend service
gcloud compute backend-services update stoneonepointsolutions-backend \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC
```

## Deployment Validation

### Post-Deployment Checklist

After completing deployment on any provider, run this validation:

```bash
# Test website accessibility
curl -I https://www.stoneonepointsolutions.in

# Check SSL certificate
openssl s_client -connect www.stoneonepointsolutions.in:443 -servername www.stoneonepointsolutions.in

# Test contact form
curl -X POST https://www.stoneonepointsolutions.in/contact-form-handler.php \
  -d "name=Test&email=test@example.com&message=Test message"

# Validate HTML
curl -s https://www.stoneonepointsolutions.in | tidy -errors -quiet

# Check performance
lighthouse https://www.stoneonepointsolutions.in --output json
```

### Provider-Specific Testing

#### Shared Hosting Validation
- Test cPanel/control panel access
- Verify email account functionality
- Check file permissions
- Test .htaccess rules

#### VPS Validation
- Check server resource usage
- Verify firewall configuration
- Test SSL certificate auto-renewal
- Monitor server logs

#### Cloud Platform Validation
- Test auto-scaling (if configured)
- Verify CDN cache behavior
- Check monitoring and alerting
- Test backup and recovery procedures

This comprehensive guide covers deployment procedures for all major hosting providers and scenarios. Each section provides specific commands and configurations tailored to the hosting environment.