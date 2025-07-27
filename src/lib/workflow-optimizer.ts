/**
 * Workflow Optimizer for Parallel Processing and Performance Enhancement
 * Optimizes Mastra workflow execution with intelligent task scheduling
 */

import { agentActivityLogger } from './agent-activity-logger';
import { performanceCache, createCacheKey } from './performance-cache';

export interface TaskConfig {
  id: string;
  name: string;
  execute: (...args: any[]) => Promise<any>;
  dependencies?: string[];
  priority?: number;
  timeout?: number;
  retries?: number;
  cacheKey?: string;
  cacheTTL?: number;
  tags?: string[];
}

export interface WorkflowConfig {
  maxConcurrency?: number;
  adaptiveConcurrency?: boolean;
  enableProgress?: boolean;
  enableCaching?: boolean;
  defaultTimeout?: number;
  defaultRetries?: number;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  fromCache: boolean;
}

export interface WorkflowProgress {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  currentTasks: string[];
  progress: number;
  estimatedCompletion?: number;
}

export class WorkflowOptimizer {
  private config: WorkflowConfig;
  private activeTasks: Map<string, Promise<any>> = new Map();
  private taskResults: Map<string, TaskResult> = new Map();
  private progressCallbacks: ((progress: WorkflowProgress) => void)[] = [];

  constructor(config: WorkflowConfig = {}) {
    this.config = {
      maxConcurrency: config.maxConcurrency || 5,
      adaptiveConcurrency: config.adaptiveConcurrency ?? true,
      enableProgress: config.enableProgress ?? true,
      enableCaching: config.enableCaching ?? true,
      defaultTimeout: config.defaultTimeout || 30000, // 30 seconds
      defaultRetries: config.defaultRetries || 2,
      ...config,
    };
  }

  /**
   * Execute workflow with optimized parallel processing
   */
  async executeWorkflow(
    tasks: TaskConfig[],
    context: any = {}
  ): Promise<Map<string, TaskResult>> {
    const workflowId = `workflow-${Date.now()}`;
    const activityId = await agentActivityLogger.startActivity(
      'WorkflowOptimizer',
      'Executing optimized workflow',
      { taskCount: tasks.length, context }
    );

    try {
      // Reset state
      this.activeTasks.clear();
      this.taskResults.clear();

      // Build dependency graph
      const dependencyGraph = this.buildDependencyGraph(tasks);
      const executionPlan = this.createExecutionPlan(dependencyGraph);

      console.log(`🚀 Starting optimized workflow with ${tasks.length} tasks`);
      
      if (this.config.enableProgress) {
        this.notifyProgress(tasks.length, 0, 0, []);
      }

      // Execute tasks in optimized order
      await this.executeTasks(executionPlan, context);

      await agentActivityLogger.completeActivity(activityId, {
        taskCount: tasks.length,
        completedTasks: Array.from(this.taskResults.values()).filter(r => r.success).length,
        failedTasks: Array.from(this.taskResults.values()).filter(r => !r.success).length,
        totalDuration: Array.from(this.taskResults.values()).reduce((sum, r) => sum + r.duration, 0),
      });

      console.log('✅ Workflow completed successfully');
      return new Map(this.taskResults);

    } catch (error) {
      await agentActivityLogger.completeActivity(
        activityId,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Execute a single optimized task with caching and retry logic
   */
  async executeTask(
    task: TaskConfig,
    context: any = {},
    dependencies: Map<string, any> = new Map()
  ): Promise<TaskResult> {
    const startTime = Date.now();
    const taskActivityId = await agentActivityLogger.startActivity(
      'TaskExecutor',
      `Executing task: ${task.name}`,
      { taskId: task.id, dependencies: Array.from(dependencies.keys()) }
    );

    try {
      // Check cache first if enabled
      if (this.config.enableCaching && task.cacheKey) {
        const cached = await performanceCache.get(task.cacheKey);
        if (cached) {
          const result: TaskResult = {
            taskId: task.id,
            success: true,
            result: cached,
            duration: Date.now() - startTime,
            fromCache: true,
          };
          
          await agentActivityLogger.completeActivity(taskActivityId, { fromCache: true });
          console.log(`💾 Task ${task.name} served from cache`);
          return result;
        }
      }

      // Execute task with retry logic
      let lastError: any;
      const maxRetries = task.retries ?? this.config.defaultRetries!;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`⚡ Executing task: ${task.name} (attempt ${attempt + 1})`);
          
          // Create enhanced context with dependencies
          const enhancedContext = {
            ...context,
            dependencies: Object.fromEntries(dependencies),
            attempt: attempt + 1,
            maxAttempts: maxRetries + 1,
          };

          // Execute with timeout
          const result = await this.executeWithTimeout(
            () => task.execute(enhancedContext),
            task.timeout ?? this.config.defaultTimeout!
          );

          // Cache result if applicable
          if (this.config.enableCaching && task.cacheKey && result) {
            await performanceCache.set(
              task.cacheKey,
              result,
              {
                ttl: task.cacheTTL || 300000, // 5 minutes default
                tags: task.tags || [task.id],
              }
            );
          }

          const taskResult: TaskResult = {
            taskId: task.id,
            success: true,
            result,
            duration: Date.now() - startTime,
            fromCache: false,
          };

          await agentActivityLogger.completeActivity(taskActivityId, {
            attempt: attempt + 1,
            result: typeof result === 'object' ? 'object' : result,
          });

          console.log(`✅ Task ${task.name} completed successfully`);
          return taskResult;

        } catch (error) {
          lastError = error;
          console.log(`❌ Task ${task.name} failed (attempt ${attempt + 1}):`, error);
          
          if (attempt < maxRetries) {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
            console.log(`⏳ Retrying task ${task.name} in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All retries failed
      const taskResult: TaskResult = {
        taskId: task.id,
        success: false,
        error: lastError instanceof Error ? lastError.message : String(lastError),
        duration: Date.now() - startTime,
        fromCache: false,
      };

      await agentActivityLogger.completeActivity(
        taskActivityId,
        undefined,
        taskResult.error
      );

      return taskResult;

    } catch (error) {
      const taskResult: TaskResult = {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        fromCache: false,
      };

      await agentActivityLogger.completeActivity(
        taskActivityId,
        undefined,
        taskResult.error
      );

      return taskResult;
    }
  }

  /**
   * Execute tasks in parallel with intelligent concurrency control
   */
  private async executeTasks(
    executionPlan: TaskConfig[][],
    context: any
  ): Promise<void> {
    const dependencyResults = new Map<string, any>();

    for (const batch of executionPlan) {
      console.log(`🔄 Executing batch with ${batch.length} tasks`);
      
      // Adjust concurrency based on system load if adaptive mode is enabled
      const concurrency = this.config.adaptiveConcurrency
        ? Math.min(this.config.maxConcurrency!, batch.length, this.getOptimalConcurrency())
        : Math.min(this.config.maxConcurrency!, batch.length);

      // Execute batch with controlled concurrency
      const batchResults = await this.executeBatchWithConcurrency(
        batch,
        context,
        dependencyResults,
        concurrency
      );

      // Process results and update dependencies
      batchResults.forEach((taskResult, index) => {
        const task = batch[index];
        this.taskResults.set(task.id, taskResult);
        
        if (taskResult.success) {
          dependencyResults.set(task.id, taskResult.result);
        }
      });

      // Update progress
      if (this.config.enableProgress) {
        const completed = Array.from(this.taskResults.values()).filter(r => r.success).length;
        const failed = Array.from(this.taskResults.values()).filter(r => !r.success).length;
        const currentTasks = Array.from(this.activeTasks.keys());
        
        this.notifyProgress(
          this.taskResults.size + this.activeTasks.size,
          completed,
          failed,
          currentTasks
        );
      }
    }
  }

  /**
   * Execute batch with controlled concurrency
   */
  private async executeBatchWithConcurrency(
    batch: TaskConfig[],
    context: any,
    dependencyResults: Map<string, any>,
    concurrency: number
  ): Promise<TaskResult[]> {
    const taskPromises: Promise<TaskResult>[] = [];

    // Create all task promises
    for (const task of batch) {
      // Get dependencies for this task
      const taskDependencies = new Map<string, any>();
      (task.dependencies || []).forEach(depId => {
        if (dependencyResults.has(depId)) {
          taskDependencies.set(depId, dependencyResults.get(depId));
        }
      });

      // Create task promise
      const taskPromise = this.executeTask(task, context, taskDependencies);
      this.activeTasks.set(task.id, taskPromise);
      taskPromises.push(taskPromise);
    }

    // Execute with concurrency control using semaphore-like approach
    const semaphore = new TaskSemaphore(concurrency);
    const results = await Promise.all(
      taskPromises.map(async (taskPromise) => {
        await semaphore.acquire();
        try {
          return await taskPromise;
        } finally {
          semaphore.release();
        }
      })
    );

    // Clear active tasks
    results.forEach(result => {
      this.activeTasks.delete(result.taskId);
    });

    return results;
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task timed out after ${timeout}ms`));
      }, timeout);

      fn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Build dependency graph from tasks
   */
  private buildDependencyGraph(tasks: TaskConfig[]): Map<string, TaskConfig> {
    const graph = new Map<string, TaskConfig>();
    
    tasks.forEach(task => {
      graph.set(task.id, task);
    });

    return graph;
  }

  /**
   * Create execution plan with topological sorting
   */
  private createExecutionPlan(graph: Map<string, TaskConfig>): TaskConfig[][] {
    const plan: TaskConfig[][] = [];
    const visited = new Set<string>();
    const inProgress = new Set<string>();

    // Find tasks with no dependencies for first batch
    const getReadyTasks = (): TaskConfig[] => {
      return Array.from(graph.values()).filter(task => {
        if (visited.has(task.id) || inProgress.has(task.id)) {
          return false;
        }
        
        return !task.dependencies || 
               task.dependencies.every(depId => visited.has(depId));
      });
    };

    while (visited.size < graph.size) {
      const readyTasks = getReadyTasks();
      
      if (readyTasks.length === 0) {
        throw new Error('Circular dependency detected in workflow');
      }

      // Sort by priority (higher priority first)
      readyTasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      plan.push(readyTasks);
      readyTasks.forEach(task => {
        visited.add(task.id);
      });
    }

    return plan;
  }

  /**
   * Get optimal concurrency based on system metrics
   */
  private getOptimalConcurrency(): number {
    // Basic heuristic - in production, this could use actual system metrics
    const cpuCount = typeof navigator !== 'undefined' 
      ? navigator.hardwareConcurrency || 4 
      : 4;
    
    return Math.max(2, Math.floor(cpuCount * 0.8));
  }

  /**
   * Register progress callback
   */
  onProgress(callback: (progress: WorkflowProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Notify progress to all callbacks
   */
  private notifyProgress(
    total: number,
    completed: number,
    failed: number,
    current: string[]
  ): void {
    const progress: WorkflowProgress = {
      totalTasks: total,
      completedTasks: completed,
      failedTasks: failed,
      currentTasks: current,
      progress: total > 0 ? (completed + failed) / total * 100 : 0,
      estimatedCompletion: this.estimateCompletion(total, completed, failed),
    };

    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }

  /**
   * Estimate workflow completion time
   */
  private estimateCompletion(total: number, completed: number, failed: number): number | undefined {
    if (completed === 0) return undefined;

    const completedTasks = Array.from(this.taskResults.values()).filter(r => r.success);
    if (completedTasks.length === 0) return undefined;

    const avgDuration = completedTasks.reduce((sum, r) => sum + r.duration, 0) / completedTasks.length;
    const remaining = total - completed - failed;
    
    return remaining > 0 ? Date.now() + (remaining * avgDuration) : Date.now();
  }

  /**
   * Get workflow statistics
   */
  getStatistics(): {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageDuration: number;
    totalDuration: number;
    cacheHitRate: number;
  } {
    const results = Array.from(this.taskResults.values());
    const completed = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const cached = results.filter(r => r.fromCache);

    return {
      totalTasks: results.length,
      completedTasks: completed.length,
      failedTasks: failed.length,
      averageDuration: completed.length > 0 
        ? completed.reduce((sum, r) => sum + r.duration, 0) / completed.length 
        : 0,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      cacheHitRate: results.length > 0 ? cached.length / results.length : 0,
    };
  }
}

// Global workflow optimizer instance
export const workflowOptimizer = new WorkflowOptimizer();

// Utility function to create optimized task
/**
 * Semaphore for task execution concurrency control
 */
class TaskSemaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      this.permits--;
      next();
    }
  }
}

export function createOptimizedTask(
  id: string,
  name: string,
  execute: (...args: any[]) => Promise<any>,
  options: Partial<TaskConfig> = {}
): TaskConfig {
  return {
    id,
    name,
    execute,
    cacheKey: options.cacheKey || createCacheKey('task', id),
    ...options,
  };
}