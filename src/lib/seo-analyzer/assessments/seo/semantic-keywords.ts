import { AssessmentResult, SEOData, ContentStatistics } from '../../types'

/**
 * Assesses semantic keyword usage in content
 * Checks if related keywords and LSI keywords are naturally integrated
 */
export function assessSemanticKeywords(seoData: SEOData, stats: ContentStatistics): AssessmentResult {
  const semanticKeywords = seoData.semanticKeywords || []
  
  if (semanticKeywords.length === 0) {
    return {
      id: 'semantic-keywords',
      rating: 'bad',
      score: 0,
      text: 'No semantic keywords provided. Add related keywords to improve topical relevance.',
      impact: 'high'
    }
  }

  // Count occurrences of semantic keywords
  const content = seoData.content.toLowerCase()
  let foundKeywords = 0
  const keywordOccurrences: Record<string, number> = {}

  semanticKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g')
    const matches = content.match(regex)
    const count = matches ? matches.length : 0
    
    if (count > 0) {
      foundKeywords++
      keywordOccurrences[keyword] = count
    }
  })

  const coverage = (foundKeywords / semanticKeywords.length) * 100

  // Score based on coverage and natural distribution
  if (coverage >= 80) {
    return {
      id: 'semantic-keywords',
      rating: 'good',
      score: 9,
      text: `Excellent semantic keyword coverage! Using ${foundKeywords} of ${semanticKeywords.length} related keywords naturally throughout the content.`,
      impact: 'positive'
    }
  }
  
  if (coverage >= 60) {
    return {
      id: 'semantic-keywords',
      rating: 'ok',
      score: 6,
      text: `Good semantic keyword usage. Using ${foundKeywords} of ${semanticKeywords.length} related keywords. Consider adding: ${semanticKeywords.filter(k => !keywordOccurrences[k]).slice(0, 3).join(', ')}.`,
      impact: 'medium'
    }
  }

  return {
    id: 'semantic-keywords',
    rating: 'bad',
    score: 3,
    text: `Low semantic keyword coverage (${coverage.toFixed(0)}%). Add more related keywords like: ${semanticKeywords.filter(k => !keywordOccurrences[k]).slice(0, 5).join(', ')}.`,
    impact: 'high'
  }
}