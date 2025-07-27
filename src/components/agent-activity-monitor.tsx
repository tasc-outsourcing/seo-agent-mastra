'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  PlayCircle,
  RefreshCw
} from 'lucide-react';

interface AgentActivity {
  id: string;
  agentName: string;
  activity: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  metadata?: Record<string, any>;
}

interface AgentMetrics {
  totalActivities: number;
  completedActivities: number;
  failedActivities: number;
  averageDuration: number;
  activitiesByAgent: Record<string, number>;
  recentActivities: AgentActivity[];
}

export function AgentActivityMonitor() {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Initial load
    fetchActivities();
    fetchMetrics();

    // Set up polling for updates
    const interval = setInterval(() => {
      if (isLive) {
        fetchActivities();
        fetchMetrics();
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/agent-activities');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/agent-activities/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'started':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      started: 'default',
      in_progress: 'secondary',
      completed: 'default',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="ml-2">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    const seconds = Math.round(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getAgentEmoji = (agentName: string) => {
    const emojis: Record<string, string> = {
      blogArticleAgent: '📝',
      seoOrchestratorAgent: '🎯',
      seoResearchAgent: '🔍',
      seoStructureAgent: '🏗️',
      seoContentAgent: '✍️',
      seoOptimizationAgent: '⚡',
      unifiedResearchTool: '🔬',
      tascContextTool: '📚',
    };
    return emojis[agentName] || '🤖';
  };

  const calculateSuccessRate = () => {
    if (!metrics) return 0;
    const total = metrics.completedActivities + metrics.failedActivities;
    return total > 0 ? (metrics.completedActivities / total) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Agent Activity Monitor</h2>
          <Badge variant={isLive ? 'default' : 'secondary'}>
            {isLive ? 'Live' : 'Paused'}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLive(!isLive)}
        >
          {isLive ? 'Pause' : 'Resume'}
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalActivities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calculateSuccessRate().toFixed(1)}%</div>
              <Progress value={calculateSuccessRate()} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(metrics.averageDuration)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activities.filter(a => a.status === 'in_progress' || a.status === 'started').length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No activities yet. Activities will appear here when agents start working.
                </p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getAgentEmoji(activity.agentName)}</span>
                        <span className="font-medium">{activity.agentName}</span>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activity.activity}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Started: {new Date(activity.startTime).toLocaleTimeString()}
                        </span>
                        {activity.duration && (
                          <span>Duration: {formatDuration(activity.duration)}</span>
                        )}
                      </div>
                      {activity.error && (
                        <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                          Error: {activity.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      {metrics && Object.keys(metrics.activitiesByAgent).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.activitiesByAgent).map(([agentName, count]) => (
                <div key={agentName} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getAgentEmoji(agentName)}</span>
                    <span className="font-medium">{agentName}</span>
                  </div>
                  <Badge variant="outline">{count} activities</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}