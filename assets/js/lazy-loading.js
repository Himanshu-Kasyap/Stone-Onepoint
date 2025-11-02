/**
 * Lazy Loading Implementation
 * Implements lazy loading for images with responsive variants and WebP support
 */

class LazyImageLoader {
  constructor(options = {}) {
    this.config = {
      selector: options.selector || 'img[data-src]',
      rootMargin: options.rootMargin || '50px 0px',
      threshold: options.threshold || 0.01,
      loadingClass: options.loadingClass || 'lazy-loading',
      loadedClass: options.loadedClass || 'lazy-loaded',
      errorClass: options.errorClass || 'lazy-error',
      fadeInDuration: options.fadeInDuration || 300,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000
    };

    this.observer = null;
    this.images = [];
    this.loadedImages = new Set();
    this.failedImages = new Set();
    
    this.init();
  }

  /**
   * Initialize lazy loading
   */
  init() {
    // Check for Intersection Observer support
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, loading all images immediately');
      this.loadAllImages();
      return;
    }

    this.setupObserver();
    this.findImages();
    this.observeImages();
    this.setupEventListeners();
  }

  /**
   * Setup Intersection Observer
   */
  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: this.config.rootMargin,
      threshold: this.config.threshold
    });
  }

  /**
   * Find all lazy loading images
   */
  findImages() {
    this.images = Array.from(document.querySelectorAll(this.config.selector));
    console.log(`Found ${this.images.length} images for lazy loading`);
  }

  /**
   * Start observing images
   */
  observeImages() {
    this.images.forEach(img => {
      this.observer.observe(img);
      this.setupImageAttributes(img);
    });
  }

  /**
   * Setup image attributes for lazy loading
   */
  setupImageAttributes(img) {
    // Add loading class
    img.classList.add(this.config.loadingClass);
    
    // Set up placeholder if not already set
    if (!img.src || img.src === window.location.href) {
      img.src = this.generatePlaceholder(img);
    }

    // Store original dimensions if available
    if (img.dataset.width) img.setAttribute('width', img.dataset.width);
    if (img.dataset.height) img.setAttribute('height', img.dataset.height);
  }

  /**
   * Generate placeholder image
   */
  generatePlaceholder(img) {
    const width = img.dataset.width || 300;
    const height = img.dataset.height || 200;
    
    // Create a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="Arial, sans-serif" font-size="14">
          Loading...
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Load image with responsive and WebP support
   */
  async loadImage(img) {
    const imageId = this.getImageId(img);
    
    if (this.loadedImages.has(imageId)) {
      return;
    }

    try {
      const bestSource = await this.getBestImageSource(img);
      await this.loadImageSource(img, bestSource);
      
      this.onImageLoaded(img);
      this.loadedImages.add(imageId);
      
    } catch (error) {
      console.error('Failed to load image:', error);
      this.onImageError(img, error);
      this.failedImages.add(imageId);
    }
  }

  /**
   * Get best image source based on device capabilities and screen size
   */
  async getBestImageSource(img) {
    const dataSrc = img.dataset.src;
    const dataSrcset = img.dataset.srcset;
    
    // If srcset is provided, use responsive logic
    if (dataSrcset) {
      return this.selectResponsiveSource(dataSrcset);
    }

    // Check for WebP support and WebP version
    if (await this.supportsWebP()) {
      const webpSrc = this.getWebPVersion(dataSrc);
      if (await this.imageExists(webpSrc)) {
        return webpSrc;
      }
    }

    // Fallback to original source
    return dataSrc;
  }

  /**
   * Select best responsive source based on screen size and DPR
   */
  selectResponsiveSource(srcset) {
    const sources = this.parseSrcset(srcset);
    const devicePixelRatio = window.devicePixelRatio || 1;
    const viewportWidth = window.innerWidth * devicePixelRatio;

    // Find the best match
    let bestSource = sources[0];
    
    for (const source of sources) {
      if (source.width <= viewportWidth) {
        bestSource = source;
      } else {
        break;
      }
    }

    return bestSource.url;
  }

  /**
   * Parse srcset string into array of sources
   */
  parseSrcset(srcset) {
    return srcset.split(',').map(src => {
      const [url, descriptor] = src.trim().split(' ');
      const width = descriptor ? parseInt(descriptor.replace('w', '')) : 0;
      return { url, width };
    }).sort((a, b) => a.width - b.width);
  }

  /**
   * Check WebP support
   */
  supportsWebP() {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Get WebP version of image URL
   */
  getWebPVersion(src) {
    return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  /**
   * Check if image exists
   */
  imageExists(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  /**
   * Load image source
   */
  loadImageSource(img, src) {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();
      
      tempImg.onload = () => {
        img.src = src;
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
        resolve();
      };
      
      tempImg.onerror = reject;
      tempImg.src = src;
    });
  }

  /**
   * Handle successful image load
   */
  onImageLoaded(img) {
    img.classList.remove(this.config.loadingClass);
    img.classList.add(this.config.loadedClass);
    
    // Fade in effect
    img.style.opacity = '0';
    img.style.transition = `opacity ${this.config.fadeInDuration}ms ease-in-out`;
    
    requestAnimationFrame(() => {
      img.style.opacity = '1';
    });

    // Dispatch custom event
    img.dispatchEvent(new CustomEvent('lazyloaded', {
      detail: { src: img.src }
    }));
  }

  /**
   * Handle image load error
   */
  onImageError(img, error) {
    img.classList.remove(this.config.loadingClass);
    img.classList.add(this.config.errorClass);
    
    // Set fallback image
    img.src = this.getFallbackImage();
    
    // Dispatch custom event
    img.dispatchEvent(new CustomEvent('lazyerror', {
      detail: { error: error.message }
    }));
  }

  /**
   * Get fallback image for errors
   */
  getFallbackImage() {
    const svg = `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f5f5f5" stroke="#ddd"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-family="Arial, sans-serif" font-size="12">
          Image not available
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Get unique image identifier
   */
  getImageId(img) {
    return img.dataset.src || img.src;
  }

  /**
   * Load all images immediately (fallback)
   */
  loadAllImages() {
    this.findImages();
    this.images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Handle dynamic content
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            const newImages = node.querySelectorAll ? 
              Array.from(node.querySelectorAll(this.config.selector)) : [];
            
            if (node.matches && node.matches(this.config.selector)) {
              newImages.push(node);
            }

            newImages.forEach(img => {
              this.observer.observe(img);
              this.setupImageAttributes(img);
            });
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Handle window resize for responsive images
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Reload responsive images if screen size changed significantly
    const currentWidth = window.innerWidth;
    if (!this.lastWidth || Math.abs(currentWidth - this.lastWidth) > 100) {
      this.reloadResponsiveImages();
      this.lastWidth = currentWidth;
    }
  }

  /**
   * Reload responsive images
   */
  reloadResponsiveImages() {
    this.images.forEach(img => {
      if (img.dataset.srcset && this.loadedImages.has(this.getImageId(img))) {
        this.loadImage(img);
      }
    });
  }

  /**
   * Destroy lazy loader
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.lazyLoader = new LazyImageLoader();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyImageLoader;
}