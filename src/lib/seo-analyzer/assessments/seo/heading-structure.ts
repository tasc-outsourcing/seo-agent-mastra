import { AssessmentResult, ContentStatistics } from '../../types'

/**
 * Assesses heading structure (H1-H6) for SEO optimization
 * Checks hierarchy, keyword usage in headings, and proper structure
 */
export function assessHeadingStructure(content: string, stats: ContentStatistics, keyword?: string): AssessmentResult {
  // Extract all headings
  const headingRegex = /<h([1-6])(?:\s[^>]*)?>([^<]+)<\/h[1-6]>/gi
  const markdownHeadingRegex = /^(#{1,6})\s+(.+)$/gm
  
  const headings: Array<{ level: number; text: string }> = []
  
  // Check HTML headings
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].trim()
    })
  }
  
  // Check Markdown headings if no HTML found
  if (headings.length === 0) {
    while ((match = markdownHeadingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].trim()
      })
    }
  }

  // Analyze heading structure
  const h1Count = headings.filter(h => h.level === 1).length
  const h2Count = headings.filter(h => h.level === 2).length
  const hasKeywordInH1 = keyword ? headings.some(h => h.level === 1 && h.text.toLowerCase().includes(keyword.toLowerCase())) : true
  const hasKeywordInH2 = keyword ? headings.some(h => h.level === 2 && h.text.toLowerCase().includes(keyword.toLowerCase())) : true
  
  // Check for proper hierarchy
  let hasProperHierarchy = true
  let previousLevel = 0
  for (const heading of headings) {
    if (heading.level > previousLevel + 1 && previousLevel !== 0) {
      hasProperHierarchy = false
      break
    }
    previousLevel = heading.level
  }

  // Scoring logic
  let score = 0
  let issues: string[] = []
  
  // H1 checks
  if (h1Count === 0) {
    issues.push('No H1 heading found')
  } else if (h1Count > 1) {
    issues.push(`Multiple H1 headings found (${h1Count}). Use only one H1 per page`)
  } else {
    score += 3
    if (!hasKeywordInH1 && keyword) {
      issues.push('Focus keyword not found in H1')
    } else if (keyword) {
      score += 2
    }
  }
  
  // H2 checks
  if (h2Count === 0) {
    issues.push('No H2 headings found. Add subheadings to structure your content')
  } else if (h2Count < 2) {
    issues.push('Only one H2 found. Add more subheadings for better structure')
    score += 1
  } else {
    score += 2
    if (hasKeywordInH2 && keyword) {
      score += 1
    }
  }
  
  // Hierarchy check
  if (!hasProperHierarchy) {
    issues.push('Heading hierarchy is incorrect (e.g., H3 before H2)')
  } else {
    score += 1
  }

  // Generate assessment
  if (score >= 8) {
    return {
      id: 'heading-structure',
      rating: 'good',
      score: 9,
      text: 'Excellent heading structure! Your content has proper H1-H6 hierarchy with keyword optimization.',
      impact: 'positive'
    }
  }
  
  if (score >= 5) {
    return {
      id: 'heading-structure',
      rating: 'ok',
      score: 6,
      text: `Good heading structure with minor issues: ${issues.join('. ')}.`,
      impact: 'medium'
    }
  }

  return {
    id: 'heading-structure',
    rating: 'bad',
    score: 3,
    text: `Poor heading structure. Issues found: ${issues.join('. ')}.`,
    impact: 'high'
  }
}