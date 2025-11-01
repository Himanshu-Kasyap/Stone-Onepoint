#!/usr/bin/env node

/**
 * Structured Data Markup Generator
 * 
 * This script adds JSON-LD structured data markup to HTML files:
 * - Implements JSON-LD structured data for business information
 * - Add LocalBusiness schema markup for company locations
 * - Include Service schema markup for HR services
 * - Add Organization schema with contact details
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class StructuredDataGenerator {
    constructor(publicDir, baseUrl = 'https://www.stoneonepointsolutions.in') {
        this.publicDir = publicDir;
        this.baseUrl = baseUrl;
        this.processedFiles = [];
        this.errors = [];
        
        // Company information for structured data
        this.companyInfo = {
            name: "Stone OnePoint Solutions Pvt. Ltd.",
            alternateName: "Stone OnePoint Solutions",
            url: "https://www.stoneonepointsolutions.in",
            logo: "https://www.stoneonepointsolutions.in/assets/img/logo.png",
            description: "India's premier HR solutions partner providing temporary staffing, permanent recruitment, payroll management, and training services.",
            email: "hr@stoneonepointsolutions.in",
            telephone: "+91 8595378782",
            foundingDate: "2010",
            numberOfEmployees: "50-100",
            industry: "Human Resources Services",
            locations: [
                {
                    name: "Mumbai Office",
                    address: {
                        streetAddress: "Andheri West",
                        addressLocality: "Mumbai",
                        addressRegion: "Maharashtra",
                        postalCode: "400058",
                        addressCountry: "IN"
                    },
                    telephone: "+91 8595378782",
                    geo: {
                        latitude: "19.1136",
                        longitude: "72.8697"
                    }
                },
                {
                    name: "Bangalore Office",
                    address: {
                        streetAddress: "Koramangala",
                        addressLocality: "Bangalore",
                        addressRegion: "Karnataka",
                        postalCode: "560034",
                        addressCountry: "IN"
                    },
                    telephone: "+91 8595378782",
                    geo: {
                        latitude: "12.9352",
                        longitude: "77.6245"
                    }
                },
                {
                    name: "Delhi Office",
                    address: {
                        streetAddress: "Connaught Place",
                        addressLocality: "New Delhi",
                        addressRegion: "Delhi",
                        postalCode: "110001",
                        addressCountry: "IN"
                    },
                    telephone: "+91 8595378782",
                    geo: {
                        latitude: "28.6315",
                        longitude: "77.2167"
                    }
                },
                {
                    name: "Kolkata Office",
                    address: {
                        streetAddress: "Salt Lake City",
                        addressLocality: "Kolkata",
                        addressRegion: "West Bengal",
                        postalCode: "700064",
                        addressCountry: "IN"
                    },
                    telephone: "+91 8595378782",
                    geo: {
                        latitude: "22.5726",
                        longitude: "88.3639"
                    }
                },
                {
                    name: "Noida Office",
                    address: {
                        streetAddress: "Sector 62",
                        addressLocality: "Noida",
                        addressRegion: "Uttar Pradesh",
                        postalCode: "201309",
                        addressCountry: "IN"
                    },
                    telephone: "+91 8595378782",
                    geo: {
                        latitude: "28.6139",
                        longitude: "77.3910"
                    }
                }
            ],
            services: [
                {
                    name: "Temporary Staffing",
                    description: "Flexible temporary staffing solutions to meet your workforce demands.",
                    serviceType: "Staffing Services"
                },
                {
                    name: "Permanent Recruitment",
                    description: "Expert permanent recruitment services to find the right talent for your organization.",
                    serviceType: "Recruitment Services"
                },
                {
                    name: "Payroll Management",
                    description: "Comprehensive payroll outsourcing and management services.",
                    serviceType: "Payroll Services"
                },
                {
                    name: "Training & Development",
                    description: "Professional training and development programs to enhance workforce skills.",
                    serviceType: "Training Services"
                },
                {
                    name: "Executive Hiring",
                    description: "Specialized executive search and hiring services for senior-level positions.",
                    serviceType: "Executive Search"
                },
                {
                    name: "Bulk & Campus Hiring",
                    description: "Efficient bulk and campus hiring solutions for large-scale recruitment needs.",
                    serviceType: "Campus Recruitment"
                }
            ],
            socialMedia: [
                "https://www.facebook.com/stoneonepointsolutions/",
                "https://www.linkedin.com/company/stone-onepoint-solutions/"
            ]
        };
    }

    /**
     * Process all HTML files and add structured data
     */
    async processAllFiles() {
        console.log('🚀 Starting Structured Data Markup Generation...\n');
        
        try {
            const files = await this.getHtmlFiles();
            console.log(`📁 Found ${files.length} HTML files to process\n`);
            
            for (const file of files) {
                await this.processFile(file);
            }
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Error processing files:', error.message);
            process.exit(1);
        }
    }

    /**
     * Get all HTML files from the public directory
     */
    async getHtmlFiles() {
        const files = [];
        const entries = await fs.promises.readdir(this.publicDir);
        
        for (const entry of entries) {
            const fullPath = path.join(this.publicDir, entry);
            const stat = await fs.promises.stat(fullPath);
            
            if (stat.isFile() && entry.endsWith('.html')) {
                // Skip error pages and non-content files
                if (!this.shouldSkipFile(entry)) {
                    files.push(entry);
                }
            }
        }
        
        return files.sort();
    }

    /**
     * Check if file should be skipped
     */
    shouldSkipFile(filename) {
        const skipPatterns = [
            /^\d+\.html$/,  // Numbered files like 1.html, 2.html
            /^(bg|shape|section-shape|right-img|help-img|experience-img|download-img|quote-here-img|what-do-img|popular-posts-\d+|owl\.video\.play)\.html$/,
            /^(fade|backblue)\.html$/
        ];
        
        return skipPatterns.some(pattern => pattern.test(filename));
    }

    /**
     * Process individual HTML file
     */
    async processFile(filename) {
        const filePath = path.join(this.publicDir, filename);
        
        try {
            console.log(`📄 Processing: ${filename}`);
            
            const content = await fs.promises.readFile(filePath, 'utf8');
            const dom = new JSDOM(content);
            const document = dom.window.document;
            
            let modified = false;
            
            // Remove existing structured data to avoid duplicates
            const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
            existingScripts.forEach(script => script.remove());
            
            // Add appropriate structured data based on page type
            const structuredData = this.generateStructuredDataForPage(filename);
            
            if (structuredData.length > 0) {
                structuredData.forEach(data => {
                    const script = document.createElement('script');
                    script.type = 'application/ld+json';
                    script.textContent = JSON.stringify(data, null, 2);
                    document.head.appendChild(script);
                });
                
                console.log(`  ✅ Added ${structuredData.length} structured data schema(s)`);
                modified = true;
            }
            
            // Save changes if any modifications were made
            if (modified) {
                const optimizedContent = dom.serialize();
                await fs.promises.writeFile(filePath, optimizedContent, 'utf8');
                console.log(`  💾 Saved with structured data`);
            } else {
                console.log(`  ℹ️  No structured data added`);
            }
            
            this.processedFiles.push({
                filename,
                modified,
                schemasAdded: structuredData.length,
                status: 'success'
            });
            
        } catch (error) {
            console.error(`  ❌ Error processing ${filename}:`, error.message);
            this.errors.push({
                filename,
                error: error.message
            });
        }
        
        console.log(''); // Empty line for readability
    }

    /**
     * Generate structured data based on page type
     */
    generateStructuredDataForPage(filename) {
        const schemas = [];
        
        // Always add Organization schema to main pages
        if (this.isMainPage(filename)) {
            schemas.push(this.generateOrganizationSchema());
        }
        
        // Add LocalBusiness schema for location-specific pages
        if (this.isLocationPage(filename)) {
            const location = this.getLocationFromFilename(filename);
            if (location) {
                schemas.push(this.generateLocalBusinessSchema(location));
            }
        }
        
        // Add Service schema for service pages
        if (this.isServicePage(filename)) {
            const service = this.getServiceFromFilename(filename);
            if (service) {
                schemas.push(this.generateServiceSchema(service));
            }
        }
        
        // Add WebSite schema for homepage
        if (filename === 'index.html') {
            schemas.push(this.generateWebSiteSchema());
        }
        
        // Add ContactPage schema for contact page
        if (filename === 'contact.html') {
            schemas.push(this.generateContactPageSchema());
        }
        
        // Add AboutPage schema for company profile
        if (filename === 'company-profile.html') {
            schemas.push(this.generateAboutPageSchema());
        }
        
        return schemas;
    }

    /**
     * Check if page is a main page
     */
    isMainPage(filename) {
        const mainPages = [
            'index.html',
            'company-profile.html',
            'contact.html',
            'clients.html'
        ];
        return mainPages.includes(filename);
    }

    /**
     * Check if page is location-specific
     */
    isLocationPage(filename) {
        const locationKeywords = ['mumbai', 'bangalore', 'delhi', 'kolkata', 'noida', 'andheri'];
        return locationKeywords.some(keyword => filename.includes(keyword));
    }

    /**
     * Check if page is service-specific
     */
    isServicePage(filename) {
        const serviceKeywords = [
            'temporary-staffing', 'permanent-recruitment', 'payroll', 'training',
            'executive-hiring', 'bulk-campus-hiring', 'recruitment', 'staffing',
            'manpower', 'leadership', 'skill-development'
        ];
        return serviceKeywords.some(keyword => filename.includes(keyword));
    }

    /**
     * Get location info from filename
     */
    getLocationFromFilename(filename) {
        if (filename.includes('mumbai') || filename.includes('andheri')) {
            return this.companyInfo.locations[0]; // Mumbai
        }
        if (filename.includes('bangalore')) {
            return this.companyInfo.locations[1]; // Bangalore
        }
        if (filename.includes('delhi')) {
            return this.companyInfo.locations[2]; // Delhi
        }
        if (filename.includes('kolkata')) {
            return this.companyInfo.locations[3]; // Kolkata
        }
        if (filename.includes('noida')) {
            return this.companyInfo.locations[4]; // Noida
        }
        return null;
    }

    /**
     * Get service info from filename
     */
    getServiceFromFilename(filename) {
        if (filename.includes('temporary-staffing')) {
            return this.companyInfo.services[0];
        }
        if (filename.includes('permanent-recruitment')) {
            return this.companyInfo.services[1];
        }
        if (filename.includes('payroll')) {
            return this.companyInfo.services[2];
        }
        if (filename.includes('training') || filename.includes('leadership') || filename.includes('skill-development')) {
            return this.companyInfo.services[3];
        }
        if (filename.includes('executive-hiring')) {
            return this.companyInfo.services[4];
        }
        if (filename.includes('bulk') || filename.includes('campus')) {
            return this.companyInfo.services[5];
        }
        
        // Default service for recruitment-related pages
        if (filename.includes('recruitment') || filename.includes('staffing') || filename.includes('manpower')) {
            return this.companyInfo.services[1]; // Permanent Recruitment
        }
        
        return null;
    }

    /**
     * Generate Organization schema
     */
    generateOrganizationSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.companyInfo.name,
            "alternateName": this.companyInfo.alternateName,
            "url": this.companyInfo.url,
            "logo": this.companyInfo.logo,
            "description": this.companyInfo.description,
            "email": this.companyInfo.email,
            "telephone": this.companyInfo.telephone,
            "foundingDate": this.companyInfo.foundingDate,
            "numberOfEmployees": this.companyInfo.numberOfEmployees,
            "industry": this.companyInfo.industry,
            "sameAs": this.companyInfo.socialMedia,
            "address": this.companyInfo.locations.map(location => ({
                "@type": "PostalAddress",
                "streetAddress": location.address.streetAddress,
                "addressLocality": location.address.addressLocality,
                "addressRegion": location.address.addressRegion,
                "postalCode": location.address.postalCode,
                "addressCountry": location.address.addressCountry
            })),
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": this.companyInfo.telephone,
                "contactType": "customer service",
                "email": this.companyInfo.email,
                "availableLanguage": ["English", "Hindi"]
            },
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "HR Services",
                "itemListElement": this.companyInfo.services.map(service => ({
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": service.name,
                        "description": service.description,
                        "serviceType": service.serviceType
                    }
                }))
            }
        };
    }

    /**
     * Generate LocalBusiness schema
     */
    generateLocalBusinessSchema(location) {
        return {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": `${this.companyInfo.name} - ${location.name}`,
            "description": this.companyInfo.description,
            "url": this.companyInfo.url,
            "telephone": location.telephone,
            "email": this.companyInfo.email,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": location.address.streetAddress,
                "addressLocality": location.address.addressLocality,
                "addressRegion": location.address.addressRegion,
                "postalCode": location.address.postalCode,
                "addressCountry": location.address.addressCountry
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": location.geo.latitude,
                "longitude": location.geo.longitude
            },
            "openingHours": "Mo-Fr 09:00-18:00",
            "priceRange": "$$",
            "paymentAccepted": "Cash, Credit Card, Bank Transfer",
            "currenciesAccepted": "INR"
        };
    }

    /**
     * Generate Service schema
     */
    generateServiceSchema(service) {
        return {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": service.name,
            "description": service.description,
            "serviceType": service.serviceType,
            "provider": {
                "@type": "Organization",
                "name": this.companyInfo.name,
                "url": this.companyInfo.url,
                "telephone": this.companyInfo.telephone,
                "email": this.companyInfo.email
            },
            "areaServed": [
                {
                    "@type": "City",
                    "name": "Mumbai"
                },
                {
                    "@type": "City",
                    "name": "Bangalore"
                },
                {
                    "@type": "City",
                    "name": "Delhi"
                },
                {
                    "@type": "City",
                    "name": "Kolkata"
                },
                {
                    "@type": "City",
                    "name": "Noida"
                }
            ],
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": service.name,
                "itemListElement": [
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": service.name,
                            "description": service.description
                        }
                    }
                ]
            }
        };
    }

    /**
     * Generate WebSite schema
     */
    generateWebSiteSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": this.companyInfo.name,
            "alternateName": this.companyInfo.alternateName,
            "url": this.companyInfo.url,
            "description": this.companyInfo.description,
            "publisher": {
                "@type": "Organization",
                "name": this.companyInfo.name,
                "logo": this.companyInfo.logo
            },
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${this.companyInfo.url}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            }
        };
    }

    /**
     * Generate ContactPage schema
     */
    generateContactPageSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contact Us - Stone OnePoint Solutions Pvt. Ltd.",
            "description": "Get in touch with Stone OnePoint Solutions for professional HR solutions.",
            "url": `${this.companyInfo.url}/contact.html`,
            "mainEntity": {
                "@type": "Organization",
                "name": this.companyInfo.name,
                "telephone": this.companyInfo.telephone,
                "email": this.companyInfo.email,
                "address": this.companyInfo.locations.map(location => ({
                    "@type": "PostalAddress",
                    "name": location.name,
                    "streetAddress": location.address.streetAddress,
                    "addressLocality": location.address.addressLocality,
                    "addressRegion": location.address.addressRegion,
                    "postalCode": location.address.postalCode,
                    "addressCountry": location.address.addressCountry
                }))
            }
        };
    }

    /**
     * Generate AboutPage schema
     */
    generateAboutPageSchema() {
        return {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "About Stone OnePoint Solutions Pvt. Ltd.",
            "description": "Learn about Stone OnePoint Solutions - India's premier HR solutions partner.",
            "url": `${this.companyInfo.url}/company-profile.html`,
            "mainEntity": {
                "@type": "Organization",
                "name": this.companyInfo.name,
                "description": this.companyInfo.description,
                "foundingDate": this.companyInfo.foundingDate,
                "numberOfEmployees": this.companyInfo.numberOfEmployees,
                "industry": this.companyInfo.industry,
                "url": this.companyInfo.url,
                "logo": this.companyInfo.logo
            }
        };
    }

    /**
     * Generate processing report
     */
    generateReport() {
        console.log('📊 Structured Data Generation Report');
        console.log('====================================\n');
        
        const successful = this.processedFiles.filter(f => f.status === 'success');
        const modified = successful.filter(f => f.modified);
        const totalSchemas = successful.reduce((sum, f) => sum + f.schemasAdded, 0);
        
        console.log(`✅ Successfully processed: ${successful.length} files`);
        console.log(`🔧 Modified: ${modified.length} files`);
        console.log(`📋 Total schemas added: ${totalSchemas}`);
        console.log(`❌ Errors: ${this.errors.length} files\n`);
        
        if (modified.length > 0) {
            console.log('📝 Modified Files:');
            modified.forEach(file => {
                console.log(`  • ${file.filename} (${file.schemasAdded} schemas)`);
            });
            console.log('');
        }
        
        if (this.errors.length > 0) {
            console.log('❌ Errors:');
            this.errors.forEach(error => {
                console.log(`  • ${error.filename}: ${error.error}`);
            });
            console.log('');
        }
        
        console.log('🎉 Structured data generation completed!\n');
        
        // Save report to file
        const reportPath = path.join(this.publicDir, '../docs/structured-data-report.md');
        this.saveReportToFile(reportPath);
    }

    /**
     * Save detailed report to markdown file
     */
    async saveReportToFile(reportPath) {
        const totalSchemas = this.processedFiles.reduce((sum, f) => sum + f.schemasAdded, 0);
        
        const report = `# Structured Data Generation Report

Generated on: ${new Date().toISOString()}

## Summary

- **Total files processed:** ${this.processedFiles.length}
- **Files modified:** ${this.processedFiles.filter(f => f.modified).length}
- **Total schemas added:** ${totalSchemas}
- **Errors encountered:** ${this.errors.length}

## Schema Types Added

### Organization Schema
- Added to main pages (index, company-profile, contact, clients)
- Includes company information, contact details, and service catalog

### LocalBusiness Schema
- Added to location-specific pages
- Includes address, geo-coordinates, and local business information

### Service Schema
- Added to service-specific pages
- Includes service descriptions and area served

### WebSite Schema
- Added to homepage
- Includes search functionality and publisher information

### ContactPage Schema
- Added to contact page
- Includes contact information and office locations

### AboutPage Schema
- Added to company profile page
- Includes company background and organizational details

## Modified Files

${this.processedFiles.filter(f => f.modified).map(f => `- ${f.filename} (${f.schemasAdded} schemas)`).join('\n')}

## Errors

${this.errors.length > 0 ? this.errors.map(e => `- ${e.filename}: ${e.error}`).join('\n') : 'No errors encountered.'}

## Validation

To validate the structured data:
1. Use Google's Rich Results Test: https://search.google.com/test/rich-results
2. Use Schema.org validator: https://validator.schema.org/
3. Check Google Search Console for structured data reports

## Next Steps

1. Test structured data with Google's Rich Results Test
2. Submit updated sitemap to Google Search Console
3. Monitor search console for structured data errors
4. Update structured data as business information changes
`;

        try {
            await fs.promises.writeFile(reportPath, report, 'utf8');
            console.log(`📄 Detailed report saved to: ${reportPath}`);
        } catch (error) {
            console.error('❌ Error saving report:', error.message);
        }
    }
}

// Main execution
if (require.main === module) {
    const publicDir = path.join(__dirname, '../public');
    const generator = new StructuredDataGenerator(publicDir);
    
    generator.processAllFiles().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = StructuredDataGenerator;