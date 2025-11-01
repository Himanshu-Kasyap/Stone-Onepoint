# Deployment Troubleshooting Guide - Stone OnePoint Solutions Website

This guide provides solutions to common deployment issues and problems that may occur during or after deploying the Stone OnePoint Solutions website.

## Table of Contents

1. [Common Deployment Issues](#common-deployment-issues)
2. [Server Configuration Problems](#server-configuration-problems)
3. [SSL and HTTPS Issues](#ssl-and-https-issues)
4. [Performance Problems](#performance-problems)
5. [Contact Form Issues](#contact-form-issues)
6. [SEO and Analytics Problems](#seo-and-analytics-problems)
7. [Emergency Recovery Procedures](#emergency-recovery-procedures)

## Common Deployment Issues

### Issue 1: Website Shows "Index of /" Directory Listing

**Symptoms:**
- Browser shows directory listing instead of website
- No index.html file is being served

**Causes:**
- Missing index.html file in root directory
- Incorrect file permissions
- Web server not configured to serve index.html

**Solutions:**

```bash
# Check if index.html exists in the correct location
ls -la /var/www/html/index.html  # Apache default
ls -la /var/www/stoneonepointsolutions/index.html  # Custom path

# Verify file permissions
chmod 644 /var/www/html/index.html

# Check Apache configuration
sudo nano /etc/apache2/sites-available/000-default.c