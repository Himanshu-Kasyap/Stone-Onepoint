# Security Headers Configuration

This document outlines the comprehensive security headers implementation for the Stone OnePoint Solutions website to protect against common web vulnerabilities and attacks.

## Overview

Security headers are HTTP response headers that instruct browsers on how to behave when handling the website's content. They provide an additional layer of security by preventing various types of attacks including XSS, clickjacking, MIME sniffing, and more.

## Implemented Security Headers

### 1. Content Security Policy (CSP)
**Header:** `Content-Security-Policy`
**Purpose:** Prevents XSS attacks and unauthorized resource loading

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; 
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; 
  font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; 
  img-src 'self' data: https: blob:; 
  media-src 'self' https:; 
  object-src 'none'; 
  connect-src 'self' https://www.google-analytics.com https://analytics.google.com; 
  frame-ancestors 'none'; 
  base-uri 'self'; 
  form-action 'self'; 
  upgrade-insecure-requests;
```

**Directives Explained:**
- `default-src 'self'`: Only allow resources from the same origin by default
- `script-src`: Allow scripts from self, inline scripts, and trusted CDNs
- `style-src`: Allow styles from self, inline styles, and Google Fonts
- `font-src`: Allow fonts from self and trusted sources
- `img-src`: Allow images from self, data URLs, and HTTPS sources
- `object-src 'none'`: Block all plugins (Flash, etc.)
- `frame-ancestors 'none'`: Prevent embedding in frames
- `upgrade-insecure-requests`: Automatically upgrade HTTP to HTTPS

### 2. X-Frame-Options
**Header:** `X-Frame-Options: DENY`
**Purpose:** Prevents clickjacking attacks by blocking the page from being embedded in frames

### 3. X-Content-Type-Options
**Header:** `X-Content-Type-Options: nosniff`
**Purpose:** Prevents MIME type sniffing attacks by forcing browsers to respect declared content types

### 4. X-XSS-Protection
**Header:** `X-XSS-Protection: 1; mode=block`
**Purpose:** Enables XSS filtering in legacy browsers (IE, Safari)

### 5. Referrer Policy
**Header:** `Referrer-Policy: strict-origin-when-cross-origin`
**Purpose:** Controls how much referrer information is sent with requests
- Same-origin requests: Send full URL
- Cross-origin HTTPS→HTTPS: Send origin only
- Cross-origin HTTPS→HTTP: Send nothing

### 6. Permissions Policy
**Header:** `Permissions-Policy`
**Purpose:** Controls which browser features and APIs can be used

```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self), sync-xhr=()
```

**Features Controlled:**
- `geolocation=()`: Block geolocation access
- `microphone=()`: Block microphone access
- `camera=()`: Block camera access
- `payment=()`: Block payment API
- `fullscreen=(self)`: Allow fullscreen only for same origin

### 7. Strict Transport Security (HSTS)
**Header:** `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
**Purpose:** Forces HTTPS connections and prevents protocol downgrade attacks
- `max-age=31536000`: Cache for 1 year
- `includeSubDomains`: Apply to all subdomains
- `preload`: Eligible for browser preload lists

### 8. Cross-Origin Headers
**Headers:** 
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

**Purpose:** Control cross-origin resource sharing and embedding

## Server Configuration

### Apache (.htaccess)
The security headers are configured in `/config/apache/.htaccess`:

```apache
<IfModule mod_headers.c>
    # Enhanced Security Headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self), sync-xhr=()"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set Content-Security-Policy "..."
    Header always set Cross-Origin-Embedder-Policy "require-corp"
    Header always set Cross-Origin-Opener-Policy "same-origin"
    Header always set Cross-Origin-Resource-Policy "same-origin"
</IfModule>
```

### Nginx
The security headers are configured in `/config/nginx/nginx.conf`:

```nginx
# Enhanced Security Headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self), sync-xhr=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Content-Security-Policy "..." always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
```

## Testing and Validation

### Automated Testing
Use the security headers validator script:

```bash
# Test local configuration
node scripts/security-headers-validator.js --local

# Test live website
node scripts/security-headers-validator.js https://your-domain.com
```

### Online Testing Tools
1. **Mozilla Observatory**: https://observatory.mozilla.org/
2. **Security Headers**: https://securityheaders.com/
3. **CSP Evaluator**: https://csp-evaluator.withgoogle.com/

### Manual Testing
Check headers using browser developer tools:
1. Open Network tab
2. Reload the page
3. Click on the main document request
4. Check Response Headers section

## Security Considerations

### CSP Tuning
The current CSP allows `'unsafe-inline'` and `'unsafe-eval'` for compatibility with existing JavaScript libraries. For enhanced security:

1. **Remove 'unsafe-inline'**: Move all inline scripts to external files
2. **Remove 'unsafe-eval'**: Replace libraries that use eval()
3. **Add nonces**: Use cryptographic nonces for inline scripts
4. **Use hashes**: Hash inline scripts and styles

### HSTS Preloading
To submit the domain for HSTS preloading:
1. Ensure HSTS header includes `preload` directive
2. Submit domain at: https://hstspreload.org/
3. Wait for inclusion in browser preload lists

### Regular Updates
1. **Monitor CSP violations**: Implement CSP reporting
2. **Update allowed sources**: Review and update CSP directives regularly
3. **Security audits**: Perform regular security header audits
4. **Browser compatibility**: Test headers across different browsers

## Troubleshooting

### Common Issues

**CSP Violations:**
- Check browser console for CSP violation reports
- Adjust CSP directives to allow legitimate resources
- Use CSP report-only mode for testing

**Mixed Content:**
- Ensure all resources use HTTPS
- Update hardcoded HTTP URLs
- Use protocol-relative URLs where appropriate

**Frame Blocking:**
- If legitimate embedding is needed, change X-Frame-Options to SAMEORIGIN
- Use CSP frame-ancestors directive for more granular control

**Font Loading Issues:**
- Ensure font sources are included in CSP font-src directive
- Add CORS headers for cross-origin fonts

## Compliance and Standards

### Security Standards
- **OWASP Top 10**: Addresses several OWASP security risks
- **NIST Cybersecurity Framework**: Aligns with protection and detection functions
- **ISO 27001**: Supports information security management requirements

### Regulatory Compliance
- **GDPR**: Privacy-focused headers support data protection
- **PCI DSS**: Security headers contribute to secure payment processing
- **SOC 2**: Demonstrates security controls implementation

## Monitoring and Maintenance

### Continuous Monitoring
1. **Automated testing**: Include security header tests in CI/CD pipeline
2. **Security scanning**: Regular vulnerability assessments
3. **Log monitoring**: Monitor for security-related errors and violations

### Update Schedule
- **Monthly**: Review CSP violation reports
- **Quarterly**: Update security header configurations
- **Annually**: Comprehensive security audit and policy review

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [HSTS Preload List](https://hstspreload.org/)