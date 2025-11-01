# Monitoring and Analytics Setup Guide

This comprehensive guide provides step-by-step instructions for setting up monitoring, analytics, and tracking systems for the Stone OnePoint Solutions website.

## Table of Contents

1. [Google Analytics Integration](#google-analytics-integration)
2. [Performance Monitoring Setup](#performance-monitoring-setup)
3. [Security Monitoring Configuration](#security-monitoring-configuration)
4. [Uptime Monitoring Setup](#uptime-monitoring-setup)
5. [Server Monitoring Configuration](#server-monitoring-configuration)
6. [Backup and Recovery Procedures](#backup-and-recovery-procedures)
7. [Log Management and Analysis](#log-management-and-analysis)
8. [Alerting and Notification Setup](#alerting-and-notification-setup)
9. [Dashboard Configuration](#dashboard-configuration)
10. [Reporting and Analysis](#reporting-and-analysis)

## Google Analytics Integration

### Google Analytics 4 (GA4) Setup

#### Step 1: Create Google Analytics Account

1. **Visit Google Analytics**: Go to https://analytics.google.com
2. **Create Account**: Click "Start measuring" and create a new account
3. **Account Details**:
   - Account Name: "Stone OnePoint Solutions"
   - Data Sharing Settings: Configure as needed
4. **Property Setup**:
   - Property Name: "Stone OnePoint Solutions Website"
   - Reporting Time Zone: "India Standard Time"
   - Currency: "Indian Rupee (₹)"
5. **Business Information**:
   - Industry Category: "Professional Services"
   - Business Size: "Small business"
   - Usage Intentions: Select relevant options

#### Step 2: Install GA4 Tracking Code

**Method 1: Global Site Tag (gtag.js)**

```html
<!-- Add to all HTML pages in the <head> section -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'GA_MEASUREMENT_ID', {
    // Enhanced measurement settings
    send_page_view: true,
    allow_google_signals: true,
    allow_ad_personalization_signals: false
  });
</script>
```

**Method 2: Google Tag Manager (Recommended)**

1. **Create GTM Account**: Go to https://tagmanager.google.com
2. **Create Container**:
   - Container Name: "Stone OnePoint Solutions Website"
   - Target Platform: "Web"
3. **Install GTM Code**:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->

<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```
#### Step
 3: Configure Enhanced Ecommerce (for Contact Form Tracking)

```javascript
// Track contact form submissions as conversions
function trackContactFormSubmission() {
  gtag('event', 'contact_form_submit', {
    event_category: 'engagement',
    event_label: 'contact_form',
    value: 1
  });
}

// Track service page views
function trackServicePageView(serviceName) {
  gtag('event', 'page_view', {
    page_title: serviceName + ' - Stone OnePoint Solutions',
    page_location: window.location.href,
    content_group1: 'Services'
  });
}

// Track file downloads
function trackFileDownload(fileName) {
  gtag('event', 'file_download', {
    event_category: 'engagement',
    event_label: fileName,
    value: 1
  });
}
```

#### Step 4: Set Up Goals and Conversions

1. **Contact Form Submissions**:
   - Goal Type: Event
   - Event Conditions: event_name equals contact_form_submit
   - Value: 1

2. **Service Page Engagement**:
   - Goal Type: Engagement
   - Session Duration: > 2 minutes
   - Pages per Session: > 3

3. **Phone Number Clicks**:
```javascript
// Track phone number clicks
document.addEventListener('DOMContentLoaded', function() {
  const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
  phoneLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      gtag('event', 'phone_call', {
        event_category: 'engagement',
        event_label: 'phone_click',
        value: 1
      });
    });
  });
});
```

### Google Search Console Setup

#### Step 1: Verify Website Ownership

1. **Add Property**: Go to https://search.google.com/search-console
2. **URL Prefix Method**: Enter https://www.stoneonepointsolutions.in
3. **Verification Methods**:

**HTML File Upload**:
```html
<!-- Download verification file from Google Search Console -->
<!-- Upload google[verification-code].html to website root -->
```

**HTML Meta Tag**:
```html
<meta name="google-site-verification" content="verification-code-here" />
```

**DNS Record**:
```
TXT record: google-site-verification=verification-code-here
```

#### Step 2: Submit Sitemap

```xml
<!-- Ensure sitemap.xml is accessible at root -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.stoneonepointsolutions.in/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Add all pages -->
</urlset>
```

Submit sitemap URL: https://www.stoneonepointsolutions.in/sitemap.xml

## Performance Monitoring Setup

### Google PageSpeed Insights Integration

#### Automated Performance Testing Script

```bash
#!/bin/bash
# Automated PageSpeed testing script

WEBSITE_URL="https://www.stoneonepointsolutions.in"
API_KEY="your-pagespeed-api-key"
REPORT_FILE="/var/log/pagespeed-report-$(date +%Y%m%d).json"

# Test desktop performance
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${WEBSITE_URL}&key=${API_KEY}&strategy=desktop" \
  -o "${REPORT_FILE}"

# Extract key metrics
PERFORMANCE_SCORE=$(jq '.lighthouseResult.categories.performance.score * 100' "$REPORT_FILE")
FCP=$(jq -r '.lighthouseResult.audits["first-contentful-paint"].displayValue' "$REPORT_FILE")
LCP=$(jq -r '.lighthouseResult.audits["largest-contentful-paint"].displayValue' "$REPORT_FILE")
CLS=$(jq -r '.lighthouseResult.audits["cumulative-layout-shift"].displayValue' "$REPORT_FILE")

# Create summary report
cat << EOF > /tmp/performance-summary.txt
Daily Performance Report - $(date)
================================

Performance Score: ${PERFORMANCE_SCORE}/100
First Contentful Paint: ${FCP}
Largest Contentful Paint: ${LCP}
Cumulative Layout Shift: ${CLS}

Full report: ${REPORT_FILE}
EOF

# Send alert if performance drops below threshold
if (( $(echo "$PERFORMANCE_SCORE < 80" | bc -l) )); then
  mail -s "Performance Alert - Score Below 80" -A /tmp/performance-summary.txt admin@stoneonepointsolutions.in < /dev/null
fi
```

### Core Web Vitals Monitoring

#### Real User Monitoring (RUM) Implementation

```javascript
// Core Web Vitals monitoring script
import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to Google Analytics
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true,
  });
  
  // Send to custom endpoint for detailed analysis
  fetch('/api/web-vitals', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      url: window.location.href,
      timestamp: Date.now()
    })
  });
}

// Measure all Core Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Web Vitals Data Collection Endpoint

```php
<?php
// web-vitals-collector.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input) {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'metric' => $input['name'],
            'value' => $input['value'],
            'id' => $input['id'],
            'url' => $input['url'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
        ];
        
        // Log to file
        file_put_contents(
            '/var/log/web-vitals.log',
            json_encode($logEntry) . "\n",
            FILE_APPEND | LOCK_EX
        );
        
        echo json_encode(['status' => 'success']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
```

## Security Monitoring Configuration

### Fail2Ban Setup for Intrusion Detection

#### Installation and Configuration

```bash
# Install Fail2Ban
sudo apt update
sudo apt install fail2ban -y

# Create custom configuration
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[apache-auth]
enabled = true
port = http,https
filter = apache-auth
logpath = /var/log/apache2/error.log
maxretry = 3

[apache-badbots]
enabled = true
port = http,https
filter = apache-badbots
logpath = /var/log/apache2/access.log
maxretry = 2

[apache-noscript]
enabled = true
port = http,https
filter = apache-noscript
logpath = /var/log/apache2/access.log
maxretry = 6

[apache-overflows]
enabled = true
port = http,https
filter = apache-overflows
logpath = /var/log/apache2/error.log
maxretry = 2
EOF

# Start and enable Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

#### Custom Filters for Website Protection

```bash
# Create custom filter for contact form abuse
sudo tee /etc/fail2ban/filter.d/apache-contact-form.conf << EOF
[Definition]
failregex = ^<HOST> .* "POST /contact-form-handler\.php.*" 200
ignoreregex =
EOF

# Add jail for contact form protection
sudo tee -a /etc/fail2ban/jail.local << EOF

[apache-contact-form]
enabled = true
port = http,https
filter = apache-contact-form
logpath = /var/log/apache2/access.log
maxretry = 5
findtime = 300
bantime = 1800
EOF
```

## Uptime Monitoring Setup

### UptimeRobot Configuration

#### Account Setup and Monitor Creation

1. **Create Account**: Sign up at https://uptimerobot.com
2. **Add Monitor**:
   - Monitor Type: HTTP(s)
   - Friendly Name: "Stone OnePoint Solutions Main Site"
   - URL: https://www.stoneonepointsolutions.in
   - Monitoring Interval: 5 minutes
3. **Alert Contacts**:
   - Email: admin@stoneonepointsolutions.in
   - SMS: +91 8595378782 (if available)

#### Custom Uptime Monitoring Script

```bash
#!/bin/bash
# Custom uptime monitoring script

URLS=(
  "https://www.stoneonepointsolutions.in/"
  "https://www.stoneonepointsolutions.in/contact.html"
  "https://www.stoneonepointsolutions.in/company-profile.html"
)

LOG_FILE="/var/log/uptime-monitor.log"
ALERT_EMAIL="admin@stoneonepointsolutions.in"

for url in "${URLS[@]}"; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  
  # Test URL with timeout
  if curl -f -s --max-time 10 "$url" > /dev/null; then
    echo "[$TIMESTAMP] UP: $url" >> "$LOG_FILE"
  else
    echo "[$TIMESTAMP] DOWN: $url" >> "$LOG_FILE"
    
    # Send immediate alert
    cat << EOF | mail -s "Website Down Alert" "$ALERT_EMAIL"
Website Down Alert

URL: $url
Time: $TIMESTAMP
Status: DOWN

Please check the website immediately.
EOF
  fi
done
```

## Backup and Recovery Procedures

### Automated Backup System

#### Daily Backup Script

```bash
#!/bin/bash
# Comprehensive daily backup script

BACKUP_DIR="/backups/daily"
REMOTE_BACKUP_DIR="user@backup-server:/backups/stoneonepointsolutions"
DATE=$(date +%Y%m%d)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup website files
echo "Starting website files backup..."
tar -czf "$BACKUP_DIR/website-files-$DATE.tar.gz" -C /var/www/html .

# Backup configuration files
echo "Backing up configuration files..."
tar -czf "$BACKUP_DIR/config-files-$DATE.tar.gz" \
  /etc/apache2/sites-available/ \
  /etc/nginx/sites-available/ \
  /etc/ssl/certs/ \
  /etc/fail2ban/jail.local

# Backup database (if applicable)
if command -v mysql &> /dev/null; then
  echo "Backing up database..."
  mysqldump --all-databases --single-transaction --routines --triggers > "$BACKUP_DIR/database-$DATE.sql"
  gzip "$BACKUP_DIR/database-$DATE.sql"
fi

# Upload to remote backup location
echo "Uploading to remote backup..."
rsync -av "$BACKUP_DIR/" "$REMOTE_BACKUP_DIR/"

# Clean old backups
echo "Cleaning old backups..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully at $(date)"
```

This monitoring and analytics setup guide provides comprehensive instructions for implementing all necessary monitoring systems for the Stone OnePoint Solutions website. The setup includes Google Analytics integration, performance monitoring, security monitoring, uptime monitoring, and automated backup procedures.