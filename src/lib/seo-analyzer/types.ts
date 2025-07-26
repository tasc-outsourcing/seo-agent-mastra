export type AssessmentScore = -50 | -10 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type AssessmentRating = 'error' | 'feedback' | 'bad' | 'ok' | 'good'

export interface AssessmentResult {
  score: AssessmentScore
  text: string
  id: string
  rating: AssessmentRating
}

export interface SEOData {
  title?: string
  metaDescription?: string
  url?: string
  content: string
  keyword?: string
  synonyms?: string[]
  relatedKeywords?: string[]
}

export interface ReadabilityData {
  content: string
  locale?: string
}

export interface AnalysisResult {
  seoScore: number
  readabilityScore: number
  seoAssessments: AssessmentResult[]
  readabilityAssessments: AssessmentResult[]
  overallRating: 'needs-improvement' | 'ok' | 'good'
}

export interface ContentStatistics {
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  syllableCount: number
  complexWordCount: number
  linkCount: {
    internal: number
    external: number
  }
  imageCount: number
  headingCount: {
    h1: number
    h2: number
    h3: number
    h4: number
    h5: number
    h6: number
  }
  keywordDensity?: number
  fleschReadingEase?: number
  averageSentenceLength: number
  averageParagraphLength: number
  passiveVoicePercentage: number
  transitionWordPercentage: number
}

export interface SEOConfig {
  keyword: {
    minDensity: number
    maxDensity: number
    morphologyMinDensity: number
    morphologyMaxDensity: number
  }
  metaDescription: {
    minLength: number
    maxLength: number
  }
  title: {
    minLength: number
    maxLength: number
  }
  content: {
    minWords: number
    cornerstoneMinWords: number
  }
  headings: {
    minKeywordDensity: number
    maxKeywordDensity: number
  }
}

export interface ReadabilityConfig {
  sentence: {
    maxWords: number
    maxRecommendedPercentage: number
  }
  paragraph: {
    maxWords: number
  }
  passiveVoice: {
    maxPercentage: number
  }
  transitionWords: {
    minPercentage: number
  }
  flesch: {
    targetScore: number
  }
  wordComplexity: {
    maxPercentage: number
  }
}