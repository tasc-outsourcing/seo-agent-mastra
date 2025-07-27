/**
 * Advanced Multi-Tier Performance Cache System
 * Provides memory, persistent, and distributed caching with intelligent management
 */

import { LRUCache } from 'lru-cache';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export interface CacheConfig {
  memory: {
    maxSize: number; // Maximum number of items
    ttl: number; // Time to live in milliseconds
  };
  file: {
    enabled: boolean;
    directory: string;
    maxSize: number; // Maximum file cache size in MB
  };
  redis?: {
    enabled: boolean;
    url?: string;
    ttl: number;
  };
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  hits: number;
  size: number;
}

export interface CacheMetrics {
  memoryHitRate: number;
  fileHitRate: number;
  totalHits: number;
  totalMisses: number;
  cacheSize: number;
  evictions: number;
  averageResponseTime: number;
}

class PerformanceCache {
  private memoryCache: LRUCache<string, CacheEntry>;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private tagIndex: Map<string, Set<string>> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      memory: {
        maxSize: config.memory?.maxSize || 1000,
        ttl: config.memory?.ttl || 300000, // 5 minutes
      },
      file: {
        enabled: config.file?.enabled ?? true,
        directory: config.file?.directory || path.join(process.cwd(), '.cache'),
        maxSize: config.file?.maxSize || 100, // 100MB
      },
      redis: {
        enabled: config.redis?.enabled ?? false,
        url: config.redis?.url,
        ttl: config.redis?.ttl || 3600000, // 1 hour
      },
    };

    this.memoryCache = new LRUCache({
      max: this.config.memory.maxSize,
      ttl: this.config.memory.ttl,
      updateAgeOnGet: true,
      allowStale: false,
    });

    this.metrics = {
      memoryHitRate: 0,
      fileHitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      cacheSize: 0,
      evictions: 0,
      averageResponseTime: 0,
    };

    this.ensureCacheDirectory();
  }

  private async ensureCacheDirectory() {
    if (this.config.file.enabled) {
      try {
        await fs.mkdir(this.config.file.directory, { recursive: true });
      } catch (error) {
        console.warn('Failed to create cache directory:', error);
      }
    }
  }

  /**
   * Get item from cache with multi-tier fallback
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Try memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && this.isValid(memoryEntry)) {
        memoryEntry.hits++;
        this.updateMetrics(true, Date.now() - startTime, 'memory');
        return memoryEntry.data;
      }

      // Try file cache
      if (this.config.file.enabled) {
        const fileEntry = await this.getFromFile<T>(key);
        if (fileEntry && this.isValid(fileEntry)) {
          // Promote to memory cache
          this.memoryCache.set(key, fileEntry);
          fileEntry.hits++;
          this.updateMetrics(true, Date.now() - startTime, 'file');
          return fileEntry.data;
        }
      }

      // Cache miss
      this.updateMetrics(false, Date.now() - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.updateMetrics(false, Date.now() - startTime);
      return null;
    }
  }

  /**
   * Set item in cache with multi-tier storage
   */
  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
      skipFile?: boolean;
    } = {}
  ): Promise<void> {
    const ttl = options.ttl || this.config.memory.ttl;
    const tags = options.tags || [];
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
      hits: 0,
      size: this.calculateSize(data),
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });

    // Store in file cache if enabled and not skipped
    if (this.config.file.enabled && !options.skipFile) {
      try {
        await this.setToFile(key, entry);
      } catch (error) {
        console.warn('Failed to write to file cache:', error);
      }
    }

    this.updateCacheSize();
  }

  /**
   * Delete item from all cache tiers
   */
  async delete(key: string): Promise<void> {
    // Remove from memory
    const entry = this.memoryCache.get(key);
    this.memoryCache.delete(key);

    // Remove from tag index
    if (entry) {
      entry.tags.forEach(tag => {
        const tagSet = this.tagIndex.get(tag);
        if (tagSet) {
          tagSet.delete(key);
          if (tagSet.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    }

    // Remove from file cache
    if (this.config.file.enabled) {
      try {
        const filePath = this.getFilePath(key);
        await fs.unlink(filePath);
      } catch (error) {
        // File might not exist, ignore error
      }
    }

    this.updateCacheSize();
  }

  /**
   * Clear cache by tags
   */
  async clearByTags(tags: string[]): Promise<void> {
    const keysToDelete = new Set<string>();

    tags.forEach(tag => {
      const tagSet = this.tagIndex.get(tag);
      if (tagSet) {
        tagSet.forEach(key => keysToDelete.add(key));
      }
    });

    await Promise.all(Array.from(keysToDelete).map(key => this.delete(key)));
  }

  /**
   * Get or set with cache-aside pattern
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
      skipFile?: boolean;
    } = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Warm cache with predefined data
   */
  async warmCache(entries: Array<{ key: string; factory: () => Promise<any>; options?: any }>) {
    const warmingPromises = entries.map(async ({ key, factory, options }) => {
      try {
        const data = await factory();
        await this.set(key, data, options);
      } catch (error) {
        console.warn(`Failed to warm cache for key ${key}:`, error);
      }
    });

    await Promise.all(warmingPromises);
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.tagIndex.clear();

    if (this.config.file.enabled) {
      try {
        const files = await fs.readdir(this.config.file.directory);
        await Promise.all(
          files
            .filter(file => file.endsWith('.cache'))
            .map(file => fs.unlink(path.join(this.config.file.directory, file)))
        );
      } catch (error) {
        console.warn('Failed to clear file cache:', error);
      }
    }

    this.resetMetrics();
  }

  /**
   * Optimize cache performance
   */
  async optimize(): Promise<void> {
    // Remove expired entries
    await this.cleanupExpired();

    // Analyze hit patterns and adjust cache size if needed
    if (this.metrics.memoryHitRate < 0.7) {
      console.log('Low cache hit rate detected, consider increasing cache size');
    }

    // Clean up file cache if it's too large
    if (this.config.file.enabled) {
      await this.cleanupFileCache();
    }
  }

  private async getFromFile<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const filePath = this.getFilePath(key);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  private async setToFile<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8');
  }

  private getFilePath(key: string): string {
    const hash = createHash('md5').update(key).digest('hex');
    return path.join(this.config.file.directory, `${hash}.cache`);
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private updateMetrics(hit: boolean, responseTime: number, source?: 'memory' | 'file') {
    if (hit) {
      this.metrics.totalHits++;
      if (source === 'memory') {
        this.metrics.memoryHitRate = this.metrics.totalHits / (this.metrics.totalHits + this.metrics.totalMisses);
      } else if (source === 'file') {
        this.metrics.fileHitRate = this.metrics.totalHits / (this.metrics.totalHits + this.metrics.totalMisses);
      }
    } else {
      this.metrics.totalMisses++;
    }

    // Update average response time
    const total = this.metrics.totalHits + this.metrics.totalMisses;
    this.metrics.averageResponseTime = (this.metrics.averageResponseTime * (total - 1) + responseTime) / total;
  }

  private updateCacheSize() {
    this.metrics.cacheSize = this.memoryCache.size;
  }

  private resetMetrics() {
    this.metrics = {
      memoryHitRate: 0,
      fileHitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      cacheSize: 0,
      evictions: 0,
      averageResponseTime: 0,
    };
  }

  private async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.memoryCache.forEach((entry, key) => {
      if (!this.isValid(entry)) {
        keysToDelete.push(key);
      }
    });

    await Promise.all(keysToDelete.map(key => this.delete(key)));
  }

  private async cleanupFileCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.file.directory);
      const cacheFiles = files.filter(file => file.endsWith('.cache'));
      
      // Get file stats and remove old files if cache is too large
      const fileStats = await Promise.all(
        cacheFiles.map(async file => {
          const filePath = path.join(this.config.file.directory, file);
          const stat = await fs.stat(filePath);
          return { file, path: filePath, size: stat.size, mtime: stat.mtime };
        })
      );

      const totalSize = fileStats.reduce((sum, stat) => sum + stat.size, 0);
      const maxSizeBytes = this.config.file.maxSize * 1024 * 1024;

      if (totalSize > maxSizeBytes) {
        // Sort by last modified time and remove oldest files
        fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
        
        let currentSize = totalSize;
        for (const fileStat of fileStats) {
          if (currentSize <= maxSizeBytes * 0.8) break; // Leave 20% buffer
          
          await fs.unlink(fileStat.path);
          currentSize -= fileStat.size;
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup file cache:', error);
    }
  }
}

// Global cache instance
export const performanceCache = new PerformanceCache();

// Utility functions
export function createCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}

export function withCache<T extends any[], R>(
  keyFactory: (...args: T) => string,
  ttl?: number,
  tags?: string[]
) {
  return function decorator(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const key = keyFactory(...args);
      
      return performanceCache.getOrSet(
        key,
        () => originalMethod.apply(this, args),
        { ttl, tags }
      );
    };

    return descriptor;
  };
}