import { createTool } from '@mastra/core'
import { z } from 'zod'
import { SEOAnalyzer, SEOData } from '@/lib/seo-analyzer'

const seoAnalyzerTool = createTool({
  id: 'seo_analyzer_tool',
  description: 'Analyze content for SEO optimization and readability using Yoast-inspired algorithms',
  inputSchema: z.object({
    content: z.string().describe('The blog content to analyze (HTML or plain text)'),
    title: z.string().optional().describe('The SEO title for the content'),
    metaDescription: z.string().optional().describe('The meta description for the content'),
    keyword: z.string().optional().describe('The focus keyword to optimize for'),
    url: z.string().optional().describe('The URL slug for the content'),
    isCornerstone: z.boolean().default(false).describe('Whether this is cornerstone content requiring higher standards')
  }),
  execute: async ({ content, title, metaDescription, keyword, url, isCornerstone }) => {
    try {
      const seoData: SEOData = {
        content,
        title,
        metaDescription,
        keyword,
        url
      }

      const analysis = SEOAnalyzer.analyze(seoData, isCornerstone)
      const stats = SEOAnalyzer.analyzeContent(content, keyword)

      // Create a summary for the AI agent
      const summary = {
        scores: {
          seo: analysis.seoScore,
          readability: analysis.readabilityScore,
          overall: Math.round((analysis.seoScore + analysis.readabilityScore) / 2)
        },
        rating: analysis.overallRating,
        contentStats: {
          wordCount: stats.wordCount,
          readingTime: Math.ceil(stats.wordCount / 225),
          keywordDensity: stats.keywordDensity,
          fleschScore: stats.fleschReadingEase
        },
        issues: {
          seoIssues: analysis.seoAssessments.filter(a => a.rating === 'bad').length,
          readabilityIssues: analysis.readabilityAssessments.filter(a => a.rating === 'bad').length
        },
        recommendations: [
          ...analysis.seoAssessments.filter(a => a.rating === 'bad').map(a => ({
            type: 'seo',
            issue: a.id,
            recommendation: a.text
          })),
          ...analysis.readabilityAssessments.filter(a => a.rating === 'bad').map(a => ({
            type: 'readability',
            issue: a.id,
            recommendation: a.text
          }))
        ]
      }

      return {
        success: true,
        analysis: summary,
        fullResults: analysis,
        contentStatistics: stats
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during SEO analysis'
      }
    }
  }
})

export { seoAnalyzerTool }