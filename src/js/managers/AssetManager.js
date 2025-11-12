/**
 * AssetManager - Handles loading and managing game assets
 * Uses promises for better async handling and provides error management
 */
export class AssetManager {
  constructor() {
    this.assets = new Map();
    this.loadingPromises = new Map();
    this.loadedCount = 0;
    this.totalCount = 0;
    this.onProgressCallback = null;
  }

  /**
   * Set a callback for loading progress
   * @param {Function} callback - Called with (loadedCount, totalCount, progress%)
   */
  onProgress(callback) {
    this.onProgressCallback = callback;
  }

  /**
   * Update loading progress and call callback if set
   */
  updateProgress() {
    if (this.onProgressCallback) {
      const progress = this.totalCount > 0 ? (this.loadedCount / this.totalCount) * 100 : 0;
      this.onProgressCallback(this.loadedCount, this.totalCount, progress);
    }
  }

  /**
   * Load a single image asset
   * @param {string} key - Unique key to identify the asset
   * @param {string} src - URL/path to the image
   * @returns {Promise<HTMLImageElement>} Promise that resolves with the loaded image
   */
  loadImage(key, src) {
    // Return existing promise if already loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // Return existing asset if already loaded
    if (this.assets.has(key)) {
      return Promise.resolve(this.assets.get(key));
    }

    console.log(`Loading image: ${key} from ${src}`);

    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      
      image.onload = () => {
        this.assets.set(key, image);
        this.loadingPromises.delete(key);
        this.loadedCount++;
        this.updateProgress();
        
        console.log(`Successfully loaded image: ${key}`);
        resolve(image);
      };

      image.onerror = (error) => {
        this.loadingPromises.delete(key);
        console.error(`Failed to load image: ${key} from ${src}`, error);
        reject(new Error(`Failed to load image: ${key}`));
      };

      // Start loading
      image.src = src;
    });

    this.loadingPromises.set(key, promise);
    this.totalCount++;
    this.updateProgress();

    return promise;
  }

  /**
   * Load multiple image assets
   * @param {Object} imageConfig - Object with key-value pairs of asset names and URLs
   * @returns {Promise<Object>} Promise that resolves with an object containing all loaded images
   */
  async loadImages(imageConfig) {
    const loadPromises = Object.entries(imageConfig).map(([key, src]) => {
      return this.loadImage(key, src).then(image => ({ key, image }));
    });

    try {
      const results = await Promise.all(loadPromises);
      const loadedImages = {};
      
      results.forEach(({ key, image }) => {
        loadedImages[key] = image;
      });

      console.log(`Successfully loaded ${results.length} images`);
      return loadedImages;
    } catch (error) {
      console.error('Failed to load some images:', error);
      throw error;
    }
  }

  /**
   * Load assets from a configuration object
   * @param {Object} config - Configuration object with asset definitions
   * @returns {Promise<Object>} Promise that resolves with loaded assets
   */
  async loadAssets(config) {
    const loadPromises = [];

    // Load images
    if (config.images) {
      loadPromises.push(this.loadImages(config.images));
    }

    // Could add support for other asset types here (audio, JSON, etc.)
    // if (config.sounds) { ... }
    // if (config.data) { ... }

    try {
      const results = await Promise.all(loadPromises);
      return results[0] || {}; // Return images for now
    } catch (error) {
      console.error('Failed to load assets:', error);
      throw error;
    }
  }

  /**
   * Get a loaded asset by key
   * @param {string} key - The asset key
   * @returns {HTMLImageElement|undefined} The asset or undefined if not found
   */
  getAsset(key) {
    return this.assets.get(key);
  }

  /**
   * Check if an asset is loaded
   * @param {string} key - The asset key
   * @returns {boolean} True if the asset is loaded
   */
  isLoaded(key) {
    return this.assets.has(key);
  }

  /**
   * Check if all assets are loaded
   * @returns {boolean} True if all assets are loaded
   */
  isAllLoaded() {
    return this.loadingPromises.size === 0 && this.loadedCount === this.totalCount;
  }

  /**
   * Get loading progress
   * @returns {Object} Object with loadedCount, totalCount, and progress percentage
   */
  getProgress() {
    const progress = this.totalCount > 0 ? (this.loadedCount / this.totalCount) * 100 : 0;
    return {
      loaded: this.loadedCount,
      total: this.totalCount,
      progress: progress
    };
  }

  /**
   * Clear all loaded assets
   */
  clear() {
    this.assets.clear();
    this.loadingPromises.clear();
    this.loadedCount = 0;
    this.totalCount = 0;
  }

  /**
   * Remove a specific asset
   * @param {string} key - The asset key to remove
   */
  removeAsset(key) {
    if (this.assets.has(key)) {
      this.assets.delete(key);
      console.log(`Removed asset: ${key}`);
    }
  }

  /**
   * Preload assets and show loading screen
   * @param {Object} config - Asset configuration
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} Promise that resolves when all assets are loaded
   */
  async preloadAssets(config, onProgress = null) {
    console.log('Starting asset preload...');
    
    if (onProgress) {
      this.onProgress(onProgress);
    }

    try {
      const assets = await this.loadAssets(config);
      console.log('Asset preload complete!');
      return assets;
    } catch (error) {
      console.error('Asset preload failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const assetManager = new AssetManager();

/**
 * Utility function to create asset configurations
 * @param {Object} paths - Object with asset paths
 * @returns {Object} Asset configuration object
 */
export function createAssetConfig(paths) {
  return {
    images: paths
  };
}