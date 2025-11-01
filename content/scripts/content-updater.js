#!/usr/bin/env node

/**
 * Content Update System
 * Provides tools for updating website content using templates and data files
 */

const fs = require('fs');
const path = require('path');

class ContentUpdater {
    constructor() {
        this.contentDir = path.join(__dirname, '..');
        this.publicDir = path.join(__dirname, '../../public');
        this.templatesDir = path.join(this.contentDir, 'templates');
        this.dataDir = path.join(this.contentDir, 'data');
        
        this.siteConfig = this.loadJSON('site-config.json');
        this.servicesData = this.loadJSON('services.json');
        this.pagesData = this.loadJSON('pages.json');
    }

    loadJSON(filename) {
        try {
            const filePath = path.join(this.dataDir, filename);
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            console.error(`Error loading ${filename}:`, error.message);
            return {};
        }
    }

    loadTemplate(templateName) {
        try {
            const templatePath = path.join(this.templatesDir, templateName);
            return fs.readFileSync(templatePath, 'utf8');
        } catch (error) {
            console.error(`Error loading template ${templateName}:`, error.message);
            return '';
        }
    }

    replaceTemplateVariables(content, variables) {
        let result = content;
        
        Object.keys(variables).forEach(key => {
            const placeholder = `{{${key}}}`;
            const value = variables[key] || '';
            result = result.replace(new RegExp(placeholder, 'g'), value);
        });
        
        return result;
    }

    generateServicePage(serviceId) {
        const service = this.servicesData.services.find(s => s.id === serviceId);
        if (!service) {
            console.error(`Service not found: ${serviceId}`);
            return;
        }

        const template = this.loadTemplate('service-page-template.html');
        const headerTemplate = this.loadTemplate('content-blocks.html');
        
        // Extract header and footer from content blocks
        const headerContent = this.extractTemplate(headerTemplate, 'header-template');
        const footerContent = this.extractTemplate(headerTemplate, 'footer-template');
        
        const variables = {
            SERVICE_TITLE: service.title,
            SERVICE_DESCRIPTION: service.description,
            SERVICE_KEYWORDS: service.keywords.join(', '),
            SERVICE_URL: service.url,
            SERVICE_H1: service.title,
            SERVICE_SUBTITLE: service.shortDescription,
            SERVICE_OVERVIEW_TITLE: `About ${service.name}`,
            SERVICE_OVERVIEW_CONTENT: service.description,
            SERVICE_FEATURES_LIST: service.features.map(f => `<li>${f}</li>`).join('\n                                    '),
            SERVICE_BENEFITS_CONTENT: this.generateBenefitsHTML(service.benefits),
            SERVICE_IMAGE: service.image,
            SERVICE_TYPE: service.serviceType,
            HEADER_CONTENT: headerContent,
            FOOTER_CONTENT: footerContent,
            RELATED_SERVICES_CONTENT: this.generateRelatedServicesHTML(serviceId),
            ANALYTICS_CODE: this.generateAnalyticsCode()
        };

        const pageContent = this.replaceTemplateVariables(template, variables);
        const outputPath = path.join(this.publicDir, service.url);
        
        fs.writeFileSync(outputPath, pageContent);
        console.log(`✅ Generated service page: ${service.url}`);
    }

    generateBenefitsHTML(benefits) {
        return benefits.map(benefit => `
                                    <div class="col-md-6">
                                        <div class="benefit-item">
                                            <i class="bx bx-check"></i>
                                            <span>${benefit}</span>
                                        </div>
                                    </div>`).join('');
    }

    generateRelatedServicesHTML(currentServiceId) {
        const relatedServices = this.servicesData.services
            .filter(s => s.id !== currentServiceId)
            .slice(0, 3);
        
        return relatedServices.map(service => `
                            <div class="col-lg-4">
                                <div class="service-card">
                                    <div class="service-icon">
                                        <i class="${service.icon}"></i>
                                    </div>
                                    <h3>${service.name}</h3>
                                    <p>${service.shortDescription}</p>
                                    <a href="${service.url}" class="service-link">Learn More <i class="bx bx-right-arrow-alt"></i></a>
                                </div>
                            </div>`).join('');
    }

    extractTemplate(content, templateId) {
        const regex = new RegExp(`<template id="${templateId}">(.*?)</template>`, 's');
        const match = content.match(regex);
        return match ? match[1].trim() : '';
    }

    generateAnalyticsCode() {
        if (this.siteConfig.analytics && this.siteConfig.analytics.googleAnalytics) {
            return `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${this.siteConfig.analytics.googleAnalytics}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${this.siteConfig.analytics.googleAnalytics}');
    </script>`;
        }
        return '';
    }

    updateSitemap() {
        const allPages = [
            ...this.pagesData.pages,
            ...this.pagesData.servicePages
        ];

        const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `    <url>
        <loc>${this.siteConfig.site.baseUrl}/${page.url}</loc>
        <lastmod>${page.lastModified}</lastmod>
        <changefreq>${page.changeFreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

        const sitemapPath = path.join(this.publicDir, 'sitemap.xml');
        fs.writeFileSync(sitemapPath, sitemapXML);
        console.log('✅ Updated sitemap.xml');
    }

    updateRobotsTxt() {
        const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.siteConfig.site.baseUrl}/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /config/
Disallow: /scripts/
Disallow: /content/

# Allow important files
Allow: /assets/
Allow: /sitemap.xml
Allow: /robots.txt`;

        const robotsPath = path.join(this.publicDir, 'robots.txt');
        fs.writeFileSync(robotsPath, robotsTxt);
        console.log('✅ Updated robots.txt');
    }

    generateAllServicePages() {
        console.log('🔄 Generating all service pages...\n');
        
        this.servicesData.services.forEach(service => {
            this.generateServicePage(service.id);
        });
        
        console.log('\n✅ All service pages generated successfully!');
    }

    updateAllContent() {
        console.log('🔄 Updating all website content...\n');
        
        this.generateAllServicePages();
        this.updateSitemap();
        this.updateRobotsTxt();
        
        console.log('\n🎉 Content update completed successfully!');
    }

    validateDataConsistency() {
        console.log('🔍 Validating data consistency...\n');
        
        const issues = [];
        
        // Check if all service pages exist in pages data
        this.servicesData.services.forEach(service => {
            const pageExists = this.pagesData.servicePages.find(p => p.id === service.id);
            if (!pageExists) {
                issues.push(`Service "${service.id}" missing from pages.json`);
            }
        });
        
        // Check if all page URLs are unique
        const allUrls = [
            ...this.pagesData.pages.map(p => p.url),
            ...this.pagesData.servicePages.map(p => p.url)
        ];
        
        const duplicateUrls = allUrls.filter((url, index) => allUrls.indexOf(url) !== index);
        if (duplicateUrls.length > 0) {
            issues.push(`Duplicate URLs found: ${duplicateUrls.join(', ')}`);
        }
        
        if (issues.length === 0) {
            console.log('✅ Data consistency validation passed!');
        } else {
            console.log('❌ Data consistency issues found:');
            issues.forEach(issue => console.log(`  • ${issue}`));
        }
        
        return issues.length === 0;
    }
}

// CLI interface
if (require.main === module) {
    const updater = new ContentUpdater();
    const command = process.argv[2];
    const target = process.argv[3];
    
    switch (command) {
        case 'service':
            if (target) {
                updater.generateServicePage(target);
            } else {
                updater.generateAllServicePages();
            }
            break;
        case 'sitemap':
            updater.updateSitemap();
            break;
        case 'robots':
            updater.updateRobotsTxt();
            break;
        case 'validate':
            updater.validateDataConsistency();
            break;
        case 'all':
            updater.updateAllContent();
            break;
        default:
            console.log(`
Content Updater Usage:

  node content-updater.js <command> [target]

Commands:
  service [id]    Generate service page(s)
  sitemap         Update sitemap.xml
  robots          Update robots.txt
  validate        Validate data consistency
  all             Update all content

Examples:
  node content-updater.js service permanent-recruitment
  node content-updater.js service
  node content-updater.js all
            `);
    }
}

module.exports = ContentUpdater;