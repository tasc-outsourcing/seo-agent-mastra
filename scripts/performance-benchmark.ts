#!/usr/bin/env tsx
/**
 * Performance Benchmarking Script
 * Validates the performance improvements from optimization components
 */

import { performance } from 'perf_hooks'
import { performanceCache } from '../src/lib/performance-cache'
import { workflowOptimizer, createOptimizedTask } from '../src/lib/workflow-optimizer'
import { memoryMonitor, ChunkedProcessor } from '../src/lib/memory-optimizer'
import { databaseOptimizer } from '../src/lib/database-optimizer'

interface BenchmarkResult {
  testName: string
  baselineTime: number
  optimizedTime: number
  improvement: number
  improvementPercent: number
  memoryUsage: {
    baseline: number
    optimized: number
    improvement: number
  }
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = []

  async runAllBenchmarks(): Promise<void> {
    console.log('🚀 Starting Performance Benchmarks...\n')

    await this.benchmarkCaching()
    await this.benchmarkWorkflowOptimization()
    await this.benchmarkMemoryOptimization()
    await this.benchmarkDatabaseOptimization()

    this.generateReport()
  }

  /**
   * Benchmark caching performance
   */
  async benchmarkCaching(): Promise<void> {
    console.log('📊 Benchmarking Cache Performance...')

    const testData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      data: `Test data ${i}`.repeat(100),
      timestamp: Date.now()
    }))

    // Baseline: Direct computation without caching
    const baselineStart = performance.now()
    const baselineMemoryStart = process.memoryUsage().heapUsed

    for (let i = 0; i < 100; i++) {
      // Simulate expensive computation
      const result = testData.map(item => {
        return {
          ...item,
          processed: item.data.toUpperCase(),
          hash: this.simpleHash(item.data)
        }
      })
    }

    const baselineTime = performance.now() - baselineStart
    const baselineMemoryEnd = process.memoryUsage().heapUsed

    // Optimized: With caching
    const optimizedStart = performance.now()
    const optimizedMemoryStart = process.memoryUsage().heapUsed

    for (let i = 0; i < 100; i++) {
      const cacheKey = `benchmark_data_${i % 10}` // 10 different cache keys
      
      await performanceCache.getOrSet(
        cacheKey,
        async () => {
          return testData.map(item => ({
            ...item,
            processed: item.data.toUpperCase(),
            hash: this.simpleHash(item.data)
          }))
        },
        { ttl: 60000 }
      )
    }

    const optimizedTime = performance.now() - optimizedStart
    const optimizedMemoryEnd = process.memoryUsage().heapUsed

    this.addResult('Cache Performance', baselineTime, optimizedTime, {
      baseline: baselineMemoryEnd - baselineMemoryStart,
      optimized: optimizedMemoryEnd - optimizedMemoryStart
    })
  }

  /**
   * Benchmark workflow optimization
   */
  async benchmarkWorkflowOptimization(): Promise<void> {
    console.log('⚡ Benchmarking Workflow Optimization...')

    const tasks = Array.from({ length: 20 }, (_, i) => ({
      id: `task-${i}`,
      name: `Task ${i}`,
      execute: async () => {
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
        return `Result ${i}`
      },
      dependencies: i > 0 ? [`task-${Math.floor(i / 2)}`] : []
    }))

    // Baseline: Sequential execution
    const baselineStart = performance.now()
    const baselineMemoryStart = process.memoryUsage().heapUsed

    const baselineResults = []
    for (const task of tasks) {
      const result = await task.execute()
      baselineResults.push(result)
    }

    const baselineTime = performance.now() - baselineStart
    const baselineMemoryEnd = process.memoryUsage().heapUsed

    // Optimized: Parallel workflow execution
    const optimizedStart = performance.now()
    const optimizedMemoryStart = process.memoryUsage().heapUsed

    const optimizedTasks = tasks.map(task => createOptimizedTask(
      task.id,
      task.name,
      task.execute,
      { dependencies: task.dependencies }
    ))

    await workflowOptimizer.executeWorkflow(optimizedTasks)

    const optimizedTime = performance.now() - optimizedStart
    const optimizedMemoryEnd = process.memoryUsage().heapUsed

    this.addResult('Workflow Optimization', baselineTime, optimizedTime, {
      baseline: baselineMemoryEnd - baselineMemoryStart,
      optimized: optimizedMemoryEnd - optimizedMemoryStart
    })
  }

  /**
   * Benchmark memory optimization
   */
  async benchmarkMemoryOptimization(): Promise<void> {
    console.log('🧠 Benchmarking Memory Optimization...')

    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      content: `Content ${i}`.repeat(50),
      metadata: { created: Date.now(), version: 1 }
    }))

    // Baseline: Process all data at once
    const baselineStart = performance.now()
    const baselineMemoryStart = process.memoryUsage().heapUsed

    const baselineResults = largeDataset.map(item => {
      return {
        ...item,
        processed: item.content.split(' ').length,
        normalized: item.content.toLowerCase()
      }
    })

    const baselineTime = performance.now() - baselineStart
    const baselineMemoryPeak = process.memoryUsage().heapUsed

    // Optimized: Chunked processing
    const optimizedStart = performance.now()
    const optimizedMemoryStart = process.memoryUsage().heapUsed

    const processor = new ChunkedProcessor(500, 3) // 500 items per chunk, 3 concurrent
    const optimizedResults = await processor.processInChunks(
      largeDataset,
      async (chunk) => {
        return chunk.map(item => ({
          ...item,
          processed: item.content.split(' ').length,
          normalized: item.content.toLowerCase()
        }))
      }
    )

    const optimizedTime = performance.now() - optimizedStart
    const optimizedMemoryPeak = process.memoryUsage().heapUsed

    this.addResult('Memory Optimization', baselineTime, optimizedTime, {
      baseline: baselineMemoryPeak - baselineMemoryStart,
      optimized: optimizedMemoryPeak - optimizedMemoryStart
    })
  }

  /**
   * Benchmark database optimization
   */
  async benchmarkDatabaseOptimization(): Promise<void> {
    console.log('🗄️ Benchmarking Database Optimization...')

    const queries = Array.from({ length: 100 }, (_, i) => ({
      sql: `SELECT * FROM test_table WHERE id = ?`,
      params: [i % 10] // Simulate 10 different queries
    }))

    // Baseline: Direct queries without optimization
    const baselineStart = performance.now()
    const baselineMemoryStart = process.memoryUsage().heapUsed

    for (const query of queries) {
      // Simulate database query
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
    }

    const baselineTime = performance.now() - baselineStart
    const baselineMemoryEnd = process.memoryUsage().heapUsed

    // Optimized: With connection pooling and caching
    const optimizedStart = performance.now()
    const optimizedMemoryStart = process.memoryUsage().heapUsed

    for (const query of queries) {
      await databaseOptimizer.query(query.sql, query.params, {
        cache: true,
        cacheTTL: 60000
      })
    }

    const optimizedTime = performance.now() - optimizedStart
    const optimizedMemoryEnd = process.memoryUsage().heapUsed

    this.addResult('Database Optimization', baselineTime, optimizedTime, {
      baseline: baselineMemoryEnd - baselineMemoryStart,
      optimized: optimizedMemoryEnd - optimizedMemoryStart
    })
  }

  private addResult(
    testName: string, 
    baselineTime: number, 
    optimizedTime: number,
    memory: { baseline: number; optimized: number }
  ): void {
    const improvement = baselineTime - optimizedTime
    const improvementPercent = (improvement / baselineTime) * 100
    const memoryImprovement = memory.baseline - memory.optimized

    this.results.push({
      testName,
      baselineTime,
      optimizedTime,
      improvement,
      improvementPercent,
      memoryUsage: {
        baseline: memory.baseline,
        optimized: memory.optimized,
        improvement: memoryImprovement
      }
    })

    console.log(`✅ ${testName}: ${improvementPercent.toFixed(1)}% improvement`)
  }

  private generateReport(): void {
    console.log('\n📈 Performance Benchmark Report')
    console.log('='.repeat(60))

    let totalImprovement = 0
    let totalTests = 0

    this.results.forEach(result => {
      console.log(`\n${result.testName}:`)
      console.log(`  Baseline Time:    ${result.baselineTime.toFixed(2)}ms`)
      console.log(`  Optimized Time:   ${result.optimizedTime.toFixed(2)}ms`)
      console.log(`  Improvement:      ${result.improvement.toFixed(2)}ms (${result.improvementPercent.toFixed(1)}%)`)
      console.log(`  Memory Baseline:  ${this.formatBytes(result.memoryUsage.baseline)}`)
      console.log(`  Memory Optimized: ${this.formatBytes(result.memoryUsage.optimized)}`)
      console.log(`  Memory Saved:     ${this.formatBytes(result.memoryUsage.improvement)}`)

      totalImprovement += result.improvementPercent
      totalTests++
    })

    console.log('\n' + '='.repeat(60))
    console.log(`📊 Overall Performance Improvement: ${(totalImprovement / totalTests).toFixed(1)}%`)
    
    // Performance targets check
    const averageImprovement = totalImprovement / totalTests
    if (averageImprovement >= 50) {
      console.log('🎉 EXCELLENT: Performance targets exceeded!')
    } else if (averageImprovement >= 30) {
      console.log('✅ GOOD: Performance targets met!')
    } else if (averageImprovement >= 15) {
      console.log('⚠️ FAIR: Some improvements, but targets not fully met')
    } else {
      console.log('❌ POOR: Performance improvements below expectations')
    }

    // Memory analysis
    const totalMemorySaved = this.results.reduce((sum, r) => sum + r.memoryUsage.improvement, 0)
    console.log(`💾 Total Memory Saved: ${this.formatBytes(totalMemorySaved)}`)

    console.log('\n📋 Recommendations:')
    this.results.forEach(result => {
      if (result.improvementPercent < 20) {
        console.log(`⚠️ ${result.testName}: Consider additional optimizations`)
      }
    })
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Run benchmarks if script is called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark()
  benchmark.runAllBenchmarks().catch(console.error)
}

export { PerformanceBenchmark }