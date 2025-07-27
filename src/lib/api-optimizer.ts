/**
 * API Response Optimization System
 * Implements compression, streaming, batching, and response optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import { Transform, Readable } from 'stream'
import { gzip, deflate } from 'zlib'
import { promisify } from 'util'

// API Configuration Types
interface CompressionConfig {
  threshold: number // Minimum response size to compress
  level: number // Compression level (1-9)
  algorithms: ('gzip' | 'deflate' | 'br')[]
}

interface StreamingConfig {
  chunkSize: number
  flushInterval: number
  enableServerSentEvents: boolean
}

interface BatchingConfig {
  maxBatchSize: number
  batchTimeout: number
  enableAutoBatching: boolean
}

/**
 * Advanced API response optimizer with compression and streaming
 */
export class APIOptimizer {
  private compressionConfig: CompressionConfig
  private streamingConfig: StreamingConfig
  private batchingConfig: BatchingConfig
  private responseCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()

  constructor() {
    this.compressionConfig = {
      threshold: 1024, // 1KB
      level: 6,
      algorithms: ['gzip', 'deflate']
    }
    
    this.streamingConfig = {
      chunkSize: 8192, // 8KB chunks
      flushInterval: 100, // 100ms
      enableServerSentEvents: true
    }
    
    this.batchingConfig = {
      maxBatchSize: 50,
      batchTimeout: 100,
      enableAutoBatching: true
    }
  }

  /**
   * Optimize response with compression and caching
   */
  async optimizeResponse(
    data: any,
    request: NextRequest,
    options: {
      cacheKey?: string
      cacheTTL?: number
      enableCompression?: boolean
      enableStreaming?: boolean
    } = {}
  ): Promise<NextResponse> {
    const startTime = Date.now()
    
    try {
      // Check cache first
      if (options.cacheKey) {
        const cached = this.getCachedResponse(options.cacheKey)
        if (cached) {
          return this.createOptimizedResponse(cached, request, { 
            ...options, 
            fromCache: true,
            processingTime: Date.now() - startTime
          })
        }
      }

      // Optimize data serialization
      const optimizedData = this.optimizeDataSerialization(data)
      
      // Cache response if specified
      if (options.cacheKey && options.cacheTTL) {
        this.setCachedResponse(options.cacheKey, optimizedData, options.cacheTTL)
      }

      return this.createOptimizedResponse(optimizedData, request, {
        ...options,
        processingTime: Date.now() - startTime
      })
    } catch (error) {
      console.error('Response optimization error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  /**
   * Create streaming response for large content
   */
  createStreamingResponse(
    dataStream: Readable,
    request: NextRequest,
    contentType: string = 'application/json'
  ): Response {
    const acceptsEncoding = request.headers.get('accept-encoding') || ''
    const shouldCompress = this.shouldCompress(acceptsEncoding, contentType)

    const headers = this.getOptimizedHeaders(contentType, shouldCompress)
    headers.set('Transfer-Encoding', 'chunked')
    
    if (this.streamingConfig.enableServerSentEvents && contentType.includes('text/plain')) {
      headers.set('Content-Type', 'text/event-stream')
      headers.set('Cache-Control', 'no-cache')
      headers.set('Connection', 'keep-alive')
    }

    let stream = dataStream
    
    // Add compression if needed
    if (shouldCompress) {
      stream = this.addCompressionStream(stream, acceptsEncoding)
    }

    // Add chunking and timing
    stream = this.addChunkingStream(stream)

    return new Response(stream as any, { headers })
  }

  /**
   * Batch multiple API requests for efficiency
   */
  async batchRequests<T>(
    requests: Array<() => Promise<T>>,
    options: {
      maxConcurrency?: number
      retryAttempts?: number
      timeout?: number
    } = {}
  ): Promise<Array<{ success: boolean; result?: T; error?: string }>> {
    const {
      maxConcurrency = 5,
      retryAttempts = 3,
      timeout = 30000
    } = options

    const semaphore = new BatchSemaphore(maxConcurrency)
    const results: Array<{ success: boolean; result?: T; error?: string }> = []

    await Promise.all(
      requests.map(async (request, index) => {
        await semaphore.acquire()
        try {
          const result = await this.executeWithRetry(request, retryAttempts, timeout)
          results[index] = { success: true, result }
        } catch (error) {
          results[index] = { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }
        } finally {
          semaphore.release()
        }
      })
    )

    return results
  }

  /**
   * Optimize JSON serialization for large objects
   */
  private optimizeDataSerialization(data: any): string {
    if (typeof data === 'string') return data
    
    // Use custom serialization for better performance
    return JSON.stringify(data, (key, value) => {
      // Remove null/undefined values to reduce size
      if (value === null || value === undefined) {
        return undefined
      }
      
      // Truncate very long strings in development
      if (typeof value === 'string' && value.length > 50000) {
        return value.substring(0, 50000) + '...[truncated]'
      }
      
      // Convert dates to ISO strings
      if (value instanceof Date) {
        return value.toISOString()
      }
      
      return value
    })
  }

  /**
   * Create optimized response with compression and headers
   */
  private async createOptimizedResponse(
    data: string | any,
    request: NextRequest,
    options: {
      enableCompression?: boolean
      fromCache?: boolean
      processingTime?: number
    } = {}
  ): Promise<NextResponse> {
    const serializedData = typeof data === 'string' ? data : this.optimizeDataSerialization(data)
    const acceptsEncoding = request.headers.get('accept-encoding') || ''
    
    // Determine if compression should be applied
    const shouldCompress = options.enableCompression !== false && 
      this.shouldCompress(acceptsEncoding, 'application/json') &&
      serializedData.length > this.compressionConfig.threshold

    let responseData = serializedData
    let encoding: string | undefined

    // Apply compression
    if (shouldCompress) {
      const compressionResult = await this.compressData(serializedData, acceptsEncoding)
      responseData = compressionResult.data
      encoding = compressionResult.encoding
    }

    // Create headers
    const headers = this.getOptimizedHeaders('application/json', shouldCompress, encoding)
    
    // Add performance headers
    if (options.processingTime) {
      headers.set('X-Processing-Time', `${options.processingTime}ms`)
    }
    
    if (options.fromCache) {
      headers.set('X-Cache', 'HIT')
    } else {
      headers.set('X-Cache', 'MISS')
    }

    // Add content length
    headers.set('Content-Length', Buffer.byteLength(responseData).toString())

    return new NextResponse(responseData, { headers })
  }

  /**
   * Compress data using the best available algorithm
   */
  private async compressData(data: string, acceptsEncoding: string): Promise<{
    data: string
    encoding: string
  }> {
    const gzipAsync = promisify(gzip)
    const deflateAsync = promisify(deflate)

    try {
      if (acceptsEncoding.includes('gzip')) {
        const compressed = await gzipAsync(data, { level: this.compressionConfig.level })
        return { data: compressed.toString('binary'), encoding: 'gzip' }
      } else if (acceptsEncoding.includes('deflate')) {
        const compressed = await deflateAsync(data, { level: this.compressionConfig.level })
        return { data: compressed.toString('binary'), encoding: 'deflate' }
      }
    } catch (error) {
      console.warn('Compression failed, returning uncompressed:', error)
    }

    return { data, encoding: 'identity' }
  }

  /**
   * Get optimized headers for response
   */
  private getOptimizedHeaders(
    contentType: string,
    isCompressed: boolean = false,
    encoding?: string
  ): Headers {
    const headers = new Headers()
    
    headers.set('Content-Type', contentType)
    headers.set('X-Powered-By', 'TASC-Agent-Optimized')
    
    if (isCompressed && encoding && encoding !== 'identity') {
      headers.set('Content-Encoding', encoding)
      headers.set('Vary', 'Accept-Encoding')
    }

    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'DENY')
    headers.set('X-XSS-Protection', '1; mode=block')
    
    // Performance headers
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
    headers.set('ETag', this.generateETag())
    
    return headers
  }

  /**
   * Check if response should be compressed
   */
  private shouldCompress(acceptsEncoding: string, contentType: string): boolean {
    // Don't compress already compressed content
    if (contentType.includes('image/') || contentType.includes('video/')) {
      return false
    }
    
    // Check if client accepts compression
    return this.compressionConfig.algorithms.some(alg => acceptsEncoding.includes(alg))
  }

  /**
   * Add compression stream to data stream
   */
  private addCompressionStream(stream: Readable, acceptsEncoding: string): Readable {
    if (acceptsEncoding.includes('gzip')) {
      return stream.pipe(require('zlib').createGzip({ level: this.compressionConfig.level }))
    } else if (acceptsEncoding.includes('deflate')) {
      return stream.pipe(require('zlib').createDeflate({ level: this.compressionConfig.level }))
    }
    return stream
  }

  /**
   * Add chunking stream for better streaming performance
   */
  private addChunkingStream(stream: Readable): Transform {
    let buffer = ''
    let lastFlush = Date.now()

    return new Transform({
      transform(chunk, encoding, callback) {
        buffer += chunk.toString()
        
        // Flush based on size or time
        if (buffer.length >= 8192 || Date.now() - lastFlush >= 100) {
          this.push(buffer)
          buffer = ''
          lastFlush = Date.now()
        }
        
        callback()
      },
      
      flush(callback) {
        if (buffer.length > 0) {
          this.push(buffer)
        }
        callback()
      }
    })
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    request: () => Promise<T>,
    retryAttempts: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        })

        return await Promise.race([request(), timeoutPromise])
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt < retryAttempts) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  /**
   * Cache management
   */
  private getCachedResponse(key: string): any | null {
    const cached = this.responseCache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    
    if (cached) {
      this.responseCache.delete(key)
    }
    
    return null
  }

  private setCachedResponse(key: string, data: any, ttl: number): void {
    this.responseCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
    
    // Cleanup old entries periodically
    if (this.responseCache.size > 1000) {
      this.cleanupCache()
    }
  }

  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.responseCache.delete(key)
      }
    }
  }

  /**
   * Generate ETag for caching
   */
  private generateETag(): string {
    return `"${Date.now().toString(36)}-${Math.random().toString(36).substr(2)}"`
  }

  /**
   * Get API performance metrics
   */
  getPerformanceMetrics() {
    return {
      cacheSize: this.responseCache.size,
      cacheHitRate: 0, // Would track in real implementation
      averageResponseTime: 0, // Would track in real implementation
      compressionRatio: 0, // Would track in real implementation
      configuration: {
        compression: this.compressionConfig,
        streaming: this.streamingConfig,
        batching: this.batchingConfig
      }
    }
  }
}

/**
 * Semaphore for batch request concurrency control
 */
class BatchSemaphore {
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

/**
 * Streaming response helper for Server-Sent Events
 */
export class SSEStream {
  private encoder = new TextEncoder()

  /**
   * Create SSE stream for real-time updates
   */
  static create(): ReadableStream {
    let controller: ReadableStreamDefaultController<Uint8Array>

    return new ReadableStream({
      start(ctrl) {
        controller = ctrl
      },
      cancel() {
        // Cleanup when stream is cancelled
      }
    })
  }

  /**
   * Send SSE event
   */
  static sendEvent(
    controller: ReadableStreamDefaultController<Uint8Array>,
    data: any,
    event?: string,
    id?: string
  ): void {
    const encoder = new TextEncoder()
    let message = ''

    if (event) {
      message += `event: ${event}\n`
    }
    
    if (id) {
      message += `id: ${id}\n`
    }
    
    message += `data: ${JSON.stringify(data)}\n\n`
    
    controller.enqueue(encoder.encode(message))
  }
}

// Export singleton instance
export const apiOptimizer = new APIOptimizer()

// Export utility functions
export const optimizeAPIResponse = apiOptimizer.optimizeResponse.bind(apiOptimizer)
export const createStreamingResponse = apiOptimizer.createStreamingResponse.bind(apiOptimizer)
export const batchAPIRequests = apiOptimizer.batchRequests.bind(apiOptimizer)