import { createTool } from "@mastra/core"
import { z } from "zod"
import Exa from "exa-js"
import { getApiKey, isFeatureEnabled } from "@/lib/env"
import { sanitizeInput, auditLogger } from "@/lib/security"

// Import the research functions
import { performBasicResearch } from "./basic-research"
import { performDeepResearch } from "./deep-research"

// Cache configuration with different TTLs for different research types
const CACHE_TTL = {
  basic: 1000 * 60 * 60, // 1 hour for basic research
  web: 1000 * 60 * 30,   // 30 minutes for web search
  deep: 1000 * 60 * 15,  // 15 minutes for deep research
}

// Simple in-memory cache
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry>()

// Generate cache key
function generateCacheKey(params: any): string {
  return JSON.stringify(params)
}

// Get cached result if valid
async function getCachedResult(key: string, mode: string): Promise<any | null> {
  const entry = cache.get(key)
  if (!entry) return null
  
  const now = Date.now()
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }
  
  console.log(`[Cache Hit] Returning cached ${mode} research result`)
  return { ...entry.data, metadata: { ...entry.data.metadata, cached: true } }
}

// Save result to cache
function cacheResult(key: string, data: any, mode: 'basic' | 'web' | 'deep') {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: CACHE_TTL[mode],
  })
}

// Enhanced web search with security
async function performSecureWebSearch(query: string, config: any = {}) {
  if (!isFeatureEnabled('exa')) {
    console.warn('EXA_API_KEY not found, falling back to basic research');
    return await performBasicResearch(query);
  }
  
  try {
    const exa = new Exa(getApiKey('exa'));
    const sanitizedQuery = sanitizeInput(query);
    
    const searchResponse = await exa.searchAndContents(sanitizedQuery, {
      type: "neural",
      useAutoprompt: true,
      numResults: config.maxResults || 5,
      contents: {
        text: true,
        highlights: true,
      },
    });
    
    return {
      mode: 'web',
      summary: `Found ${searchResponse.results.length} relevant sources for "${sanitizedQuery}"`,
      findings: searchResponse.results.map((result: any) => ({
        content: result.text || result.highlights?.join(' ') || '',
        source: result.title || 'Unknown',
        relevance: result.score ? 
          (result.score > 0.8 ? 'high' : result.score > 0.6 ? 'medium' : 'low') : 
          'medium',
        confidence: result.score ? 
          (result.score > 0.8 ? 'high' : result.score > 0.6 ? 'medium' : 'low') : 
          'medium',
      })),
      keywords: [],
      recommendations: searchResponse.results.slice(0, 3).map((r: any) => 
        `Read more: ${r.title} at ${r.url}`
      ),
      sources: searchResponse.results.map((result: any) => ({
        title: result.title || 'Unknown',
        url: result.url,
        type: 'web',
        summary: result.highlights?.join(' ').slice(0, 200) || '',
      })),
      metadata: {
        executionTime: 0,
        cached: false,
        resultsCount: searchResponse.results.length,
      },
    };
  } catch (error: any) {
    auditLogger.log({
      type: 'api_error',
      details: { 
        service: 'exa',
        error: error.message,
        query: sanitizeInput(query),
      },
    });
    
    // Fallback to basic research on error
    console.error('Web search failed, falling back to basic research:', error);
    return await performBasicResearch(query);
  }
}

/**
 * Unified Research Tool with enhanced security
 * Combines basic, web, and deep research capabilities
 */
export const unifiedResearchToolSecure = createTool({
  id: "unified-research-secure",
  description: "Secure unified research tool with input validation and error handling",
  inputSchema: z.object({
    query: z.string().min(1).max(500).describe("Research query").transform(sanitizeInput),
    mode: z.enum(['basic', 'web', 'deep']).default('web').describe("Research mode"),
    config: z.object({
      maxResults: z.number().min(1).max(20).default(5),
      sources: z.array(z.string()).optional(),
      cacheEnabled: z.boolean().default(true),
      focusAreas: z.array(z.string()).optional(),
      audience: z.string().optional(),
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
        cachedResult.metadata.executionTime = Date.now() - startTime;
        return cachedResult;
      }
    }
    
    let result;
    
    try {
      switch (mode) {
        case 'basic':
          const basicResult = await performBasicResearch(query);
          result = {
            mode: 'basic',
            summary: basicResult.summary,
            findings: basicResult.keyFindings.map(finding => ({
              content: finding,
              source: 'TASC Knowledge Base',
              relevance: 'high',
              confidence: 'high' as const,
            })),
            keywords: [],
            recommendations: basicResult.recommendations || [],
            sources: basicResult.sources.map(source => ({
              title: source.title,
              url: source.url || '#',
              type: source.type || 'article',
              summary: source.description || '',
            })),
            metadata: {
              executionTime: Date.now() - startTime,
              cached: false,
              resultsCount: basicResult.keyFindings.length,
            },
          };
          break;
          
        case 'web':
          result = await performSecureWebSearch(query, { maxResults });
          result.metadata.executionTime = Date.now() - startTime;
          break;
          
        case 'deep':
          const deepResult = await performDeepResearch(query, {
            maxResults,
            focusAreas,
            audience,
            researchType,
          });
          
          result = {
            mode: 'deep',
            summary: deepResult.executiveSummary,
            findings: deepResult.insights.map(insight => ({
              content: insight,
              source: 'Deep Research Analysis',
              relevance: 'high',
              confidence: 'high' as const,
            })),
            keywords: deepResult.keywords || [],
            recommendations: deepResult.recommendations,
            sources: deepResult.sources.map(source => ({
              title: source.title,
              url: source.url,
              type: source.type,
              summary: source.summary || '',
            })),
            metadata: {
              executionTime: Date.now() - startTime,
              cached: false,
              resultsCount: deepResult.insights.length,
            },
          };
          break;
          
        default:
          throw new Error(`Unknown research mode: ${mode}`);
      }
      
      // Cache the result if enabled
      if (cacheEnabled) {
        cacheResult(cacheKey, result, mode);
      }
      
      return result;
      
    } catch (error: any) {
      console.error(`[Unified Research] Error in ${mode} mode:`, error);
      
      // Fallback to basic research on any error
      const fallbackResult = await performBasicResearch(query);
      return {
        mode: 'basic',
        summary: `${fallbackResult.summary} (Fallback due to ${mode} research error)`,
        findings: fallbackResult.keyFindings.map(finding => ({
          content: finding,
          source: 'TASC Knowledge Base (Fallback)',
          relevance: 'medium',
          confidence: 'medium' as const,
        })),
        keywords: [],
        recommendations: fallbackResult.recommendations || [],
        sources: fallbackResult.sources.map(source => ({
          title: source.title,
          url: source.url || '#',
          type: source.type || 'article',
          summary: source.description || '',
        })),
        metadata: {
          executionTime: Date.now() - startTime,
          cached: false,
          resultsCount: fallbackResult.keyFindings.length,
        },
      };
    }
  },
});