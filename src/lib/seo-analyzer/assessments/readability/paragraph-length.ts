import { AssessmentResult } from '../../types'
import { DEFAULT_READABILITY_CONFIG } from '../../config'
import { getParagraphs, getWords } from '../../utils/text-statistics'

export function assessParagraphLength(
  content: string,
  config = DEFAULT_READABILITY_CONFIG
): AssessmentResult {
  const paragraphs = getParagraphs(content)
  
  if (paragraphs.length === 0) {
    return {
      score: 0,
      text: 'No paragraphs found in the content.',
      id: 'paragraph-length',
      rating: 'feedback'
    }
  }

  const maxWords = config.paragraph.maxWords
  let tooLongCount = 0

  paragraphs.forEach(paragraph => {
    const words = getWords(paragraph)
    if (words.length > maxWords) {
      tooLongCount++
    }
  })

  if (tooLongCount === 0) {
    return {
      score: 9,
      text: `Great! None of your paragraphs exceed ${maxWords} words.`,
      id: 'paragraph-length',
      rating: 'good'
    }
  }

  const percentage = (tooLongCount / paragraphs.length) * 100

  if (tooLongCount === 1) {
    return {
      score: 6,
      text: `1 paragraph exceeds ${maxWords} words. Consider breaking it up for better readability.`,
      id: 'paragraph-length',
      rating: 'ok'
    }
  }

  if (percentage <= 20) {
    return {
      score: 6,
      text: `${tooLongCount} paragraphs exceed ${maxWords} words. Consider breaking them up.`,
      id: 'paragraph-length',
      rating: 'ok'
    }
  }

  return {
    score: 3,
    text: `${tooLongCount} paragraphs (${percentage.toFixed(1)}%) exceed ${maxWords} words. Break up long paragraphs to improve readability.`,
    id: 'paragraph-length',
    rating: 'bad'
  }
}