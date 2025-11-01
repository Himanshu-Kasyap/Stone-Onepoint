# Content Management Guide

This guide explains how to use the content management system for the Stone OnePoint Solutions website.

## Overview

The content management system provides:
- **Templates**: Consistent formatting for pages and content blocks
- **Data Files**: Structured content data in JSON format
- **Scripts**: Automated tools for content updates and validation
- **Backup System**: Version control and backup management

## Quick Start

### 1. Update Content Data

Edit the JSON files in `content/data/`:
- `site-config.json` - Site-wide configuration
- `services.json` - Service information
- `pages.json` - Page metadata

### 2. Generate Updated Pages

```bash
# Update all content
npm run content:update

# Update only service pages
npm run content:update-services

# Update sitemap
npm run content:update-sitemap
```

### 3. Validate Content

```bash
# Validate HTML content
npm run content:validate

# Validate data consistency
npm run content:validate-data
```

### 4. Backup Before Changes

```bash
# Create backup
npm run backup:create

# List backups
npm run backup:list

# Restore backup if needed
npm run backup:restore <backup-id>
```

## Content Structure

### Data Files

#### site-config.json
Contains site-wide configuration:
```json
{
  "site": {
    "name": "Stone OnePoint Solutions Pvt. Ltd.",
    "baseUrl": "https://www.stoneonepointsolutions.in"
  },
  "contact": {
    "phone": "+91 8595378782",
    "email": "hr@stoneonepointsolutions.in"
  }
}
```

#### services.json
Defines all services:
```json
{
  "services": [
    {
      "id": "permanent-recruitment",
      "name": "Permanent Recruitment",
      "title": "Permanent Recruitment Services",
      "description": "...",
      "url": "permanent-recruitment.html",
      "keywords": ["recruitment", "hiring"]
    }
  ]
}
```

#### pages.json
Defines page metadata:
```json
{
  "pages": [
    {
      "id": "home",
      "title": "Home",
      "url": "index.html",
      "description": "...",
      "priority": 1.0
    }
  ]
}
```

### Templates

#### page-template.html
Basic page template with placeholders:
- `{{PAGE_TITLE}}` - Page title
- `{{PAGE_DESCRIPTION}}` - Meta description
- `{{PAGE_CONTENT}}` - Main content area

#### service-page-template.html
Service-specific template with:
- `{{SERVICE_TITLE}}` - Service name
- `{{SERVICE_FEATURES_LIST}}` - Feature list
- `{{SERVICE_BENEFITS_CONTENT}}` - Benefits section

#### content-blocks.html
Reusable content blocks:
- Header template
- Footer template
- Service cards
- Contact forms

## Content Management Tasks

### Adding a New Service

1. **Update services.json**:
```json
{
  "id": "new-service",
  "name": "New Service",
  "title": "New Service Title",
  "description": "Service description",
  "url": "new-service.html",
  "image": "service-image.jpg",
  "keywords": ["keyword1", "keyword2"]
}
```

2. **Update pages.json**:
```json
{
  "id": "new-service",
  "title": "New Service Title",
  "url": "new-service.html",
  "description": "Service description",
  "priority": 0.8
}
```

3. **Generate the page**:
```bash
npm run content:update-services
```

### Updating Contact Information

1. **Edit site-config.json**:
```json
{
  "contact": {
    "phone": "+91 8595378782",
    "email": "hr@stoneonepointsolutions.in"
  }
}
```

2. **Regenerate all content**:
```bash
npm run content:update
```

### Modifying Page Templates

1. **Edit template files** in `content/templates/`
2. **Test changes** on a single page first
3. **Create backup** before applying to all pages:
```bash
npm run backup:create "Before template update"
```
4. **Apply changes**:
```bash
npm run content:update
```

## Validation and Quality Control

### Content Validation

The content validator checks for:
- **SEO compliance**: Title length, meta descriptions, structured data
- **Accessibility**: Alt tags, form labels, heading hierarchy
- **Content consistency**: Company name, contact info, branding
- **Link integrity**: Broken links, external link attributes
- **HTML quality**: Proper structure, semantic markup

Run validation:
```bash
npm run content:validate
```

### Data Consistency

Validates that:
- All services have corresponding page entries
- URLs are unique
- Required fields are present

```bash
npm run content:validate-data
```

## Backup and Version Control

### Creating Backups

```bash
# Create backup with description
npm run backup:create "Description of changes"

# Or use the script directly
node content/scripts/backup-manager.js create "Major content update"
```

### Managing Backups

```bash
# List all backups
npm run backup:list

# Restore specific backup
npm run backup:restore backup-2024-10-31T10-30-00-000Z

# Compare two backups
node content/scripts/backup-manager.js compare backup1 backup2

# Clean up old backups (keep 5 most recent)
npm run backup:cleanup
```

### What Gets Backed Up

- Content data files (`content/data/`)
- Template files (`content/templates/`)
- Generated HTML files (`public/*.html`)
- Sitemap and robots.txt

## Best Practices

### Before Making Changes

1. **Create a backup**:
```bash
npm run backup:create "Before [description of changes]"
```

2. **Validate current content**:
```bash
npm run content:validate
```

### Making Changes

1. **Edit data files** rather than HTML directly
2. **Use templates** for consistent formatting
3. **Test on single page** before bulk updates
4. **Validate after changes**

### After Changes

1. **Validate content**:
```bash
npm run content:validate
npm run content:validate-data
```

2. **Test website functionality**
3. **Update sitemap if needed**:
```bash
npm run content:update-sitemap
```

### Content Guidelines

- **Company Name**: Always use "Stone OnePoint Solutions Pvt. Ltd."
- **Contact Info**: Use standardized format from site-config.json
- **SEO**: Keep titles 30-60 chars, descriptions 120-160 chars
- **Images**: Always include descriptive alt text
- **Links**: External links should open in new tab with security attributes

## Troubleshooting

### Common Issues

**Validation Errors**:
- Check for missing alt tags on images
- Verify meta descriptions are within character limits
- Ensure proper heading hierarchy (h1 → h2 → h3)

**Template Issues**:
- Verify placeholder syntax: `{{VARIABLE_NAME}}`
- Check that all required variables are defined
- Ensure template files are valid HTML

**Backup Problems**:
- Check disk space for backup directory
- Verify file permissions
- Use absolute backup IDs when restoring

### Getting Help

1. **Check validation reports** in `content/validation/`
2. **Review backup manifests** for file changes
3. **Use compare function** to see differences between versions

## Advanced Usage

### Custom Templates

Create new templates by:
1. Copying existing template
2. Modifying placeholders and structure
3. Updating content-updater.js to use new template

### Automated Updates

Set up automated content updates:
```bash
# Daily backup
0 2 * * * cd /path/to/website && npm run backup:create "Daily backup"

# Weekly validation
0 3 * * 0 cd /path/to/website && npm run content:validate
```

### Integration with CI/CD

Add to deployment pipeline:
```bash
# Validate before deployment
npm run content:validate
npm run content:validate-data

# Create deployment backup
npm run backup:create "Pre-deployment backup"
```