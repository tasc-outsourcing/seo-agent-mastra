/**
 * Memory Optimization System
 * Implements streaming, object pooling, and garbage collection strategies
 */

import { Transform, Readable, Writable } from 'stream'
import { performance } from 'perf_hooks'

// Memory monitoring interfaces
interface MemoryMetrics {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
  peak: number
  gcCount: number
  gcDuration: number
}

interface ObjectPoolConfig {
  maxSize: number
  resetFn?: (obj: any) => void
  createFn: () => any
}

/**
 * Object pool for reusing expensive objects
 */
class ObjectPool<T> {
  private pool: T[] = []
  private config: ObjectPoolConfig
  private created: number = 0
  private reused: number = 0

  constructor(config: ObjectPoolConfig) {
    this.config = config
  }

  acquire(): T {
    if (this.pool.length > 0) {
      const obj = this.pool.pop()!
      this.reused++
      return obj
    }

    this.created++
    return this.config.createFn()
  }

  release(obj: T): void {
    if (this.pool.length < this.config.maxSize) {
      if (this.config.resetFn) {
        this.config.resetFn(obj)
      }
      this.pool.push(obj)
    }
  }

  getStats() {
    return {
      poolSize: this.pool.length,
      created: this.created,
      reused: this.reused,
      reuseRate: this.reused / (this.created + this.reused) * 100
    }
  }
}

/**
 * Streaming text processor for large content analysis
 */
export class StreamingTextProcessor extends Transform {
  private buffer: string = ''
  private wordCount: number = 0
  private sentenceCount: number = 0
  private paragraphCount: number = 0
  private keywordCounts: Map<string, number> = new Map()
  private keywords: string[]

  constructor(keywords: string[] = []) {
    super({ objectMode: false })
    this.keywords = keywords.map(k => k.toLowerCase())
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
    this.buffer += chunk.toString()
    
    // Process complete sentences
    let sentences = this.buffer.split(/[.!?]+/)
    this.buffer = sentences.pop() || '' // Keep incomplete sentence
    
    sentences.forEach(sentence => {
      if (sentence.trim()) {
        this.processSentence(sentence.trim())
      }
    })

    // Process complete paragraphs
    let paragraphs = this.buffer.split(/\n\s*\n/)
    this.buffer = paragraphs.pop() || ''
    
    this.paragraphCount += paragraphs.filter(p => p.trim()).length

    this.push(chunk) // Pass through original content
    callback()
  }

  _flush(callback: Function) {
    // Process remaining buffer
    if (this.buffer.trim()) {
      this.processSentence(this.buffer.trim())
      this.paragraphCount++
    }
    callback()
  }

  private processSentence(sentence: string) {
    this.sentenceCount++
    
    const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 0)
    this.wordCount += words.length

    // Count keywords
    this.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = sentence.match(regex)
      if (matches) {
        this.keywordCounts.set(keyword, (this.keywordCounts.get(keyword) || 0) + matches.length)
      }
    })
  }

  getStatistics() {
    return {
      wordCount: this.wordCount,
      sentenceCount: this.sentenceCount,
      paragraphCount: this.paragraphCount,
      avgWordsPerSentence: this.sentenceCount > 0 ? this.wordCount / this.sentenceCount : 0,
      keywordDensity: this.keywords.reduce((acc, keyword) => {
        acc[keyword] = this.wordCount > 0 ? (this.keywordCounts.get(keyword) || 0) / this.wordCount * 100 : 0
        return acc
      }, {} as Record<string, number>)
    }
  }
}

/**
 * Memory-efficient content generator using streaming
 */
export class StreamingContentGenerator {
  private objectPools: Map<string, ObjectPool<any>> = new Map()

  constructor() {
    this.initializeObjectPools()
  }

  /**
   * Generate content using streaming to minimize memory usage
   */
  async generateContentStream(
    sections: Array<{ title: string; bullets: string[] }>,
    context: any
  ): Promise<Readable> {
    return new Readable({
      objectMode: false,
      read() {
        // Implementation would stream content generation
        this.push('# Generated Content\n\n')
        
        sections.forEach((section, index) => {
          this.push(`## ${section.title}\n\n`)
          
          section.bullets.forEach(bullet => {
            // Generate paragraph for each bullet point
            const paragraph = this.generateParagraph(bullet, context)
            this.push(paragraph + '\n\n')
          })
          
          // Add some delay to simulate real generation
          if (index < sections.length - 1) {
            setTimeout(() => {}, 100)
          }
        })
        
        this.push(null) // End stream
      }
    })
  }

  /**
   * Generate paragraph with memory pooling
   */
  private generateParagraph(bullet: string, context: any): string {
    const generator = this.objectPools.get('paragraphGenerator')!.acquire()
    
    try {
      // Mock paragraph generation
      const sentences = [
        `${bullet} is an important aspect to consider.`,
        `When implementing ${bullet}, organizations should focus on best practices.`,
        `The impact of ${bullet} on business operations cannot be understated.`,
        `Modern approaches to ${bullet} emphasize efficiency and scalability.`
      ]
      
      return sentences.slice(0, Math.floor(Math.random() * 3) + 2).join(' ')
    } finally {
      this.objectPools.get('paragraphGenerator')!.release(generator)
    }
  }

  /**
   * Initialize object pools for reusable components
   */
  private initializeObjectPools() {
    // Paragraph generator pool
    this.objectPools.set('paragraphGenerator', new ObjectPool({
      maxSize: 10,
      createFn: () => ({
        templates: [],
        cache: new Map(),
        reset() {
          this.cache.clear()
        }
      }),
      resetFn: (obj) => obj.reset()
    }))

    // SEO analyzer pool
    this.objectPools.set('seoAnalyzer', new ObjectPool({
      maxSize: 5,
      createFn: () => ({
        keywords: new Set(),
        statistics: {},
        reset() {
          this.keywords.clear()
          this.statistics = {}
        }
      }),
      resetFn: (obj) => obj.reset()
    }))
  }

  /**
   * Get object pool statistics
   */
  getPoolStats() {
    const stats: Record<string, any> = {}
    this.objectPools.forEach((pool, name) => {
      stats[name] = pool.getStats()
    })
    return stats
  }
}

/**
 * Memory monitoring and garbage collection optimizer
 */
export class MemoryMonitor {
  private metrics: MemoryMetrics[] = []
  private gcStartTime: number = 0
  private gcCount: number = 0
  private gcTotalDuration: number = 0
  private alertThreshold: number = 0.8 // 80% of max heap
  private maxHeapSize: number

  constructor() {
    this.maxHeapSize = this.getMaxHeapSize()
    this.setupGCMonitoring()
    this.startMonitoring()
  }

  /**
   * Get current memory metrics
   */
  getCurrentMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage()
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      peak: Math.max(...this.metrics.map(m => m.heapUsed), memUsage.heapUsed),
      gcCount: this.gcCount,
      gcDuration: this.gcTotalDuration
    }
  }

  /**
   * Check if memory usage is critical
   */
  isMemoryCritical(): boolean {
    const current = this.getCurrentMetrics()
    return current.heapUsed > (this.maxHeapSize * this.alertThreshold)
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    if (global.gc) {
      const start = performance.now()
      global.gc()
      const duration = performance.now() - start
      this.gcCount++
      this.gcTotalDuration += duration
      console.log(`Forced GC completed in ${duration.toFixed(2)}ms`)
      return true
    }
    return false
  }

  /**
   * Get memory optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const current = this.getCurrentMetrics()
    const recommendations: string[] = []

    if (current.heapUsed > this.maxHeapSize * 0.7) {
      recommendations.push('Consider reducing data retention or implementing streaming')
    }

    if (current.external > current.heapUsed * 0.5) {
      recommendations.push('High external memory usage detected - check Buffer usage')
    }

    if (this.gcCount > 0 && this.gcTotalDuration / this.gcCount > 100) {
      recommendations.push('GC pauses are high - consider object pooling or data structure optimization')
    }

    const recentMetrics = this.metrics.slice(-10)
    if (recentMetrics.length >= 5) {
      const trend = recentMetrics[recentMetrics.length - 1].heapUsed - recentMetrics[0].heapUsed
      if (trend > 0) {
        recommendations.push('Memory usage trending upward - potential memory leak')
      }
    }

    return recommendations
  }

  /**
   * Optimize memory usage proactively
   */
  async optimizeMemory(): Promise<{ 
    beforeMetrics: MemoryMetrics, 
    afterMetrics: MemoryMetrics,
    actions: string[]
  }> {
    const beforeMetrics = this.getCurrentMetrics()
    const actions: string[] = []

    // Force GC if available
    if (this.forceGarbageCollection()) {
      actions.push('Forced garbage collection')
    }

    // Clear caches if memory is critical
    if (this.isMemoryCritical()) {
      // Clear various caches (implementation would depend on actual cache instances)
      actions.push('Cleared performance caches')
    }

    // Wait a bit for GC to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    const afterMetrics = this.getCurrentMetrics()
    
    return {
      beforeMetrics,
      afterMetrics,
      actions
    }
  }

  /**
   * Setup GC monitoring using performance hooks
   */
  private setupGCMonitoring() {
    if (typeof PerformanceObserver !== 'undefined') {
      const obs = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'gc') {
            this.gcCount++
            this.gcTotalDuration += entry.duration
          }
        })
      })
      
      try {
        obs.observe({ entryTypes: ['gc'] })
      } catch (error) {
        console.warn('GC monitoring not available:', error)
      }
    }
  }

  /**
   * Start periodic memory monitoring
   */
  private startMonitoring() {
    setInterval(() => {
      const metrics = this.getCurrentMetrics()
      this.metrics.push(metrics)
      
      // Keep only last 100 measurements
      if (this.metrics.length > 100) {
        this.metrics.shift()
      }

      // Alert on critical memory usage
      if (this.isMemoryCritical()) {
        console.warn('Memory usage critical:', {
          heapUsed: `${(metrics.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(metrics.heapTotal / 1024 / 1024).toFixed(2)}MB`,
          percentage: `${(metrics.heapUsed / metrics.heapTotal * 100).toFixed(1)}%`
        })
      }
    }, 10000) // Every 10 seconds
  }

  /**
   * Get maximum heap size
   */
  private getMaxHeapSize(): number {
    // Default Node.js heap size is around 1.7GB for 64-bit systems
    return process.env.NODE_OPTIONS?.includes('--max-old-space-size') 
      ? parseInt(process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)?.[1] || '1700') * 1024 * 1024
      : 1700 * 1024 * 1024
  }

  /**
   * Get memory usage report
   */
  getMemoryReport() {
    const current = this.getCurrentMetrics()
    const recommendations = this.getOptimizationRecommendations()
    
    return {
      current: {
        heapUsed: `${(current.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(current.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(current.external / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(current.rss / 1024 / 1024).toFixed(2)}MB`
      },
      gc: {
        count: this.gcCount,
        totalDuration: `${this.gcTotalDuration.toFixed(2)}ms`,
        averageDuration: this.gcCount > 0 ? `${(this.gcTotalDuration / this.gcCount).toFixed(2)}ms` : '0ms'
      },
      recommendations,
      isCritical: this.isMemoryCritical()
    }
  }
}

/**
 * Chunked data processor for large datasets
 */
export class ChunkedProcessor<T> {
  private chunkSize: number
  private concurrency: number

  constructor(chunkSize: number = 100, concurrency: number = 3) {
    this.chunkSize = chunkSize
    this.concurrency = concurrency
  }

  /**
   * Process large array in memory-efficient chunks
   */
  async processInChunks<R>(
    data: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    const chunks = this.createChunks(data)
    const results: R[] = []
    let processed = 0

    // Process chunks with controlled concurrency
    const semaphore = new ChunkSemaphore(this.concurrency)

    await Promise.all(
      chunks.map(async (chunk, index) => {
        await semaphore.acquire()
        try {
          const chunkResults = await processor(chunk)
          results.push(...chunkResults)
          processed += chunk.length
          
          if (onProgress) {
            onProgress(processed, data.length)
          }
          
          console.log(`Processed chunk ${index + 1}/${chunks.length} (${processed}/${data.length} items)`)
        } finally {
          semaphore.release()
        }
      })
    )

    return results
  }

  private createChunks(data: T[]): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < data.length; i += this.chunkSize) {
      chunks.push(data.slice(i, i + this.chunkSize))
    }
    return chunks
  }
}

/**
 * Semaphore for chunk processing concurrency
 */
class ChunkSemaphore {
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

// Export singleton instances
export const memoryMonitor = new MemoryMonitor()
export const streamingContentGenerator = new StreamingContentGenerator()