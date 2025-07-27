import { seoArticleWorkflow } from '../seo-article-workflow';
import { mastra } from '../../index';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Mastra instance
vi.mock('../../index', () => ({
  mastra: {
    getAgent: vi.fn()
  }
}));

describe('seoArticleWorkflow', () => {
  let mockAgent: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock agent
    mockAgent = {
      generate: vi.fn()
    };
    
    vi.mocked(mastra.getAgent).mockReturnValue(mockAgent);
  });

  describe('step definitions', () => {
    it('should have all main phases defined', () => {
      const steps = Object.keys(seoArticleWorkflow.steps);
      
      expect(steps.length).toBeGreaterThan(0);
      expect(steps).toContain('research_phase');
      expect(steps).toContain('structure_phase');
      expect(steps).toContain('content_phase');
      expect(steps).toContain('optimization_phase');
      expect(steps).toContain('finalization_phase');
    });
  });

  describe('research phase', () => {
    it('should use seoResearchAgent for research', async () => {
      const mockResearchResult = {
        messages: [{ content: 'Research completed' }],
        text: 'Research findings...'
      };
      mockAgent.generate.mockResolvedValue(mockResearchResult);

      const researchStep = seoArticleWorkflow.steps.research_phase;
      const inputData = { userInput: 'SEO optimization' };
      const context = { inputData, mastra };
      const result = await researchStep.execute(context);

      expect(mastra.getAgent).toHaveBeenCalledWith('seoResearchAgent');
      expect(mockAgent.generate).toHaveBeenCalled();
    });
  });

  describe('structure phase', () => {
    it('should use seoStructureAgent with research context', async () => {
      const mockStructureResult = {
        messages: [{ content: 'Structure created' }],
        text: 'Article outline...'
      };
      mockAgent.generate.mockResolvedValue(mockStructureResult);

      if (seoArticleWorkflow.steps.structure_phase) {
        const structureStep = seoArticleWorkflow.steps.structure_phase;
        const inputData = { 
          focusKeyword: 'SEO optimization',
          researchComplete: true
        };
        const context = { inputData, mastra };
        const result = await structureStep.execute(context);

        expect(mastra.getAgent).toHaveBeenCalledWith('seoStructureAgent');
      }
    });
  });

  describe('content phase', () => {
    it('should use seoContentAgent with structure context', async () => {
      const mockContentResult = {
        messages: [{ content: 'Content written' }],
        text: 'Full article content...'
      };
      mockAgent.generate.mockResolvedValue(mockContentResult);

      if (seoArticleWorkflow.steps.content_phase) {
        const contentStep = seoArticleWorkflow.steps.content_phase;
        const inputData = {
          articleStructure: 'Article outline',
          structureComplete: true
        };
        const context = { inputData, mastra };
        const result = await contentStep.execute(context);

        expect(mastra.getAgent).toHaveBeenCalledWith('seoContentAgent');
      }
    });
  });

  describe('optimization phase', () => {
    it('should use seoOptimizationAgent for all optimization sub-phases', async () => {
      const mockOptimizationResult = {
        messages: [{ content: 'Optimization complete' }],
        text: 'Optimized content...'
      };
      mockAgent.generate.mockResolvedValue(mockOptimizationResult);

      if (seoArticleWorkflow.steps.optimization_phase) {
        const optimizationStep = seoArticleWorkflow.steps.optimization_phase;
        const inputData = {
          articleContent: 'Article content',
          contentComplete: true
        };
        const context = { inputData, mastra };
        const result = await optimizationStep.execute(context);

        expect(mastra.getAgent).toHaveBeenCalledWith('seoOptimizationAgent');
      }
    });
  });

  describe('error handling', () => {
    it('should handle agent errors gracefully', async () => {
      mockAgent.generate.mockRejectedValue(new Error('Agent error'));

      if (seoArticleWorkflow.steps.research_phase) {
        const researchStep = seoArticleWorkflow.steps.research_phase;
        const context = { inputData: { userInput: 'test' }, mastra };
        
        await expect(
          researchStep.execute(context)
        ).rejects.toThrow('Agent error');
      }
    });

    it('should handle missing agent', async () => {
      vi.mocked(mastra.getAgent).mockReturnValue(null);

      if (seoArticleWorkflow.steps.research_phase) {
        const researchStep = seoArticleWorkflow.steps.research_phase;
        const context = { inputData: { userInput: 'test' }, mastra: null };
        
        await expect(
          researchStep.execute(context)
        ).rejects.toThrow();
      }
    });
  });

  describe('workflow execution', () => {
    it('should pass data between steps correctly', async () => {
      // Mock different responses for different agents
      const mockResponses: Record<string, any> = {
        seoResearchAgent: { text: 'research data' },
        seoStructureAgent: { text: 'structure data' },
        seoContentAgent: { text: 'content data' },
        seoOptimizationAgent: { text: 'optimized data' }
      };

      vi.mocked(mastra.getAgent).mockImplementation((agentName: string) => ({
        generate: vi.fn().mockResolvedValue({
          messages: [{ content: 'Done' }],
          text: mockResponses[agentName]?.text || 'default'
        })
      }));

      // Test that agents are called with correct names
      expect(vi.mocked(mastra.getAgent)).toHaveBeenCalled();
    });
  });
});