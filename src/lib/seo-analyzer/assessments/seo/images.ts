import { AssessmentResult, ContentStatistics } from '../../types'

export function assessImages(stats: ContentStatistics): AssessmentResult {
  const imageCount = stats.imageCount
  const wordCount = stats.wordCount

  // For short content, images might not be necessary
  if (wordCount < 300) {
    if (imageCount === 0) {
      return {
        score: 6,
        text: 'No images found. Consider adding an image to make your content more engaging.',
        id: 'images',
        rating: 'ok'
      }
    }
    return {
      score: 9,
      text: 'Good! Your content includes images.',
      id: 'images',
      rating: 'good'
    }
  }

  // For longer content, images are more important
  if (imageCount === 0) {
    return {
      score: 3,
      text: 'No images found. Add images to make your content more engaging and to break up the text.',
      id: 'images',
      rating: 'bad'
    }
  }

  // Check image density for longer content
  const wordsPerImage = wordCount / imageCount

  if (wordsPerImage > 500) {
    return {
      score: 6,
      text: `You have ${imageCount} image${imageCount > 1 ? 's' : ''} for ${wordCount} words. Consider adding more images to better illustrate your content.`,
      id: 'images',
      rating: 'ok'
    }
  }

  return {
    score: 9,
    text: `Perfect! You have ${imageCount} image${imageCount > 1 ? 's' : ''} in your content, providing good visual support.`,
    id: 'images',
    rating: 'good'
  }
}