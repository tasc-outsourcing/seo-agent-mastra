/**
 * Agent Activity Logger
 * Tracks and logs agent activities with real-time notifications
 */

import fs from 'fs/promises';
import path from 'path';

export interface AgentActivity {
  id: string;
  agentName: string;
  activity: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentMetrics {
  totalActivities: number;
  completedActivities: number;
  failedActivities: number;
  averageDuration: number;
  activitiesByAgent: Record<string, number>;
  recentActivities: AgentActivity[];
}

class AgentActivityLogger {
  private activities: Map<string, AgentActivity> = new Map();
  private logFilePath: string;
  private chatCallbacks: ((activity: AgentActivity) => void)[] = [];

  constructor() {
    this.logFilePath = path.join(process.cwd(), 'logs', 'agent-activities.log');
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory() {
    try {
      const logDir = path.dirname(this.logFilePath);
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Register a callback for real-time chat announcements
   */
  onActivity(callback: (activity: AgentActivity) => void) {
    this.chatCallbacks.push(callback);
  }

  /**
   * Start tracking an agent activity
   */
  async startActivity(
    agentName: string,
    activity: string,
    input?: any,
    metadata?: Record<string, any>
  ): Promise<string> {
    const id = `${agentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const activityRecord: AgentActivity = {
      id,
      agentName,
      activity,
      startTime: new Date(),
      status: 'started',
      input,
      metadata,
    };

    this.activities.set(id, activityRecord);
    
    // Log to file
    await this.logToFile(activityRecord);
    
    // Notify chat callbacks
    this.notifyCallbacks(activityRecord);
    
    return id;
  }

  /**
   * Update activity progress
   */
  async updateActivity(
    id: string,
    updates: Partial<Pick<AgentActivity, 'status' | 'metadata'>>
  ) {
    const activity = this.activities.get(id);
    if (!activity) return;

    Object.assign(activity, updates);
    
    // Log to file
    await this.logToFile(activity);
    
    // Notify chat callbacks
    this.notifyCallbacks(activity);
  }

  /**
   * Complete an agent activity
   */
  async completeActivity(
    id: string,
    output?: any,
    error?: string
  ) {
    const activity = this.activities.get(id);
    if (!activity) return;

    activity.endTime = new Date();
    activity.duration = activity.endTime.getTime() - activity.startTime.getTime();
    activity.status = error ? 'failed' : 'completed';
    activity.output = output;
    activity.error = error;

    // Log to file
    await this.logToFile(activity);
    
    // Notify chat callbacks
    this.notifyCallbacks(activity);
  }

  /**
   * Get current metrics
   */
  getMetrics(): AgentMetrics {
    const activities = Array.from(this.activities.values());
    const completed = activities.filter(a => a.status === 'completed');
    const failed = activities.filter(a => a.status === 'failed');
    
    const activitiesByAgent = activities.reduce((acc, activity) => {
      acc[activity.agentName] = (acc[activity.agentName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageDuration = completed.length > 0
      ? completed.reduce((sum, a) => sum + (a.duration || 0), 0) / completed.length
      : 0;

    return {
      totalActivities: activities.length,
      completedActivities: completed.length,
      failedActivities: failed.length,
      averageDuration,
      activitiesByAgent,
      recentActivities: activities
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .slice(0, 20),
    };
  }

  /**
   * Get activities by agent
   */
  getActivitiesByAgent(agentName: string): AgentActivity[] {
    return Array.from(this.activities.values())
      .filter(activity => activity.agentName === agentName)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Log activity to file
   */
  private async logToFile(activity: AgentActivity) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...activity,
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(this.logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to activity log:', error);
    }
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks(activity: AgentActivity) {
    this.chatCallbacks.forEach(callback => {
      try {
        callback(activity);
      } catch (error) {
        console.error('Error in activity callback:', error);
      }
    });
  }

  /**
   * Generate human-readable activity message
   */
  formatActivityMessage(activity: AgentActivity): string {
    const emoji = this.getActivityEmoji(activity);
    const duration = activity.duration ? ` (${Math.round(activity.duration / 1000)}s)` : '';
    
    switch (activity.status) {
      case 'started':
        return `${emoji} **${activity.agentName}** started: ${activity.activity}`;
      case 'in_progress':
        return `⚡ **${activity.agentName}** working on: ${activity.activity}`;
      case 'completed':
        return `✅ **${activity.agentName}** completed: ${activity.activity}${duration}`;
      case 'failed':
        return `❌ **${activity.agentName}** failed: ${activity.activity}${duration}`;
      default:
        return `📝 **${activity.agentName}**: ${activity.activity}`;
    }
  }

  private getActivityEmoji(activity: AgentActivity): string {
    const agentEmojis: Record<string, string> = {
      'blogArticleAgent': '📝',
      'seoOrchestratorAgent': '🎯',
      'seoResearchAgent': '🔍',
      'seoStructureAgent': '🏗️',
      'seoContentAgent': '✍️',
      'seoOptimizationAgent': '⚡',
      'unifiedResearchTool': '🔬',
      'tascContextTool': '📚',
    };

    return agentEmojis[activity.agentName] || '🤖';
  }

  /**
   * Clear old activities (older than 24 hours)
   */
  async cleanup() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [id, activity] of this.activities.entries()) {
      if (activity.startTime < cutoff) {
        this.activities.delete(id);
      }
    }
  }

  /**
   * Export activity log as JSON
   */
  async exportLog(): Promise<AgentActivity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
}

// Singleton instance
export const agentActivityLogger = new AgentActivityLogger();

// Utility function for easy agent instrumentation
export function withActivityLogging<T extends any[], R>(
  agentName: string,
  activityName: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const activityId = await agentActivityLogger.startActivity(
      agentName,
      activityName,
      { args: args.length > 0 ? args[0] : undefined }
    );

    try {
      const result = await fn(...args);
      await agentActivityLogger.completeActivity(activityId, result);
      return result;
    } catch (error) {
      await agentActivityLogger.completeActivity(
        activityId,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  };
}