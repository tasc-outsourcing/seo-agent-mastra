import { blogArticleAgent } from '../blog-article';
import { Agent } from '@mastra/core';
import { describe, it, expect } from 'vitest';

describe('blogArticleAgent', () => {
  it('should be properly configured', () => {
    expect(blogArticleAgent).toBeDefined();
    expect(blogArticleAgent.id).toBe('blog-article-agent');
    expect(blogArticleAgent.name).toBe('Blog Article Agent');
  });

  it('should have the correct model configuration', () => {
    const model = blogArticleAgent.model;
    expect(model.provider).toBe('openai.chat');
    expect(model.name).toBe('gpt-4-turbo');
    expect(model.toolChoice).toBe('auto');
  });

  it('should have access to required tools', () => {
    const tools = blogArticleAgent.tools || [];
    const toolIds = tools.map((tool: any) => tool.id);

    expect(toolIds).toContain('unified-research');
    expect(toolIds).toContain('tasc-context');
    expect(toolIds).toContain('tasc-web-search');
    expect(toolIds).toContain('seo-analyzer');
  });

  it('should have comprehensive instructions', () => {
    const instructions = blogArticleAgent.instructions;
    
    expect(instructions).toContain('TASC');
    expect(instructions).toContain('blog article');
    expect(instructions).toContain('SEO');
    expect(instructions).toContain('professional tone');
    expect(instructions).toContain('actionable insights');
  });

  describe('agent behavior', () => {
    it('should include TASC context in instructions', () => {
      expect(blogArticleAgent.instructions).toContain('TASC');
      expect(blogArticleAgent.instructions).toContain('Technical Analysis and Strategic Consulting');
      expect(blogArticleAgent.instructions).toContain('technical and business audiences');
    });

    it('should emphasize SEO requirements', () => {
      expect(blogArticleAgent.instructions).toContain('SEO');
      expect(blogArticleAgent.instructions).toContain('keywords');
      expect(blogArticleAgent.instructions).toContain('meta descriptions');
    });

    it('should follow TASC content guidelines', () => {
      expect(blogArticleAgent.instructions).toContain('actionable insights');
      expect(blogArticleAgent.instructions).toContain('case studies');
      expect(blogArticleAgent.instructions).toContain('sources');
    });
  });
});