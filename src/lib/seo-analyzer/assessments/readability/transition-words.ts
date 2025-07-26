import { AssessmentResult, ContentStatistics } from '../../types'
import { DEFAULT_READABILITY_CONFIG } from '../../config'

export function assessTransitionWords(
  stats: ContentStatistics,
  config = DEFAULT_READABILITY_CONFIG
): AssessmentResult {
  const percentage = stats.transitionWordPercentage
  const minPercentage = config.transitionWords.minPercentage

  if (stats.sentenceCount === 0) {
    return {
      score: 0,
      text: 'No sentences found to assess transition word usage.',
      id: 'transition-words',
      rating: 'feedback'
    }
  }

  if (percentage >= minPercentage) {
    return {
      score: 9,
      text: `Excellent! ${percentage.toFixed(1)}% of sentences contain transition words, which meets the recommended minimum of ${minPercentage}%.`,
      id: 'transition-words',
      rating: 'good'
    }
  }

  if (percentage >= minPercentage * 0.8) {
    return {
      score: 6,
      text: `${percentage.toFixed(1)}% of sentences contain transition words, which is close to the recommended minimum of ${minPercentage}%. Add a few more transition words to improve flow.`,
      id: 'transition-words',
      rating: 'ok'
    }
  }

  if (percentage >= minPercentage * 0.5) {
    return {
      score: 3,
      text: `Only ${percentage.toFixed(1)}% of sentences contain transition words, which is below the recommended minimum of ${minPercentage}%. Add transition words like 'however', 'therefore', 'moreover' to improve text flow.`,
      id: 'transition-words',
      rating: 'bad'
    }
  }

  return {
    score: 1,
    text: `Only ${percentage.toFixed(1)}% of sentences contain transition words, which is well below the recommended minimum of ${minPercentage}%. Your text lacks flow - add transition words to connect your ideas.`,
    id: 'transition-words',
    rating: 'bad'
  }
}