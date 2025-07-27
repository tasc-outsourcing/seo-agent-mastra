# Agent Activity Logging System

The Agent Activity Logging System provides comprehensive tracking and real-time monitoring of AI agent activities in the TASC Blog Article Agent v2 application. This system allows developers and users to see exactly when agents are working, what they're doing, and how long tasks take.

## Features

### 🔍 Activity Tracking
- **Real-time monitoring** of all agent activities
- **Detailed logging** with start/end times, duration, and status
- **Input/output tracking** for debugging and optimization
- **Error handling** with detailed error messages
- **Metadata support** for additional context

### 📊 Performance Metrics
- **Success rates** for each agent
- **Average execution times** 
- **Activity counts** by agent type
- **Failure tracking** with error analysis
- **Historical data** for trend analysis

### 💬 Real-time Notifications
- **Chat announcements** that appear in the UI
- **Server-Sent Events** for live updates
- **Customizable notifications** with emojis and styling
- **Activity status badges** (started, in progress, completed, failed)

### 📈 Monitoring Dashboard
- **Live activity feed** showing recent agent work
- **Performance cards** with key metrics
- **Agent-specific filtering** and views
- **Export capabilities** for analysis

## Architecture

### Core Components

1. **AgentActivityLogger** (`src/lib/agent-activity-logger.ts`)
   - Main logging service
   - In-memory storage with file persistence
   - Callback system for real-time updates
   - Metrics calculation and aggregation

2. **Agent Wrapper** (`src/lib/agent-wrapper.ts`)
   - Automatic instrumentation for Mastra agents
   - Non-intrusive logging integration
   - Error handling and completion tracking

3. **API Endpoints** (`src/app/api/agent-activities/`)
   - REST API for activity data
   - Real-time Server-Sent Events stream
   - Authentication and security

4. **UI Components**
   - **AgentActivityMonitor** - Full dashboard view
   - **AgentChatAnnouncements** - Real-time notifications
   - **Activity cards** and **metrics displays**

## Usage

### Automatic Agent Tracking

All agents are automatically instrumented when registered in the Mastra configuration:

```typescript
// src/mastra/index.ts
import { wrapAgentWithLogging } from '@/lib/agent-wrapper';

export const mastra = new Mastra({
  agents: { 
    blogArticleAgent: wrapAgentWithLogging(blogArticleAgent, 'blogArticleAgent'),
    seoOrchestratorAgent: wrapAgentWithLogging(seoOrchestratorAgent, 'seoOrchestratorAgent'),
    // ... other agents
  },
});
```

### Manual Activity Tracking

For custom tools or workflows:

```typescript
import { agentActivityLogger } from '@/lib/agent-activity-logger';

// Start an activity
const activityId = await agentActivityLogger.startActivity(
  'myCustomTool',
  'Processing user request',
  { userId: 'user123', action: 'analyze' }
);

try {
  // Update progress
  await agentActivityLogger.updateActivity(activityId, { 
    status: 'in_progress',
    metadata: { progress: 50 }
  });

  // Do the work
  const result = await processRequest();

  // Complete successfully
  await agentActivityLogger.completeActivity(activityId, result);
} catch (error) {
  // Complete with error
  await agentActivityLogger.completeActivity(
    activityId, 
    undefined, 
    error.message
  );
}
```

### Function Wrapper

For simple function instrumentation:

```typescript
import { withActivityLogging } from '@/lib/agent-activity-logger';

const instrumentedFunction = withActivityLogging(
  'dataProcessor',
  'Processing data',
  async (data) => {
    // Your function logic
    return processedData;
  }
);

// Usage - automatically logged
const result = await instrumentedFunction(inputData);
```

## API Reference

### AgentActivityLogger Methods

#### `startActivity(agentName, activity, input?, metadata?)`
Starts tracking a new activity.
- **agentName**: Name of the agent/tool
- **activity**: Description of what's being done
- **input**: Optional input data
- **metadata**: Optional additional context
- **Returns**: Unique activity ID

#### `updateActivity(id, updates)`
Updates an existing activity.
- **id**: Activity ID from startActivity
- **updates**: Partial updates (status, metadata)

#### `completeActivity(id, output?, error?)`
Completes an activity.
- **id**: Activity ID
- **output**: Optional result data
- **error**: Optional error message

#### `getMetrics()`
Returns current metrics:
```typescript
interface AgentMetrics {
  totalActivities: number;
  completedActivities: number;
  failedActivities: number;
  averageDuration: number;
  activitiesByAgent: Record<string, number>;
  recentActivities: AgentActivity[];
}
```

#### `getActivitiesByAgent(agentName)`
Returns activities for a specific agent.

#### `formatActivityMessage(activity)`
Formats an activity for display.

### API Endpoints

#### `GET /api/agent-activities`
Returns recent activities.
- **Query params**: `agent` (filter by agent), `limit` (max results)
- **Auth**: Required

#### `GET /api/agent-activities/metrics`
Returns performance metrics.
- **Auth**: Required

#### `GET /api/agent-activities/stream`
Server-Sent Events stream for real-time updates.
- **Auth**: Required
- **Content-Type**: `text/event-stream`

#### `POST /api/agent-activities`
Programmatically log activities.
- **Body**: `{ action, agentName, activity, activityId, updates }`
- **Actions**: `start`, `update`, `complete`
- **Auth**: Required

## Configuration

### Environment Variables

```bash
# Optional: Log level for activity logger
LOG_LEVEL=info

# Optional: Enable file logging
ENABLE_ACTIVITY_FILE_LOG=true

# Optional: Activity retention period (hours)
ACTIVITY_RETENTION_HOURS=24
```

### Logging Configuration

Activities are logged to `logs/agent-activities.log` in JSON format:

```json
{
  "timestamp": "2024-01-27T10:30:00.000Z",
  "id": "blogArticleAgent-1706347800000-abc123",
  "agentName": "blogArticleAgent",
  "activity": "Generating response",
  "startTime": "2024-01-27T10:30:00.000Z",
  "endTime": "2024-01-27T10:30:05.500Z",
  "duration": 5500,
  "status": "completed",
  "input": { "messageCount": 1 },
  "output": { "responseLength": 1250 }
}
```

## UI Integration

### Activity Monitor Dashboard

Visit `/activity-monitor` to see the full dashboard with:
- Real-time activity feed
- Performance metrics cards
- Agent-specific breakdowns
- Historical activity list

### Chat Announcements

Real-time notifications appear in the bottom-right corner:
- **Started**: Blue notification with play icon
- **In Progress**: Yellow with spinning icon
- **Completed**: Green with checkmark
- **Failed**: Red with X icon

Announcements auto-dismiss after 5 seconds for completed/failed activities.

### Custom Emojis by Agent

Each agent has a unique emoji for easy identification:
- 📝 **blogArticleAgent** - Blog writing
- 🎯 **seoOrchestratorAgent** - SEO coordination
- 🔍 **seoResearchAgent** - Research and analysis
- 🏗️ **seoStructureAgent** - Content structure
- ✍️ **seoContentAgent** - Content creation
- ⚡ **seoOptimizationAgent** - Optimization
- 🔬 **unifiedResearchTool** - Research tool
- 📚 **tascContextTool** - Context tool

## Testing

The system includes comprehensive tests in `src/lib/__tests__/agent-activity-logger.test.ts`:

```bash
# Run activity logger tests
npm test src/lib/__tests__/agent-activity-logger.test.ts

# Run all tests
npm test
```

## Performance Considerations

### Memory Usage
- Activities are stored in memory with automatic cleanup
- Old activities (>24 hours) are automatically removed
- Maximum 20 recent activities kept in metrics

### File I/O
- Asynchronous file logging to prevent blocking
- Graceful error handling for file operations
- Log rotation can be implemented for production

### Real-time Updates
- Efficient callback system for live updates
- Server-Sent Events with keep-alive pings
- Client-side reconnection on connection loss

## Security

### Authentication
- All API endpoints require authentication
- Activity data is user-scoped where applicable
- Secure headers on all responses

### Data Privacy
- Sensitive data is automatically masked in logs
- Input/output data can be filtered
- Activity data has configurable retention

### Rate Limiting
- Standard rate limits apply to all endpoints
- SSE connections have connection limits
- Automatic cleanup prevents memory leaks

## Troubleshooting

### Common Issues

**Activities not appearing**:
- Check authentication is working
- Verify agents are wrapped with logging
- Check browser console for errors

**SSE connection failing**:
- Ensure `/api/agent-activities/stream` is accessible
- Check for corporate firewall blocking SSE
- Verify authentication headers

**High memory usage**:
- Check activity cleanup is running
- Reduce retention period if needed
- Monitor for callback memory leaks

### Debug Mode

Enable debug logging:

```typescript
// Temporary debug enable
localStorage.setItem('debug-agent-activity', 'true');
```

### Log Analysis

Query activity logs:

```bash
# Show recent activities
tail -f logs/agent-activities.log | jq .

# Filter by agent
grep "blogArticleAgent" logs/agent-activities.log | jq .

# Show failed activities
grep '"status":"failed"' logs/agent-activities.log | jq .
```

## Future Enhancements

### Planned Features
- **Database persistence** for long-term storage
- **Advanced analytics** with charts and trends
- **Alert system** for failed activities
- **Integration with monitoring tools** (Datadog, etc.)
- **Agent performance optimization** suggestions
- **Custom dashboards** and views

### API Extensions
- **Webhook notifications** for external systems
- **Bulk operations** for activity management
- **Advanced filtering** and search
- **Export formats** (CSV, JSON, PDF)

## Contributing

When adding new agents or tools:

1. **Wrap with logging** using `wrapAgentWithLogging`
2. **Add appropriate emojis** in the emoji mapping
3. **Test activity tracking** works correctly
4. **Update documentation** if needed

For custom activity types:
1. **Use descriptive names** for activities
2. **Include relevant metadata** for debugging
3. **Handle errors gracefully** in completion
4. **Follow naming conventions** for consistency