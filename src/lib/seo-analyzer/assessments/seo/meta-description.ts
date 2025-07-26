import { AssessmentResult, SEOData } from '../../types'
import { DEFAULT_SEO_CONFIG } from '../../config'

export function assessMetaDescription(
  data: SEOData,
  config = DEFAULT_SEO_CONFIG
): AssessmentResult {
  if (!data.metaDescription) {
    return {
      score: 1,
      text: 'No meta description has been specified. Search engines will display a snippet from the page instead. Make sure to write one!',
      id: 'meta-description',
      rating: 'bad'
    }
  }

  const length = data.metaDescription.length
  const { minLength, maxLength } = config.metaDescription

  // Perfect length
  if (length >= minLength && length <= maxLength) {
    // Check if keyword is in meta description
    if (data.keyword && data.metaDescription.toLowerCase().includes(data.keyword.toLowerCase())) {
      return {
        score: 9,
        text: `The meta description is ${length} characters long and contains the focus keyword. Well done!`,
        id: 'meta-description',
        rating: 'good'
      }
    }
    return {
      score: 6,
      text: `The meta description is ${length} characters long, which is good. However, it doesn't contain the focus keyword.`,
      id: 'meta-description',
      rating: 'ok'
    }
  }

  // Too short
  if (length < minLength) {
    return {
      score: 6,
      text: `The meta description is only ${length} characters long, which is below the recommended minimum of ${minLength} characters. Add more content to fully utilize the available space.`,
      id: 'meta-description',
      rating: 'ok'
    }
  }

  // Too long
  return {
    score: 6,
    text: `The meta description is ${length} characters long, which exceeds the recommended maximum of ${maxLength} characters. It may be truncated in search results.`,
    id: 'meta-description',
    rating: 'ok'
  }
}