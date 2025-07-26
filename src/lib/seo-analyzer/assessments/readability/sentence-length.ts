import { AssessmentResult, ContentStatistics } from '../../types'
import { DEFAULT_READABILITY_CONFIG } from '../../config'
import { getSentences, getWords } from '../../utils/text-statistics'

export function assessSentenceLength(
  content: string,
  stats: ContentStatistics,
  config = DEFAULT_READABILITY_CONFIG
): AssessmentResult {
  const sentences = getSentences(content)
  
  if (sentences.length === 0) {
    return {
      score: 0,
      text: 'No sentences found in the content.',
      id: 'sentence-length',
      rating: 'feedback'
    }
  }

  const maxWords = config.sentence.maxWords
  const maxPercentage = config.sentence.maxRecommendedPercentage

  let tooLongCount = 0
  sentences.forEach(sentence => {
    const words = getWords(sentence)
    if (words.length > maxWords) {
      tooLongCount++
    }
  })

  const percentage = (tooLongCount / sentences.length) * 100

  if (percentage === 0) {
    return {
      score: 9,
      text: `Excellent! None of your sentences exceed ${maxWords} words.`,
      id: 'sentence-length',
      rating: 'good'
    }
  }

  if (percentage <= maxPercentage) {
    return {
      score: 9,
      text: `${percentage.toFixed(1)}% of sentences are over ${maxWords} words, which is within the recommended maximum of ${maxPercentage}%.`,
      id: 'sentence-length',
      rating: 'good'
    }
  }

  if (percentage <= 30) {
    return {
      score: 6,
      text: `${percentage.toFixed(1)}% of sentences are over ${maxWords} words, which is slightly above the recommended maximum of ${maxPercentage}%. Consider shortening some sentences.`,
      id: 'sentence-length',
      rating: 'ok'
    }
  }

  return {
    score: 3,
    text: `${percentage.toFixed(1)}% of sentences are over ${maxWords} words, which is well above the recommended maximum of ${maxPercentage}%. Shorten your sentences to improve readability.`,
    id: 'sentence-length',
    rating: 'bad'
  }
}