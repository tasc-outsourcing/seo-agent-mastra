import { AssessmentResult, ContentStatistics } from '../../types'

/**
 * Assesses external link quality and quantity
 * Checks for authoritative outbound links and proper link attributes
 */
export function assessExternalLinks(content: string, stats: ContentStatistics): AssessmentResult {
  // Regex patterns for different link types
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  
  const externalLinks: Array<{ url: string; text: string; hasNofollow: boolean; opensNewTab: boolean }> = []
  
  // Process HTML links
  let match
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[1]
    const text = match[2]
    const fullTag = match[0]
    
    // Check if external
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      externalLinks.push({
        url,
        text: text.replace(/<[^>]*>/g, ''), // Strip inner HTML
        hasNofollow: /rel=["'][^"']*nofollow/i.test(fullTag),
        opensNewTab: /target=["']_blank["']/i.test(fullTag)
      })
    }
  }
  
  // Process Markdown links if no HTML links found
  if (externalLinks.length === 0) {
    while ((match = markdownLinkRegex.exec(content)) !== null) {
      const text = match[1]
      const url = match[2]
      
      if (url.startsWith('http://') || url.startsWith('https://')) {
        externalLinks.push({
          url,
          text,
          hasNofollow: false, // Markdown doesn't support rel attributes
          opensNewTab: false
        })
      }
    }
  }
  
  // Analyze link quality
  const linkCount = externalLinks.length
  const wordsPerLink = linkCount > 0 ? stats.wordCount / linkCount : 0
  const authoritativeDomains = [
    'wikipedia.org', 'gov', 'edu', 'forbes.com', 'harvard.edu', 
    'nature.com', 'sciencedirect.com', 'ieee.org', 'acm.org',
    'google.com/scholar', 'microsoft.com', 'amazon.com', 'github.com'
  ]
  
  const authoritativeLinks = externalLinks.filter(link => 
    authoritativeDomains.some(domain => link.url.includes(domain))
  ).length
  
  const linksWithProperAttributes = externalLinks.filter(link => 
    link.opensNewTab
  ).length
  
  // Scoring logic
  if (linkCount === 0) {
    return {
      id: 'external-links',
      rating: 'bad',
      score: 3,
      text: 'No external links found. Add 2-5 authoritative external sources to improve credibility and SEO.',
      impact: 'medium'
    }
  }
  
  // Check for optimal link density (1 external link per 300-500 words is good)
  const isOptimalDensity = wordsPerLink >= 300 && wordsPerLink <= 500
  const hasAuthoritativeLinks = authoritativeLinks > 0
  const properAttributeRatio = linksWithProperAttributes / linkCount
  
  let score = 5
  if (isOptimalDensity) score += 2
  if (hasAuthoritativeLinks) score += 2
  if (properAttributeRatio > 0.8) score += 1
  
  // Too many links penalty
  if (wordsPerLink < 200) score -= 2
  
  score = Math.max(0, Math.min(9, score))
  
  if (score >= 8) {
    return {
      id: 'external-links',
      rating: 'good',
      score: 9,
      text: `Excellent external linking! ${linkCount} quality external links with ${authoritativeLinks} from authoritative sources.`,
      impact: 'positive'
    }
  }
  
  if (score >= 5) {
    const suggestions = []
    if (!hasAuthoritativeLinks) suggestions.push('add links to authoritative sources')
    if (properAttributeRatio < 0.8) suggestions.push('set target="_blank" on external links')
    if (!isOptimalDensity) suggestions.push(wordsPerLink < 300 ? 'reduce link frequency' : 'add more relevant external links')
    
    return {
      id: 'external-links',
      rating: 'ok',
      score: 6,
      text: `${linkCount} external links found. To improve: ${suggestions.join(', ')}.`,
      impact: 'low'
    }
  }
  
  return {
    id: 'external-links',
    rating: 'bad',
    score: 3,
    text: `Poor external linking strategy. ${linkCount > 10 ? 'Too many' : 'Too few'} external links (${linkCount}). Aim for 1 link per 300-500 words to authoritative sources.`,
    impact: 'medium'
  }
}