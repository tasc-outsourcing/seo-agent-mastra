import { unifiedResearchTool } from '../unified-research';
import { z } from 'zod';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { performBasicResearch } from '../basic-research';
import { performWebSearch } from '../web-search';
import { performDeepResearch } from '../deep-research';

// Mock the research functions
vi.mock('../basic-research', () => ({
  performBasicResearch: vi.fn()
}));

vi.mock('../web-search', () => ({
  performWebSearch: vi.fn()
}));

vi.mock('../deep-research', () => ({
  performDeepResearch: vi.fn()
}));

describe('unifiedResearchTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the cache
    (unifiedResearchTool as any).cache?.clear();
  });

  describe('execute function', () => {
    it('should perform basic research when mode is basic', async () => {
      const mockResult = {
        summary: 'Basic research summary',
        keyFindings: ['finding1', 'finding2'],
        sources: []
      };
      vi.mocked(performBasicResearch).mockResolvedValue(mockResult);

      const result = await unifiedResearchTool.execute!({
        context: {
          query: 'test query',
          mode: 'basic'
        }
      });

      expect(performBasicResearch).toHaveBeenCalledWith('test query');
      expect(result).toEqual(mockResult);
    });

    it('should perform web search when mode is web', async () => {
      const mockResult = {
        summary: 'Web search summary',
        results: [{ title: 'Result 1', url: 'https://example.com' }],
        keyFindings: ['web finding']
      };
      vi.mocked(performWebSearch).mockResolvedValue(mockResult);

      const result = await unifiedResearchTool.execute!({
        context: {
          query: 'test web query',
          mode: 'web',
          config: { maxResults: 10 }
        }
      });

      expect(performWebSearch).toHaveBeenCalledWith('test web query', { maxResults: 10 });
      expect(result).toEqual(mockResult);
    });

    it('should perform deep research when mode is deep', async () => {
      const mockResult = {
        summary: 'Deep research analysis',
        analysis: { depth: 'comprehensive' },
        sources: ['source1', 'source2']
      };
      vi.mocked(performDeepResearch).mockResolvedValue(mockResult);

      const result = await unifiedResearchTool.execute!({
        context: {
          query: 'deep research query',
          mode: 'deep'
        }
      });

      expect(performDeepResearch).toHaveBeenCalledWith('deep research query', {});
      expect(result).toEqual(mockResult);
    });

    it('should use cache when enabled', async () => {
      const mockResult = { summary: 'Cached result' };
      vi.mocked(performWebSearch).mockResolvedValue(mockResult);

      // First call
      const result1 = await unifiedResearchTool.execute!({
        context: {
          query: 'cached query',
          mode: 'web',
          config: { cacheEnabled: true }
        }
      });

      // Second call with same query
      const result2 = await unifiedResearchTool.execute!({
        context: {
          query: 'cached query',
          mode: 'web',
          config: { cacheEnabled: true }
        }
      });

      expect(performWebSearch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should bypass cache when disabled', async () => {
      const mockResult = { summary: 'Non-cached result' };
      vi.mocked(performWebSearch).mockResolvedValue(mockResult);

      // First call
      await unifiedResearchTool.execute!({
        context: {
          query: 'non-cached query',
          mode: 'web',
          config: { cacheEnabled: false }
        }
      });

      // Second call with same query
      await unifiedResearchTool.execute!({
        context: {
          query: 'non-cached query',
          mode: 'web',
          config: { cacheEnabled: false }
        }
      });

      expect(performWebSearch).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(performWebSearch).mockRejectedValue(new Error('Search failed'));

      await expect(
        unifiedResearchTool.execute!({
          context: {
            query: 'error query',
            mode: 'web'
          }
        })
      ).rejects.toThrow('Search failed');
    });
  });

  describe('input validation', () => {
    it('should validate required query parameter', () => {
      const inputSchema = unifiedResearchTool.inputSchema as z.ZodObject<any>;
      
      const validInput = { query: 'test query' };
      const invalidInput = { mode: 'web' };

      expect(() => inputSchema.parse(validInput)).not.toThrow();
      expect(() => inputSchema.parse(invalidInput)).toThrow();
    });

    it('should validate mode enum values', () => {
      const inputSchema = unifiedResearchTool.inputSchema as z.ZodObject<any>;

      const validModes = ['basic', 'web', 'deep'];
      const invalidMode = 'invalid';

      validModes.forEach(mode => {
        expect(() => inputSchema.parse({ query: 'test', mode })).not.toThrow();
      });

      expect(() => inputSchema.parse({ query: 'test', mode: invalidMode })).toThrow();
    });

    it('should validate optional config parameter', () => {
      const inputSchema = unifiedResearchTool.inputSchema as z.ZodObject<any>;

      const validConfig = {
        query: 'test',
        config: { maxResults: 10, cacheEnabled: false }
      };

      expect(() => inputSchema.parse(validConfig)).not.toThrow();
    });
  });
});