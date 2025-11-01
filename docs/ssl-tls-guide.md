# SSL/TLS Configuration Guide

## Overview
This guide provides recommendations for secure SSL/TLS configuration for the Stone OnePoint Solutions website.

## Recommended SSL/TLS Settings

### Apache Configuration
```apache
# Enable SSL module
LoadModule ssl_module modules/mod_ssl.so

# SSL Configuration
<VirtualHost *:443>
    ServerName www.stoneonepointsolutions.in
    DocumentRoot /var/www/html
    
    # SSL Engine
    SSLEngine on
    
    # Certificate files (update paths)
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    SSLCertificateChainFile /path/to/chain.crt
    
    # Secure protocols (TLS 1.2 and 1.3 only)
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    
    # Secure cipher suites
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256
    
    # Prefer server ciphers
    SSLHonorCipherOrder off
    
    # Session configuration
    SSLSessionCache shmcb:/var/cache/mod_ssl/scache(512000)
    SSLSessionCacheTimeout 300
    
    # OCSP Stapling
    SSLUseStapling on
    SSLStaplingCache shmcb:/var/run/ocsp(128000)
</VirtualHost>
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name www.stoneonepointsolutions.in;
    
    # Certificate files (update paths)
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Secure protocols
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Secure ciphers
    ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    
    # Prefer server ciphers
    ssl_prefer_server_ciphers off;
    
    # Session configuration
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /path/to/chain.crt;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
}
```

## Certificate Management

### Let's Encrypt (Recommended for free certificates)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-apache

# Obtain certificate
sudo certbot --apache -d www.stoneonepointsolutions.in

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Commercial SSL Certificates
1. Generate CSR (Certificate Signing Request)
2. Purchase certificate from trusted CA
3. Install certificate files
4. Configure web server

## Security Best Practices

1. **Use Strong Protocols**: Only TLS 1.2 and 1.3
2. **Secure Ciphers**: Use modern, secure cipher suites
3. **HSTS**: Enable HTTP Strict Transport Security
4. **OCSP Stapling**: Improve certificate validation performance
5. **Regular Updates**: Keep SSL/TLS libraries updated
6. **Certificate Monitoring**: Monitor certificate expiration

## Testing Tools

- SSL Labs Test: https://www.ssllabs.com/ssltest/
- Mozilla Observatory: https://observatory.mozilla.org/
- Security Headers: https://securityheaders.com/

## Troubleshooting

### Common Issues
1. **Mixed Content**: Ensure all resources use HTTPS
2. **Certificate Errors**: Verify certificate chain
3. **Cipher Mismatches**: Update cipher suites
4. **Protocol Issues**: Disable insecure protocols

### Monitoring
- Set up certificate expiration alerts
- Monitor SSL/TLS configuration changes
- Regular security assessments
