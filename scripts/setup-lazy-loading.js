#!/usr/bin/env node

/**
 * Setup Lazy Loading Script
 * Converts existing img tags to use lazy loading attributes
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class LazyLoadingSetup {
  constructor(options = {}) {
    this.publicDir = options.publicDir || 'public';
    this.assetsDir = options.assetsDir || 'public/assets/img';
    this.excludePatterns = options.excludePatterns || [
      'logo', 'favicon', 'critical', 'above-fold'
    ];
    this.stats = {
      filesProcessed: 0,
      imagesConverted: 0,
      errors: 0
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
        
        if (stat.isDirectory() && !item.startsWith('.')) {
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
   * Check if image should be excluded from lazy loading
   */
  shouldExcludeImage(img) {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';
    const className = img.getAttribute('class') || '';
    
    // Check exclusion patterns
    for (const pattern of this.excludePatterns) {
      if (src.toLowerCase().includes(pattern) || 
          alt.toLowerCase().includes(pattern) ||
          className.toLowerCase().includes(pattern)) {
        return true;
      }
    }

    // Exclude small images (likely icons)
    const width = parseInt(img.getAttribute('width')) || 0;
    const height = parseInt(img.getAttribute('height')) || 0;
    
    if ((width > 0 && width < 50) || (height > 0 && height < 50)) {
      return true;
    }

    return false;
  }

  /**
   * Generate responsive srcset for image
   */
  generateResponsiveSrcset(originalSrc) {
    const breakpoints = [320, 640, 768, 1024, 1200, 1920];
    const ext = path.extname(originalSrc);
    const baseName = path.basename(originalSrc, ext);
    const dir = path.dirname(originalSrc);
    
    const srcsetEntries = breakpoints.map(width => {
      const responsiveSrc = `${dir}/${baseName}-${width}w${ext}`;
      return `${responsiveSrc} ${width}w`;
    });

    return srcsetEntries.join(', ');
  }

  /**
   * Convert image to lazy loading
   */
  convertImageToLazy(img, document) {
    const src = img.getAttribute('src');
    
    if (!src || src.startsWith('data:') || src.startsWith('#')) {
      return false;
    }

    // Move src to data-src
    img.setAttribute('data-src', src);
    
    // Generate responsive srcset if image is large enough
    const width = parseInt(img.getAttribute('width')) || 0;
    const height = parseInt(img.getAttribute('height')) || 0;
    
    if (width > 300 || height > 200) {
      const srcset = this.generateResponsiveSrcset(src);
      img.setAttribute('data-srcset', srcset);
    }

    // Set placeholder
    const placeholder = this.generatePlaceholder(width || 300, height || 200);
    img.setAttribute('src', placeholder);

    // Add lazy loading class
    const existingClass = img.getAttribute('class') || '';
    img.setAttribute('class', `${existingClass} lazy-image`.trim());

    // Add loading attribute for native lazy loading fallback
    img.setAttribute('loading', 'lazy');

    return true;
  }

  /**
   * Generate placeholder SVG
   */
  generatePlaceholder(width, height) {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6c757d" font-family="system-ui, sans-serif" font-size="12">
          Loading...
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Add lazy loading script to HTML
   */
  addLazyLoadingScript(document) {
    const head = document.querySelector('head');
    const body = document.querySelector('body');
    
    if (!head || !body) return;

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="lazy-loading.js"]');
    if (existingScript) return;

    // Add CSS for lazy loading
    const style = document.createElement('style');
    style.textContent = `
      .lazy-image {
        transition: opacity 0.3s ease-in-out;
      }
      
      .lazy-loading {
        opacity: 0.7;
        background: #f8f9fa;
      }
      
      .lazy-loaded {
        opacity: 1;
      }
      
      .lazy-error {
        opacity: 0.5;
        background: #f8d7da;
      }
      
      /* Prevent layout shift */
      img[data-src] {
        display: block;
        min-height: 1px;
      }
    `;
    head.appendChild(style);

    // Add lazy loading script
    const script = document.createElement('script');
    script.src = 'assets/js/lazy-loading.js';
    script.defer = true;
    body.appendChild(script);
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
      
      const images = document.querySelectorAll('img');
      let convertedCount = 0;
      
      images.forEach(img => {
        if (!this.shouldExcludeImage(img)) {
          if (this.convertImageToLazy(img, document)) {
            convertedCount++;
          }
        }
      });

      // Add lazy loading script
      this.addLazyLoadingScript(document);

      // Write back to file
      const updatedHtml = dom.serialize();
      fs.writeFileSync(filePath, updatedHtml);
      
      this.stats.filesProcessed++;
      this.stats.imagesConverted += convertedCount;
      
      console.log(`  ✓ Converted ${convertedCount} images to lazy loading`);
      
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
      this.stats.errors++;
    }
  }

  /**
   * Run setup process
   */
  async setup() {
    console.log('🚀 Setting up lazy loading for images...\n');
    
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
   * Print setup statistics
   */
  printStats() {
    console.log('\n📊 Lazy Loading Setup Results:');
    console.log(`   Files processed: ${this.stats.filesProcessed}`);
    console.log(`   Images converted: ${this.stats.imagesConverted}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log('\n✅ Lazy loading setup complete!');
    
    if (this.stats.imagesConverted > 0) {
      console.log('\n📝 Next steps:');
      console.log('   1. Run image optimization: npm run optimize:images');
      console.log('   2. Test lazy loading in browser');
      console.log('   3. Verify responsive images are working');
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
    if (key === 'assets-dir') options.assetsDir = value;
  }

  const setup = new LazyLoadingSetup(options);
  setup.setup().catch(console.error);
}

module.exports = LazyLoadingSetup;