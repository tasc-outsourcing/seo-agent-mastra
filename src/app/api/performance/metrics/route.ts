import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { performanceMonitor } from '@/lib/performance-monitor'
import { performanceCache } from '@/lib/performance-cache'
import { memoryMonitor } from '@/lib/memory-optimizer'
import { databaseOptimizer } from '@/lib/database-optimizer'
import { apiOptimizer } from '@/lib/api-optimizer'
import { securityHeaders, auditLogger } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      auditLogger.log({ type: 'auth_failure', details: { route: 'performance-metrics' } })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders })
    }

    // Get current performance status
    const performanceStatus = performanceMonitor.getCurrentStatus()
    
    // Get detailed metrics from all performance components
    const metrics = {
      system: {
        status: performanceStatus.status,
        timestamp: Date.now(),
        metrics: performanceStatus.metrics,
        activeAlerts: performanceStatus.activeAlerts,
        trends: performanceStatus.trends,
      },
      cache: {
        metrics: performanceCache.getMetrics(),
        recommendations: performanceCache.getMetrics().memoryHitRate < 0.7 
          ? ['Consider increasing cache size or TTL']
          : ['Cache performance is optimal']
      },
      memory: {
        report: memoryMonitor.getMemoryReport(),
        recommendations: memoryMonitor.getOptimizationRecommendations(),
        isCritical: memoryMonitor.isMemoryCritical()
      },
      database: {
        metrics: databaseOptimizer.getMetrics(),
        connectionStats: {
          activeConnections: databaseOptimizer.getMetrics().activeConnections,
          poolUtilization: databaseOptimizer.getMetrics().poolUtilization
        }
      },
      api: {
        metrics: apiOptimizer.getPerformanceMetrics(),
        configuration: apiOptimizer.getPerformanceMetrics().configuration
      },
      recommendations: {
        overall: performanceMonitor.getRecommendations(),
        priority: performanceStatus.status === 'critical' ? 'high' : 
                 performanceStatus.status === 'warning' ? 'medium' : 'low'
      }
    }

    // Log metrics access for audit
    auditLogger.log({
      type: 'metrics_access',
      userId,
      details: { 
        route: 'performance-metrics',
        systemStatus: performanceStatus.status,
        alertCount: performanceStatus.activeAlerts.length
      }
    })

    return await apiOptimizer.optimizeResponse(metrics, request, {
      enableCompression: true,
      cacheTTL: 30000 // 30 seconds cache for metrics
    })

  } catch (error) {
    console.error('Performance metrics API error:', error)
    auditLogger.log({
      type: 'api_error',
      details: { route: 'performance-metrics', error: error instanceof Error ? error.message : 'Unknown error' }
    })
    
    return NextResponse.json({ 
      error: 'Failed to retrieve performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: securityHeaders })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders })
    }

    const body = await request.json()
    const { action } = body

    let result: any = {}

    switch (action) {
      case 'optimize':
        // Trigger system optimization
        const memoryOptimization = await memoryMonitor.optimizeMemory()
        await performanceCache.optimize()
        await databaseOptimizer.optimize()
        
        result = {
          action: 'optimize',
          memory: memoryOptimization,
          message: 'System optimization completed'
        }
        break

      case 'clear-cache':
        // Clear performance caches
        await performanceCache.clear()
        databaseOptimizer.clearCache()
        
        result = {
          action: 'clear-cache',
          message: 'All caches cleared successfully'
        }
        break

      case 'collect-metrics':
        // Force metrics collection
        const currentMetrics = await performanceMonitor.collectMetrics()
        
        result = {
          action: 'collect-metrics',
          metrics: currentMetrics,
          message: 'Metrics collection completed'
        }
        break

      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          allowedActions: ['optimize', 'clear-cache', 'collect-metrics']
        }, { status: 400, headers: securityHeaders })
    }

    auditLogger.log({
      type: 'performance_action',
      userId,
      details: { action, route: 'performance-metrics' }
    })

    return await apiOptimizer.optimizeResponse(result, request, {
      enableCompression: true
    })

  } catch (error) {
    console.error('Performance action API error:', error)
    return NextResponse.json({ 
      error: 'Failed to execute performance action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: securityHeaders })
  }
}