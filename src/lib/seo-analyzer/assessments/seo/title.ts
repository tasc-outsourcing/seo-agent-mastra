import { AssessmentResult, SEOData, AssessmentScore } from '../../types'
import { DEFAULT_SEO_CONFIG } from '../../config'

export function assessTitle(
  data: SEOData,
  config = DEFAULT_SEO_CONFIG
): AssessmentResult {
  if (!data.title) {
    return {
      score: 1,
      text: 'No SEO title has been set. This is critical for search engine rankings.',
      id: 'seo-title',
      rating: 'bad'
    }
  }

  const length = data.title.length
  const { minLength, maxLength } = config.title

  // Check length first
  let lengthScore = 9
  let lengthFeedback = ''

  if (length < minLength) {
    lengthScore = 6
    lengthFeedback = ` The title is ${length} characters, which is below the recommended minimum of ${minLength}.`
  } else if (length > maxLength) {
    lengthScore = 6
    lengthFeedback = ` The title is ${length} characters, which exceeds the recommended maximum of ${maxLength}.`
  }

  // Check keyword position and presence
  if (data.keyword) {
    const titleLower = data.title.toLowerCase()
    const keywordLower = data.keyword.toLowerCase()
    
    if (!titleLower.includes(keywordLower)) {
      return {
        score: 2,
        text: `The focus keyword doesn't appear in the SEO title. Add it to improve SEO.${lengthFeedback}`,
        id: 'seo-title',
        rating: 'bad'
      }
    }

    // Check if keyword is at the beginning
    if (titleLower.startsWith(keywordLower)) {
      return {
        score: Math.min(9, lengthScore) as AssessmentScore,
        text: `Excellent! The SEO title contains the focus keyword at the beginning.${lengthFeedback}`,
        id: 'seo-title',
        rating: lengthScore === 9 ? 'good' : 'ok'
      }
    }

    // Keyword is present but not at beginning
    return {
      score: Math.min(6, lengthScore) as AssessmentScore,
      text: `The SEO title contains the focus keyword, but it's not at the beginning. Consider moving it to the start for better SEO.${lengthFeedback}`,
      id: 'seo-title',
      rating: 'ok'
    }
  }

  // No keyword set, just check length
  return {
    score: lengthScore,
    text: `The SEO title length is ${length === 1 ? 'good' : length < minLength ? 'too short' : length > maxLength ? 'too long' : 'good'}.${lengthFeedback} Set a focus keyword to get more specific recommendations.`,
    id: 'seo-title',
    rating: lengthScore === 9 ? 'good' : 'ok'
  }
}