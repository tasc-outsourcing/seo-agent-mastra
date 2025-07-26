import { AssessmentResult, SEOData, ContentStatistics } from '../../types'
import { DEFAULT_SEO_CONFIG } from '../../config'

export function assessKeywordDensity(
  data: SEOData,
  stats: ContentStatistics,
  config = DEFAULT_SEO_CONFIG
): AssessmentResult {
  if (!data.keyword || !stats.keywordDensity) {
    return {
      score: 0,
      text: 'No focus keyword has been set. Set a focus keyword to optimize your content.',
      id: 'keyword-density',
      rating: 'feedback'
    }
  }

  const density = stats.keywordDensity
  const { minDensity, maxDensity } = config.keyword

  // Perfect density range
  if (density >= minDensity && density <= maxDensity) {
    return {
      score: 9,
      text: `The focus keyword appears ${density.toFixed(1)}% of the time. This is within the recommended range of ${minDensity}%-${maxDensity}%.`,
      id: 'keyword-density',
      rating: 'good'
    }
  }

  // Too low
  if (density < minDensity) {
    return {
      score: 4,
      text: `The focus keyword density is ${density.toFixed(1)}%, which is below the recommended minimum of ${minDensity}%. Use your focus keyword more often.`,
      id: 'keyword-density',
      rating: 'bad'
    }
  }

  // Slightly too high
  if (density > maxDensity && density <= 4) {
    return {
      score: -10,
      text: `The focus keyword density is ${density.toFixed(1)}%, which is above the recommended maximum of ${maxDensity}%. Reduce keyword usage to avoid over-optimization.`,
      id: 'keyword-density',
      rating: 'bad'
    }
  }

  // Way too high
  return {
    score: -50,
    text: `The focus keyword density is ${density.toFixed(1)}%, which is way too high. This looks like keyword stuffing and will hurt your SEO.`,
    id: 'keyword-density',
    rating: 'bad'
  }
}