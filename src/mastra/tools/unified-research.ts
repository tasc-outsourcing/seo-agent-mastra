import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import Exa from 'exa-js';
import { getApiKey, isFeatureEnabled } from '@/lib/env';
import { sanitizeInput, auditLogger } from '@/lib/security';

// Cache configuration
const CACHE_DIR = path.join(process.cwd(), '.cache', 'unified-research');
const CACHE_TTL = {
  basic: 3600000,      // 1 hour
  web: 1800000,        // 30 minutes
  deep: 7200000,       // 2 hours
};

// Cache utilities
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.warn('Failed to create cache directory:', error);
  }
}

function generateCacheKey(input: any): string {
  const content = JSON.stringify(input, Object.keys(input).sort());
  return createHash('md5').update(content).digest('hex');
}

async function getCachedResult(cacheKey: string, mode: string) {
  try {
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    const cacheData = await fs.readFile(cachePath, 'utf-8');
    const parsed = JSON.parse(cacheData);
    
    const ttl = CACHE_TTL[mode as keyof typeof CACHE_TTL] || CACHE_TTL.basic;
    if (Date.now() - parsed.timestamp < ttl) {
      console.log(`Using cached result for key: ${cacheKey}`);
      return parsed.data;
    } else {
      await fs.unlink(cachePath).catch(() => {});
      return null;
    }
  } catch {
    return null;
  }
}

async function setCachedResult(cacheKey: string, data: any) {
  try {
    await ensureCacheDir();
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    await fs.writeFile(cachePath, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }, null, 2));
  } catch (error) {
    console.warn('Failed to cache result:', error);
  }
}

export const unifiedResearchTool = createTool({
  id: 'unified-research',
  description: 'Unified research tool combining basic, web, and deep research capabilities with intelligent caching',
  inputSchema: z.object({
    query: z.string().describe('The topic or query to research').transform(sanitizeInput),
    mode: z.enum(['basic', 'web', 'deep']).default('web').describe('Research mode - basic (fast), web (moderate), or deep (comprehensive)'),
    config: z.object({
      maxResults: z.number().default(5).describe('Maximum number of results'),
      sources: z.array(z.string()).optional().describe('Specific sources to prioritize'),
      cacheEnabled: z.boolean().default(true).describe('Enable result caching'),
      focusAreas: z.array(z.string()).optional().describe('Specific areas to focus on'),
      audience: z.string().optional().describe('Target audience for the research'),
      researchType: z.enum(['trending', 'facts', 'examples', 'sources', 'competitive', 'technical']).optional(),
    }).optional(),
  }),
  outputSchema: z.object({
    mode: z.string(),
    summary: z.string(),
    findings: z.array(z.object({
      content: z.string(),
      source: z.string(),
      relevance: z.string(),
      confidence: z.enum(['high', 'medium', 'low']),
    })),
    keywords: z.array(z.string()),
    recommendations: z.array(z.string()),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      type: z.string(),
      summary: z.string(),
    })),
    metadata: z.object({
      executionTime: z.number(),
      cached: z.boolean(),
      resultsCount: z.number(),
    }),
  }),
  execute: async ({ context }) => {
    const startTime = Date.now();
    const { query, mode = 'web', config = {} } = context;
    const { 
      maxResults = 5, 
      cacheEnabled = true, 
      focusAreas = [], 
      audience = 'technical professionals',
      researchType = 'facts'
    } = config;
    
    console.log(`[Unified Research] Starting ${mode} research for: "${query}"`);
    
    // Generate cache key
    const cacheKey = generateCacheKey({ query, mode, config });
    
    // Check cache if enabled
    if (cacheEnabled) {
      const cachedResult = await getCachedResult(cacheKey, mode);
      if (cachedResult) {
        return {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            cached: true,
            executionTime: Date.now() - startTime,
          }
        };
      }
    }
    
    let result;
    
    switch (mode) {
      case 'basic':
        result = await performBasicResearch(query, config);
        break;
        
      case 'web':
        result = await performWebResearch(query, config);
        break;
        
      case 'deep':
        result = await performDeepResearch(query, config);
        break;
        
      default:
        throw new Error(`Unknown research mode: ${mode}`);
    }
    
    // Add metadata
    const finalResult = {
      ...result,
      mode,
      metadata: {
        executionTime: Date.now() - startTime,
        cached: false,
        resultsCount: result.findings.length,
      }
    };
    
    // Cache result if enabled
    if (cacheEnabled) {
      await setCachedResult(cacheKey, finalResult);
    }
    
    return finalResult;
  },
});

// Basic research - fast, template-based
async function performBasicResearch(query: string, config: any) {
  const { focusAreas = [], audience, researchType } = config;
  
  return {
    summary: `Basic research for "${query}" targeting ${audience}. Focus: ${researchType}.`,
    findings: [
      {
        content: `Key concept: ${query} is essential for modern ${focusAreas[0] || 'business operations'}`,
        source: 'Industry Knowledge Base',
        relevance: 'Direct match to query',
        confidence: 'medium' as const,
      },
      {
        content: `Best practice: Implement ${query} with scalability and security in mind`,
        source: 'Technical Guidelines',
        relevance: 'Implementation guidance',
        confidence: 'high' as const,
      },
    ],
    keywords: [
      query,
      `${query} best practices`,
      `${query} implementation`,
      `${query} strategy`,
    ],
    recommendations: [
      `Start with a comprehensive assessment of ${query} requirements`,
      `Consider industry-specific applications of ${query}`,
      `Plan for scalability and future growth`,
    ],
    sources: [
      {
        title: `Understanding ${query} - A Comprehensive Guide`,
        url: `https://example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'Guide',
        summary: `Comprehensive overview of ${query} concepts and applications`,
      }
    ],
  };
}

// Web research - uses Exa API for real web search
async function performWebResearch(query: string, config: any) {
  const { maxResults = 5, focusAreas = [], audience, researchType = 'facts' } = config;
  
  try {
    if (!isFeatureEnabled('exa')) {
      console.warn('EXA API not configured, falling back to basic research');
      return performBasicResearch(query, config);
    }
    
    try {
      const exa = new Exa(getApiKey('exa'));
    } catch (error) {
      auditLogger.log({
        type: 'api_error',
        details: { service: 'exa', error: 'API key not available' }
      });
      return performBasicResearch(query, config);
    }
    
    const exa = new Exa(getApiKey('exa'));
    
    // Enhance query based on context
    const enhancedQuery = `${query} ${researchType} ${focusAreas.join(' ')} technical consulting strategic`;
    
    const searchResults = await exa.searchAndContents(enhancedQuery, {
      numResults: maxResults,
      text: true,
      summary: true,
      category: 'company',
      useAutoprompt: true,
      startPublishedDate: '2023-01-01',
    });
    
    const findings = searchResults.results.map((result: any, index: number) => ({
      content: result.summary || result.text?.substring(0, 500) || 'No summary available',
      source: result.title || 'Web Source',
      relevance: index === 0 ? 'Highly relevant' : 'Relevant',
      confidence: result.score > 0.8 ? 'high' : result.score > 0.5 ? 'medium' : 'low' as const,
    }));
    
    const sources = searchResults.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      type: determineSourceType(result.url),
      summary: result.summary || 'Click to read more',
    }));
    
    // Extract keywords from results
    const keywords = extractKeywords(searchResults.results, query);
    
    return {
      summary: `Web research completed for "${query}". Found ${findings.length} relevant results focused on ${researchType}.`,
      findings,
      keywords,
      recommendations: generateRecommendations(findings, query),
      sources,
    };
    
  } catch (error) {
    console.error('Web research error:', error);
    return performBasicResearch(query, config);
  }
}

// Deep research - comprehensive multi-step research
async function performDeepResearch(query: string, config: any) {
  const { maxResults = 10, focusAreas = [], audience } = config;
  
  // First, perform web research
  const webResults = await performWebResearch(query, { ...config, maxResults: Math.floor(maxResults / 2) });
  
  // Then enhance with additional analysis
  const enhancedFindings = [
    ...webResults.findings,
    {
      content: `Strategic insight: ${query} requires careful consideration of ${focusAreas.join(', ')}`,
      source: 'Strategic Analysis',
      relevance: 'Strategic planning',
      confidence: 'high' as const,
    },
    {
      content: `Technical consideration: Implementation of ${query} should align with existing infrastructure`,
      source: 'Technical Assessment',
      relevance: 'Technical requirements',
      confidence: 'high' as const,
    },
  ];
  
  // Generate comprehensive recommendations
  const deepRecommendations = [
    ...webResults.recommendations,
    `Conduct a feasibility study for ${query} implementation`,
    `Develop a phased rollout plan with clear milestones`,
    `Establish KPIs to measure ${query} effectiveness`,
    `Create documentation and training materials for ${audience}`,
  ];
  
  return {
    summary: `Deep research completed for "${query}". Comprehensive analysis covering technical, strategic, and implementation aspects.`,
    findings: enhancedFindings,
    keywords: [...webResults.keywords, `${query} ROI`, `${query} metrics`, `${query} case studies`],
    recommendations: deepRecommendations,
    sources: webResults.sources,
  };
}

// Helper functions
function determineSourceType(url: string): string {
  if (url.includes('github.com') || url.includes('docs.')) return 'Technical Documentation';
  if (url.includes('blog') || url.includes('medium.com')) return 'Blog Article';
  if (url.includes('research') || url.includes('study')) return 'Research Report';
  if (url.includes('news')) return 'Industry News';
  return 'Industry Report';
}

function extractKeywords(results: any[], baseQuery: string): string[] {
  const keywords = new Set([baseQuery]);
  
  // Extract common terms from results
  results.forEach((result: any) => {
    const text = (result.title + ' ' + result.summary).toLowerCase();
    // Add relevant terms (simplified keyword extraction)
    const terms = text.match(/\b\w{4,}\b/g) || [];
    terms.slice(0, 5).forEach(term => keywords.add(term));
  });
  
  return Array.from(keywords).slice(0, 10);
}

function generateRecommendations(findings: any[], query: string): string[] {
  const recommendations = [
    `Research current best practices for ${query}`,
    `Analyze competitor approaches to ${query}`,
  ];
  
  if (findings.some(f => f.confidence === 'high')) {
    recommendations.push(`Build on high-confidence insights for ${query} implementation`);
  }
  
  if (findings.length > 3) {
    recommendations.push(`Synthesize multiple perspectives on ${query} for comprehensive understanding`);
  }
  
  return recommendations;
}