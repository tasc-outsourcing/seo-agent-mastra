'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  activity: AgentActivity;
}

export function AgentChatAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!isEnabled) return;

    let eventSource: EventSource;

    const connectToStream = () => {
      eventSource = new EventSource('/api/agent-activities/stream');
      
      eventSource.onmessage = (event) => {
        try {
          const activity: AgentActivity = JSON.parse(event.data);
          const announcement = createAnnouncement(activity);
          
          setAnnouncements(prev => [announcement, ...prev.slice(0, 9)]); // Keep last 10
          
          // Auto-remove completed/failed announcements after 5 seconds
          if (activity.status === 'completed' || activity.status === 'failed') {
            setTimeout(() => {
              setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
            }, 5000);
          }
        } catch (error) {
          console.error('Failed to parse activity data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        eventSource.close();
        
        // Reconnect after 5 seconds
        setTimeout(connectToStream, 5000);
      };
    };

    connectToStream();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isEnabled]);

  const createAnnouncement = (activity: AgentActivity): Announcement => {
    const emoji = getAgentEmoji(activity.agentName);
    let message = '';
    let type: Announcement['type'] = 'info';

    switch (activity.status) {
      case 'started':
        message = `${emoji} ${activity.agentName} started: ${activity.activity}`;
        type = 'info';
        break;
      case 'in_progress':
        message = `⚡ ${activity.agentName} working on: ${activity.activity}`;
        type = 'info';
        break;
      case 'completed':
        const duration = activity.duration ? ` (${Math.round(activity.duration / 1000)}s)` : '';
        message = `✅ ${activity.agentName} completed: ${activity.activity}${duration}`;
        type = 'success';
        break;
      case 'failed':
        message = `❌ ${activity.agentName} failed: ${activity.activity}`;
        type = 'error';
        break;
    }

    return {
      id: activity.id,
      message,
      type,
      timestamp: new Date(),
      activity,
    };
  };

  const getAgentEmoji = (agentName: string): string => {
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

  const getAnnouncementStyle = (type: Announcement['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  const dismissAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (!isEnabled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEnabled(true)}
        >
          Show Agent Activity
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Toggle Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEnabled(false)}
        >
          Hide Announcements
        </Button>
      </div>

      {/* Announcements */}
      {announcements.map((announcement) => (
        <Card
          key={announcement.id}
          className={`animate-in slide-in-from-right duration-300 ${getAnnouncementStyle(announcement.type)}`}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between space-x-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{announcement.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {announcement.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-transparent"
                onClick={() => dismissAnnouncement(announcement.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {announcements.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <p className="text-sm text-muted-foreground text-center">
              Waiting for agent activity...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}