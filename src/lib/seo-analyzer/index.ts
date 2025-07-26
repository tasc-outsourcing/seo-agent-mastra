import { SEOData, ReadabilityData, AnalysisResult, AssessmentResult, ContentStatistics } from './types'
import { analyzeText } from './utils/text-statistics'
import { OVERALL_SCORE_THRESHOLDS } from './config'

// SEO Assessments
import { assessKeywordDensity } from './assessments/seo/keyword-density'
import { assessMetaDescription } from './assessments/seo/meta-description'
import { assessTitle } from './assessments/seo/title'
import { assessTextLength } from './assessments/seo/text-length'
import { assessInternalLinks } from './assessments/seo/internal-links'
import { assessImages } from './assessments/seo/images'

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
      assessImages(stats)
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
}

export * from './types'
export * from './config'