import { SEOData, ReadabilityData, AnalysisResult, AssessmentResult, ContentStatistics } from './types'
import { analyzeText } from './utils/text-statistics'
import { OVERALL_SCORE_THRESHOLDS } from './config'
import { AdvancedSEOScorer } from './scoring/advanced-scorer'

// SEO Assessments
import { assessKeywordDensity } from './assessments/seo/keyword-density'
import { assessMetaDescription } from './assessments/seo/meta-description'
import { assessTitle } from './assessments/seo/title'
import { assessTextLength } from './assessments/seo/text-length'
import { assessInternalLinks } from './assessments/seo/internal-links'
import { assessImages } from './assessments/seo/images'
import { assessSemanticKeywords } from './assessments/seo/semantic-keywords'
import { assessHeadingStructure } from './assessments/seo/heading-structure'
import { assessContentFreshness } from './assessments/seo/content-freshness'
import { assessExternalLinks } from './assessments/seo/external-links'

// Readability Assessments
import { assessSentenceLength } from './assessments/readability/sentence-length'
import { assessParagraphLength } from './assessments/readability/paragraph-length'
import { assessPassiveVoice } from './assessments/readability/passive-voice'
import { assessFleschReadingEase } from './assessments/readability/flesch-reading-ease'
import { assessTransitionWords } from './assessments/readability/transition-words'

export class SEOAnalyzer {
  /**
   * Analyzes content for SEO and readability
   */
  static analyze(seoData: SEOData, isCornerstone = false): AnalysisResult {
    // Generate content statistics
    const stats = analyzeText(seoData.content, seoData.keyword)

    // Run SEO assessments
    const seoAssessments: AssessmentResult[] = [
      assessKeywordDensity(seoData, stats),
      assessMetaDescription(seoData),
      assessTitle(seoData),
      assessTextLength(stats, isCornerstone),
      assessInternalLinks(stats),
      assessImages(stats),
      assessSemanticKeywords(seoData, stats),
      assessHeadingStructure(seoData.content, stats, seoData.keyword),
      assessContentFreshness(seoData.content, stats),
      assessExternalLinks(seoData.content, stats)
    ]

    // Run readability assessments
    const readabilityAssessments: AssessmentResult[] = [
      assessSentenceLength(seoData.content, stats),
      assessParagraphLength(seoData.content),
      assessPassiveVoice(stats),
      assessFleschReadingEase(stats),
      assessTransitionWords(stats)
    ]

    // Calculate overall scores
    const seoScore = this.calculateScore(seoAssessments)
    const readabilityScore = this.calculateScore(readabilityAssessments)

    // Determine overall rating
    const averageScore = (seoScore + readabilityScore) / 2
    const overallRating = this.getOverallRating(averageScore)

    return {
      seoScore,
      readabilityScore,
      seoAssessments,
      readabilityAssessments,
      overallRating
    }
  }

  /**
   * Calculates score based on assessment results using Yoast's formula
   */
  private static calculateScore(assessments: AssessmentResult[]): number {
    if (assessments.length === 0) return 0

    const validAssessments = assessments.filter(a => a.score >= 0)
    if (validAssessments.length === 0) return 0

    const totalScore = validAssessments.reduce((sum, assessment) => {
      // Normalize negative scores to 0 for calculation
      const normalizedScore = Math.max(0, assessment.score)
      return sum + normalizedScore
    }, 0)

    // Yoast formula: (totalScore * 100) / (numberOfAssessments * 9)
    const maxPossibleScore = validAssessments.length * 9
    return Math.round((totalScore * 100) / maxPossibleScore)
  }

  /**
   * Determines overall rating based on average score
   */
  private static getOverallRating(score: number): 'needs-improvement' | 'ok' | 'good' {
    if (score >= OVERALL_SCORE_THRESHOLDS.good) return 'good'
    if (score >= OVERALL_SCORE_THRESHOLDS.ok) return 'ok'
    return 'needs-improvement'
  }

  /**
   * Analyzes just content statistics without full assessment
   */
  static analyzeContent(content: string, keyword?: string): ContentStatistics {
    return analyzeText(content, keyword)
  }

  /**
   * Gets score color based on rating
   */
  static getScoreColor(score: number): 'red' | 'orange' | 'green' {
    if (score >= OVERALL_SCORE_THRESHOLDS.good) return 'green'
    if (score >= OVERALL_SCORE_THRESHOLDS.ok) return 'orange'
    return 'red'
  }

  /**
   * Gets rating color for individual assessments
   */
  static getRatingColor(rating: string): 'red' | 'orange' | 'green' | 'gray' {
    switch (rating) {
      case 'good': return 'green'
      case 'ok': return 'orange'
      case 'bad': return 'red'
      default: return 'gray'
    }
  }

  /**
   * Performs advanced analysis with weighted scoring and insights
   */
  static analyzeAdvanced(seoData: SEOData, isCornerstone = false) {
    // Get standard analysis first
    const basicAnalysis = this.analyze(seoData, isCornerstone)
    
    // Calculate advanced scores
    const advancedSEO = AdvancedSEOScorer.calculateAdvancedScore(basicAnalysis.seoAssessments)
    const advancedReadability = AdvancedSEOScorer.calculateAdvancedScore(basicAnalysis.readabilityAssessments)
    const contentQuality = AdvancedSEOScorer.calculateContentQualityScore(basicAnalysis)
    const eatScore = AdvancedSEOScorer.calculateEATScore(basicAnalysis)
    const recommendations = AdvancedSEOScorer.generateRecommendations(basicAnalysis)
    
    return {
      ...basicAnalysis,
      advanced: {
        seo: advancedSEO,
        readability: advancedReadability,
        contentQuality,
        eatScore,
        recommendations,
        overallScore: Math.round((advancedSEO.score + advancedReadability.score + contentQuality.score + eatScore.score) / 4)
      }
    }
  }

  /**
   * Get optimization suggestions based on content
   */
  static getOptimizationSuggestions(content: string, targetKeyword?: string): string[] {
    const stats = this.analyzeContent(content, targetKeyword)
    const suggestions: string[] = []
    
    // Word count suggestions
    if (stats.wordCount < 300) {
      suggestions.push('Add more content - aim for at least 300 words for basic SEO value')
    } else if (stats.wordCount < 600) {
      suggestions.push('Consider expanding content to 600+ words for better SEO performance')
    }
    
    // Keyword suggestions
    if (targetKeyword && (!stats.keywordDensity || stats.keywordDensity < 0.5)) {
      suggestions.push(`Increase usage of focus keyword "${targetKeyword}" - currently too low`)
    } else if (targetKeyword && stats.keywordDensity && stats.keywordDensity > 3) {
      suggestions.push(`Reduce keyword stuffing - "${targetKeyword}" is overused`)
    }
    
    // Structure suggestions
    if (stats.headingCount.h2 < 2) {
      suggestions.push('Add more H2 subheadings to improve content structure')
    }
    
    if (stats.imageCount === 0) {
      suggestions.push('Add at least one relevant image with alt text')
    }
    
    if (stats.linkCount.internal === 0) {
      suggestions.push('Add internal links to related content')
    }
    
    if (stats.linkCount.external === 0) {
      suggestions.push('Add 1-2 external links to authoritative sources')
    }
    
    // Readability suggestions
    if (stats.averageSentenceLength > 20) {
      suggestions.push('Shorten sentences for better readability')
    }
    
    if (stats.passiveVoicePercentage > 10) {
      suggestions.push('Reduce passive voice usage to under 10%')
    }
    
    return suggestions
  }
}

export * from './types'
export * from './config'