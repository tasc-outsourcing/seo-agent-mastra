import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const tascDeepResearchTool = createTool({
  id: 'tasc-deep-research',
  description: 'Comprehensive deep research tool for TASC blog articles using multiple research methods and sources',
  inputSchema: z.object({
    topic: z.string().describe('The blog topic to research'),
    researchDepth: z.enum(['basic', 'comprehensive', 'exhaustive']).optional().describe('Depth of research to perform'),
    focusAreas: z.array(z.string()).optional().describe('Specific areas to focus research on'),
    targetAudience: z.string().optional().describe('Target audience for the article'),
  }),
  outputSchema: z.object({
    researchSummary: z.string(),
    keyFindings: z.array(z.object({
      insight: z.string(),
      source: z.string(),
      relevance: z.string(),
      confidence: z.string(),
    })),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      type: z.string(),
      summary: z.string(),
      relevance: z.string(),
    })),
    trends: z.array(z.string()),
    opportunities: z.array(z.string()),
    challenges: z.array(z.string()),
    recommendations: z.array(z.string()),
    seoInsights: z.object({
      keywords: z.array(z.string()),
      titleSuggestions: z.array(z.string()),
      metaDescription: z.string(),
    }),
  }),
  execute: async ({ context, mastra }) => {
    const { topic, researchDepth = 'comprehensive', focusAreas = [], targetAudience = 'Technical professionals and business decision-makers' } = context;
    
    console.log(`Starting deep research for TASC blog article: "${topic}"`);
    
    try {
      // Get the blog article agent for research
      const agent = mastra!.getAgent('blogArticleAgent');
      
      // Create comprehensive research prompt
      const researchPrompt = `Conduct comprehensive deep research for a TASC blog article on: "${topic}"

Research Parameters:
- Topic: ${topic}
- Research Depth: ${researchDepth}
- Focus Areas: ${focusAreas.join(', ') || 'Technical analysis, strategic consulting, industry trends'}
- Target Audience: ${targetAudience}

Research Requirements:
1. **Market Analysis**: Current market trends, size, and growth projections
2. **Technical Deep Dive**: Technical implementations, methodologies, and best practices
3. **Strategic Insights**: Business implications, competitive advantages, and strategic considerations
4. **Case Studies**: Real-world examples and success stories
5. **Expert Opinions**: Industry expert insights and predictions
6. **Challenges & Opportunities**: Current challenges and future opportunities
7. **SEO Analysis**: Keywords, search trends, and content optimization opportunities

Use all available tools (web search, context analysis, research tools) to gather comprehensive information.

Return a structured research report with:
- Key findings and insights
- Relevant sources and citations
- Market trends and developments
- Strategic recommendations
- SEO insights and keyword opportunities
- Article angle suggestions`;

      const result = await agent.generate(
        [
          {
            role: 'user',
            content: researchPrompt,
          },
        ],
        {
          maxSteps: 25,
          experimental_output: z.object({
            keyFindings: z.array(z.object({
              insight: z.string(),
              source: z.string(),
              relevance: z.string(),
              confidence: z.string(),
            })),
            sources: z.array(z.object({
              title: z.string(),
              url: z.string(),
              type: z.string(),
              summary: z.string(),
              relevance: z.string(),
            })),
            trends: z.array(z.string()),
            opportunities: z.array(z.string()),
            challenges: z.array(z.string()),
            recommendations: z.array(z.string()),
            seoInsights: z.object({
              keywords: z.array(z.string()),
              titleSuggestions: z.array(z.string()),
              metaDescription: z.string(),
            }),
          }),
        },
      );

      const resultData = result.object || {
        keyFindings: [],
        sources: [],
        trends: [],
        opportunities: [],
        challenges: [],
        recommendations: [],
        seoInsights: {
          keywords: [],
          titleSuggestions: [],
          metaDescription: '',
        },
      };

      const researchSummary = `Deep research completed for TASC blog article on "${topic}"

Research Depth: ${researchDepth}
Key Findings: ${resultData.keyFindings.length}
Sources: ${resultData.sources.length}
Trends Identified: ${resultData.trends.length}
Opportunities: ${resultData.opportunities.length}
Challenges: ${resultData.challenges.length}
Recommendations: ${resultData.recommendations.length}

This research provides comprehensive insights for creating a high-quality TASC blog article that will engage ${targetAudience} and provide valuable strategic insights.`;

      return {
        researchSummary,
        keyFindings: resultData.keyFindings,
        sources: resultData.sources,
        trends: resultData.trends,
        opportunities: resultData.opportunities,
        challenges: resultData.challenges,
        recommendations: resultData.recommendations,
        seoInsights: resultData.seoInsights,
      };
    } catch (error: any) {
      console.error('Error during deep research:', error);
      return {
        researchSummary: `Error during research: ${error.message}`,
        keyFindings: [],
        sources: [],
        trends: [],
        opportunities: [],
        challenges: [],
        recommendations: [],
        seoInsights: {
          keywords: [],
          titleSuggestions: [],
          metaDescription: 'Research error occurred',
        },
      };
    }
  },
}); 