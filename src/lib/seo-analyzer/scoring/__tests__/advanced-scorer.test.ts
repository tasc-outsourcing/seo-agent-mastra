import { AdvancedSEOScorer } from '../advanced-scorer';
import { AssessmentResult, AnalysisResult } from '../../types';
import { describe, it, expect } from 'vitest';

describe('AdvancedSEOScorer', () => {
  const createAssessment = (id: string, score: number, rating: string): AssessmentResult => ({
    id,
    score: score as any,
    rating: rating as any,
    text: `Assessment for ${id}`
  });

  describe('calculateAdvancedScore', () => {
    it('should calculate weighted scores correctly', () => {
      const assessments: AssessmentResult[] = [
        createAssessment('title', 9, 'good'),
        createAssessment('meta-description', 6, 'ok'),
        createAssessment('keyword-density', 3, 'bad'),
        createAssessment('text-length', 9, 'good'),
      ];

      const result = AdvancedSEOScorer.calculateAdvancedScore(assessments);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
    });

    it('should identify critical issues', () => {
      const assessments: AssessmentResult[] = [
        createAssessment('title', 3, 'bad'), // Critical factor
        createAssessment('images', 6, 'ok'), // Beneficial factor
      ];

      const result = AdvancedSEOScorer.calculateAdvancedScore(assessments);

      expect(result.insights).toContain('Critical issue: Assessment for title');
    });

    it('should provide appropriate overall insights', () => {
      const excellentAssessments: AssessmentResult[] = [
        createAssessment('title', 9, 'good'),
        createAssessment('meta-description', 9, 'good'),
        createAssessment('keyword-density', 9, 'good'),
      ];

      const result = AdvancedSEOScorer.calculateAdvancedScore(excellentAssessments);

      expect(result.insights[0]).toContain('Excellent SEO optimization');
      expect(result.score).toBeGreaterThanOrEqual(90);
    });
  });

  describe('calculateContentQualityScore', () => {
    it('should evaluate content quality factors', () => {
      const analysis: AnalysisResult = {
        seoScore: 80,
        readabilityScore: 70,
        seoAssessments: [
          createAssessment('text-length', 9, 'good'),
          createAssessment('heading-structure', 6, 'ok'),
          createAssessment('keyword-density', 9, 'good'),
          createAssessment('internal-links', 3, 'bad'),
          createAssessment('content-freshness', 9, 'good'),
        ],
        readabilityAssessments: [],
        overallRating: 'good'
      };

      const result = AdvancedSEOScorer.calculateContentQualityScore(analysis);

      expect(result.score).toBeGreaterThan(0);
      expect(result.factors.comprehensiveContent).toBe(true);
      expect(result.factors.goodReadability).toBe(true);
      expect(result.factors.properStructure).toBe(true);
      expect(result.factors.keywordOptimized).toBe(true);
      expect(result.factors.hasLinks).toBe(false);
      expect(result.factors.freshContent).toBe(true);
    });
  });

  describe('generateRecommendations', () => {
    it('should prioritize critical issues', () => {
      const analysis: AnalysisResult = {
        seoScore: 50,
        readabilityScore: 60,
        seoAssessments: [
          createAssessment('title', 3, 'bad'), // Critical
          createAssessment('images', 3, 'bad'), // Beneficial
          createAssessment('semantic-keywords', 3, 'bad'), // Important
        ],
        readabilityAssessments: [],
        overallRating: 'needs-improvement'
      };

      const recommendations = AdvancedSEOScorer.generateRecommendations(analysis);

      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].impact).toContain('High impact');
      expect(recommendations.length).toBeLessThanOrEqual(10);
    });

    it('should handle error ratings', () => {
      const analysis: AnalysisResult = {
        seoScore: 30,
        readabilityScore: 40,
        seoAssessments: [
          { id: 'title', score: -1, rating: 'error', text: 'Title missing' }
        ],
        readabilityAssessments: [],
        overallRating: 'needs-improvement'
      };

      const recommendations = AdvancedSEOScorer.generateRecommendations(analysis);

      expect(recommendations.some(r => r.priority === 'high')).toBe(true);
    });
  });

  describe('calculateEATScore', () => {
    it('should calculate E-A-T factors correctly', () => {
      const analysis: AnalysisResult = {
        seoScore: 75,
        readabilityScore: 80,
        seoAssessments: [
          createAssessment('text-length', 9, 'good'),
          createAssessment('semantic-keywords', 9, 'good'),
          createAssessment('external-links', 9, 'good'),
          createAssessment('heading-structure', 6, 'ok'),
          createAssessment('content-freshness', 9, 'good'),
          createAssessment('meta-description', 9, 'good'),
        ],
        readabilityAssessments: [
          createAssessment('flesch-reading-ease', 6, 'ok'),
        ],
        overallRating: 'good'
      };

      const result = AdvancedSEOScorer.calculateEATScore(analysis);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.factors.expertise).toBeGreaterThan(0);
      expect(result.factors.authority).toBeGreaterThan(0);
      expect(result.factors.trust).toBeGreaterThan(0);
    });

    it('should handle missing assessments', () => {
      const analysis: AnalysisResult = {
        seoScore: 50,
        readabilityScore: 50,
        seoAssessments: [],
        readabilityAssessments: [],
        overallRating: 'ok'
      };

      const result = AdvancedSEOScorer.calculateEATScore(analysis);

      expect(result.score).toBe(0);
      expect(result.factors.expertise).toBe(0);
      expect(result.factors.authority).toBe(0);
      expect(result.factors.trust).toBe(0);
    });
  });
});