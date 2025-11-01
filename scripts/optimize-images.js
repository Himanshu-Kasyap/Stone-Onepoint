#!/usr/bin/env node

/**
 * Image Optimization Pipeline
 * Compresses and optimizes images for web delivery
 * Converts to modern formats (WebP) with fallbacks
 * Generates responsive variants for different screen sizes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ImageOptimizer {
  constructor(options = {}) {
    this.inputDir = options.inputDir || 'public/assets/img';
    this.outputDir = options.outputDir || 'public/assets/img/optimized';
    this.quality = options.quality || 85;
    this.webpQuality = options.webpQuality || 80;
    this.breakpoints = options.breakpoints || [320, 640, 768, 1024, 1200, 1920];
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
    this.stats = {
      processed: 0,
      errors: 0,
      originalSize: 0,
      optimizedSize: 0
    };
  }

  /**
   * Check if required tools are available
   */
  checkDependencies() {
    const tools = ['magick', 'cwebp'];
    const missing = [];

    for (const tool of tools) {
      try {
        execSync(`${tool} -version`, { stdio: 'ignore' });
      } catch (error) {
        missing.push(tool);
      }
    }

    if (missing.length > 0) {
      console.warn('⚠️  Missing optimization tools:', missing.join(', '));
      console.warn('   Install ImageMagick and WebP tools for full optimization');
      console.warn('   Falling back to basic optimization...');
      return false;
    }

    return true;
  }

  /**
   * Get all image files recursively
   */
  getImageFiles(dir) {
    const files = [];
    
    const scanDir = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (this.supportedFormats.includes(path.extname(item).toLowerCase())) {
          files.push(fullPath);
        }
      }
    };

    scanDir(dir);
    return files;
  }

  /**
   * Create output directory structure
   */
  ensureOutputDir(filePath) {
    const relativePath = path.relative(this.inputDir, filePath);
    const outputPath = path.join(this.outputDir, relativePath);
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    return outputPath;
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
   * Optimize single image with ImageMagick
   */
  optimizeWithImageMagick(inputPath, outputPath) {
    try {
      const ext = path.extname(inputPath).toLowerCase();
      let command;

      if (ext === '.png') {
        // PNG optimization
        command = `magick "${inputPath}" -strip -define png:compression-filter=5 -define png:compression-level=9 -define png:compression-strategy=1 "${outputPath}"`;
      } else {
        // JPEG optimization
        command = `magick "${inputPath}" -strip -interlace Plane -gaussian-blur 0.05 -quality ${this.quality} "${outputPath}"`;
      }

      execSync(command, { stdio: 'ignore' });
      return true;
    } catch (error) {
      console.error(`Failed to optimize ${inputPath}:`, error.message);
      return false;
    }
  }

  /**
   * Create WebP version
   */
  createWebP(inputPath, outputPath) {
    try {
      const webpPath = outputPath.replace(/\.[^.]+$/, '.webp');
      const command = `cwebp -q ${this.webpQuality} "${inputPath}" -o "${webpPath}"`;
      execSync(command, { stdio: 'ignore' });
      return webpPath;
    } catch (error) {
      console.error(`Failed to create WebP for ${inputPath}:`, error.message);
      return null;
    }
  }

  /**
   * Generate responsive variants
   */
  generateResponsiveVariants(inputPath, outputPath) {
    const variants = [];
    const baseName = path.basename(outputPath, path.extname(outputPath));
    const dir = path.dirname(outputPath);
    const ext = path.extname(outputPath);

    for (const width of this.breakpoints) {
      try {
        const variantPath = path.join(dir, `${baseName}-${width}w${ext}`);
        const command = `magick "${inputPath}" -resize ${width}x -strip -quality ${this.quality} "${variantPath}"`;
        execSync(command, { stdio: 'ignore' });
        variants.push({
          width,
          path: variantPath,
          size: this.getFileSize(variantPath)
        });
      } catch (error) {
        console.error(`Failed to create ${width}px variant for ${inputPath}:`, error.message);
      }
    }

    return variants;
  }

  /**
   * Basic optimization fallback (copy with basic compression)
   */
  basicOptimization(inputPath, outputPath) {
    try {
      // Simple copy for fallback
      fs.copyFileSync(inputPath, outputPath);
      return true;
    } catch (error) {
      console.error(`Failed to copy ${inputPath}:`, error.message);
      return false;
    }
  }

  /**
   * Process single image
   */
  async processImage(inputPath) {
    const outputPath = this.ensureOutputDir(inputPath);
    const originalSize = this.getFileSize(inputPath);
    
    console.log(`Processing: ${path.relative(process.cwd(), inputPath)}`);
    
    this.stats.originalSize += originalSize;
    
    const hasTools = this.checkDependencies();
    let success = false;

    if (hasTools) {
      // Full optimization with tools
      success = this.optimizeWithImageMagick(inputPath, outputPath);
      
      if (success) {
        // Create WebP version
        const webpPath = this.createWebP(inputPath, outputPath);
        
        // Generate responsive variants
        const variants = this.generateResponsiveVariants(inputPath, outputPath);
        
        console.log(`  ✓ Optimized (${variants.length} responsive variants)`);
        if (webpPath) {
          console.log(`  ✓ WebP created`);
        }
      }
    } else {
      // Fallback optimization
      success = this.basicOptimization(inputPath, outputPath);
      if (success) {
        console.log(`  ✓ Copied (basic optimization)`);
      }
    }

    if (success) {
      this.stats.processed++;
      this.stats.optimizedSize += this.getFileSize(outputPath);
    } else {
      this.stats.errors++;
    }
  }

  /**
   * Generate lazy loading configuration
   */
  generateLazyLoadConfig() {
    const config = {
      selector: 'img[data-src]',
      rootMargin: '50px 0px',
      threshold: 0.01,
      loadingClass: 'lazy-loading',
      loadedClass: 'lazy-loaded',
      errorClass: 'lazy-error'
    };

    const configPath = path.join(this.outputDir, 'lazy-load-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    return config;
  }

  /**
   * Generate responsive image manifest
   */
  generateImageManifest() {
    const manifest = {
      breakpoints: this.breakpoints,
      formats: ['webp', 'jpg', 'png'],
      quality: {
        jpg: this.quality,
        webp: this.webpQuality
      },
      lazyLoading: true,
      generated: new Date().toISOString()
    };

    const manifestPath = path.join(this.outputDir, 'image-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    return manifest;
  }

  /**
   * Run optimization process
   */
  async optimize() {
    console.log('🖼️  Starting image optimization pipeline...\n');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Get all image files
    const imageFiles = this.getImageFiles(this.inputDir);
    console.log(`Found ${imageFiles.length} images to process\n`);

    if (imageFiles.length === 0) {
      console.log('No images found to optimize.');
      return;
    }

    // Process each image
    for (const imagePath of imageFiles) {
      await this.processImage(imagePath);
    }

    // Generate configuration files
    this.generateLazyLoadConfig();
    this.generateImageManifest();

    // Print statistics
    this.printStats();
  }

  /**
   * Print optimization statistics
   */
  printStats() {
    const savings = this.stats.originalSize - this.stats.optimizedSize;
    const savingsPercent = this.stats.originalSize > 0 
      ? ((savings / this.stats.originalSize) * 100).toFixed(1)
      : 0;

    console.log('\n📊 Optimization Results:');
    console.log(`   Processed: ${this.stats.processed} images`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log(`   Original size: ${this.formatBytes(this.stats.originalSize)}`);
    console.log(`   Optimized size: ${this.formatBytes(this.stats.optimizedSize)}`);
    console.log(`   Savings: ${this.formatBytes(savings)} (${savingsPercent}%)`);
    console.log('\n✅ Image optimization complete!');
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
    
    if (key === 'quality') options.quality = parseInt(value);
    if (key === 'webp-quality') options.webpQuality = parseInt(value);
    if (key === 'input') options.inputDir = value;
    if (key === 'output') options.outputDir = value;
  }

  const optimizer = new ImageOptimizer(options);
  optimizer.optimize().catch(console.error);
}

module.exports = ImageOptimizer;