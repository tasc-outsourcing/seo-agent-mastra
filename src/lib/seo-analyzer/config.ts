import { SEOConfig, ReadabilityConfig } from './types'

export const DEFAULT_SEO_CONFIG: SEOConfig = {
  keyword: {
    minDensity: 0.5,
    maxDensity: 3.0,
    morphologyMinDensity: 0.5,
    morphologyMaxDensity: 3.5
  },
  metaDescription: {
    minLength: 120,
    maxLength: 156
  },
  title: {
    minLength: 30,
    maxLength: 60
  },
  content: {
    minWords: 300,
    cornerstoneMinWords: 900
  },
  headings: {
    minKeywordDensity: 30,
    maxKeywordDensity: 75
  }
}

export const DEFAULT_READABILITY_CONFIG: ReadabilityConfig = {
  sentence: {
    maxWords: 20,
    maxRecommendedPercentage: 25
  },
  paragraph: {
    maxWords: 150
  },
  passiveVoice: {
    maxPercentage: 10
  },
  transitionWords: {
    minPercentage: 30
  },
  flesch: {
    targetScore: 60
  },
  wordComplexity: {
    maxPercentage: 10
  }
}

export const TRANSITION_WORDS = [
  // Addition
  'also', 'moreover', 'furthermore', 'additionally', 'besides', 'plus', 'likewise',
  'similarly', 'equally', 'identically', 'uniquely', 'alternatively',
  
  // Contrast
  'however', 'although', 'but', 'yet', 'still', 'nevertheless', 'nonetheless',
  'conversely', 'instead', 'otherwise', 'rather', 'whereas', 'despite',
  'regardless', 'notwithstanding',
  
  // Cause and Effect
  'therefore', 'thus', 'hence', 'consequently', 'accordingly', 'because',
  'since', 'due to', 'as a result', 'for this reason', 'so',
  
  // Time
  'meanwhile', 'subsequently', 'afterwards', 'then', 'next', 'finally',
  'eventually', 'later', 'previously', 'simultaneously', 'during',
  
  // Example
  'for example', 'for instance', 'specifically', 'namely', 'particularly',
  'especially', 'notably', 'including', 'such as',
  
  // Emphasis
  'indeed', 'certainly', 'undoubtedly', 'obviously', 'clearly', 'naturally',
  'of course', 'importantly', 'significantly',
  
  // Sequence
  'first', 'second', 'third', 'firstly', 'secondly', 'thirdly', 'lastly',
  'initially', 'primarily', 'predominantly',
  
  // Conclusion
  'in conclusion', 'to conclude', 'in summary', 'to summarize', 'overall',
  'altogether', 'in short', 'briefly', 'to sum up', 'ultimately'
]

export const COMPLEX_WORDS_SYLLABLE_THRESHOLD = 3

export const SCORE_TO_RATING_MAP = {
  error: -1,
  feedback: 0,
  bad: [1, 2, 3, 4],
  ok: [5, 6, 7],
  good: [8, 9]
}

export const OVERALL_SCORE_THRESHOLDS = {
  good: 80,
  ok: 60
}