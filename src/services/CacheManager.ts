/**
 * Advanced Caching System for WACC Calculator
 * Multi-layer caching with TTL, LRU eviction, and persistence
 */

// Cache entry interface
interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccess: number;
  size: number; // Estimated size in bytes
}

// Cache configuration
interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  persistToDisk: boolean; // Whether to persist to localStorage/IndexedDB
  compressionEnabled: boolean; // Whether to compress large entries
}

// Cache statistics for monitoring
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  entryCount: number;
  hitRate: number;
  averageAccessTime: number;
  memoryUsage: number;
}

// Cache layer types
type CacheLayer = 'memory' | 'sessionStorage' | 'localStorage' | 'indexedDB';

/**
 * Multi-layer cache implementation with LRU eviction
 */
export class CacheManager<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = []; // For LRU tracking
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    entryCount: 0,
    hitRate: 0,
    averageAccessTime: 0,
    memoryUsage: 0,
  };
  
  private cleanupTimer?: NodeJS.Timeout;
  private config: CacheConfig;
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxEntries: 1000,
      defaultTTL: 60 * 60 * 1000, // 1 hour
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      persistToDisk: true,
      compressionEnabled: true,
      ...config,
    };
    
    this.startCleanupTimer();
    this.loadFromPersistence();
  }
  
  /**
   * Get value from cache with performance tracking
   */
  async get(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      // Check memory cache first
      const entry = this.cache.get(key);
      
      if (entry && !this.isExpired(entry)) {
        // Update access statistics
        entry.accessCount++;
        entry.lastAccess = Date.now();
        this.updateAccessOrder(key);
        
        this.stats.hits++;
        this.updateAverageAccessTime(performance.now() - startTime);
        
        return entry.value;
      }
      
      // If expired, remove from cache
      if (entry && this.isExpired(entry)) {
        this.delete(key);
      }
      
      // Try secondary storage layers
      const persistedValue = await this.getFromPersistence(key);
      if (persistedValue !== null) {
        // Re-add to memory cache
        await this.set(key, persistedValue, this.config.defaultTTL);
        this.stats.hits++;
        return persistedValue;
      }
      
      this.stats.misses++;
      return null;
      
    } finally {
      this.updateAverageAccessTime(performance.now() - startTime);
    }
  }
  
  /**
   * Set value in cache with automatic eviction
   */
  async set(key: string, value: T, ttl: number = this.config.defaultTTL): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccess: Date.now(),
      size: this.estimateSize(value),
    };
    
    // Check if we need to evict entries
    await this.ensureCapacity(entry.size);
    
    // Add to cache
    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    
    // Update statistics
    this.stats.size += entry.size;
    this.stats.entryCount = this.cache.size;
    this.updateHitRate();
    
    // Persist to secondary storage if enabled
    if (this.config.persistToDisk) {
      await this.saveToPersistence(key, value, ttl);
    }
  }
  
  /**
   * Delete entry from all cache layers
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    const deleted = this.cache.delete(key);
    
    if (deleted && entry) {
      this.stats.size -= entry.size;
      this.stats.entryCount = this.cache.size;
      this.removeFromAccessOrder(key);
      
      // Remove from persistence
      this.removeFromPersistence(key);
    }
    
    return deleted;
  }
  
  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessOrder = [];
    this.stats = {
      ...this.stats,
      size: 0,
      entryCount: 0,
    };
    
    // Clear persistence layers
    await this.clearPersistence();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Manual cleanup of expired entries
   */
  cleanup(): number {
    let removedCount = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }
  
  /**
   * Get cache entries sorted by access pattern
   */
  getEntries(sortBy: 'access' | 'time' | 'size' = 'access'): Array<CacheEntry<T>> {
    const entries = Array.from(this.cache.values());
    
    return entries.sort((a, b) => {
      switch (sortBy) {
        case 'access':
          return b.accessCount - a.accessCount;
        case 'time':
          return b.lastAccess - a.lastAccess;
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });
  }
  
  /**
   * Preload cache with common data
   */
  async preload(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const promises = entries.map(({ key, value, ttl }) => 
      this.set(key, value, ttl)
    );
    
    await Promise.all(promises);
  }
  
  /**
   * Cache warming strategy
   */
  async warmCache(warmupFunction: () => Promise<Array<{ key: string; value: T }>>): Promise<void> {
    try {
      const warmupData = await warmupFunction();
      await this.preload(warmupData);
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  }
  
  // Private methods
  
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
  
  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.removeFromAccessOrder(key);
    // Add to front (most recently used)
    this.accessOrder.unshift(key);
  }
  
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
  
  private async ensureCapacity(newEntrySize: number): Promise<void> {
    // Check size limit
    while (this.stats.size + newEntrySize > this.config.maxSize && this.cache.size > 0) {
      await this.evictLRU();
    }
    
    // Check entry count limit
    while (this.cache.size >= this.config.maxEntries) {
      await this.evictLRU();
    }
  }
  
  private async evictLRU(): Promise<void> {
    const lruKey = this.accessOrder[this.accessOrder.length - 1];
    if (lruKey) {
      this.delete(lruKey);
      this.stats.evictions++;
    }
  }
  
  private estimateSize(value: T): number {
    try {
      const jsonString = JSON.stringify(value);
      return new Blob([jsonString]).size;
    } catch {
      // Fallback estimation
      return 1024; // 1KB default
    }
  }
  
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
  
  private updateAverageAccessTime(accessTime: number): void {
    const totalAccesses = this.stats.hits + this.stats.misses;
    if (totalAccesses === 1) {
      this.stats.averageAccessTime = accessTime;
    } else {
      this.stats.averageAccessTime = 
        (this.stats.averageAccessTime * (totalAccesses - 1) + accessTime) / totalAccesses;
    }
  }
  
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
  
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
  
  // Persistence layer methods
  
  private async loadFromPersistence(): Promise<void> {
    if (!this.config.persistToDisk) return;
    
    try {
      // Load from localStorage first (fastest)
      const stored = localStorage.getItem('wacc-cache-index');
      if (stored) {
        const index = JSON.parse(stored) as string[];
        for (const key of index) {
          const entry = localStorage.getItem(`wacc-cache-${key}`);
          if (entry) {
            const { value, ttl, timestamp } = JSON.parse(entry);
            if (Date.now() - timestamp < ttl) {
              await this.set(key, value, ttl - (Date.now() - timestamp));
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from persistence:', error);
    }
  }
  
  private async saveToPersistence(key: string, value: T, ttl: number): Promise<void> {
    if (!this.config.persistToDisk) return;
    
    try {
      const entry = {
        value,
        ttl,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(`wacc-cache-${key}`, JSON.stringify(entry));
      
      // Update index
      const indexKey = 'wacc-cache-index';
      const stored = localStorage.getItem(indexKey);
      const index = stored ? JSON.parse(stored) as string[] : [];
      if (!index.includes(key)) {
        index.push(key);
        localStorage.setItem(indexKey, JSON.stringify(index));
      }
    } catch (error) {
      console.warn('Failed to save to persistence:', error);
    }
  }
  
  private async getFromPersistence(key: string): Promise<T | null> {
    if (!this.config.persistToDisk) return null;
    
    try {
      const entry = localStorage.getItem(`wacc-cache-${key}`);
      if (entry) {
        const { value, ttl, timestamp } = JSON.parse(entry);
        if (Date.now() - timestamp < ttl) {
          return value;
        } else {
          // Remove expired entry
          this.removeFromPersistence(key);
        }
      }
    } catch (error) {
      console.warn('Failed to get from persistence:', error);
    }
    
    return null;
  }
  
  private removeFromPersistence(key: string): void {
    if (!this.config.persistToDisk) return;
    
    try {
      localStorage.removeItem(`wacc-cache-${key}`);
      
      // Update index
      const indexKey = 'wacc-cache-index';
      const stored = localStorage.getItem(indexKey);
      if (stored) {
        const index = JSON.parse(stored) as string[];
        const filteredIndex = index.filter(k => k !== key);
        localStorage.setItem(indexKey, JSON.stringify(filteredIndex));
      }
    } catch (error) {
      console.warn('Failed to remove from persistence:', error);
    }
  }
  
  private async clearPersistence(): Promise<void> {
    if (!this.config.persistToDisk) return;
    
    try {
      const indexKey = 'wacc-cache-index';
      const stored = localStorage.getItem(indexKey);
      if (stored) {
        const index = JSON.parse(stored) as string[];
        for (const key of index) {
          localStorage.removeItem(`wacc-cache-${key}`);
        }
        localStorage.removeItem(indexKey);
      }
    } catch (error) {
      console.warn('Failed to clear persistence:', error);
    }
  }
  
  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopCleanupTimer();
    this.cache.clear();
  }
}

/**
 * Specialized cache for WACC calculations
 */
export class WACCCalculationCache extends CacheManager<any> {
  constructor() {
    super({
      maxSize: 10 * 1024 * 1024, // 10MB for calculation results
      maxEntries: 500,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 2 * 60 * 1000, // 2 minutes
      persistToDisk: true,
    });
  }
  
  /**
   * Generate cache key for WACC input data
   */
  generateWACCKey(inputData: any): string {
    // Create deterministic hash of input data
    const dataString = JSON.stringify(inputData, Object.keys(inputData).sort());
    return `wacc-${this.hashString(dataString)}`;
  }
  
  /**
   * Cache WACC calculation result
   */
  async cacheCalculation(inputData: any, result: any): Promise<void> {
    const key = this.generateWACCKey(inputData);
    await this.set(key, result, 60 * 60 * 1000); // 1 hour TTL for calculations
  }
  
  /**
   * Get cached WACC calculation
   */
  async getCachedCalculation(inputData: any): Promise<any | null> {
    const key = this.generateWACCKey(inputData);
    return await this.get(key);
  }
  
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}

/**
 * Specialized cache for Excel formatting
 */
export class ExcelFormattingCache extends CacheManager<any> {
  constructor() {
    super({
      maxSize: 5 * 1024 * 1024, // 5MB for formatting templates
      maxEntries: 100,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: 10 * 60 * 1000, // 10 minutes
      persistToDisk: true,
    });
  }
  
  /**
   * Cache formatted template
   */
  async cacheTemplate(templateId: string, formattedData: any): Promise<void> {
    const key = `template-${templateId}`;
    await this.set(key, formattedData);
  }
  
  /**
   * Get cached template
   */
  async getCachedTemplate(templateId: string): Promise<any | null> {
    const key = `template-${templateId}`;
    return await this.get(key);
  }
}

// Global cache instances
export const waccCalculationCache = new WACCCalculationCache();
export const excelFormattingCache = new ExcelFormattingCache();

// Cache factory for creating specialized caches
export class CacheFactory {
  static createCalculationCache(config?: Partial<CacheConfig>): CacheManager {
    return new CacheManager({
      maxSize: 20 * 1024 * 1024, // 20MB
      maxEntries: 1000,
      defaultTTL: 60 * 60 * 1000, // 1 hour
      ...config,
    });
  }
  
  static createFormattingCache(config?: Partial<CacheConfig>): CacheManager {
    return new CacheManager({
      maxSize: 5 * 1024 * 1024, // 5MB
      maxEntries: 200,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    });
  }
  
  static createSessionCache(config?: Partial<CacheConfig>): CacheManager {
    return new CacheManager({
      maxSize: 1 * 1024 * 1024, // 1MB
      maxEntries: 50,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      persistToDisk: false, // Session-only
      ...config,
    });
  }
}