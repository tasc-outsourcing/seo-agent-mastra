import { ContentStatistics } from '../types'
import { TRANSITION_WORDS, COMPLEX_WORDS_SYLLABLE_THRESHOLD } from '../config'

export function analyzeText(content: string, keyword?: string): ContentStatistics {
  const cleanContent = stripHtml(content)
  const sentences = getSentences(cleanContent)
  const words = getWords(cleanContent)
  const paragraphs = getParagraphs(content)
  
  const stats: ContentStatistics = {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    syllableCount: 0,
    complexWordCount: 0,
    linkCount: {
      internal: 0,
      external: 0
    },
    imageCount: 0,
    headingCount: {
      h1: 0,
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0
    },
    averageSentenceLength: 0,
    averageParagraphLength: 0,
    passiveVoicePercentage: 0,
    transitionWordPercentage: 0
  }

  // Calculate syllables and complex words
  words.forEach(word => {
    const syllables = countSyllables(word)
    stats.syllableCount += syllables
    if (syllables >= COMPLEX_WORDS_SYLLABLE_THRESHOLD) {
      stats.complexWordCount++
    }
  })

  // Calculate averages
  stats.averageSentenceLength = stats.sentenceCount > 0 
    ? stats.wordCount / stats.sentenceCount 
    : 0
    
  stats.averageParagraphLength = stats.paragraphCount > 0
    ? stats.wordCount / stats.paragraphCount
    : 0

  // Calculate Flesch Reading Ease
  if (stats.sentenceCount > 0 && stats.wordCount > 0) {
    stats.fleschReadingEase = 
      206.835 - 
      1.015 * (stats.wordCount / stats.sentenceCount) -
      84.6 * (stats.syllableCount / stats.wordCount)
    stats.fleschReadingEase = Math.max(0, Math.min(100, stats.fleschReadingEase))
  }

  // Calculate passive voice percentage
  stats.passiveVoicePercentage = calculatePassiveVoicePercentage(sentences)

  // Calculate transition word percentage
  stats.transitionWordPercentage = calculateTransitionWordPercentage(sentences)

  // Calculate keyword density if keyword provided
  if (keyword) {
    stats.keywordDensity = calculateKeywordDensity(cleanContent, keyword)
  }

  // Count links
  const linkCounts = countLinks(content)
  stats.linkCount = linkCounts

  // Count images
  stats.imageCount = countImages(content)

  // Count headings
  stats.headingCount = countHeadings(content)

  return stats
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getSentences(text: string): string[] {
  // Split by sentence-ending punctuation
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  return sentences.map(s => s.trim()).filter(s => s.length > 0)
}

export function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0)
}

export function getParagraphs(html: string): string[] {
  const paragraphs = html.match(/<p[^>]*>.*?<\/p>/gi) || []
  return paragraphs.map(p => stripHtml(p)).filter(p => p.length > 0)
}

export function countSyllables(word: string): number {
  word = word.toLowerCase()
  let count = 0
  let previousWasVowel = false
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = /[aeiou]/.test(word[i])
    if (isVowel && !previousWasVowel) {
      count++
    }
    previousWasVowel = isVowel
  }
  
  // Adjust for silent e
  if (word.endsWith('e') && count > 1) {
    count--
  }
  
  // Ensure at least one syllable
  return Math.max(1, count)
}

export function calculatePassiveVoicePercentage(sentences: string[]): number {
  if (sentences.length === 0) return 0
  
  const passiveIndicators = [
    /\b(was|were|been|being|is|are|am)\s+\w+ed\b/i,
    /\b(was|were|been|being|is|are|am)\s+\w+en\b/i,
    /\b(get|gets|got|gotten|getting)\s+\w+ed\b/i
  ]
  
  let passiveCount = 0
  sentences.forEach(sentence => {
    if (passiveIndicators.some(pattern => pattern.test(sentence))) {
      passiveCount++
    }
  })
  
  return (passiveCount / sentences.length) * 100
}

export function calculateTransitionWordPercentage(sentences: string[]): number {
  if (sentences.length === 0) return 0
  
  let transitionCount = 0
  sentences.forEach(sentence => {
    const sentenceLower = sentence.toLowerCase()
    if (TRANSITION_WORDS.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i')
      return regex.test(sentenceLower)
    })) {
      transitionCount++
    }
  })
  
  return (transitionCount / sentences.length) * 100
}

export function calculateKeywordDensity(text: string, keyword: string): number {
  const words = getWords(text)
  if (words.length === 0) return 0
  
  const keywordLower = keyword.toLowerCase()
  const keywordWords = keywordLower.split(/\s+/)
  let occurrences = 0
  
  // For single-word keywords
  if (keywordWords.length === 1) {
    occurrences = words.filter(word => word === keywordLower).length
  } else {
    // For multi-word keywords
    const textLower = text.toLowerCase()
    const regex = new RegExp(`\\b${keywordLower}\\b`, 'g')
    const matches = textLower.match(regex)
    occurrences = matches ? matches.length : 0
  }
  
  return (occurrences / words.length) * 100
}

export function countLinks(html: string): { internal: number, external: number } {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
  let match
  let internal = 0
  let external = 0
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    if (href.startsWith('http://') || href.startsWith('https://')) {
      external++
    } else if (!href.startsWith('mailto:') && !href.startsWith('tel:')) {
      internal++
    }
  }
  
  return { internal, external }
}

export function countImages(html: string): number {
  const imgRegex = /<img[^>]+>/gi
  const matches = html.match(imgRegex)
  return matches ? matches.length : 0
}

export function countHeadings(html: string): ContentStatistics['headingCount'] {
  const counts = {
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0
  }
  
  for (let i = 1; i <= 6; i++) {
    const regex = new RegExp(`<h${i}[^>]*>.*?</h${i}>`, 'gi')
    const matches = html.match(regex)
    counts[`h${i}` as keyof typeof counts] = matches ? matches.length : 0
  }
  
  return counts
}