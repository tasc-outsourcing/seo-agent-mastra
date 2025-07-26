import { AssessmentResult, ContentStatistics } from '../../types'

export function assessFleschReadingEase(stats: ContentStatistics): AssessmentResult {
  if (!stats.fleschReadingEase || stats.wordCount === 0) {
    return {
      score: 0,
      text: 'Unable to calculate Flesch Reading Ease score.',
      id: 'flesch-reading-ease',
      rating: 'feedback'
    }
  }

  const score = stats.fleschReadingEase

  // Determine difficulty level and score
  if (score >= 90) {
    return {
      score: 9,
      text: `Excellent! Your text has a Flesch Reading Ease score of ${score.toFixed(1)}, making it very easy to read.`,
      id: 'flesch-reading-ease',
      rating: 'good'
    }
  }

  if (score >= 80) {
    return {
      score: 9,
      text: `Great! Your text has a Flesch Reading Ease score of ${score.toFixed(1)}, making it easy to read.`,
      id: 'flesch-reading-ease',
      rating: 'good'
    }
  }

  if (score >= 70) {
    return {
      score: 8,
      text: `Good! Your text has a Flesch Reading Ease score of ${score.toFixed(1)}, making it fairly easy to read.`,
      id: 'flesch-reading-ease',
      rating: 'good'
    }
  }

  if (score >= 60) {
    return {
      score: 6,
      text: `Your text has a Flesch Reading Ease score of ${score.toFixed(1)}, which is standard for most content.`,
      id: 'flesch-reading-ease',
      rating: 'ok'
    }
  }

  if (score >= 50) {
    return {
      score: 5,
      text: `Your text has a Flesch Reading Ease score of ${score.toFixed(1)}, making it fairly difficult to read. Consider simplifying your sentences.`,
      id: 'flesch-reading-ease',
      rating: 'ok'
    }
  }

  if (score >= 30) {
    return {
      score: 3,
      text: `Your text has a Flesch Reading Ease score of ${score.toFixed(1)}, making it difficult to read. Use shorter sentences and simpler words.`,
      id: 'flesch-reading-ease',
      rating: 'bad'
    }
  }

  return {
    score: 2,
    text: `Your text has a Flesch Reading Ease score of ${score.toFixed(1)}, making it very difficult to read. Significantly simplify your writing.`,
    id: 'flesch-reading-ease',
    rating: 'bad'
  }
}