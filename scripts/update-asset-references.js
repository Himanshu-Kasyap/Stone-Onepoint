#!/usr/bin/env node

/**
 * Update Asset References Script
 * Updates HTML files to use optimized and bundled assets
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class AssetReferenceUpdater {
  constructor(options = {}) {
    this.publicDir = options.publicDir || 'public';
    this.optimizedDir = options.optimizedDir || 'public/assets/optimized';
    this.assetManifestPath = options.assetManifestPath || 'public/assets/optimized/asset-manifest.json';
    this.stats = {
      filesProcessed: 0,
      referencesUpdated: 0,
      errors: 0
    };
    
    this.loadAssetManifest();
  }

  /**
   * Load asset manifest
   */
  loadAssetManifest() {
    try {
      if (fs.existsSync(this.assetManifestPath)) {
        const manifestContent = fs.readFileSync(this.assetManifestPath, 'utf8');
        this.manifest = JSON.parse(manifestContent);
      } else {
        console.warn('Asset manifest not found, using default configuration');
        this.manifest = this.getDefaultManifest();
      }
    } catch (error) {
      console.error('Failed to load asset manifest:', error.message);
      this.manifest = this.getDefaultManifest();
    }
  }

  /**
   * Default manifest configuration
   */
  getDefaultManifest() {
    return {
      bundles: {
        css: [
          { name: 'critical', file: 'critical.min.css' },
          { name: 'vendor', file: 'vendor.min.css' },
          { name: 'plugins', file: 'plugins.min.css' }
        ],
        js: [
          { name: 'vendor', file: 'vendor.min.js' },
          { name: 'plugins', file: 'plugins.min.js' },
          { name: 'custom', file: 'custom.min.js' }
        ]
      }
    };
  }

  /**
   * Get all HTML files
   */
  getHtmlFiles(dir) {
    const files = [];
    
    const scanDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'assets') {
          scanDir(fullPath);
        } else if (item.endsWith('.html')) {
          files.push(fullPath);
        }
      }
    };

    scanDir(dir);
    return files;
  }

  /**
   * Update CSS references in HTML
   */
  updateCSSReferences(document) {
    const head = document.querySelector('head');
    if (!head) return 0;

    let updatedCount = 0;
    
    // Remove existing CSS links that will be bundled
    const existingLinks = Array.from(head.querySelectorAll('link[rel="stylesheet"]'));
    const bundledFiles = this.getBundledFiles('css');
    
    existingLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && this.shouldReplaceWithBundle(href, bundledFiles)) {
        link.remove();
        updatedCount++;
      }
    });

    // Add critical CSS inline
    const criticalCSS = this.getCriticalCSS();
    if (criticalCSS) {
      const style = document.createElement('style');
      style.textContent = criticalCSS;
      head.appendChild(style);
    }

    // Add bundled CSS files
    this.manifest.bundles.css.forEach(bundle => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `assets/optimized/css/${bundle.file}`;
      
      if (bundle.name === 'critical') {
        link.media = 'all';
      } else {
        // Load non-critical CSS asynchronously
        link.media = 'print';
        link.onload = function() { this.media = 'all'; };
      }
      
      head.appendChild(link);
    });

    // Add image optimization CSS
    const imgOptLink = document.createElement('link');
    imgOptLink.rel = 'stylesheet';
    imgOptLink.href = 'assets/css/image-optimization.css';
    imgOptLink.media = 'all';
    head.appendChild(imgOptLink);

    return updatedCount;
  }

  /**
   * Update JavaScript references in HTML
   */
  updateJSReferences(document) {
    const body = document.querySelector('body');
    if (!body) return 0;

    let updatedCount = 0;
    
    // Remove existing script tags that will be bundled
    const existingScripts = Array.from(document.querySelectorAll('script[src]'));
    const bundledFiles = this.getBundledFiles('js');
    
    existingScripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && this.shouldReplaceWithBundle(src, bundledFiles)) {
        script.remove();
        updatedCount++;
      }
    });

    // Add bundled JavaScript files
    this.manifest.bundles.js.forEach(bundle => {
      const script = document.createElement('script');
      script.src = `assets/optimized/js/${bundle.file}`;
      script.defer = true;
      body.appendChild(script);
    });

    // Add lazy loading script
    const lazyScript = document.createElement('script');
    lazyScript.src = 'assets/js/lazy-loading.js';
    lazyScript.defer = true;
    body.appendChild(lazyScript);

    return updatedCount;
  }

  /**
   * Get list of files that are bundled
   */
  getBundledFiles(type) {
    const files = [];
    this.manifest.bundles[type].forEach(bundle => {
      if (bundle.files) {
        files.push(...bundle.files);
      }
    });
    return files;
  }

  /**
   * Check if file should be replaced with bundle
   */
  shouldReplaceWithBundle(filePath, bundledFiles) {
    const fileName = path.basename(filePath);
    return bundledFiles.some(bundledFile => 
      fileName === bundledFile || 
      fileName === bundledFile.replace('.min.', '.') ||
      filePath.includes(bundledFile)
    );
  }

  /**
   * Get critical CSS content
   */
  getCriticalCSS() {
    try {
      const criticalPath = path.join(this.optimizedDir, 'css', 'critical-inline.css');
      if (fs.existsSync(criticalPath)) {
        return fs.readFileSync(criticalPath, 'utf8');
      }
    } catch (error) {
      console.warn('Critical CSS not found, skipping inline CSS');
    }
    return null;
  }

  /**
   * Add performance optimizations to HTML
   */
  addPerformanceOptimizations(document) {
    const head = document.querySelector('head');
    if (!head) return;

    // Add DNS prefetch for external resources
    const dnsPrefetch = [
      '//fonts.googleapis.com',
      '//fonts.gstatic.com',
      '//www.google-analytics.com'
    ];

    dnsPrefetch.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      head.appendChild(link);
    });

    // Add preload for critical resources
    const preloadResources = [
      { href: 'assets/optimized/css/critical.min.css', as: 'style' },
      { href: 'assets/optimized/js/vendor.min.js', as: 'script' }
    ];

    preloadResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      head.appendChild(link);
    });

    // Add viewport meta tag if missing
    if (!head.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0';
      head.appendChild(viewport);
    }
  }

  /**
   * Process single HTML file
   */
  processHtmlFile(filePath) {
    try {
      console.log(`Processing: ${path.relative(process.cwd(), filePath)}`);
      
      const html = fs.readFileSync(filePath, 'utf8');
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      let totalUpdates = 0;
      
      // Update CSS references
      totalUpdates += this.updateCSSReferences(document);
      
      // Update JavaScript references
      totalUpdates += this.updateJSReferences(document);
      
      // Add performance optimizations
      this.addPerformanceOptimizations(document);

      // Write back to file
      const updatedHtml = dom.serialize();
      fs.writeFileSync(filePath, updatedHtml);
      
      this.stats.filesProcessed++;
      this.stats.referencesUpdated += totalUpdates;
      
      console.log(`  ✓ Updated ${totalUpdates} asset references`);
      
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
      this.stats.errors++;
    }
  }

  /**
   * Run update process
   */
  async update() {
    console.log('🔗 Updating asset references in HTML files...\n');
    
    // Get all HTML files
    const htmlFiles = this.getHtmlFiles(this.publicDir);
    console.log(`Found ${htmlFiles.length} HTML files to process\n`);

    if (htmlFiles.length === 0) {
      console.log('No HTML files found to process.');
      return;
    }

    // Process each file
    for (const filePath of htmlFiles) {
      this.processHtmlFile(filePath);
    }

    // Print statistics
    this.printStats();
  }

  /**
   * Print update statistics
   */
  printStats() {
    console.log('\n📊 Asset Reference Update Results:');
    console.log(`   Files processed: ${this.stats.filesProcessed}`);
    console.log(`   References updated: ${this.stats.referencesUpdated}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log('\n✅ Asset reference update complete!');
    
    if (this.stats.referencesUpdated > 0) {
      console.log('\n📝 Optimizations applied:');
      console.log('   • CSS and JS files bundled and minified');
      console.log('   • Critical CSS inlined for faster rendering');
      console.log('   • Non-critical CSS loaded asynchronously');
      console.log('   • DNS prefetch added for external resources');
      console.log('   • Resource preloading for critical assets');
    }
  }
}

// CLI execution
if (require.main === module) {
  // Check for jsdom dependency
  try {
    require('jsdom');
  } catch (error) {
    console.error('❌ jsdom is required for this script.');
    console.error('   Install it with: npm install jsdom --save-dev');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'public-dir') options.publicDir = value;
    if (key === 'optimized-dir') options.optimizedDir = value;
    if (key === 'manifest') options.assetManifestPath = value;
  }

  const updater = new AssetReferenceUpdater(options);
  updater.update().catch(console.error);
}

module.exports = AssetReferenceUpdater;