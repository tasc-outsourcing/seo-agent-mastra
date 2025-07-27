/**
 * Real-time Performance Monitoring System
 * Comprehensive metrics collection and analysis for optimization
 */

import { agentActivityLogger } from './agent-activity-logger';
import { performanceCache } from './performance-cache';

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    usage: number;
    heapUsed: number;
    heapTotal: number;
  };
  database: {
    connectionCount: number;
    averageQueryTime: number;
    slowQueries: number;
    errors: number;
  };
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    activeSessions: number;
  };
  cache: {
    hitRate: number;
    size: number;
    evictions: number;
  };
  workflows: {
    activeWorkflows: number;
    averageExecutionTime: number;
    successRate: number;
    queueSize: number;
  };
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'cpu' | 'memory' | 'database' | 'api' | 'cache' | 'workflow';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  autoResolved: boolean;
}

export interface PerformanceThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  database: { responseTime: number; errorRate: number };
  api: { responseTime: number; errorRate: number };
  cache: { hitRate: number };
  workflow: { executionTime: number; errorRate: number };
}

class PerformanceMonitor {
  private metrics: SystemMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds: PerformanceThresholds;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = [];

  constructor() {
    this.thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      database: { responseTime: 1000, errorRate: 5 },
      api: { responseTime: 2000, errorRate: 10 },
      cache: { hitRate: 70 },
      workflow: { executionTime: 300000, errorRate: 15 }, // 5 minutes
    };
  }

  /**
   * Start performance monitoring
   */
  start(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log('Performance monitoring already started');
      return;
    }

    console.log('🔍 Starting performance monitoring...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.analyzeMetrics();
      } catch (error) {
        console.error('Error in performance monitoring:', error);
      }
    }, intervalMs);

    // Initial metrics collection
    this.collectMetrics();
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;

    console.log('⏹️ Stopping performance monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Collect current system metrics
   */
  async collectMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();
    
    const metrics: SystemMetrics = {
      timestamp,
      cpu: await this.getCPUMetrics(),
      memory: this.getMemoryMetrics(),
      database: await this.getDatabaseMetrics(),
      api: await this.getAPIMetrics(),
      cache: this.getCacheMetrics(),
      workflows: await this.getWorkflowMetrics(),
    };

    // Store metrics (keep last 1000 entries)
    this.metrics.push(metrics);
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    return metrics;
  }

  /**
   * Get current performance status
   */
  getCurrentStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: SystemMetrics | null;
    activeAlerts: PerformanceAlert[];
    trends: any;
  } {
    const latestMetrics = this.metrics[this.metrics.length - 1] || null;
    const activeAlerts = this.alerts.filter(alert => !alert.autoResolved);
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (activeAlerts.some(alert => alert.severity === 'critical')) {
      status = 'critical';
    } else if (activeAlerts.some(alert => alert.severity === 'high' || alert.severity === 'medium')) {
      status = 'warning';
    }

    return {
      status,
      metrics: latestMetrics,
      activeAlerts,
      trends: this.calculateTrends(),
    };
  }

  /**
   * Get performance history
   */
  getHistory(hours: number = 24): SystemMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const latest = this.metrics[this.metrics.length - 1];
    
    if (!latest) return recommendations;

    // CPU recommendations
    if (latest.cpu.usage > this.thresholds.cpu.warning) {
      recommendations.push('Consider reducing concurrent operations or optimizing CPU-intensive tasks');
    }

    // Memory recommendations
    if (latest.memory.usage > this.thresholds.memory.warning) {
      recommendations.push('Memory usage is high - consider implementing memory cleanup or increasing cache eviction');
    }

    // Database recommendations
    if (latest.database.averageQueryTime > this.thresholds.database.responseTime) {
      recommendations.push('Database queries are slow - consider adding indexes or query optimization');
    }

    // API recommendations
    if (latest.api.averageResponseTime > this.thresholds.api.responseTime) {
      recommendations.push('API response times are high - consider caching, request batching, or load balancing');
    }

    // Cache recommendations
    if (latest.cache.hitRate < this.thresholds.cache.hitRate) {
      recommendations.push('Cache hit rate is low - consider cache warming or TTL adjustments');
    }

    // Workflow recommendations
    if (latest.workflows.averageExecutionTime > this.thresholds.workflow.executionTime) {
      recommendations.push('Workflow execution is slow - consider parallel processing or task optimization');
    }

    return recommendations;
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Export performance data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportCSV();
    }
    
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      thresholds: this.thresholds,
      exportTime: new Date().toISOString(),
    }, null, 2);
  }

  private async getCPUMetrics(): Promise<{ usage: number; cores: number }> {
    // In a real environment, you'd use system monitoring libraries
    // For now, return mock data with some realistic fluctuation
    const usage = Math.random() * 30 + 20; // 20-50% usage
    const cores = typeof navigator !== 'undefined' 
      ? navigator.hardwareConcurrency || 4 
      : 4;
    
    return { usage, cores };
  }

  private getMemoryMetrics(): SystemMetrics['memory'] {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      return {
        used: memUsage.rss,
        total: memUsage.rss * 2, // Approximate
        usage: (memUsage.rss / (memUsage.rss * 2)) * 100,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
      };
    }

    // Fallback for client-side
    return {
      used: 50 * 1024 * 1024, // 50MB
      total: 200 * 1024 * 1024, // 200MB
      usage: 25,
      heapUsed: 40 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
    };
  }

  private async getDatabaseMetrics(): Promise<SystemMetrics['database']> {
    // In production, integrate with your database monitoring
    return {
      connectionCount: Math.floor(Math.random() * 10) + 5,
      averageQueryTime: Math.random() * 500 + 100,
      slowQueries: Math.floor(Math.random() * 3),
      errors: Math.floor(Math.random() * 2),
    };
  }

  private async getAPIMetrics(): Promise<SystemMetrics['api']> {
    // Get activity logger metrics
    const activityMetrics = agentActivityLogger.getMetrics();
    
    return {
      requestsPerMinute: activityMetrics.totalHits + activityMetrics.totalMisses,
      averageResponseTime: activityMetrics.averageResponseTime || 0,
      errorRate: activityMetrics.totalMisses > 0 
        ? (activityMetrics.totalMisses / (activityMetrics.totalHits + activityMetrics.totalMisses)) * 100 
        : 0,
      activeSessions: Math.floor(Math.random() * 20) + 5,
    };
  }

  private getCacheMetrics(): SystemMetrics['cache'] {
    const cacheMetrics = performanceCache.getMetrics();
    
    return {
      hitRate: cacheMetrics.memoryHitRate * 100,
      size: cacheMetrics.cacheSize,
      evictions: cacheMetrics.evictions,
    };
  }

  private async getWorkflowMetrics(): Promise<SystemMetrics['workflows']> {
    // In production, integrate with workflow engine metrics
    return {
      activeWorkflows: Math.floor(Math.random() * 5),
      averageExecutionTime: Math.random() * 60000 + 30000, // 30-90 seconds
      successRate: Math.random() * 20 + 80, // 80-100%
      queueSize: Math.floor(Math.random() * 10),
    };
  }

  private async analyzeMetrics(): Promise<void> {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) return;

    // Check for threshold violations and create alerts
    await this.checkThresholds(latest);
    
    // Auto-resolve alerts if metrics improve
    await this.autoResolveAlerts(latest);
  }

  private async checkThresholds(metrics: SystemMetrics): Promise<void> {
    const checks = [
      {
        type: 'cpu' as const,
        metric: 'usage',
        value: metrics.cpu.usage,
        warning: this.thresholds.cpu.warning,
        critical: this.thresholds.cpu.critical,
      },
      {
        type: 'memory' as const,
        metric: 'usage',
        value: metrics.memory.usage,
        warning: this.thresholds.memory.warning,
        critical: this.thresholds.memory.critical,
      },
      {
        type: 'database' as const,
        metric: 'responseTime',
        value: metrics.database.averageQueryTime,
        warning: this.thresholds.database.responseTime * 0.8,
        critical: this.thresholds.database.responseTime,
      },
      {
        type: 'api' as const,
        metric: 'responseTime',
        value: metrics.api.averageResponseTime,
        warning: this.thresholds.api.responseTime * 0.8,
        critical: this.thresholds.api.responseTime,
      },
      {
        type: 'cache' as const,
        metric: 'hitRate',
        value: metrics.cache.hitRate,
        warning: this.thresholds.cache.hitRate,
        critical: this.thresholds.cache.hitRate * 0.5,
      },
    ];

    for (const check of checks) {
      let severity: PerformanceAlert['severity'] | null = null;
      let threshold = 0;

      if (check.metric === 'hitRate') {
        // For cache hit rate, lower is worse
        if (check.value < check.critical) {
          severity = 'critical';
          threshold = check.critical;
        } else if (check.value < check.warning) {
          severity = 'medium';
          threshold = check.warning;
        }
      } else {
        // For other metrics, higher is worse
        if (check.value > check.critical) {
          severity = 'critical';
          threshold = check.critical;
        } else if (check.value > check.warning) {
          severity = 'medium';
          threshold = check.warning;
        }
      }

      if (severity) {
        await this.createAlert(check.type, check.metric, check.value, threshold, severity);
      }
    }
  }

  private async createAlert(
    type: PerformanceAlert['type'],
    metric: string,
    value: number,
    threshold: number,
    severity: PerformanceAlert['severity']
  ): Promise<void> {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(alert => 
      alert.type === type && 
      alert.metric === metric && 
      !alert.autoResolved
    );

    if (existingAlert) return; // Don't create duplicate alerts

    const alert: PerformanceAlert = {
      id: `${type}-${metric}-${Date.now()}`,
      timestamp: Date.now(),
      severity,
      type,
      metric,
      value,
      threshold,
      message: this.generateAlertMessage(type, metric, value, threshold, severity),
      autoResolved: false,
    };

    this.alerts.push(alert);

    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });

    console.warn(`🚨 Performance Alert [${severity.toUpperCase()}]: ${alert.message}`);
  }

  private async autoResolveAlerts(metrics: SystemMetrics): Promise<void> {
    const activeAlerts = this.alerts.filter(alert => !alert.autoResolved);

    for (const alert of activeAlerts) {
      let shouldResolve = false;
      let currentValue = 0;

      switch (alert.type) {
        case 'cpu':
          currentValue = metrics.cpu.usage;
          shouldResolve = currentValue < alert.threshold * 0.9;
          break;
        case 'memory':
          currentValue = metrics.memory.usage;
          shouldResolve = currentValue < alert.threshold * 0.9;
          break;
        case 'database':
          if (alert.metric === 'responseTime') {
            currentValue = metrics.database.averageQueryTime;
            shouldResolve = currentValue < alert.threshold * 0.9;
          }
          break;
        case 'api':
          if (alert.metric === 'responseTime') {
            currentValue = metrics.api.averageResponseTime;
            shouldResolve = currentValue < alert.threshold * 0.9;
          }
          break;
        case 'cache':
          if (alert.metric === 'hitRate') {
            currentValue = metrics.cache.hitRate;
            shouldResolve = currentValue > alert.threshold * 1.1;
          }
          break;
      }

      if (shouldResolve) {
        alert.autoResolved = true;
        console.log(`✅ Performance Alert resolved: ${alert.message}`);
      }
    }
  }

  private generateAlertMessage(
    type: string,
    metric: string,
    value: number,
    threshold: number,
    severity: string
  ): string {
    const formattedValue = metric.includes('Time') 
      ? `${Math.round(value)}ms`
      : metric.includes('Rate') || metric.includes('usage')
      ? `${Math.round(value)}%`
      : Math.round(value).toString();

    const formattedThreshold = metric.includes('Time')
      ? `${threshold}ms`
      : metric.includes('Rate') || metric.includes('usage')
      ? `${threshold}%`
      : threshold.toString();

    return `${type.toUpperCase()} ${metric} is ${formattedValue} (threshold: ${formattedThreshold})`;
  }

  private calculateTrends(): any {
    if (this.metrics.length < 2) return {};

    const recent = this.metrics.slice(-10); // Last 10 measurements
    const older = this.metrics.slice(-20, -10); // Previous 10 measurements

    if (recent.length === 0 || older.length === 0) return {};

    const avgRecent = this.averageMetrics(recent);
    const avgOlder = this.averageMetrics(older);

    return {
      cpu: this.calculateTrend(avgOlder.cpu.usage, avgRecent.cpu.usage),
      memory: this.calculateTrend(avgOlder.memory.usage, avgRecent.memory.usage),
      database: this.calculateTrend(avgOlder.database.averageQueryTime, avgRecent.database.averageQueryTime),
      api: this.calculateTrend(avgOlder.api.averageResponseTime, avgRecent.api.averageResponseTime),
      cache: this.calculateTrend(avgOlder.cache.hitRate, avgRecent.cache.hitRate),
    };
  }

  private averageMetrics(metrics: SystemMetrics[]): SystemMetrics {
    const count = metrics.length;
    return metrics.reduce((acc, metric) => ({
      timestamp: metric.timestamp,
      cpu: {
        usage: acc.cpu.usage + metric.cpu.usage / count,
        cores: metric.cpu.cores,
      },
      memory: {
        used: acc.memory.used + metric.memory.used / count,
        total: metric.memory.total,
        usage: acc.memory.usage + metric.memory.usage / count,
        heapUsed: acc.memory.heapUsed + metric.memory.heapUsed / count,
        heapTotal: metric.memory.heapTotal,
      },
      database: {
        connectionCount: acc.database.connectionCount + metric.database.connectionCount / count,
        averageQueryTime: acc.database.averageQueryTime + metric.database.averageQueryTime / count,
        slowQueries: acc.database.slowQueries + metric.database.slowQueries / count,
        errors: acc.database.errors + metric.database.errors / count,
      },
      api: {
        requestsPerMinute: acc.api.requestsPerMinute + metric.api.requestsPerMinute / count,
        averageResponseTime: acc.api.averageResponseTime + metric.api.averageResponseTime / count,
        errorRate: acc.api.errorRate + metric.api.errorRate / count,
        activeSessions: acc.api.activeSessions + metric.api.activeSessions / count,
      },
      cache: {
        hitRate: acc.cache.hitRate + metric.cache.hitRate / count,
        size: acc.cache.size + metric.cache.size / count,
        evictions: acc.cache.evictions + metric.cache.evictions / count,
      },
      workflows: {
        activeWorkflows: acc.workflows.activeWorkflows + metric.workflows.activeWorkflows / count,
        averageExecutionTime: acc.workflows.averageExecutionTime + metric.workflows.averageExecutionTime / count,
        successRate: acc.workflows.successRate + metric.workflows.successRate / count,
        queueSize: acc.workflows.queueSize + metric.workflows.queueSize / count,
      },
    }), {
      timestamp: 0,
      cpu: { usage: 0, cores: 0 },
      memory: { used: 0, total: 0, usage: 0, heapUsed: 0, heapTotal: 0 },
      database: { connectionCount: 0, averageQueryTime: 0, slowQueries: 0, errors: 0 },
      api: { requestsPerMinute: 0, averageResponseTime: 0, errorRate: 0, activeSessions: 0 },
      cache: { hitRate: 0, size: 0, evictions: 0 },
      workflows: { activeWorkflows: 0, averageExecutionTime: 0, successRate: 0, queueSize: 0 },
    });
  }

  private calculateTrend(oldValue: number, newValue: number): string {
    const change = ((newValue - oldValue) / oldValue) * 100;
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  private exportCSV(): string {
    const headers = [
      'timestamp', 'cpu_usage', 'memory_usage', 'db_query_time', 
      'api_response_time', 'cache_hit_rate', 'workflow_execution_time'
    ];
    
    const rows = this.metrics.map(metric => [
      new Date(metric.timestamp).toISOString(),
      metric.cpu.usage.toFixed(2),
      metric.memory.usage.toFixed(2),
      metric.database.averageQueryTime.toFixed(2),
      metric.api.averageResponseTime.toFixed(2),
      metric.cache.hitRate.toFixed(2),
      metric.workflows.averageExecutionTime.toFixed(2),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring if in production
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  performanceMonitor.start(60000); // 1 minute intervals in production
} else if (typeof process !== 'undefined' && process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
  performanceMonitor.start(30000); // 30 second intervals in development
}