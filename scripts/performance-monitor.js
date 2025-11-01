#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Monitors website performance and generates reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceMonitor {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8080';
    this.outputDir = options.outputDir || 'tests/performance';
    this.pages = options.pages || this.getDefaultPages();
    this.metrics = {
      lighthouse: true,
      webPageTest: false,
      customMetrics: true
    };
    this.results = [];
  }

  /**
   * Default pages to test
   */
  getDefaultPages() {
    return [
      { name: 'Home', url: '/' },
      { name: 'About', url: '/company-profile.html' },
      { name: 'Services', url: '/permanent-recruitment.html' },
      { name: 'Contact', url: '/contact.html' }
    ];
  }

  /**
   * Check if performance tools are available
   */
  checkDependencies() {
    const tools = [];
    
    try {
      execSync('lighthouse --version', { stdio: 'ignore' });
      tools.push('lighthouse');
    } catch (error) {
      console.warn('⚠️  Lighthouse not found. Install with: npm install -g lighthouse');
    }

    try {
      execSync('curl --version', { stdio: 'ignore' });
      tools.push('curl');
    } catch (error) {
      console.warn('⚠️  curl not found. Some tests may not work.');
    }

    return tools;
  }

  /**
   * Run Lighthouse audit
   */
  async runLighthouseAudit(page) {
    try {
      const url = `${this.baseUrl}${page.url}`;
      const outputFile = path.join(this.outputDir, `lighthouse-${page.name.toLowerCase()}.json`);
      
      console.log(`Running Lighthouse audit for ${page.name}...`);
      
      const command = `lighthouse "${url}" --output=json --output-path="${outputFile}" --chrome-flags="--headless --no-sandbox" --quiet`;
      execSync(command, { stdio: 'ignore' });
      
      // Parse results
      const results = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      
      return {
        page: page.name,
        url: url,
        performance: Math.round(results.lhr.categories.performance.score * 100),
        accessibility: Math.round(results.lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(results.lhr.categories['best-practices'].score * 100),
        seo: Math.round(results.lhr.categories.seo.score * 100),
        metrics: {
          firstContentfulPaint: results.lhr.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint: results.lhr.audits['largest-contentful-paint'].numericValue,
          cumulativeLayoutShift: results.lhr.audits['cumulative-layout-shift'].numericValue,
          totalBlockingTime: results.lhr.audits['total-blocking-time'].numericValue,
          speedIndex: results.lhr.audits['speed-index'].numericValue
        },
        opportunities: results.lhr.audits,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Failed to run Lighthouse audit for ${page.name}:`, error.message);
      return null;
    }
  }

  /**
   * Test page load times with curl
   */
  async testLoadTimes(page) {
    try {
      const url = `${this.baseUrl}${page.url}`;
      
      console.log(`Testing load times for ${page.name}...`);
      
      const command = `curl -o /dev/null -s -w "time_namelookup:%{time_namelookup}\\ntime_connect:%{time_connect}\\ntime_appconnect:%{time_appconnect}\\ntime_pretransfer:%{time_pretransfer}\\ntime_redirect:%{time_redirect}\\ntime_starttransfer:%{time_starttransfer}\\ntime_total:%{time_total}\\nhttp_code:%{http_code}\\nsize_download:%{size_download}" "${url}"`;
      
      const output = execSync(command, { encoding: 'utf8' });
      const metrics = {};
      
      output.split('\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          metrics[key] = parseFloat(value) || value;
        }
      });
      
      return {
        page: page.name,
        url: url,
        loadTime: metrics.time_total * 1000, // Convert to ms
        dnsLookup: metrics.time_namelookup * 1000,
        tcpConnect: metrics.time_connect * 1000,
        sslHandshake: (metrics.time_appconnect - metrics.time_connect) * 1000,
        serverResponse: (metrics.time_starttransfer - metrics.time_pretransfer) * 1000,
        contentTransfer: (metrics.time_total - metrics.time_starttransfer) * 1000,
        httpCode: metrics.http_code,
        downloadSize: metrics.size_download,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Failed to test load times for ${page.name}:`, error.message);
      return null;
    }
  }

  /**
   * Test resource optimization
   */
  async testResourceOptimization() {
    console.log('Testing resource optimization...');
    
    const results = {
      images: await this.testImageOptimization(),
      css: await this.testCSSOptimization(),
      js: await this.testJSOptimization(),
      caching: await this.testCaching()
    };
    
    return results;
  }

  /**
   * Test image optimization
   */
  async testImageOptimization() {
    const imgDir = 'public/assets/img';
    const optimizedDir = 'public/assets/img/optimized';
    
    if (!fs.existsSync(imgDir)) {
      return { status: 'not_found', message: 'Image directory not found' };
    }
    
    const originalImages = this.getImageFiles(imgDir);
    const optimizedImages = fs.existsSync(optimizedDir) ? this.getImageFiles(optimizedDir) : [];
    
    const webpImages = optimizedImages.filter(img => img.endsWith('.webp'));
    const responsiveImages = optimizedImages.filter(img => /-\d+w\.(jpg|png|webp)$/.test(img));
    
    return {
      originalCount: originalImages.length,
      optimizedCount: optimizedImages.length,
      webpCount: webpImages.length,
      responsiveVariants: responsiveImages.length,
      optimizationRatio: optimizedImages.length / originalImages.length
    };
  }

  /**
   * Test CSS optimization
   */
  async testCSSOptimization() {
    const cssDir = 'public/assets/css';
    const optimizedDir = 'public/assets/optimized/css';
    
    if (!fs.existsSync(cssDir)) {
      return { status: 'not_found', message: 'CSS directory not found' };
    }
    
    const originalCSS = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    const optimizedCSS = fs.existsSync(optimizedDir) ? 
      fs.readdirSync(optimizedDir).filter(f => f.endsWith('.css')) : [];
    
    const bundles = optimizedCSS.filter(f => f.includes('bundle') || f.includes('vendor'));
    const minified = optimizedCSS.filter(f => f.includes('.min.'));
    
    return {
      originalFiles: originalCSS.length,
      optimizedFiles: optimizedCSS.length,
      bundles: bundles.length,
      minifiedFiles: minified.length,
      hasCriticalCSS: fs.existsSync(path.join(optimizedDir, 'critical-inline.css'))
    };
  }

  /**
   * Test JavaScript optimization
   */
  async testJSOptimization() {
    const jsDir = 'public/assets/js';
    const optimizedDir = 'public/assets/optimized/js';
    
    if (!fs.existsSync(jsDir)) {
      return { status: 'not_found', message: 'JS directory not found' };
    }
    
    const originalJS = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    const optimizedJS = fs.existsSync(optimizedDir) ? 
      fs.readdirSync(optimizedDir).filter(f => f.endsWith('.js')) : [];
    
    const bundles = optimizedJS.filter(f => f.includes('bundle') || f.includes('vendor'));
    const minified = optimizedJS.filter(f => f.includes('.min.'));
    
    return {
      originalFiles: originalJS.length,
      optimizedFiles: optimizedJS.length,
      bundles: bundles.length,
      minifiedFiles: minified.length,
      hasLazyLoading: fs.existsSync('public/assets/js/lazy-loading.js')
    };
  }

  /**
   * Test caching configuration
   */
  async testCaching() {
    const configs = {
      apache: fs.existsSync('config/apache/.htaccess'),
      nginx: fs.existsSync('config/nginx/nginx.conf'),
      cloudflare: false // Would need API check
    };
    
    return {
      configFiles: configs,
      hasApacheConfig: configs.apache,
      hasNginxConfig: configs.nginx
    };
  }

  /**
   * Get image files recursively
   */
  getImageFiles(dir) {
    const files = [];
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    
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
   * Generate performance report
   */
  generateReport() {
    const report = {
      summary: this.generateSummary(),
      pages: this.results,
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
    
    const reportPath = path.join(this.outputDir, 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    this.generateHTMLReport(report);
    
    return report;
  }

  /**
   * Generate performance summary
   */
  generateSummary() {
    if (this.results.length === 0) {
      return { status: 'no_data' };
    }
    
    const lighthouseResults = this.results.filter(r => r.lighthouse);
    const loadTimeResults = this.results.filter(r => r.loadTime);
    
    const avgPerformance = lighthouseResults.length > 0 ?
      lighthouseResults.reduce((sum, r) => sum + r.lighthouse.performance, 0) / lighthouseResults.length : 0;
    
    const avgLoadTime = loadTimeResults.length > 0 ?
      loadTimeResults.reduce((sum, r) => sum + r.loadTime.loadTime, 0) / loadTimeResults.length : 0;
    
    return {
      averagePerformanceScore: Math.round(avgPerformance),
      averageLoadTime: Math.round(avgLoadTime),
      totalPages: this.results.length,
      passedAudits: lighthouseResults.filter(r => r.lighthouse.performance >= 90).length,
      needsImprovement: lighthouseResults.filter(r => r.lighthouse.performance < 70).length
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze results and generate recommendations
    this.results.forEach(result => {
      if (result.lighthouse) {
        const perf = result.lighthouse.performance;
        if (perf < 70) {
          recommendations.push({
            page: result.page,
            type: 'performance',
            priority: 'high',
            message: `Performance score is ${perf}%. Consider optimizing images and reducing JavaScript.`
          });
        }
        
        if (result.lighthouse.metrics.largestContentfulPaint > 2500) {
          recommendations.push({
            page: result.page,
            type: 'lcp',
            priority: 'medium',
            message: 'Largest Contentful Paint is slow. Optimize critical resources.'
          });
        }
      }
      
      if (result.loadTime && result.loadTime.loadTime > 3000) {
        recommendations.push({
          page: result.page,
          type: 'load_time',
          priority: 'medium',
          message: `Page load time is ${Math.round(result.loadTime.loadTime)}ms. Consider server optimization.`
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Report - Stone OnePoint Solutions</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .pages { margin-bottom: 30px; }
        .page-result { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .scores { display: flex; gap: 15px; margin: 10px 0; }
        .score { padding: 5px 10px; border-radius: 4px; color: white; font-weight: bold; }
        .score.good { background: #28a745; }
        .score.average { background: #ffc107; color: #333; }
        .score.poor { background: #dc3545; }
        .recommendations { background: #fff3cd; padding: 20px; border-radius: 8px; }
        .recommendation { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Performance Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Average Performance</h3>
                <div class="value">${report.summary.averagePerformanceScore || 0}</div>
            </div>
            <div class="metric">
                <h3>Average Load Time</h3>
                <div class="value">${report.summary.averageLoadTime || 0}ms</div>
            </div>
            <div class="metric">
                <h3>Pages Tested</h3>
                <div class="value">${report.summary.totalPages || 0}</div>
            </div>
            <div class="metric">
                <h3>Passed Audits</h3>
                <div class="value">${report.summary.passedAudits || 0}</div>
            </div>
        </div>
        
        <div class="pages">
            <h2>Page Results</h2>
            ${report.pages.map(page => `
                <div class="page-result">
                    <h3>${page.page}</h3>
                    ${page.lighthouse ? `
                        <div class="scores">
                            <span class="score ${this.getScoreClass(page.lighthouse.performance)}">Performance: ${page.lighthouse.performance}</span>
                            <span class="score ${this.getScoreClass(page.lighthouse.accessibility)}">Accessibility: ${page.lighthouse.accessibility}</span>
                            <span class="score ${this.getScoreClass(page.lighthouse.seo)}">SEO: ${page.lighthouse.seo}</span>
                        </div>
                    ` : ''}
                    ${page.loadTime ? `
                        <p>Load Time: ${Math.round(page.loadTime.loadTime)}ms</p>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        ${report.recommendations.length > 0 ? `
            <div class="recommendations">
                <h2>Recommendations</h2>
                ${report.recommendations.map(rec => `
                    <div class="recommendation">
                        <strong>${rec.page}</strong>: ${rec.message}
                    </div>
                `).join('')}
            </div>
        ` : ''}
    </div>
</body>
</html>
    `;
    
    const htmlPath = path.join(this.outputDir, 'performance-report.html');
    fs.writeFileSync(htmlPath, html);
  }

  /**
   * Get CSS class for score
   */
  getScoreClass(score) {
    if (score >= 90) return 'good';
    if (score >= 70) return 'average';
    return 'poor';
  }

  /**
   * Run performance monitoring
   */
  async monitor() {
    console.log('🚀 Starting performance monitoring...\n');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Check dependencies
    const availableTools = this.checkDependencies();
    console.log(`Available tools: ${availableTools.join(', ')}\n`);

    // Test resource optimization
    const resourceOptimization = await this.testResourceOptimization();
    console.log('Resource optimization results:', resourceOptimization);

    // Run tests for each page
    for (const page of this.pages) {
      const result = { page: page.name, url: page.url };
      
      // Run Lighthouse audit if available
      if (availableTools.includes('lighthouse')) {
        result.lighthouse = await this.runLighthouseAudit(page);
      }
      
      // Test load times if curl is available
      if (availableTools.includes('curl')) {
        result.loadTime = await this.testLoadTimes(page);
      }
      
      this.results.push(result);
    }

    // Generate report
    const report = this.generateReport();
    
    console.log('\n📊 Performance monitoring complete!');
    console.log(`Report saved to: ${path.join(this.outputDir, 'performance-report.html')}`);
    
    return report;
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
    if (key === 'output') options.outputDir = value;
  }

  const monitor = new PerformanceMonitor(options);
  monitor.monitor().catch(console.error);
}

module.exports = PerformanceMonitor;