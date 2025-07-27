import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { AgentActivityLogger, withActivityLogging } from '../agent-activity-logger';

// Mock fs module
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  appendFile: vi.fn(),
}));

describe('AgentActivityLogger', () => {
  let logger: AgentActivityLogger;

  beforeEach(() => {
    logger = new (AgentActivityLogger as any)();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('startActivity', () => {
    it('should create a new activity with unique ID', async () => {
      const activityId = await logger.startActivity(
        'testAgent',
        'test activity',
        { input: 'test' }
      );

      expect(activityId).toBeDefined();
      expect(typeof activityId).toBe('string');
      expect(activityId).toMatch(/^testAgent-/);
    });

    it('should log activity to file', async () => {
      await logger.startActivity('testAgent', 'test activity');
      
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('agent-activities.log'),
        expect.stringContaining('testAgent')
      );
    });

    it('should notify callbacks', async () => {
      const callback = vi.fn();
      logger.onActivity(callback);

      await logger.startActivity('testAgent', 'test activity');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          agentName: 'testAgent',
          activity: 'test activity',
          status: 'started'
        })
      );
    });
  });

  describe('updateActivity', () => {
    it('should update activity status', async () => {
      const activityId = await logger.startActivity('testAgent', 'test activity');
      
      await logger.updateActivity(activityId, { status: 'in_progress' });

      const metrics = logger.getMetrics();
      const activity = metrics.recentActivities.find(a => a.id === activityId);
      expect(activity?.status).toBe('in_progress');
    });
  });

  describe('completeActivity', () => {
    it('should complete activity successfully', async () => {
      const activityId = await logger.startActivity('testAgent', 'test activity');
      
      await logger.completeActivity(activityId, { result: 'success' });

      const metrics = logger.getMetrics();
      const activity = metrics.recentActivities.find(a => a.id === activityId);
      
      expect(activity?.status).toBe('completed');
      expect(activity?.output).toEqual({ result: 'success' });
      expect(activity?.endTime).toBeDefined();
      expect(activity?.duration).toBeDefined();
    });

    it('should mark activity as failed when error provided', async () => {
      const activityId = await logger.startActivity('testAgent', 'test activity');
      
      await logger.completeActivity(activityId, undefined, 'Test error');

      const metrics = logger.getMetrics();
      const activity = metrics.recentActivities.find(a => a.id === activityId);
      
      expect(activity?.status).toBe('failed');
      expect(activity?.error).toBe('Test error');
    });
  });

  describe('getMetrics', () => {
    it('should return correct metrics', async () => {
      // Create some test activities
      const id1 = await logger.startActivity('agent1', 'activity1');
      const id2 = await logger.startActivity('agent2', 'activity2');
      const id3 = await logger.startActivity('agent1', 'activity3');

      await logger.completeActivity(id1, 'result1');
      await logger.completeActivity(id2, undefined, 'error');

      const metrics = logger.getMetrics();

      expect(metrics.totalActivities).toBe(3);
      expect(metrics.completedActivities).toBe(1);
      expect(metrics.failedActivities).toBe(1);
      expect(metrics.activitiesByAgent).toEqual({
        agent1: 2,
        agent2: 1
      });
      expect(metrics.recentActivities).toHaveLength(3);
    });

    it('should calculate average duration correctly', async () => {
      const id1 = await logger.startActivity('testAgent', 'activity1');
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await logger.completeActivity(id1, 'result');

      const metrics = logger.getMetrics();
      expect(metrics.averageDuration).toBeGreaterThan(0);
    });
  });

  describe('getActivitiesByAgent', () => {
    it('should return activities for specific agent', async () => {
      await logger.startActivity('agent1', 'activity1');
      await logger.startActivity('agent2', 'activity2');
      await logger.startActivity('agent1', 'activity3');

      const agent1Activities = logger.getActivitiesByAgent('agent1');
      const agent2Activities = logger.getActivitiesByAgent('agent2');

      expect(agent1Activities).toHaveLength(2);
      expect(agent2Activities).toHaveLength(1);
      expect(agent1Activities.every(a => a.agentName === 'agent1')).toBe(true);
    });
  });

  describe('formatActivityMessage', () => {
    it('should format activity messages correctly', () => {
      const activity = {
        id: 'test-id',
        agentName: 'testAgent',
        activity: 'test activity',
        startTime: new Date(),
        status: 'completed' as const,
        duration: 5000
      };

      const message = logger.formatActivityMessage(activity);
      
      expect(message).toContain('testAgent');
      expect(message).toContain('test activity');
      expect(message).toContain('✅');
      expect(message).toContain('(5s)');
    });

    it('should use correct emojis for different agents', () => {
      const activity = {
        id: 'test-id',
        agentName: 'blogArticleAgent',
        activity: 'test',
        startTime: new Date(),
        status: 'started' as const
      };

      const message = logger.formatActivityMessage(activity);
      expect(message).toContain('📝');
    });
  });

  describe('cleanup', () => {
    it('should remove old activities', async () => {
      // Create an activity
      const id = await logger.startActivity('testAgent', 'old activity');
      
      // Manually set old timestamp
      const activities = (logger as any).activities;
      const activity = activities.get(id);
      activity.startTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

      await logger.cleanup();

      const metrics = logger.getMetrics();
      expect(metrics.totalActivities).toBe(0);
    });
  });
});

describe('withActivityLogging', () => {
  let logger: AgentActivityLogger;

  beforeEach(() => {
    logger = new (AgentActivityLogger as any)();
    vi.clearAllMocks();
  });

  it('should wrap function with activity logging', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const wrappedFn = withActivityLogging('testAgent', 'test activity', mockFn);

    const result = await wrappedFn('input');

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledWith('input');

    const metrics = logger.getMetrics();
    expect(metrics.totalActivities).toBe(1);
    expect(metrics.completedActivities).toBe(1);
  });

  it('should handle function errors', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
    const wrappedFn = withActivityLogging('testAgent', 'test activity', mockFn);

    await expect(wrappedFn('input')).rejects.toThrow('Test error');

    const metrics = logger.getMetrics();
    expect(metrics.totalActivities).toBe(1);
    expect(metrics.failedActivities).toBe(1);
  });
});