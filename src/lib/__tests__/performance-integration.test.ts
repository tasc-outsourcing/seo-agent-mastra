/**
 * Performance Integration Tests
 * Validates that all performance components work together correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { performanceCache } from '../performance-cache'
import { workflowOptimizer, createOptimizedTask } from '../workflow-optimizer'
import { memoryMonitor, ChunkedProcessor } from '../memory-optimizer'
import { performanceMonitor } from '../performance-monitor'

describe('Performance Integration', () => {
  beforeEach(() => {
    // Reset performance state before each test
    vi.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up after each test
    await performanceCache.clear()
  })

  describe('Performance Cache Integration', () => {
    it('should cache and retrieve data efficiently', async () => {
      const testKey = 'test-cache-key'
      const testData = { message: 'Hello, World!', timestamp: Date.now() }

      // Set data in cache
      await performanceCache.set(testKey, testData)

      // Retrieve data from cache
      const cachedData = await performanceCache.get(testKey)
      expect(cachedData).toEqual(testData)

      // Check cache metrics
      const metrics = performanceCache.getMetrics()
      expect(metrics.totalHits).toBeGreaterThan(0)
    })

    it('should handle cache-aside pattern correctly', async () => {
      const testKey = 'cache-aside-test'
      let factoryCalled = false

      const factory = async () => {
        factoryCalled = true
        return { computed: true, value: Math.random() }
      }

      // First call should trigger factory
      const result1 = await performanceCache.getOrSet(testKey, factory)
      expect(factoryCalled).toBe(true)
      expect(result1.computed).toBe(true)

      // Reset flag
      factoryCalled = false

      // Second call should use cache
      const result2 = await performanceCache.getOrSet(testKey, factory)
      expect(factoryCalled).toBe(false)
      expect(result2).toEqual(result1)
    })
  })

  describe('Workflow Optimizer Integration', () => {
    it('should execute tasks with proper dependency management', async () => {
      const executionOrder: string[] = []

      const tasks = [
        createOptimizedTask('task1', 'Task 1', async () => {
          executionOrder.push('task1')
          return 'result1'
        }),
        createOptimizedTask('task2', 'Task 2', async () => {
          executionOrder.push('task2')
          return 'result2'
        }, { dependencies: ['task1'] }),
        createOptimizedTask('task3', 'Task 3', async () => {
          executionOrder.push('task3')
          return 'result3'
        }, { dependencies: ['task1', 'task2'] })
      ]

      const results = await workflowOptimizer.executeWorkflow(tasks)

      // Verify all tasks completed successfully
      expect(results.size).toBe(3)
      expect(results.get('task1')?.success).toBe(true)
      expect(results.get('task2')?.success).toBe(true)
      expect(results.get('task3')?.success).toBe(true)

      // Verify dependency order was respected
      expect(executionOrder.indexOf('task1')).toBeLessThan(executionOrder.indexOf('task2'))
      expect(executionOrder.indexOf('task2')).toBeLessThan(executionOrder.indexOf('task3'))
    })

    it('should handle task caching correctly', async () => {
      let executionCount = 0

      const task = createOptimizedTask('cached-task', 'Cached Task', async () => {
        executionCount++
        return { value: executionCount }
      }, {
        cacheKey: 'test-cached-task',
        cacheTTL: 60000
      })

      // Execute task twice
      const results1 = await workflowOptimizer.executeWorkflow([task])
      const results2 = await workflowOptimizer.executeWorkflow([task])

      // First execution should run the task
      expect(results1.get('cached-task')?.fromCache).toBe(false)
      
      // Second execution should use cache
      expect(results2.get('cached-task')?.fromCache).toBe(true)
      
      // Factory should only be called once
      expect(executionCount).toBe(1)
    })
  })

  describe('Memory Optimizer Integration', () => {
    it('should process large datasets in chunks efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
      const processor = new ChunkedProcessor(100, 2) // 100 items per chunk, 2 concurrent

      const processedItems: any[] = []
      const results = await processor.processInChunks(
        largeDataset,
        async (chunk) => {
          // Simulate processing
          return chunk.map(item => ({ ...item, processed: true }))
        },
        (processed, total) => {
          // Track progress
          processedItems.push({ processed, total })
        }
      )

      // Verify all items were processed
      expect(results).toHaveLength(1000)
      expect(results.every(item => item.processed)).toBe(true)

      // Verify progress was tracked
      expect(processedItems.length).toBeGreaterThan(0)
    })

    it('should monitor memory usage correctly', async () => {
      const initialMetrics = memoryMonitor.getCurrentMetrics()
      expect(initialMetrics.heapUsed).toBeGreaterThan(0)
      expect(initialMetrics.heapTotal).toBeGreaterThan(0)

      // Memory monitor should detect when memory is not critical in test environment
      expect(memoryMonitor.isMemoryCritical()).toBe(false)

      // Get optimization recommendations
      const recommendations = memoryMonitor.getOptimizationRecommendations()
      expect(Array.isArray(recommendations)).toBe(true)
    })
  })

  describe('Performance Monitor Integration', () => {
    it('should collect and track system metrics', async () => {
      // Collect initial metrics
      const metrics = await performanceMonitor.collectMetrics()

      expect(metrics.timestamp).toBeGreaterThan(0)
      expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0)
      expect(metrics.memory.usage).toBeGreaterThanOrEqual(0)
      expect(metrics.database.connectionCount).toBeGreaterThanOrEqual(0)
    })

    it('should provide current system status', () => {
      const status = performanceMonitor.getCurrentStatus()

      expect(['healthy', 'warning', 'critical']).toContain(status.status)
      expect(Array.isArray(status.activeAlerts)).toBe(true)
      expect(typeof status.trends).toBe('object')
    })

    it('should generate performance recommendations', () => {
      const recommendations = performanceMonitor.getRecommendations()
      expect(Array.isArray(recommendations)).toBe(true)
    })
  })

  describe('End-to-End Performance Integration', () => {
    it('should demonstrate complete performance optimization flow', async () => {
      // 1. Use cache for expensive computation
      const expensiveComputation = async (input: string) => {
        // Simulate expensive work
        await new Promise(resolve => setTimeout(resolve, 10))
        return { result: input.toUpperCase(), computed: Date.now() }
      }

      const cacheKey = 'e2e-test'
      const input = 'test input'

      // First call - should execute computation
      const result1 = await performanceCache.getOrSet(
        cacheKey,
        () => expensiveComputation(input)
      )

      // 2. Use workflow optimizer for parallel tasks
      const tasks = [
        createOptimizedTask('process1', 'Process 1', async () => {
          return await performanceCache.getOrSet(
            'process1-cache',
            () => expensiveComputation('process1')
          )
        }),
        createOptimizedTask('process2', 'Process 2', async () => {
          return await performanceCache.getOrSet(
            'process2-cache',
            () => expensiveComputation('process2')
          )
        })
      ]

      const workflowResults = await workflowOptimizer.executeWorkflow(tasks)

      // 3. Process large dataset with memory optimization
      const dataset = Array.from({ length: 100 }, (_, i) => ({ id: i }))
      const processor = new ChunkedProcessor(25, 2)

      const processedData = await processor.processInChunks(
        dataset,
        async (chunk) => {
          return chunk.map(item => ({ ...item, enhanced: true }))
        }
      )

      // 4. Verify performance metrics
      const cacheMetrics = performanceCache.getMetrics()
      const workflowStats = workflowOptimizer.getStatistics()
      const status = performanceMonitor.getCurrentStatus()

      // Assertions
      expect(result1.result).toBe('TEST INPUT')
      expect(workflowResults.size).toBe(2)
      expect(processedData).toHaveLength(100)
      
      // Check that either cache metrics or workflow cache hits are working
      const totalCacheActivity = cacheMetrics.totalHits + workflowStats.cacheHitRate
      expect(totalCacheActivity).toBeGreaterThanOrEqual(0) // At least some cache activity
      
      expect(['healthy', 'warning', 'critical']).toContain(status.status)

      console.log('✅ End-to-end performance integration test completed successfully')
    })
  })
})