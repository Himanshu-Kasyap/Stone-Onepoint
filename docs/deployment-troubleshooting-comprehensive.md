# Comprehensive Deployment Troubleshooting Guide

This guide provides detailed solutions for common deployment issues specific to the Stone OnePoint Solutions website across different hosting environments.

## Table of Contents

1. [Pre-Deployment Issues](#pre-deployment-issues)
2. [File Upload and Transfer Issues](#file-upload-and-transfer-issues)
3. [Server Configuration Problems](#server-configuration-problems)
4. [SSL and Security Issues](#ssl-and-security-issues)
5. [Performance and Loading Issues](#performance-and-loading-issues)
6. [Contact Form and PHP Issues](#contact-form-and-php-issues)
7. [DNS and Domain Issues](#dns-and-domain-issues)
8. [SEO and Analytics Issues](#seo-and-analytics-issues)
9. [Mobile and Responsive Issues](#mobile-and-responsive-issues)
10. [Emergency Recovery Procedures](#emergency-recovery-procedures)

## Pre-Deployment Issues

### Issue: Build Process Fails

**Symptoms:**
- Build script throws errors
- Missing files in output directory
- Optimization scripts fail

**Diagnostic Commands:**
```bash
# Check Node.js version
node --version
npm --version

# Verify all dependencies
npm list --depth=0

# Check for missing files
ls -la deployment-ready/public/
```

**Solutions:**

1. **Update Dependencies:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run build with verbose output
npm run build --verbose
```

2. **Fix Missing Files:**
```bash
# Check for missing source files
find . -name "*.html" -type f | wc -l
find . -name "*.css" -type f | wc -l
find . -name "*.js" -type f | wc -l

# Verify image files
find . -name "*.jpg" -o -name "*.png" -o -name "*.webp" | head -10
```

3. **Permission Issues:**
```bash
# Fix file permissions
chmod -R 644 deployment-ready/
find deployment-ready/ -type d -exec chmod 755 {} \;
```

### Issue: Validation Errors

**Symptoms:**
- HTML validation fails
- SEO validation reports errors
- Accessibility checks fail

**Diagnostic Commands:**
```bash
# Run validation scripts
node scripts/html-validator.js
node scripts/seo-validator.js
node scripts/accessibility-validator.js
```

**Solutions:**

1. **HTML Validation Errors:**
```bash
# Check for common HTML issues
grep -r "unclosed" deployment-ready/public/
grep -r "duplicate id" deployment-ready/public/

# Fix DOCTYPE declarations
sed -i '1s/^/<!DOCTYPE html>\n/' deployment-ready/public/*.html
```

2. **SEO Issues:**
```bash
# Check for missing meta tags
grep -L "<meta name=\"description\"" deployment-ready/public/*.html

# Verify title tags
grep -L "<title>" deployment-ready/public/*.html
```

## File Upload and Transfer Issues

### Issue: Files Not Uploading Completely

**Symptoms:**
- Partial file uploads
- Corrupted files after upload
- Upload timeouts

**Diagnostic Commands:**
```bash
# Check file sizes before and after upload
ls -lah deployment-ready/public/ | head -10

# Verify file integrity
md5sum deployment-ready/public/index.html
```

**Solutions:**

1. **FTP/SFTP Upload Issues:**
```bash
# Use rsync for reliable transfer
rsync -avz --progress deployment-ready/public/ user@server:/var/www/html/

# Alternative: Use SCP with compression
scp -C -r deployment-ready/public/* user@server:/var/www/html/

# For large files, use split and transfer
split -b 10M large-file.zip large-file-part-
```

2. **File Manager Upload Issues:**
```bash
# Create smaller zip files
cd deployment-ready/public
zip -r ../assets.zip assets/
zip -r ../pages.zip *.html
zip -r ../styles.zip *.css

# Upload separately and extract
```

3. **Permission Denied Errors:**
```bash
# Check directory permissions
ls -la /var/www/html/

# Fix ownership (on server)
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

### Issue: File Path Problems

**Symptoms:**
- Images not loading
- CSS/JS files not found
- Broken internal links

**Diagnostic Commands:**
```bash
# Check for absolute paths
grep -r "http://localhost" deployment-ready/public/
grep -r "file://" deployment-ready/public/

# Find broken relative paths
grep -r "\.\./\.\." deployment-ready/public/
```

**Solutions:**

1. **Fix Absolute Paths:**
```bash
# Replace localhost references
find deployment-ready/public/ -name "*.html" -exec sed -i 's|http://localhost:3000||g' {} \;
find deployment-ready/public/ -name "*.html" -exec sed -i 's|http://127.0.0.1||g' {} \;
```

2. **Correct Relative Paths:**
```bash
# Fix asset references
sed -i 's|src="../assets/|src="assets/|g' deployment-ready/public/*.html
sed -i 's|href="../css/|href="css/|g' deployment-ready/public/*.html
```

## Server Configuration Problems

### Issue: Apache .htaccess Not Working

**Symptoms:**
- 500 Internal Server Error
- Redirects not working
- Caching headers not applied

**Diagnostic Commands:**
```bash
# Check Apache error logs
sudo tail -f /var/log/apache2/error.log

# Test .htaccess syntax
apache2ctl configtest

# Check if mod_rewrite is enabled
apache2ctl -M | grep rewrite
```

**Solutions:**

1. **Enable Required Modules:**
```bash
# Enable Apache modules
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod expires
sudo a2enmod deflate
sudo systemctl restart apache2
```

2. **Fix .htaccess Syntax:**
```apache
# Minimal working .htaccess
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

# Basic security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
</IfModule>
```

3. **Check Directory Configuration:**
```apache
# In Apache virtual host or main config
<Directory /var/www/html>
    AllowOverride All
    Require all granted
</Directory>
```

### Issue: Nginx Configuration Problems

**Symptoms:**
- 404 errors for existing files
- PHP not processing
- SSL not working

**Diagnostic Commands:**
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify PHP-FPM status
sudo systemctl status php7.4-fpm
```

**Solutions:**

1. **Fix Location Blocks:**
```nginx
server {
    listen 80;
    server_name stoneonepointsolutions.in www.stoneonepointsolutions.in;
    root /var/www/stoneonepointsolutions;
    index index.html index.htm index.php;

    # Handle static files
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Handle HTML files
    location / {
        try_files $uri $uri/ =404;
    }

    # Handle PHP files
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

2. **Fix File Permissions:**
```bash
# Set correct ownership
sudo chown -R www-data:www-data /var/www/stoneonepointsolutions

# Set correct permissions
sudo find /var/www/stoneonepointsolutions -type f -exec chmod 644 {} \;
sudo find /var/www/stoneonepointsolutions -type d -exec chmod 755 {} \;
```

## SSL and Security Issues

### Issue: SSL Certificate Problems

**Symptoms:**
- "Not Secure" warning in browser
- SSL certificate errors
- Mixed content warnings

**Diagnostic Commands:**
```bash
# Check SSL certificate
openssl s_client -connect www.stoneonepointsolutions.in:443 -servername www.stoneonepointsolutions.in

# Test SSL configuration
curl -I https://www.stoneonepointsolutions.in

# Check certificate expiration
echo | openssl s_client -connect www.stoneonepointsolutions.in:443 2>/dev/null | openssl x509 -noout -dates
```

**Solutions:**

1. **Install Let's Encrypt Certificate:**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache -y

# Obtain certificate
sudo certbot --apache -d stoneonepointsolutions.in -d www.stoneonepointsolutions.in

# Test auto-renewal
sudo certbot renew --dry-run
```

2. **Fix Mixed Content Issues:**
```bash
# Find HTTP references in HTTPS pages
grep -r "http://" deployment-ready/public/ | grep -v "https://"

# Replace HTTP with HTTPS
find deployment-ready/public/ -name "*.html" -exec sed -i 's|http://|https://|g' {} \;
```

3. **Configure Security Headers:**
```apache
# Add to .htaccess or Apache config
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

### Issue: Content Security Policy Errors

**Symptoms:**
- Console errors about blocked resources
- Inline scripts not executing
- External resources not loading

**Diagnostic Commands:**
```bash
# Check browser console for CSP errors
# Look for messages like "Refused to execute inline script"

# Test CSP header
curl -I https://www.stoneonepointsolutions.in | grep -i "content-security-policy"
```

**Solutions:**

1. **Configure Proper CSP:**
```apache
# Relaxed CSP for initial deployment
Header always set Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: https:; font-src 'self' https: data:;"
```

2. **Fix Inline Scripts:**
```html
<!-- Move inline scripts to external files -->
<!-- Instead of: -->
<script>
    function myFunction() { ... }
</script>

<!-- Use: -->
<script src="js/custom-functions.js"></script>
```

## Performance and Loading Issues

### Issue: Slow Page Loading

**Symptoms:**
- Page load times > 5 seconds
- Large file sizes
- Poor Lighthouse scores

**Diagnostic Commands:**
```bash
# Check file sizes
du -sh deployment-ready/public/assets/

# Test page load time
curl -w "@curl-format.txt" -o /dev/null -s https://www.stoneonepointsolutions.in

# Run Lighthouse audit
lighthouse https://www.stoneonepointsolutions.in --output json
```

**Solutions:**

1. **Optimize Images:**
```bash
# Compress images
find deployment-ready/public/assets/images/ -name "*.jpg" -exec jpegoptim --max=85 {} \;
find deployment-ready/public/assets/images/ -name "*.png" -exec optipng -o2 {} \;

# Convert to WebP
for img in deployment-ready/public/assets/images/*.jpg; do
    cwebp -q 85 "$img" -o "${img%.jpg}.webp"
done
```

2. **Minify CSS and JavaScript:**
```bash
# Install minification tools
npm install -g clean-css-cli uglify-js

# Minify CSS
cleancss -o deployment-ready/public/css/style.min.css deployment-ready/public/css/style.css

# Minify JavaScript
uglifyjs deployment-ready/public/js/custom.js -o deployment-ready/public/js/custom.min.js
```

3. **Enable Compression:**
```apache
# Add to .htaccess
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

### Issue: Caching Not Working

**Symptoms:**
- Files reload on every visit
- No cache headers in response
- Poor repeat visit performance

**Diagnostic Commands:**
```bash
# Check cache headers
curl -I https://www.stoneonepointsolutions.in/css/style.css

# Test browser caching
curl -H "If-Modified-Since: $(date -R)" https://www.stoneonepointsolutions.in/
```

**Solutions:**

1. **Configure Browser Caching:**
```apache
# Add to .htaccess
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

2. **Add Cache-Control Headers:**
```apache
<IfModule mod_headers.c>
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|webp|ico|svg)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
</IfModule>
```

## Contact Form and PHP Issues

### Issue: Contact Form Not Working

**Symptoms:**
- Form submissions fail
- No email received
- PHP errors in logs

**Diagnostic Commands:**
```bash
# Check PHP version and modules
php -v
php -m | grep -E "(curl|json|mbstring|openssl)"

# Test PHP configuration
php -i | grep -E "(mail|smtp)"

# Check form handler file
ls -la deployment-ready/public/contact-form-handler.php
```

**Solutions:**

1. **Fix PHP Configuration:**
```php
<?php
// Basic contact form handler
if ($_POST) {
    $name = filter_var($_POST['name'], FILTER_SANITIZE_STRING);
    $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
    $message = filter_var($_POST['message'], FILTER_SANITIZE_STRING);
    
    if ($name && $email && $message) {
        $to = "hr@stoneonepointsolutions.in";
        $subject = "Contact Form Submission from " . $name;
        $body = "Name: " . $name . "\n";
        $body .= "Email: " . $email . "\n";
        $body .= "Message: " . $message . "\n";
        
        $headers = "From: " . $email . "\r\n";
        $headers .= "Reply-To: " . $email . "\r\n";
        
        if (mail($to, $subject, $body, $headers)) {
            header("Location: contact-success.html");
        } else {
            header("Location: contact-error.html");
        }
    }
}
?>
```

2. **Configure SMTP Settings:**
```php
<?php
// Using PHPMailer for better email delivery
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'hr@stoneonepointsolutions.in';
    $mail->Password   = 'app-specific-password';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    $mail->setFrom($_POST['email'], $_POST['name']);
    $mail->addAddress('hr@stoneonepointsolutions.in');
    
    $mail->Subject = 'Contact Form Submission';
    $mail->Body    = $_POST['message'];

    $mail->send();
    header("Location: contact-success.html");
} catch (Exception $e) {
    error_log("Mailer Error: {$mail->ErrorInfo}");
    header("Location: contact-error.html");
}
?>
```

3. **Test Email Functionality:**
```bash
# Test PHP mail function
php -r "mail('test@example.com', 'Test', 'Test message');"

# Check mail logs
tail -f /var/log/mail.log
```

### Issue: Form Validation Problems

**Symptoms:**
- Forms accept invalid data
- No client-side validation
- Security vulnerabilities

**Solutions:**

1. **Add Client-Side Validation:**
```javascript
// Add to form validation script
function validateForm() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    if (name.length < 2) {
        alert('Name must be at least 2 characters long');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    if (message.length < 10) {
        alert('Message must be at least 10 characters long');
        return false;
    }
    
    return true;
}
```

2. **Add CSRF Protection:**
```php
<?php
session_start();

// Generate CSRF token
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Validate CSRF token
if ($_POST && (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token'])) {
    die('CSRF token validation failed');
}
?>

<!-- Add to form -->
<input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
```

## DNS and Domain Issues

### Issue: Domain Not Resolving

**Symptoms:**
- Website not accessible by domain name
- DNS propagation issues
- Subdomain problems

**Diagnostic Commands:**
```bash
# Check DNS resolution
nslookup stoneonepointsolutions.in
dig stoneonepointsolutions.in

# Check from different locations
dig @8.8.8.8 stoneonepointsolutions.in
dig @1.1.1.1 stoneonepointsolutions.in

# Check DNS propagation
# Use online tools like whatsmydns.net
```

**Solutions:**

1. **Configure DNS Records:**
```
# A Records
@ (root domain) -> Server IP Address
www -> Server IP Address

# CNAME Records (alternative to www A record)
www -> stoneonepointsolutions.in

# MX Records (for email)
@ -> mail.stoneonepointsolutions.in (Priority: 10)
```

2. **Fix Nameserver Issues:**
```bash
# Check current nameservers
dig NS stoneonepointsolutions.in

# Verify nameserver configuration at registrar
# Ensure nameservers point to hosting provider or DNS service
```

### Issue: Subdomain Problems

**Symptoms:**
- www version not working
- Staging subdomain issues
- SSL certificate problems with subdomains

**Solutions:**

1. **Configure Subdomain DNS:**
```
# DNS Records for subdomains
staging -> Staging Server IP
blog -> Blog Server IP
mail -> Mail Server IP
```

2. **Apache Virtual Host for Subdomains:**
```apache
<VirtualHost *:443>
    ServerName staging.stoneonepointsolutions.in
    DocumentRoot /var/www/staging
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/stoneonepointsolutions.in/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/stoneonepointsolutions.in/privkey.pem
</VirtualHost>
```

## SEO and Analytics Issues

### Issue: Google Analytics Not Tracking

**Symptoms:**
- No data in Google Analytics
- Tracking code errors
- Real-time data not showing

**Diagnostic Commands:**
```bash
# Check for Google Analytics code
grep -r "gtag\|ga(" deployment-ready/public/

# Verify tracking ID
grep -r "UA-252401001-1" deployment-ready/public/
```

**Solutions:**

1. **Fix Google Analytics Implementation:**
```html
<!-- Correct GA4 implementation -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-252401001-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-252401001-1');
</script>
```

2. **Test Analytics:**
```javascript
// Test if gtag is loaded
if (typeof gtag !== 'undefined') {
    console.log('Google Analytics loaded successfully');
} else {
    console.error('Google Analytics not loaded');
}
```

### Issue: SEO Meta Tags Missing

**Symptoms:**
- Poor search engine rankings
- Missing descriptions in search results
- Duplicate meta tags

**Diagnostic Commands:**
```bash
# Check for missing meta descriptions
grep -L "meta name=\"description\"" deployment-ready/public/*.html

# Check for duplicate titles
grep -h "<title>" deployment-ready/public/*.html | sort | uniq -d
```

**Solutions:**

1. **Add Missing Meta Tags:**
```html
<!-- Add to each page head section -->
<meta name="description" content="Specific page description here">
<meta name="keywords" content="relevant, keywords, here">
<meta name="author" content="Stone OnePoint Solutions Pvt. Ltd.">
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description">
<meta property="og:image" content="https://www.stoneonepointsolutions.in/assets/images/og-image.jpg">
```

2. **Fix Duplicate Content:**
```bash
# Add canonical URLs
sed -i '/<head>/a <link rel="canonical" href="https://www.stoneonepointsolutions.in/page-name.html">' deployment-ready/public/*.html
```

## Mobile and Responsive Issues

### Issue: Mobile Layout Problems

**Symptoms:**
- Text too small on mobile
- Horizontal scrolling
- Touch targets too small

**Diagnostic Commands:**
```bash
# Check viewport meta tag
grep -r "viewport" deployment-ready/public/

# Test responsive images
grep -r "srcset\|sizes" deployment-ready/public/
```

**Solutions:**

1. **Fix Viewport Configuration:**
```html
<!-- Correct viewport meta tag -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

2. **Add Responsive Images:**
```html
<!-- Responsive image implementation -->
<img src="image-small.jpg" 
     srcset="image-small.jpg 480w, image-medium.jpg 768w, image-large.jpg 1200w"
     sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
     alt="Description">
```

3. **Fix CSS Media Queries:**
```css
/* Mobile-first responsive design */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    .nav-menu {
        display: none;
    }
    
    .mobile-menu {
        display: block;
    }
}
```

## Emergency Recovery Procedures

### Complete Website Failure

**Immediate Actions:**

1. **Check Server Status:**
```bash
# Check if server is running
ping your-server-ip

# Check web server status
curl -I http://your-server-ip
```

2. **Restore from Backup:**
```bash
# Stop web server
sudo systemctl stop apache2

# Restore files from backup
sudo tar -xzf /backups/website-backup-latest.tar.gz -C /var/www/html/

# Fix permissions
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 644 /var/www/html/
sudo find /var/www/html/ -type d -exec chmod 755 {} \;

# Start web server
sudo systemctl start apache2
```

3. **Activate Maintenance Mode:**
```html
<!-- Create maintenance.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Site Maintenance - Stone OnePoint Solutions</title>
    <meta http-equiv="refresh" content="300">
</head>
<body>
    <h1>Site Under Maintenance</h1>
    <p>We're currently performing scheduled maintenance. Please check back in a few minutes.</p>
</body>
</html>
```

### Security Breach Response

**Immediate Actions:**

1. **Isolate the System:**
```bash
# Block all traffic except admin
iptables -A INPUT -s your-admin-ip -j ACCEPT
iptables -A INPUT -j DROP
```

2. **Preserve Evidence:**
```bash
# Create forensic backup
dd if=/dev/sda of=/external/forensic-backup.img

# Copy logs
cp -r /var/log/ /external/logs-backup/
```

3. **Clean and Restore:**
```bash
# Scan for malware
clamscan -r /var/www/html/

# Remove malicious files
find /var/www/html/ -name "*.php" -exec grep -l "eval\|base64_decode" {} \; | xargs rm

# Restore from clean backup
tar -xzf /backups/clean-backup.tar.gz -C /var/www/html/
```

### Data Loss Recovery

**Recovery Steps:**

1. **Check Available Backups:**
```bash
# List available backups
ls -la /backups/
ls -la /remote-backups/
```

2. **Restore Database (if applicable):**
```bash
# Restore MySQL database
mysql -u root -p database_name < /backups/database-backup.sql
```

3. **Verify Recovery:**
```bash
# Test website functionality
curl -I https://www.stoneonepointsolutions.in
curl -X POST https://www.stoneonepointsolutions.in/contact-form-handler.php
```

This comprehensive troubleshooting guide covers the most common deployment issues and provides step-by-step solutions for each scenario. Always test solutions in a staging environment before applying to production.