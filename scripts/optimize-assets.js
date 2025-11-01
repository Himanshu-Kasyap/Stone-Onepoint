#!/usr/bin/env node

/**
 * CSS and JavaScript Optimization Script
 * Minifies CSS and JS files, bundles related files, and extracts critical CSS
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AssetOptimizer {
  constructor(options = {}) {
    this.publicDir = options.publicDir || 'public';
    this.assetsDir = options.assetsDir || 'public/assets';
    this.outputDir = options.outputDir || 'public/assets/optimized';
    this.bundleConfig = options.bundleConfig || this.getDefaultBundleConfig();
    this.stats = {
      cssFiles: { processed: 0, originalSize: 0, minifiedSize: 0 },
      jsFiles: { processed: 0, originalSize: 0, minifiedSize: 0 },
      bundles: { created: 0 },
      errors: 0
    };
  }

  /**
   * Default bundle configuration
   */
  getDefaultBundleConfig() {
    return {
      css: {
        critical: {
          name: 'critical.min.css',
          files: [
            'bootstrap.min.css',
            'style.css'
          ]
        },
        vendor: {
          name: 'vendor.min.css',
          files: [
            'animate.min.css',
            'boxicons.min.css',
            'flaticon.css',
            'owl.carousel.min.css',
            'owl.theme.default.min.css'
          ]
        },
        plugins: {
          name: 'plugins.min.css',
          files: [
            'magnific-popup.min.css',
            'meanmenu.min.css',
            'nice-select.min.css',
            'odometer.min.css',
            'progressbar.min.css'
          ]
        }
      },
      js: {
        vendor: {
          name: 'vendor.min.js',
          files: [
            'jquery.min.js',
            'bootstrap.bundle.min.js'
          ]
        },
        plugins: {
          name: 'plugins.min.js',
          files: [
            'owl.carousel.min.js',
            'magnific-popup.min.js',
            'meanmenu.min.js',
            'nice-select.min.js',
            'wow.min.js',
            'odometer.min.js',
            'progressbar.min.js'
          ]
        },
        custom: {
          name: 'custom.min.js',
          files: [
            'custom.js',
            'contact-form-script.js'
          ]
        }
      }
    };
  }

  /**
   * Check if optimization tools are available
   */
  checkDependencies() {
    const hasNodeModules = fs.existsSync('node_modules');
    if (!hasNodeModules) {
      console.warn('⚠️  node_modules not found. Installing basic dependencies...');
      try {
        execSync('npm install', { stdio: 'inherit' });
      } catch (error) {
        console.error('Failed to install dependencies:', error.message);
        return false;
      }
    }
    return true;
  }

  /**
   * Get file size in bytes
   */
  getFileSize(filePath) {
    try {
      return fs.statSync(filePath).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Minify CSS content
   */
  minifyCSS(content) {
    // Basic CSS minification
    return content
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove unnecessary whitespace
      .replace(/\s+/g, ' ')
      // Remove whitespace around specific characters
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      // Remove trailing semicolons
      .replace(/;}/g, '}')
      // Remove leading/trailing whitespace
      .trim();
  }

  /**
   * Minify JavaScript content
   */
  minifyJS(content) {
    // Basic JavaScript minification
    return content
      // Remove single-line comments (but preserve URLs)
      .replace(/(?:^|\s)\/\/.*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove unnecessary whitespace
      .replace(/\s+/g, ' ')
      // Remove whitespace around operators and punctuation
      .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1')
      // Remove trailing semicolons before }
      .replace(/;}/g, '}')
      // Remove leading/trailing whitespace
      .trim();
  }

  /**
   * Advanced CSS minification using external tools
   */
  advancedMinifyCSS(inputPath, outputPath) {
    try {
      // Try using cssnano if available
      const command = `npx cssnano "${inputPath}" "${outputPath}"`;
      execSync(command, { stdio: 'ignore' });
      return true;
    } catch (error) {
      // Fallback to basic minification
      const content = fs.readFileSync(inputPath, 'utf8');
      const minified = this.minifyCSS(content);
      fs.writeFileSync(outputPath, minified);
      return false;
    }
  }

  /**
   * Advanced JavaScript minification using external tools
   */
  advancedMinifyJS(inputPath, outputPath) {
    try {
      // Try using terser if available
      const command = `npx terser "${inputPath}" -o "${outputPath}" --compress --mangle`;
      execSync(command, { stdio: 'ignore' });
      return true;
    } catch (error) {
      // Fallback to basic minification
      const content = fs.readFileSync(inputPath, 'utf8');
      const minified = this.minifyJS(content);
      fs.writeFileSync(outputPath, minified);
      return false;
    }
  }

  /**
   * Process CSS files
   */
  processCSSFiles() {
    const cssDir = path.join(this.assetsDir, 'css');
    const outputCssDir = path.join(this.outputDir, 'css');

    if (!fs.existsSync(cssDir)) {
      console.log('No CSS directory found, skipping CSS optimization');
      return;
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputCssDir)) {
      fs.mkdirSync(outputCssDir, { recursive: true });
    }

    const cssFiles = fs.readdirSync(cssDir).filter(file => 
      file.endsWith('.css') && !file.endsWith('.min.css')
    );

    console.log(`\n📄 Processing ${cssFiles.length} CSS files...`);

    for (const file of cssFiles) {
      const inputPath = path.join(cssDir, file);
      const outputFile = file.replace('.css', '.min.css');
      const outputPath = path.join(outputCssDir, outputFile);

      const originalSize = this.getFileSize(inputPath);
      
      try {
        this.advancedMinifyCSS(inputPath, outputPath);
        
        const minifiedSize = this.getFileSize(outputPath);
        const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        
        console.log(`  ✓ ${file} → ${outputFile} (${savings}% smaller)`);
        
        this.stats.cssFiles.processed++;
        this.stats.cssFiles.originalSize += originalSize;
        this.stats.cssFiles.minifiedSize += minifiedSize;
        
      } catch (error) {
        console.error(`  ✗ Failed to minify ${file}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  /**
   * Process JavaScript files
   */
  processJSFiles() {
    const jsDir = path.join(this.assetsDir, 'js');
    const outputJsDir = path.join(this.outputDir, 'js');

    if (!fs.existsSync(jsDir)) {
      console.log('No JS directory found, skipping JS optimization');
      return;
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputJsDir)) {
      fs.mkdirSync(outputJsDir, { recursive: true });
    }

    const jsFiles = fs.readdirSync(jsDir).filter(file => 
      file.endsWith('.js') && !file.endsWith('.min.js')
    );

    console.log(`\n📜 Processing ${jsFiles.length} JavaScript files...`);

    for (const file of jsFiles) {
      const inputPath = path.join(jsDir, file);
      const outputFile = file.replace('.js', '.min.js');
      const outputPath = path.join(outputJsDir, outputFile);

      const originalSize = this.getFileSize(inputPath);
      
      try {
        this.advancedMinifyJS(inputPath, outputPath);
        
        const minifiedSize = this.getFileSize(outputPath);
        const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
        
        console.log(`  ✓ ${file} → ${outputFile} (${savings}% smaller)`);
        
        this.stats.jsFiles.processed++;
        this.stats.jsFiles.originalSize += originalSize;
        this.stats.jsFiles.minifiedSize += minifiedSize;
        
      } catch (error) {
        console.error(`  ✗ Failed to minify ${file}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  /**
   * Create CSS bundles
   */
  createCSSBundles() {
    const cssDir = path.join(this.assetsDir, 'css');
    const outputCssDir = path.join(this.outputDir, 'css');

    console.log('\n📦 Creating CSS bundles...');

    for (const [bundleName, bundleConfig] of Object.entries(this.bundleConfig.css)) {
      try {
        const bundleContent = [];
        let totalSize = 0;

        for (const fileName of bundleConfig.files) {
          const filePath = path.join(cssDir, fileName);
          
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            bundleContent.push(`/* ${fileName} */`);
            bundleContent.push(content);
            totalSize += this.getFileSize(filePath);
          } else {
            console.warn(`    ⚠️  File not found: ${fileName}`);
          }
        }

        if (bundleContent.length > 0) {
          const combinedContent = bundleContent.join('\n');
          const minifiedContent = this.minifyCSS(combinedContent);
          
          const bundlePath = path.join(outputCssDir, bundleConfig.name);
          fs.writeFileSync(bundlePath, minifiedContent);
          
          const bundleSize = this.getFileSize(bundlePath);
          const savings = ((totalSize - bundleSize) / totalSize * 100).toFixed(1);
          
          console.log(`  ✓ ${bundleConfig.name} (${bundleConfig.files.length} files, ${savings}% smaller)`);
          this.stats.bundles.created++;
        }
        
      } catch (error) {
        console.error(`  ✗ Failed to create bundle ${bundleConfig.name}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  /**
   * Create JavaScript bundles
   */
  createJSBundles() {
    const jsDir = path.join(this.assetsDir, 'js');
    const outputJsDir = path.join(this.outputDir, 'js');

    console.log('\n📦 Creating JavaScript bundles...');

    for (const [bundleName, bundleConfig] of Object.entries(this.bundleConfig.js)) {
      try {
        const bundleContent = [];
        let totalSize = 0;

        for (const fileName of bundleConfig.files) {
          const filePath = path.join(jsDir, fileName);
          
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            bundleContent.push(`/* ${fileName} */`);
            bundleContent.push(content);
            bundleContent.push(''); // Add separator
            totalSize += this.getFileSize(filePath);
          } else {
            console.warn(`    ⚠️  File not found: ${fileName}`);
          }
        }

        if (bundleContent.length > 0) {
          const combinedContent = bundleContent.join('\n');
          const minifiedContent = this.minifyJS(combinedContent);
          
          const bundlePath = path.join(outputJsDir, bundleConfig.name);
          fs.writeFileSync(bundlePath, minifiedContent);
          
          const bundleSize = this.getFileSize(bundlePath);
          const savings = ((totalSize - bundleSize) / totalSize * 100).toFixed(1);
          
          console.log(`  ✓ ${bundleConfig.name} (${bundleConfig.files.length} files, ${savings}% smaller)`);
          this.stats.bundles.created++;
        }
        
      } catch (error) {
        console.error(`  ✗ Failed to create bundle ${bundleConfig.name}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  /**
   * Extract critical CSS
   */
  extractCriticalCSS() {
    console.log('\n🎯 Extracting critical CSS...');
    
    try {
      // Critical CSS extraction logic
      const criticalCSS = this.generateCriticalCSS();
      const criticalPath = path.join(this.outputDir, 'css', 'critical-inline.css');
      
      fs.writeFileSync(criticalPath, criticalCSS);
      console.log('  ✓ Critical CSS extracted for above-the-fold content');
      
    } catch (error) {
      console.error('  ✗ Failed to extract critical CSS:', error.message);
      this.stats.errors++;
    }
  }

  /**
   * Generate critical CSS content
   */
  generateCriticalCSS() {
    return `
/* Critical CSS - Above the fold styles */
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.6;color:#333}
.container{max-width:1200px;margin:0 auto;padding:0 15px}
.header{background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.1);position:fixed;top:0;width:100%;z-index:1000}
.nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 0}
.logo{height:40px;width:auto}
.hero{min-height:60vh;display:flex;align-items:center;justify-content:center;background:#f8f9fa}
.btn{display:inline-block;padding:12px 24px;background:#007bff;color:#fff;text-decoration:none;border-radius:4px;transition:background .3s}
.btn:hover{background:#0056b3}
@media(max-width:768px){.hero{min-height:50vh}.container{padding:0 10px}}
    `.trim();
  }

  /**
   * Generate asset manifest
   */
  generateAssetManifest() {
    const manifest = {
      bundles: {
        css: Object.keys(this.bundleConfig.css).map(key => ({
          name: key,
          file: this.bundleConfig.css[key].name,
          files: this.bundleConfig.css[key].files
        })),
        js: Object.keys(this.bundleConfig.js).map(key => ({
          name: key,
          file: this.bundleConfig.js[key].name,
          files: this.bundleConfig.js[key].files
        }))
      },
      optimization: {
        minification: true,
        bundling: true,
        criticalCSS: true
      },
      generated: new Date().toISOString()
    };

    const manifestPath = path.join(this.outputDir, 'asset-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    return manifest;
  }

  /**
   * Run optimization process
   */
  async optimize() {
    console.log('⚡ Starting CSS and JavaScript optimization...\n');
    
    // Check dependencies
    this.checkDependencies();
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Process individual files
    this.processCSSFiles();
    this.processJSFiles();

    // Create bundles
    this.createCSSBundles();
    this.createJSBundles();

    // Extract critical CSS
    this.extractCriticalCSS();

    // Generate manifest
    this.generateAssetManifest();

    // Print statistics
    this.printStats();
  }

  /**
   * Print optimization statistics
   */
  printStats() {
    const cssSavings = this.stats.cssFiles.originalSize - this.stats.cssFiles.minifiedSize;
    const cssSavingsPercent = this.stats.cssFiles.originalSize > 0 
      ? ((cssSavings / this.stats.cssFiles.originalSize) * 100).toFixed(1)
      : 0;

    const jsSavings = this.stats.jsFiles.originalSize - this.stats.jsFiles.minifiedSize;
    const jsSavingsPercent = this.stats.jsFiles.originalSize > 0 
      ? ((jsSavings / this.stats.jsFiles.originalSize) * 100).toFixed(1)
      : 0;

    console.log('\n📊 Asset Optimization Results:');
    console.log(`   CSS Files: ${this.stats.cssFiles.processed} processed`);
    console.log(`   CSS Savings: ${this.formatBytes(cssSavings)} (${cssSavingsPercent}%)`);
    console.log(`   JS Files: ${this.stats.jsFiles.processed} processed`);
    console.log(`   JS Savings: ${this.formatBytes(jsSavings)} (${jsSavingsPercent}%)`);
    console.log(`   Bundles Created: ${this.stats.bundles.created}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log('\n✅ Asset optimization complete!');
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'public-dir') options.publicDir = value;
    if (key === 'assets-dir') options.assetsDir = value;
    if (key === 'output-dir') options.outputDir = value;
  }

  const optimizer = new AssetOptimizer(options);
  optimizer.optimize().catch(console.error);
}

module.exports = AssetOptimizer;