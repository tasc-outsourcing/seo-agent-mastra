/**
 * Agent Wrapper with Activity Logging
 * Wraps Mastra agents to automatically log their activities
 */

import { Agent } from '@mastra/core/agent';
import { agentActivityLogger } from './agent-activity-logger';

export function wrapAgentWithLogging(agent: Agent, agentName: string): Agent {
  const originalGenerate = agent.generate.bind(agent);
  
  agent.generate = async (messages: any[], options?: any) => {
    const activityId = await agentActivityLogger.startActivity(
      agentName,
      'Generating response',
      { 
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]?.content?.slice(0, 100) + '...',
        options 
      }
    );

    try {
      await agentActivityLogger.updateActivity(activityId, { status: 'in_progress' });
      
      const result = await originalGenerate(messages, options);
      
      await agentActivityLogger.completeActivity(
        activityId,
        { 
          responseLength: result.text?.length || 0,
          finishReason: result.finishReason,
          usage: result.usage
        }
      );
      
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

  return agent;
}

export function wrapToolWithLogging(tool: any, toolName: string) {
  const originalExecute = tool.execute.bind(tool);
  
  tool.execute = async (context: any) => {
    const activityId = await agentActivityLogger.startActivity(
      toolName,
      `Executing ${tool.id || 'tool'}`,
      context
    );

    try {
      await agentActivityLogger.updateActivity(activityId, { status: 'in_progress' });
      
      const result = await originalExecute(context);
      
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

  return tool;
}