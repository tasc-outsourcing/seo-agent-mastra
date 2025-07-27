import { assessSemanticKeywords } from '../assessments/seo/semantic-keywords';
import { assessHeadingStructure } from '../assessments/seo/heading-structure';
import { assessContentFreshness } from '../assessments/seo/content-freshness';
import { assessExternalLinks } from '../assessments/seo/external-links';
import { SEOData, ContentStatistics } from '../types';
import { describe, it, expect } from 'vitest';

describe('SEO Assessments', () => {
  describe('assessSemanticKeywords', () => {
    const baseStats: ContentStatistics = {
      wordCount: 500,
      sentenceCount: 25,
      paragraphCount: 5,
      syllableCount: 750,
      complexWordCount: 50,
      linkCount: { internal: 2, external: 1 },
      imageCount: 1,
      headingCount: { h1: 1, h2: 3, h3: 2, h4: 0, h5: 0, h6: 0 },
      averageSentenceLength: 20,
      averageParagraphLength: 100,
      passiveVoicePercentage: 5,
      transitionWordPercentage: 30
    };

    it('should score well when semantic keywords are present', () => {
      const seoData: SEOData = {
        content: 'This content discusses machine learning, artificial intelligence, neural networks, and deep learning algorithms extensively.',
        keyword: 'AI',
        semanticKeywords: ['machine learning', 'neural networks', 'deep learning']
      };

      const result = assessSemanticKeywords(seoData, baseStats);

      expect(result.rating).toBe('good');
      expect(result.score).toBeGreaterThanOrEqual(7);
    });

    it('should handle missing semantic keywords', () => {
      const seoData: SEOData = {
        content: 'This content is about something completely different.',
        keyword: 'AI'
      };

      const result = assessSemanticKeywords(seoData, baseStats);

      expect(result.rating).toBe('ok');
      expect(result.text).toContain('No semantic keywords defined');
    });

    it('should penalize overuse of semantic keywords', () => {
      const repeatedContent = 'machine learning '.repeat(100);
      const seoData: SEOData = {
        content: repeatedContent,
        keyword: 'AI',
        semanticKeywords: ['machine learning']
      };

      const result = assessSemanticKeywords(seoData, { ...baseStats, wordCount: 200 });

      expect(result.score).toBeLessThan(9);
      expect(result.text).toContain('appears too frequently');
    });
  });

  describe('assessHeadingStructure', () => {
    it('should score well for proper heading hierarchy', () => {
      const content = `
        <h1>Main Title with SEO keyword</h1>
        <h2>First Section about SEO</h2>
        <p>Content...</p>
        <h3>Subsection</h3>
        <p>More content...</p>
        <h2>Second Section with SEO tips</h2>
        <h3>Another subsection</h3>
      `;

      const stats: ContentStatistics = {
        ...baseStats,
        headingCount: { h1: 1, h2: 2, h3: 2, h4: 0, h5: 0, h6: 0 }
      };

      const result = assessHeadingStructure(content, stats, 'SEO');

      expect(result.rating).toBe('good');
      expect(result.score).toBe(9);
    });

    it('should detect missing H1', () => {
      const content = `
        <h2>Section without main title</h2>
        <p>Content...</p>
      `;

      const stats: ContentStatistics = {
        ...baseStats,
        headingCount: { h1: 0, h2: 1, h3: 0, h4: 0, h5: 0, h6: 0 }
      };

      const result = assessHeadingStructure(content, stats, 'keyword');

      expect(result.rating).toBe('bad');
      expect(result.text).toContain('No H1 heading found');
    });

    it('should detect hierarchy issues', () => {
      const content = `
        <h1>Title</h1>
        <h3>Skipping H2</h3>
        <h5>Skipping H4</h5>
      `;

      const stats: ContentStatistics = {
        ...baseStats,
        headingCount: { h1: 1, h2: 0, h3: 1, h4: 0, h5: 1, h6: 0 }
      };

      const result = assessHeadingStructure(content, stats, 'keyword');

      expect(result.rating).not.toBe('good');
      expect(result.text).toContain('hierarchy issues');
    });
  });

  describe('assessContentFreshness', () => {
    it('should score well for fresh content', () => {
      const currentYear = new Date().getFullYear();
      const content = `
        This article was updated in ${currentYear} with the latest information.
        Recent developments in the field show promising results.
        As of ${currentYear}, new regulations have been implemented.
      `;

      const result = assessContentFreshness(content, baseStats);

      expect(result.rating).toBe('good');
      expect(result.score).toBe(9);
    });

    it('should detect stale content', () => {
      const content = `
        This outdated guide from 2019 covers obsolete techniques.
        These deprecated methods are no longer recommended.
        Legacy systems from 2020 should be avoided.
      `;

      const result = assessContentFreshness(content, baseStats);

      expect(result.rating).toBe('bad');
      expect(result.text).toContain('lacks freshness indicators');
    });
  });

  describe('assessExternalLinks', () => {
    it('should score well for quality external links', () => {
      const content = `
        According to <a href="https://harvard.edu/research" target="_blank">Harvard research</a>,
        the findings are significant. The <a href="https://nature.com/article" target="_blank">Nature journal</a>
        published similar results. See also <a href="https://github.com/example" target="_blank">this implementation</a>.
      `;

      const stats: ContentStatistics = {
        ...baseStats,
        wordCount: 300,
        linkCount: { internal: 0, external: 3 }
      };

      const result = assessExternalLinks(content, stats);

      expect(result.rating).toBe('good');
      expect(result.text).toContain('Excellent external linking');
    });

    it('should detect missing external links', () => {
      const content = 'Content without any external links to authoritative sources.';

      const stats: ContentStatistics = {
        ...baseStats,
        linkCount: { internal: 2, external: 0 }
      };

      const result = assessExternalLinks(content, stats);

      expect(result.rating).toBe('bad');
      expect(result.text).toContain('No external links found');
    });

    it('should detect too many external links', () => {
      const content = 'Short content with ' + 
        '<a href="https://example1.com">link1</a> ' +
        '<a href="https://example2.com">link2</a> ' +
        '<a href="https://example3.com">link3</a> ' +
        '<a href="https://example4.com">link4</a> ' +
        '<a href="https://example5.com">link5</a>';

      const stats: ContentStatistics = {
        ...baseStats,
        wordCount: 50,
        linkCount: { internal: 0, external: 5 }
      };

      const result = assessExternalLinks(content, stats);

      expect(result.score).toBeLessThan(6);
    });
  });
});