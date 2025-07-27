import { AgentActivityMonitor } from '@/components/agent-activity-monitor';
import { AgentChatAnnouncements } from '@/components/agent-chat-announcements';

export default function ActivityMonitorPage() {
  return (
    <div className="container mx-auto py-8">
      <AgentActivityMonitor />
      <AgentChatAnnouncements />
    </div>
  );
}