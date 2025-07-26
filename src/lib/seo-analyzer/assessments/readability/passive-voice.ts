import { AssessmentResult, ContentStatistics } from '../../types'
import { DEFAULT_READABILITY_CONFIG } from '../../config'

export function assessPassiveVoice(
  stats: ContentStatistics,
  config = DEFAULT_READABILITY_CONFIG
): AssessmentResult {
  const percentage = stats.passiveVoicePercentage
  const maxPercentage = config.passiveVoice.maxPercentage

  if (stats.sentenceCount === 0) {
    return {
      score: 0,
      text: 'No sentences found to assess passive voice usage.',
      id: 'passive-voice',
      rating: 'feedback'
    }
  }

  if (percentage <= maxPercentage) {
    return {
      score: 9,
      text: `Excellent! ${percentage.toFixed(1)}% of sentences use passive voice, which is within the recommended maximum of ${maxPercentage}%.`,
      id: 'passive-voice',
      rating: 'good'
    }
  }

  if (percentage <= maxPercentage * 1.5) {
    return {
      score: 6,
      text: `${percentage.toFixed(1)}% of sentences use passive voice, which is slightly above the recommended maximum of ${maxPercentage}%. Try to use more active voice.`,
      id: 'passive-voice',
      rating: 'ok'
    }
  }

  return {
    score: 3,
    text: `${percentage.toFixed(1)}% of sentences use passive voice, which is well above the recommended maximum of ${maxPercentage}%. Use active voice to make your writing more engaging.`,
    id: 'passive-voice',
    rating: 'bad'
  }
}