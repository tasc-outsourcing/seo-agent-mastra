import { AssessmentResult, ContentStatistics } from '../../types'
import { DEFAULT_SEO_CONFIG } from '../../config'

export function assessTextLength(
  stats: ContentStatistics,
  isCornerstone = false,
  config = DEFAULT_SEO_CONFIG
): AssessmentResult {
  const minWords = isCornerstone ? config.content.cornerstoneMinWords : config.content.minWords
  const wordCount = stats.wordCount

  if (wordCount === 0) {
    return {
      score: -1,
      text: 'No content found. Add content to your page.',
      id: 'text-length',
      rating: 'error'
    }
  }

  if (wordCount >= minWords) {
    return {
      score: 9,
      text: `Great! Your content has ${wordCount} words, which is above the recommended minimum of ${minWords} words${isCornerstone ? ' for cornerstone content' : ''}.`,
      id: 'text-length',
      rating: 'good'
    }
  }

  // Below minimum but not terrible
  if (wordCount >= minWords * 0.8) {
    return {
      score: 6,
      text: `Your content has ${wordCount} words. Consider adding more content to reach the recommended minimum of ${minWords} words${isCornerstone ? ' for cornerstone content' : ''}.`,
      id: 'text-length',
      rating: 'ok'
    }
  }

  // Way too short
  return {
    score: 3,
    text: `Your content has only ${wordCount} words, which is far below the recommended minimum of ${minWords} words${isCornerstone ? ' for cornerstone content' : ''}. Add more valuable content.`,
    id: 'text-length',
    rating: 'bad'
  }
}