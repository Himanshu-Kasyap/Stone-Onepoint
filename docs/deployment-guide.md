# Deployment Guide - Stone OnePoint Solutions Website

This guide provides step-by-step instructions for deploying the Stone OnePoint Solutions website to various hosting environments.

## Prerequisites

- Web server with PHP 7.4+ support (for contact forms)
- SSL certificate (recommended for production)
- FTP/SFTP access or server management panel
- Domain name configured to point to your server

## Quick Deployment Steps

### 1. Prepare the Build

```bash
# Navigate to the project directory
cd deployment-ready

# Build for your target environment
node scripts/build.js production  # or staging/development

# Verify the build
ls -la public/
```

### 2. Choose Your Hosting Method

#### Option A: Shared Hosting (cPanel/DirectAdmin)

1. **Upload Files**
   - Compress the `public/` directory contents
   - Upload via File Manager or FTP to your domain's public_html folder
   - Extract the files in the root directory

2. **Configure Server**
   - Copy `config/apache/.htaccess.template` to `public_html/.htaccess`
   - Edit the file to match your domain and hosting requirements

3. **Set Up SSL**
   - Enable SSL through your hosting control panel
   - Update the .htaccess file to force HTTPS redirects

#### Option B: VPS/Dedicated Server (Apache)

1. **Upload Files**
   ```bash
   # Upload via SCP/SFTP
   scp -r public/* user@yourserver.com:/var/www/html/
   ```

2. **Configure Apache**
   ```bash
   # Copy and customize the Apache configuration
   sudo cp config/apache/.htaccess.template /var/www/html/.htaccess
   
   # Enable required Apache modules
   sudo a2enmod rewrite headers expires deflate
   sudo systemctl restart apache2
   ```

#### Option C: VPS/Dedicated Server (Nginx)

1. **Upload Files**
   ```bash
   scp -r public/* user@yourserver.com:/var/www/stoneonepointsolutions/
   ```

2. **Configure Nginx**
   ```bash
   # Copy and customize the Nginx configuration
   sudo cp config/nginx/nginx.conf.template /etc/nginx/sites-available/stoneonepointsolutions
   
   # Edit the configuration file with your specific paths and domain
   sudo nano /etc/nginx/sites-available/stoneonepointsolutions
   
   # Enable the site
   sudo ln -s /etc/nginx/sites-available/stoneonepointsolutions /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 3. Environment-Specific Configuration

#### Development Environment
- Use `config/environments/development.json`
- Disable caching and minification
- Enable debug mode
- No analytics tracking

#### Staging Environment
- Use `config/environments/staging.json`
- Enable all optimizations
- Use staging domain/subdomain
- Prevent search engine indexing

#### Production Environment
- Use `config/environments/production.json`
- Full optimization enabled
- Enable analytics and monitoring
- Allow search engine indexing

### 4. Post-Deployment Verification

1. **Test Website Functionality**
   ```bash
   # Run the deployment validation script
   ./scripts/deploy.sh --environment production --dry-run
   ```

2. **Check Key Pages**
   - Homepage: `https://yourdomain.com/`
   - Contact page: `https://yourdomain.com/contact.html`
   - Services pages: Verify all service pages load correctly

3. **Verify Performance**
   - Test page load speeds
   - Check image optimization
   - Verify CSS/JS minification

4. **Security Validation**
   - Test HTTPS redirect
   - Verify security headers
   - Check form functionality

## Hosting Provider Specific Instructions

### Shared Hosting (Hostinger, Bluehost, etc.)

1. **File Upload**
   - Use File Manager in cPanel
   - Upload to `public_html/` directory
   - Ensure index.html is in the root

2. **Domain Configuration**
   - Point domain to the hosting account
   - Enable SSL through hosting panel
   - Configure email accounts if needed

### Cloud Hosting (AWS, Google Cloud, Azure)

#### AWS S3 + CloudFront (Static Hosting)

1. **S3 Setup**
   ```bash
   # Upload to S3 bucket
   aws s3 sync public/ s3://your-bucket-name/ --delete
   
   # Configure bucket for static website hosting
   aws s3 website s3://your-bucket-name --index-document index.html --error-document 404.html
   ```

2. **CloudFront Configuration**
   - Create CloudFront distribution
   - Configure custom domain and SSL certificate
   - Set up caching rules

#### Google Cloud Storage + CDN

1. **Upload Files**
   ```bash
   gsutil -m rsync -r -d public/ gs://your-bucket-name/
   ```

2. **Configure CDN**
   - Set up Cloud CDN
   - Configure custom domain
   - Enable HTTPS

### CDN Integration

#### CloudFlare Setup

1. **Add Domain to CloudFlare**
   - Change nameservers to CloudFlare
   - Configure DNS records

2. **Optimize Settings**
   - Enable Auto Minify for CSS, JS, HTML
   - Configure caching rules
   - Enable security features

## Troubleshooting

### Common Issues

1. **404 Errors on Page Navigation**
   - Ensure .htaccess file is properly configured
   - Check that mod_rewrite is enabled (Apache)
   - Verify file permissions (644 for files, 755 for directories)

2. **CSS/JS Not Loading**
   - Check file paths in HTML files
   - Verify MIME types are configured correctly
   - Ensure files were uploaded completely

3. **Contact Form Not Working**
   - Verify PHP is enabled on the server
   - Check email configuration
   - Test form validation

4. **SSL Certificate Issues**
   - Ensure certificate is properly installed
   - Check intermediate certificates
   - Verify domain name matches certificate

### Performance Issues

1. **Slow Loading Times**
   - Enable compression (gzip/brotli)
   - Optimize images further
   - Use CDN for static assets
   - Enable browser caching

2. **Mobile Performance**
   - Test on various devices
   - Optimize images for mobile
   - Check responsive design implementation

## Maintenance

### Regular Tasks

1. **Content Updates**
   - Update company information as needed
   - Add new service pages
   - Update client testimonials

2. **Security Updates**
   - Keep server software updated
   - Monitor security headers
   - Review access logs regularly

3. **Performance Monitoring**
   - Monitor page load times
   - Check Core Web Vitals
   - Review analytics data

### Backup Strategy

1. **File Backups**
   - Regular backups of website files
   - Database backups (if applicable)
   - Configuration file backups

2. **Automated Backups**
   - Set up automated daily/weekly backups
   - Store backups in multiple locations
   - Test backup restoration process

## Support

For deployment issues or questions:

1. Check the troubleshooting section above
2. Review server error logs
3. Test in staging environment first
4. Document any custom configurations made

## Next Steps

After successful deployment:

1. Set up monitoring and analytics
2. Configure automated backups
3. Plan for regular content updates
4. Monitor performance and security