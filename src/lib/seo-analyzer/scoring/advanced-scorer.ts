import { AssessmentResult, AnalysisResult } from '../types'

/**
 * Advanced scoring algorithm with weighted assessments
 * Based on Google's ranking factors and modern SEO best practices
 */

interface WeightedAssessment {
  id: string
  weight: number
  category: 'critical' | 'important' | 'beneficial'
}

// Define weights for each assessment based on SEO impact
const ASSESSMENT_WEIGHTS: WeightedAssessment[] = [
  // Critical factors (highest impact on rankings)
  { id: 'title', weight: 1.5, category: 'critical' },
  { id: 'meta-description', weight: 1.3, category: 'critical' },
  { id: 'keyword-density', weight: 1.4, category: 'critical' },
  { id: 'text-length', weight: 1.3, category: 'critical' },
  { id: 'heading-structure', weight: 1.4, category: 'critical' },
  
  // Important factors
  { id: 'semantic-keywords', weight: 1.2, category: 'important' },
  { id: 'internal-links', weight: 1.1, category: 'important' },
  { id: 'external-links', weight: 1.1, category: 'important' },
  { id: 'flesch-reading-ease', weight: 1.0, category: 'important' },
  { id: 'content-freshness', weight: 1.0, category: 'important' },
  
  // Beneficial factors
  { id: 'images', weight: 0.9, category: 'beneficial' },
  { id: 'sentence-length', weight: 0.8, category: 'beneficial' },
  { id: 'paragraph-length', weight: 0.7, category: 'beneficial' },
  { id: 'passive-voice', weight: 0.7, category: 'beneficial' },
  { id: 'transition-words', weight: 0.8, category: 'beneficial' },
]

export class AdvancedSEOScorer {
  /**
   * Calculate advanced SEO score with weighted assessments
   */
  static calculateAdvancedScore(assessments: AssessmentResult[]): {
    score: number
    breakdown: Record<string, number>
    insights: string[]
  } {
    const breakdown: Record<string, number> = {}
    const insights: string[] = []
    
    let totalWeightedScore = 0
    let totalWeight = 0
    
    // Process each assessment
    assessments.forEach(assessment => {
      const weight = ASSESSMENT_WEIGHTS.find(w => w.id === assessment.id)?.weight || 1.0
      const weightedScore = assessment.score * weight
      
      breakdown[assessment.id] = Math.round((assessment.score / 9) * 100)
      totalWeightedScore += weightedScore
      totalWeight += weight
      
      // Generate insights for poor performing critical factors
      if (assessment.rating === 'bad') {
        const assessmentWeight = ASSESSMENT_WEIGHTS.find(w => w.id === assessment.id)
        if (assessmentWeight?.category === 'critical') {
          insights.push(`Critical issue: ${assessment.text}`)
        }
      }
    })
    
    // Calculate final score (0-100 scale)
    const rawScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0
    const normalizedScore = Math.round((rawScore / 9) * 100)
    
    // Add overall insights
    if (normalizedScore >= 90) {
      insights.unshift('Excellent SEO optimization! Content is highly optimized for search engines.')
    } else if (normalizedScore >= 70) {
      insights.unshift('Good SEO foundation. Focus on critical issues to reach excellence.')
    } else {
      insights.unshift('SEO needs improvement. Address critical issues first for better rankings.')
    }
    
    return {
      score: normalizedScore,
      breakdown,
      insights
    }
  }
  
  /**
   * Calculate content quality score (separate from technical SEO)
   */
  static calculateContentQualityScore(analysis: AnalysisResult): {
    score: number
    factors: Record<string, boolean>
  } {
    const factors: Record<string, boolean> = {}
    
    // Check quality factors
    factors.comprehensiveContent = analysis.seoAssessments.find(a => a.id === 'text-length')?.rating === 'good' || false
    factors.goodReadability = analysis.readabilityScore >= 60
    factors.properStructure = analysis.seoAssessments.find(a => a.id === 'heading-structure')?.rating !== 'bad' || false
    factors.keywordOptimized = analysis.seoAssessments.find(a => a.id === 'keyword-density')?.rating !== 'bad' || false
    factors.hasLinks = analysis.seoAssessments.find(a => a.id === 'internal-links')?.rating !== 'bad' || false
    factors.freshContent = analysis.seoAssessments.find(a => a.id === 'content-freshness')?.rating !== 'bad' || false
    
    // Calculate score based on met factors
    const metFactors = Object.values(factors).filter(Boolean).length
    const totalFactors = Object.keys(factors).length
    const score = Math.round((metFactors / totalFactors) * 100)
    
    return { score, factors }
  }
  
  /**
   * Generate actionable recommendations based on analysis
   */
  static generateRecommendations(analysis: AnalysisResult): {
    priority: 'high' | 'medium' | 'low'
    action: string
    impact: string
  }[] {
    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low'
      action: string
      impact: string
    }> = []
    
    // Analyze all assessments
    const allAssessments = [...analysis.seoAssessments, ...analysis.readabilityAssessments]
    
    allAssessments.forEach(assessment => {
      if (assessment.rating === 'bad' || assessment.rating === 'error') {
        const weight = ASSESSMENT_WEIGHTS.find(w => w.id === assessment.id)
        
        const priority = weight?.category === 'critical' ? 'high' : 
                        weight?.category === 'important' ? 'medium' : 'low'
        
        const impact = weight?.category === 'critical' ? 
          'High impact on search rankings' :
          weight?.category === 'important' ?
          'Moderate impact on user experience and SEO' :
          'Minor improvement for overall quality'
        
        // Extract actionable recommendation from assessment text
        const action = assessment.text.includes('Add') || assessment.text.includes('Create') ?
          assessment.text :
          `Fix: ${assessment.text}`
        
        recommendations.push({ priority, action, impact })
      }
    })
    
    // Sort by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    
    return recommendations.slice(0, 10) // Return top 10 recommendations
  }
  
  /**
   * Calculate E-A-T (Expertise, Authoritativeness, Trustworthiness) score
   */
  static calculateEATScore(analysis: AnalysisResult): {
    score: number
    factors: {
      expertise: number
      authority: number
      trust: number
    }
  } {
    // Expertise: Content depth and quality
    const expertiseFactors = [
      analysis.seoAssessments.find(a => a.id === 'text-length')?.score || 0,
      analysis.seoAssessments.find(a => a.id === 'semantic-keywords')?.score || 0,
      analysis.readabilityAssessments.find(a => a.id === 'flesch-reading-ease')?.score || 0,
    ]
    const expertise = Math.round(expertiseFactors.reduce((a, b) => a + b, 0) / expertiseFactors.length / 9 * 100)
    
    // Authority: Links and structure
    const authorityFactors = [
      analysis.seoAssessments.find(a => a.id === 'external-links')?.score || 0,
      analysis.seoAssessments.find(a => a.id === 'heading-structure')?.score || 0,
    ]
    const authority = Math.round(authorityFactors.reduce((a, b) => a + b, 0) / authorityFactors.length / 9 * 100)
    
    // Trust: Freshness and quality signals
    const trustFactors = [
      analysis.seoAssessments.find(a => a.id === 'content-freshness')?.score || 0,
      analysis.seoAssessments.find(a => a.id === 'meta-description')?.score || 0,
    ]
    const trust = Math.round(trustFactors.reduce((a, b) => a + b, 0) / trustFactors.length / 9 * 100)
    
    const score = Math.round((expertise + authority + trust) / 3)
    
    return {
      score,
      factors: { expertise, authority, trust }
    }
  }
}

export default AdvancedSEOScorer