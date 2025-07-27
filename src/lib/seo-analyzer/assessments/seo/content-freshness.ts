import { AssessmentResult, ContentStatistics } from '../../types'

/**
 * Assesses content freshness indicators
 * Checks for dates, current year references, and fresh terminology
 */
export function assessContentFreshness(content: string, stats: ContentStatistics): AssessmentResult {
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  
  // Patterns to check for freshness
  const freshnessIndicators = {
    currentYear: new RegExp(`\\b${currentYear}\\b`, 'g'),
    lastYear: new RegExp(`\\b${lastYear}\\b`, 'g'),
    dates: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    freshTerms: /\b(latest|recent|new|updated|current|today|now|modern|2024|2025)\b/gi,
    staleTerms: /\b(outdated|old|deprecated|legacy|obsolete|201[0-9]|202[0-2])\b/gi,
    updateIndicators: /\b(updated?|revised?|refreshed?|as of|current as of)\b/gi
  }
  
  // Count occurrences
  const currentYearMatches = (content.match(freshnessIndicators.currentYear) || []).length
  const lastYearMatches = (content.match(freshnessIndicators.lastYear) || []).length
  const dateMatches = (content.match(freshnessIndicators.dates) || []).length
  const freshTermMatches = (content.match(freshnessIndicators.freshTerms) || []).length
  const staleTermMatches = (content.match(freshnessIndicators.staleTerms) || []).length
  const updateMatches = (content.match(freshnessIndicators.updateIndicators) || []).length
  
  // Calculate freshness score
  let score = 5 // Base score
  
  // Positive indicators
  if (currentYearMatches > 0) score += 2
  if (freshTermMatches >= 3) score += 2
  if (updateMatches > 0) score += 1
  if (dateMatches > 0) score += 1
  
  // Negative indicators
  if (staleTermMatches > 2) score -= 2
  if (currentYearMatches === 0 && lastYearMatches === 0) score -= 1
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(9, score))
  
  // Generate assessment
  if (score >= 8) {
    return {
      id: 'content-freshness',
      rating: 'good',
      score: 9,
      text: `Excellent content freshness! Found ${currentYearMatches} references to ${currentYear} and ${freshTermMatches} fresh terminology indicators.`,
      impact: 'positive'
    }
  }
  
  if (score >= 5) {
    return {
      id: 'content-freshness',
      rating: 'ok',
      score: 6,
      text: `Content appears reasonably fresh. Consider adding more current references or ${currentYear} dates to improve relevance.`,
      impact: 'low'
    }
  }
  
  return {
    id: 'content-freshness',
    rating: 'bad',
    score: 3,
    text: `Content lacks freshness indicators. Add current year (${currentYear}) references, recent dates, or update terminology to improve relevance.`,
    impact: 'medium'
  }
}