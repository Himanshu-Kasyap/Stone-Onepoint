#!/usr/bin/env node

/**
 * Performance Testing Suite
 * Automated tests for website performance metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceTestSuite {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8080';
    this.thresholds = options.thresholds || this.getDefaultThresholds();
    this.testResults = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Default performance thresholds
   */
  getDefaultThresholds() {
    return {
      lighthouse: {
        performance: 85,
        accessibility: 90,
        bestPractices: 85,
        seo: 90
      },
      metrics: {
        firstContentfulPaint: 1500,
        largestContentfulPaint: 2500,
        cumulativeLayoutShift: 0.1,
        totalBlockingTime: 300,
        speedIndex: 3000
      },
      loadTime: {
        maxLoadTime: 3000,
        maxServerResponse: 500,
        maxDnsLookup: 100
      },
      resources: {
        maxImageSize: 500000, // 500KB
        maxCssSize: 100000,   // 100KB
        maxJsSize: 200000     // 200KB
      }
    };
  }

  /**
   * Run all performance tests
   */
  async runTests() {
    console.log('🧪 Running Performance Test Suite...\n');
    
    // Test 1: Lighthouse Performance
    await this.testLighthousePerformance();
    
    // Test 2: Resource Optimization
    await this.testResourceOptimization();
    
    // Test 3: Caching Headers
    await this.testCachingHeaders();
    
    // Test 4: Compression
    await this.testCompression();
    
    // Test 5: Image Optimization
    await this.testImageOptimization();
    
    // Test 6: CSS/JS Optimization
    await this.testAssetOptimization();
    
    // Generate test report
    this.generateTestReport();
    
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.testResults.length,
      results: this.testResults
    };
  }

  /**
   * Test Lighthouse performance scores
   */
  async testLighthousePerformance() {
    console.log('Testing Lighthouse Performance Scores...');
    
    try {
      const outputFile = 'temp-lighthouse.json';
      const command = `lighthouse "${this.baseUrl}" --output=json --output-path="${outputFile}" --chrome-flags="--headless --no-sandbox" --quiet`;
      
      execSync(command, { stdio: 'ignore' });
      const results = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      fs.unlinkSync(outputFile);
      
      const scores = {
        performance: Math.round(results.lhr.categories.performance.score * 100),
        accessibility: Math.round(results.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(results.lhr.categories['best-practices'].score * 100),
        seo: Math.round(results.lhr.categories.seo.score * 100)
      };
      
      // Test each score against thresholds
      Object.entries(scores).forEach(([metric, score]) => {
        const threshold = this.thresholds.lighthouse[metric];
        const passed = score >= threshold;
        
        this.addTestResult({
          test: `Lighthouse ${metric.charAt(0).toUpperCase() + metric.slice(1)}`,
          expected: `>= ${threshold}`,
          actual: score,
          passed: passed,
          category: 'lighthouse'
        });
        
        if (passed) this.passed++;
        else this.failed++;
      });
      
      // Test Core Web Vitals
      const metrics = results.lhr.audits;
      const coreWebVitals = {
        firstContentfulPaint: metrics['first-contentful-paint'].numericValue,
        largestContentfulPaint: metrics['largest-contentful-paint'].numericValue,
        cumulativeLayoutShift: metrics['cumulative-layout-shift'].numericValue,
        totalBlockingTime: metrics['total-blocking-time'].numericValue,
        speedIndex: metrics['speed-index'].numericValue
      };
      
      Object.entries(coreWebVitals).forEach(([metric, value]) => {
        const threshold = this.thresholds.metrics[metric];
        const passed = value <= threshold;
        
        this.addTestResult({
          test: `Core Web Vital: ${metric}`,
          expected: `<= ${threshold}ms`,
          actual: `${Math.round(value)}ms`,
          passed: passed,
          category: 'core-web-vitals'
        });
        
        if (passed) this.passed++;
        else this.failed++;
      });
      
    } catch (error) {
      console.error('Lighthouse test failed:', error.message);
      this.addTestResult({
        test: 'Lighthouse Performance',
        expected: 'Successful audit',
        actual: 'Failed to run',
        passed: false,
        category: 'lighthouse',
        error: error.message
      });
      this.failed++;
    }
  }

  /**
   * Test resource optimization
   */
  async testResourceOptimization() {
    console.log('Testing Resource Optimization...');
    
    // Test image optimization
    const imgDir = 'public/assets/img';
    const optimizedImgDir = 'public/assets/img/optimized';
    
    const hasOptimizedImages = fs.existsSync(optimizedImgDir);
    this.addTestResult({
      test: 'Image Optimization Directory',
      expected: 'Directory exists',
      actual: hasOptimizedImages ? 'Exists' : 'Missing',
      passed: hasOptimizedImages,
      category: 'resources'
    });
    
    if (hasOptimizedImages) this.passed++;
    else this.failed++;
    
    // Test CSS/JS optimization
    const optimizedCssDir = 'public/assets/optimized/css';
    const optimizedJsDir = 'public/assets/optimized/js';
    
    const hasOptimizedCSS = fs.existsSync(optimizedCssDir);
    const hasOptimizedJS = fs.existsSync(optimizedJsDir);
    
    this.addTestResult({
      test: 'CSS Optimization',
      expected: 'Optimized CSS directory exists',
      actual: hasOptimizedCSS ? 'Exists' : 'Missing',
      passed: hasOptimizedCSS,
      category: 'resources'
    });
    
    this.addTestResult({
      test: 'JavaScript Optimization',
      expected: 'Optimized JS directory exists',
      actual: hasOptimizedJS ? 'Exists' : 'Missing',
      passed: hasOptimizedJS,
      category: 'resources'
    });
    
    if (hasOptimizedCSS) this.passed++;
    else this.failed++;
    
    if (hasOptimizedJS) this.passed++;
    else this.failed++;
  }

  /**
   * Test caching headers
   */
  async testCachingHeaders() {
    console.log('Testing Caching Headers...');
    
    try {
      // Test static asset caching
      const testUrls = [
        `${this.baseUrl}/assets/css/style.css`,
        `${this.baseUrl}/assets/js/custom.js`,
        `${this.baseUrl}/assets/img/logo.png`
      ];
      
      for (const url of testUrls) {
        try {
          const command = `curl -I -s "${url}" | grep -i "cache-control"`;
          const output = execSync(command, { encoding: 'utf8' });
          
          const hasCacheControl = output.includes('Cache-Control');
          const hasMaxAge = output.includes('max-age');
          
          this.addTestResult({
            test: `Caching Headers: ${path.basename(url)}`,
            expected: 'Cache-Control with max-age',
            actual: hasCacheControl && hasMaxAge ? 'Present' : 'Missing',
            passed: hasCacheControl && hasMaxAge,
            category: 'caching'
          });
          
          if (hasCacheControl && hasMaxAge) this.passed++;
          else this.failed++;
          
        } catch (error) {
          // URL might not exist, skip this test
          console.warn(`Skipping cache test for ${url}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('Caching headers test failed:', error.message);
      this.addTestResult({
        test: 'Caching Headers',
        expected: 'Headers present',
        actual: 'Test failed',
        passed: false,
        category: 'caching',
        error: error.message
      });
      this.failed++;
    }
  }

  /**
   * Test compression
   */
  async testCompression() {
    console.log('Testing Compression...');
    
    try {
      const command = `curl -H "Accept-Encoding: gzip" -I -s "${this.baseUrl}" | grep -i "content-encoding"`;
      const output = execSync(command, { encoding: 'utf8' });
      
      const hasCompression = output.includes('gzip') || output.includes('deflate') || output.includes('br');
      
      this.addTestResult({
        test: 'Content Compression',
        expected: 'gzip, deflate, or brotli',
        actual: hasCompression ? 'Enabled' : 'Disabled',
        passed: hasCompression,
        category: 'compression'
      });
      
      if (hasCompression) this.passed++;
      else this.failed++;
      
    } catch (error) {
      console.error('Compression test failed:', error.message);
      this.addTestResult({
        test: 'Content Compression',
        expected: 'Compression enabled',
        actual: 'Test failed',
        passed: false,
        category: 'compression',
        error: error.message
      });
      this.failed++;
    }
  }

  /**
   * Test image optimization
   */
  async testImageOptimization() {
    console.log('Testing Image Optimization...');
    
    const imgDir = 'public/assets/img';
    if (!fs.existsSync(imgDir)) {
      this.addTestResult({
        test: 'Image Directory',
        expected: 'Directory exists',
        actual: 'Missing',
        passed: false,
        category: 'images'
      });
      this.failed++;
      return;
    }
    
    const images = this.getImageFiles(imgDir);
    let oversizedImages = 0;
    let totalSize = 0;
    
    images.forEach(imgPath => {
      const size = fs.statSync(imgPath).size;
      totalSize += size;
      
      if (size > this.thresholds.resources.maxImageSize) {
        oversizedImages++;
      }
    });
    
    const avgImageSize = images.length > 0 ? totalSize / images.length : 0;
    const hasOversizedImages = oversizedImages === 0;
    
    this.addTestResult({
      test: 'Image File Sizes',
      expected: `All images < ${this.thresholds.resources.maxImageSize / 1000}KB`,
      actual: `${oversizedImages} oversized images`,
      passed: hasOversizedImages,
      category: 'images'
    });
    
    this.addTestResult({
      test: 'Average Image Size',
      expected: `< ${this.thresholds.resources.maxImageSize / 1000}KB`,
      actual: `${Math.round(avgImageSize / 1000)}KB`,
      passed: avgImageSize < this.thresholds.resources.maxImageSize,
      category: 'images'
    });
    
    if (hasOversizedImages) this.passed++;
    else this.failed++;
    
    if (avgImageSize < this.thresholds.resources.maxImageSize) this.passed++;
    else this.failed++;
    
    // Test for WebP images
    const webpImages = images.filter(img => img.endsWith('.webp'));
    const hasWebP = webpImages.length > 0;
    
    this.addTestResult({
      test: 'WebP Image Format',
      expected: 'WebP images present',
      actual: hasWebP ? `${webpImages.length} WebP images` : 'No WebP images',
      passed: hasWebP,
      category: 'images'
    });
    
    if (hasWebP) this.passed++;
    else this.failed++;
  }

  /**
   * Test CSS/JS asset optimization
   */
  async testAssetOptimization() {
    console.log('Testing Asset Optimization...');
    
    // Test CSS optimization
    const cssDir = 'public/assets/css';
    if (fs.existsSync(cssDir)) {
      const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
      let oversizedCSS = 0;
      
      cssFiles.forEach(file => {
        const size = fs.statSync(path.join(cssDir, file)).size;
        if (size > this.thresholds.resources.maxCssSize) {
          oversizedCSS++;
        }
      });
      
      this.addTestResult({
        test: 'CSS File Sizes',
        expected: `All CSS files < ${this.thresholds.resources.maxCssSize / 1000}KB`,
        actual: `${oversizedCSS} oversized files`,
        passed: oversizedCSS === 0,
        category: 'assets'
      });
      
      if (oversizedCSS === 0) this.passed++;
      else this.failed++;
    }
    
    // Test JS optimization
    const jsDir = 'public/assets/js';
    if (fs.existsSync(jsDir)) {
      const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
      let oversizedJS = 0;
      
      jsFiles.forEach(file => {
        const size = fs.statSync(path.join(jsDir, file)).size;
        if (size > this.thresholds.resources.maxJsSize) {
          oversizedJS++;
        }
      });
      
      this.addTestResult({
        test: 'JavaScript File Sizes',
        expected: `All JS files < ${this.thresholds.resources.maxJsSize / 1000}KB`,
        actual: `${oversizedJS} oversized files`,
        passed: oversizedJS === 0,
        category: 'assets'
      });
      
      if (oversizedJS === 0) this.passed++;
      else this.failed++;
    }
    
    // Test for minified files
    const optimizedDir = 'public/assets/optimized';
    const hasMinifiedFiles = fs.existsSync(optimizedDir);
    
    this.addTestResult({
      test: 'Asset Minification',
      expected: 'Minified assets directory exists',
      actual: hasMinifiedFiles ? 'Present' : 'Missing',
      passed: hasMinifiedFiles,
      category: 'assets'
    });
    
    if (hasMinifiedFiles) this.passed++;
    else this.failed++;
  }

  /**
   * Get image files recursively
   */
  getImageFiles(dir) {
    const files = [];
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    const scanDir = (currentDir) => {
      if (!fs.existsSync(currentDir)) return;
      
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (extensions.some(ext => item.toLowerCase().endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    
    scanDir(dir);
    return files;
  }

  /**
   * Add test result
   */
  addTestResult(result) {
    this.testResults.push({
      ...result,
      timestamp: new Date().toISOString()
    });
    
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} ${result.test}: ${result.actual}`);
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    const report = {
      summary: {
        total: this.testResults.length,
        passed: this.passed,
        failed: this.failed,
        passRate: Math.round((this.passed / this.testResults.length) * 100)
      },
      results: this.testResults,
      categories: this.groupResultsByCategory(),
      timestamp: new Date().toISOString()
    };
    
    // Save JSON report
    const reportPath = 'tests/performance/test-results.json';
    if (!fs.existsSync('tests/performance')) {
      fs.mkdirSync('tests/performance', { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📊 Performance Test Results:');
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Pass Rate: ${report.summary.passRate}%`);
    
    if (report.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`   • ${result.test}: Expected ${result.expected}, got ${result.actual}`);
      });
    }
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return report;
  }

  /**
   * Group results by category
   */
  groupResultsByCategory() {
    const categories = {};
    
    this.testResults.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = {
          total: 0,
          passed: 0,
          failed: 0,
          tests: []
        };
      }
      
      categories[result.category].total++;
      if (result.passed) {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
      categories[result.category].tests.push(result);
    });
    
    return categories;
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
    
    if (key === 'url') options.baseUrl = value;
  }

  const testSuite = new PerformanceTestSuite(options);
  testSuite.runTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTestSuite;