/**
 * Database Performance Optimizer
 * Implements connection pooling, query optimization, and caching strategies
 */

import { LibSQLStore } from '@mastra/libsql'
import { createHash } from 'crypto'
import { LRUCache } from 'lru-cache'

// Connection Pool Configuration
interface ConnectionPoolConfig {
  maxConnections: number
  minConnections: number
  acquireTimeout: number
  createTimeout: number
  idleTimeout: number
  reapInterval: number
}

// Query Cache Configuration
const queryCache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
})

export class DatabaseOptimizer {
  private connectionPool: Map<string, LibSQLStore> = new Map()
  private queryStats: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map()
  
  /**
   * Optimized LibSQL configuration with performance tuning
   */
  static createOptimizedLibSQLStore(config: {
    url: string
    authToken?: string
  }): LibSQLStore {
    return new LibSQLStore({
      url: config.url,
      authToken: config.authToken,
      // Performance optimizations
      syncUrl: config.url,
      syncInterval: 60, // Sync every minute for better performance
      readYourWrites: true,
      encryptionKey: undefined, // Disable encryption for better performance in dev
    })
  }

  /**
   * Connection pool manager for database connections
   */
  static createConnectionPool(config: ConnectionPoolConfig) {
    const pool = {
      connections: [] as LibSQLStore[],
      inUse: new Set<LibSQLStore>(),
      config,
      
      async acquire(): Promise<LibSQLStore> {
        const start = Date.now()
        
        while (Date.now() - start < config.acquireTimeout) {
          // Check for available connection
          const available = this.connections.find(conn => !this.inUse.has(conn))
          if (available) {
            this.inUse.add(available)
            return available
          }
          
          // Create new connection if under max
          if (this.connections.length < config.maxConnections) {
            const newConn = DatabaseOptimizer.createOptimizedLibSQLStore({
              url: process.env.DATABASE_URL || 'file:./storage.db'
            })
            this.connections.push(newConn)
            this.inUse.add(newConn)
            return newConn
          }
          
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        
        throw new Error('Connection pool timeout')
      },
      
      release(connection: LibSQLStore) {
        this.inUse.delete(connection)
      },
      
      async destroy() {
        this.connections.forEach(conn => {
          // Close connections if supported
          try {
            // LibSQL doesn't expose close method, but we track for cleanup
          } catch (error) {
            console.warn('Error closing database connection:', error)
          }
        })
        this.connections = []
        this.inUse.clear()
      }
    }
    
    // Cleanup idle connections
    setInterval(() => {
      while (pool.connections.length > config.minConnections) {
        const conn = pool.connections.find(c => !pool.inUse.has(c))
        if (conn) {
          const index = pool.connections.indexOf(conn)
          pool.connections.splice(index, 1)
        } else {
          break
        }
      }
    }, config.reapInterval)
    
    return pool
  }

  /**
   * Query optimizer with caching and performance monitoring
   */
  static async executeOptimizedQuery<T>(
    operation: string,
    queryFn: () => Promise<T>,
    cacheKey?: string,
    cacheTTL: number = 300000 // 5 minutes
  ): Promise<T> {
    const start = Date.now()
    
    // Check cache first
    if (cacheKey && queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey)
      console.log(`Cache hit for: ${operation}`)
      return cached
    }
    
    try {
      // Execute query
      const result = await queryFn()
      const duration = Date.now() - start
      
      // Update performance stats
      this.updateQueryStats(operation, duration)
      
      // Cache result if cacheKey provided
      if (cacheKey) {
        queryCache.set(cacheKey, result, { ttl: cacheTTL })
      }
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${operation} took ${duration}ms`)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.updateQueryStats(`${operation}_ERROR`, duration)
      throw error
    }
  }

  /**
   * Batch operation optimizer for bulk database operations
   */
  static async executeBatchOperation<T>(
    items: T[],
    batchSize: number,
    operation: (batch: T[]) => Promise<void>,
    concurrency: number = 3
  ): Promise<void> {
    const batches: T[][] = []
    
    // Split into batches
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    
    // Process batches with controlled concurrency
    const semaphore = new Semaphore(concurrency)
    
    await Promise.all(
      batches.map(async (batch, index) => {
        await semaphore.acquire()
        try {
          console.log(`Processing batch ${index + 1}/${batches.length} (${batch.length} items)`)
          await operation(batch)
        } finally {
          semaphore.release()
        }
      })
    )
  }

  /**
   * Article query optimizations
   */
  static createOptimizedArticleQueries() {
    return {
      // Get article list with pagination and projection
      async getArticleList(
        userId: string,
        page: number = 1,
        limit: number = 20,
        status?: string
      ) {
        const cacheKey = createHash('md5')
          .update(`articles_${userId}_${page}_${limit}_${status || 'all'}`)
          .digest('hex')
        
        return DatabaseOptimizer.executeOptimizedQuery(
          'getArticleList',
          async () => {
            // Use projection to limit data transfer
            const filter: any = { userId }
            if (status) filter.status = status
            
            // This would be the actual query implementation
            // For now, showing the optimized structure
            return {
              articles: [], // Limited fields only
              total: 0,
              page,
              limit,
              totalPages: 0
            }
          },
          cacheKey,
          180000 // 3 minutes cache
        )
      },

      // Get article by slug with caching
      async getArticleBySlug(slug: string, userId: string) {
        const cacheKey = createHash('md5')
          .update(`article_${slug}_${userId}`)
          .digest('hex')
        
        return DatabaseOptimizer.executeOptimizedQuery(
          'getArticleBySlug',
          async () => {
            // Optimized single article query
            return null // Actual implementation would go here
          },
          cacheKey,
          600000 // 10 minutes cache
        )
      },

      // Bulk update article status
      async updateArticleStatuses(
        updates: Array<{ id: string; status: string; userId: string }>
      ) {
        return DatabaseOptimizer.executeBatchOperation(
          updates,
          50, // Batch size
          async (batch) => {
            // Batch update implementation
            console.log(`Updating ${batch.length} article statuses`)
          },
          3 // Concurrency
        )
      }
    }
  }

  /**
   * Update query performance statistics
   */
  private static updateQueryStats(operation: string, duration: number) {
    const stats = this.queryStatsMap.get(operation) || { count: 0, totalTime: 0, avgTime: 0 }
    stats.count++
    stats.totalTime += duration
    stats.avgTime = stats.totalTime / stats.count
    this.queryStatsMap.set(operation, stats)
  }

  private static queryStatsMap = new Map<string, { count: number; totalTime: number; avgTime: number }>()

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics() {
    return {
      cacheStats: {
        size: queryCache.size,
        hitRate: queryCache.calculatedSize || 0,
        maxSize: queryCache.max
      },
      queryStats: Array.from(this.queryStatsMap.entries()).map(([operation, stats]) => ({
        operation,
        ...stats
      })).sort((a, b) => b.avgTime - a.avgTime),
      slowQueries: Array.from(this.queryStatsMap.entries())
        .filter(([_, stats]) => stats.avgTime > 1000)
        .map(([operation, stats]) => ({ operation, avgTime: stats.avgTime }))
    }
  }

  /**
   * Clear performance cache and stats
   */
  static clearCache() {
    queryCache.clear()
    this.queryStatsMap.clear()
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number
  private waiting: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve)
    })
  }

  release(): void {
    this.permits++
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!
      this.permits--
      next()
    }
  }
}

// Export optimized configurations
export const optimizedDatabaseConfig = {
  connectionPool: {
    maxConnections: 10,
    minConnections: 2,
    acquireTimeout: 30000,
    createTimeout: 30000,
    idleTimeout: 300000,
    reapInterval: 60000
  },
  cache: {
    maxSize: 1000,
    defaultTTL: 300000, // 5 minutes
    checkPeriod: 600 // 10 minutes
  }
}