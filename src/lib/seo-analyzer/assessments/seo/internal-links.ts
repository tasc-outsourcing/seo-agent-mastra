import { AssessmentResult, ContentStatistics } from '../../types'

export function assessInternalLinks(stats: ContentStatistics): AssessmentResult {
  const internalLinks = stats.linkCount.internal

  if (internalLinks === 0) {
    return {
      score: 3,
      text: 'No internal links found. Add internal links to help search engines understand your site structure and keep users engaged.',
      id: 'internal-links',
      rating: 'bad'
    }
  }

  if (internalLinks === 1) {
    return {
      score: 6,
      text: 'You have 1 internal link. Consider adding more internal links to relevant content.',
      id: 'internal-links',
      rating: 'ok'
    }
  }

  if (internalLinks >= 2) {
    return {
      score: 9,
      text: `Great! You have ${internalLinks} internal links, which helps with site structure and user navigation.`,
      id: 'internal-links',
      rating: 'good'
    }
  }

  return {
    score: 0,
    text: 'Unable to assess internal links.',
    id: 'internal-links',
    rating: 'feedback'
  }
}