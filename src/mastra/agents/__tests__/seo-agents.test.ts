import { seoOrchestratorAgent } from '../seo-orchestrator';
import { seoResearchAgent } from '../seo-research-agent';
import { seoStructureAgent } from '../seo-structure-agent';
import { seoContentAgent } from '../seo-content-agent';
import { seoOptimizationAgent } from '../seo-optimization-agent';
import { Agent } from '@mastra/core';
import { describe, it, expect } from 'vitest';

describe('SEO Agents', () => {
  const agents = [
    { agent: seoOrchestratorAgent, id: 'seo-orchestrator', name: 'SEO Orchestrator Agent' },
    { agent: seoResearchAgent, id: 'seo-research', name: 'SEO Research Agent' },
    { agent: seoStructureAgent, id: 'seo-structure', name: 'SEO Structure Agent' },
    { agent: seoContentAgent, id: 'seo-content', name: 'SEO Content Agent' },
    { agent: seoOptimizationAgent, id: 'seo-optimization', name: 'SEO Optimization Agent' }
  ];

  agents.forEach(({ agent, id, name }) => {
    describe(`${name}`, () => {
      it('should be properly configured', () => {
        expect(agent).toBeDefined();
        expect(agent.id).toBe(id);
        expect(agent.name).toBe(name);
      });

      it('should use Claude model', () => {
        expect(agent.model.provider).toBe('anthropic.messages');
        expect(agent.model.name).toBe('claude-3-5-opus-20241022');
      });
    });
  });

  describe('seoOrchestratorAgent', () => {
    it('should have orchestration instructions', () => {
      expect(seoOrchestratorAgent.instructions).toContain('15-phase SEO article creation');
      expect(seoOrchestratorAgent.instructions).toContain('coordinates');
      expect(seoOrchestratorAgent.instructions).toContain('workflow');
    });
  });

  describe('seoResearchAgent', () => {
    it('should have research tools', () => {
      const toolIds = seoResearchAgent.tools.map((tool: any) => tool.id);
      expect(toolIds).toContain('unified-research');
      expect(toolIds).toContain('tasc-web-search');
    });

    it('should focus on keyword research', () => {
      expect(seoResearchAgent.instructions).toContain('keyword research');
      expect(seoResearchAgent.instructions).toContain('search intent');
      expect(seoResearchAgent.instructions).toContain('competitor analysis');
    });
  });

  describe('seoStructureAgent', () => {
    it('should have structure planning instructions', () => {
      expect(seoStructureAgent.instructions).toContain('article structure');
      expect(seoStructureAgent.instructions).toContain('heading hierarchy');
      expect(seoStructureAgent.instructions).toContain('content flow');
    });

    it('should have access to unified research tool', () => {
      const toolIds = seoStructureAgent.tools.map((tool: any) => tool.id);
      expect(toolIds).toContain('unified-research');
    });
  });

  describe('seoContentAgent', () => {
    it('should have content creation instructions', () => {
      expect(seoContentAgent.instructions).toContain('engaging content');
      expect(seoContentAgent.instructions).toContain('keyword integration');
      expect(seoContentAgent.instructions).toContain('TASC voice');
    });

    it('should have access to multiple tools', () => {
      const toolIds = seoContentAgent.tools.map((tool: any) => tool.id);
      expect(toolIds).toContain('unified-research');
      expect(toolIds).toContain('tasc-context');
      expect(toolIds).toContain('seo-analyzer');
    });
  });

  describe('seoOptimizationAgent', () => {
    it('should have optimization instructions', () => {
      expect(seoOptimizationAgent.instructions).toContain('technical SEO');
      expect(seoOptimizationAgent.instructions).toContain('meta tags');
      expect(seoOptimizationAgent.instructions).toContain('readability');
    });

    it('should have SEO analysis tools', () => {
      const toolIds = seoOptimizationAgent.tools.map((tool: any) => tool.id);
      expect(toolIds).toContain('seo-analyzer');
      expect(toolIds).toContain('unified-research');
    });

    it('should handle all 7 optimization sub-phases', () => {
      const instructions = seoOptimizationAgent.instructions;
      expect(instructions).toContain('keyword density');
      expect(instructions).toContain('meta title');
      expect(instructions).toContain('meta description');
      expect(instructions).toContain('internal links');
      expect(instructions).toContain('images');
      expect(instructions).toContain('schema markup');
      expect(instructions).toContain('readability');
    });
  });
});