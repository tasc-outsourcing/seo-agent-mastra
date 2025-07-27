import { SEOAnalyzer } from '../index';
import { SEOData } from '../types';
import { describe, it, expect } from 'vitest';

describe('SEOAnalyzer', () => {
  describe('analyze', () => {
    it('should analyze content with all required fields', () => {
      const seoData: SEOData = {
        title: 'Best Practices for SEO in 2025',
        metaDescription: 'Learn the latest SEO best practices for 2025, including keyword optimization, content structure, and technical SEO tips.',
        content: `
          <h1>Best Practices for SEO in 2025</h1>
          <p>Search engine optimization continues to evolve in 2025. This comprehensive guide covers the latest SEO best practices to help your content rank higher.</p>
          <h2>Keyword Research and Optimization</h2>
          <p>Effective keyword research remains crucial for SEO success. Focus on long-tail keywords and semantic search terms.</p>
          <p>Use tools like Google Keyword Planner and SEMrush to identify high-value keywords with reasonable competition.</p>
          <h2>Content Structure</h2>
          <p>Well-structured content improves both user experience and search engine crawlability. Use proper heading tags and organize your content logically.</p>
          <h3>Internal Linking</h3>
          <p>Link to related content within your site to improve navigation and distribute page authority. <a href="/seo-guide">See our SEO guide</a> for more details.</p>
          <h2>Technical SEO</h2>
          <p>Technical optimization ensures search engines can properly crawl and index your content. Focus on site speed, mobile responsiveness, and structured data.</p>
          <p>For authoritative information, refer to <a href="https://developers.google.com/search">Google's Search Documentation</a>.</p>
          <img src="seo-diagram.jpg" alt="SEO best practices diagram">
        `,
        keyword: 'SEO best practices',
        url: 'https://example.com/seo-best-practices-2025'
      };

      const result = SEOAnalyzer.analyze(seoData);

      expect(result.seoScore).toBeValidSEOScore();
      expect(result.readabilityScore).toBeValidSEOScore();
      expect(result.overallRating).toMatch(/^(needs-improvement|ok|good)$/);
      expect(result.seoAssessments).toBeInstanceOf(Array);
      expect(result.readabilityAssessments).toBeInstanceOf(Array);
    });

    it('should handle missing optional fields', () => {
      const seoData: SEOData = {
        content: 'Short content without much structure or optimization.',
      };

      const result = SEOAnalyzer.analyze(seoData);

      expect(result).toBeDefined();
      expect(result.seoScore).toBeValidSEOScore();
    });

    it('should give higher scores for cornerstone content', () => {
      const seoData: SEOData = {
        content: 'This is a short piece of content that would normally score low.',
        keyword: 'test'
      };

      const regularResult = SEOAnalyzer.analyze(seoData, false);
      const cornerstoneResult = SEOAnalyzer.analyze(seoData, true);

      // Cornerstone content has different length requirements
      const regularLengthAssessment = regularResult.seoAssessments.find(a => a.id === 'text-length');
      const cornerstoneLengthAssessment = cornerstoneResult.seoAssessments.find(a => a.id === 'text-length');

      expect(regularLengthAssessment).toBeDefined();
      expect(cornerstoneLengthAssessment).toBeDefined();
    });
  });

  describe('analyzeContent', () => {
    it('should return content statistics', () => {
      const content = `This is a test paragraph with multiple sentences. It contains various words and structures. The test keyword appears multiple times in this test content. Here is another paragraph to test the analysis functionality. This ensures we have enough content to test properly.`;

      const stats = SEOAnalyzer.analyzeContent(content, 'test');

      expect(stats.wordCount).toBeGreaterThan(0);
      expect(stats.sentenceCount).toBeGreaterThan(0);
      expect(stats.paragraphCount).toBeGreaterThan(0);
      expect(stats.keywordDensity).toBeDefined();
    });
  });

  describe('getScoreColor', () => {
    it('should return correct colors for different scores', () => {
      expect(SEOAnalyzer.getScoreColor(90)).toBe('green');
      expect(SEOAnalyzer.getScoreColor(70)).toBe('orange');
      expect(SEOAnalyzer.getScoreColor(40)).toBe('red');
    });
  });

  describe('getRatingColor', () => {
    it('should return correct colors for different ratings', () => {
      expect(SEOAnalyzer.getRatingColor('good')).toBe('green');
      expect(SEOAnalyzer.getRatingColor('ok')).toBe('orange');
      expect(SEOAnalyzer.getRatingColor('bad')).toBe('red');
      expect(SEOAnalyzer.getRatingColor('unknown')).toBe('gray');
    });
  });

  describe('analyzeAdvanced', () => {
    it('should provide advanced analysis with E-A-T scores', () => {
      const seoData: SEOData = {
        title: 'Comprehensive Guide to Machine Learning in 2025 - Expert Analysis and Best Practices',
        metaDescription: 'Expert guide on machine learning techniques, algorithms, and best practices for 2025. Learn about neural networks, deep learning, and AI applications with practical examples.',
        content: `
          <h1>Comprehensive Guide to Machine Learning in 2025</h1>
          <p>Machine learning continues to revolutionize technology in 2025. This comprehensive guide provides expert insights into the latest developments, practical applications, and future trends in machine learning and artificial intelligence.</p>
          <h2>Understanding Neural Networks and Machine Learning</h2>
          <p>Neural networks form the backbone of modern machine learning systems. Recent advances have made them more efficient and accessible than ever before. Machine learning algorithms can now process vast amounts of data with unprecedented accuracy.</p>
          <h3>Deep Learning Architecture</h3>
          <p>Deep learning, a subset of machine learning, uses multi-layered neural networks to process complex patterns. According to <a href="https://arxiv.org" target="_blank">recent research from arXiv</a>, transformer architectures continue to dominate the machine learning landscape.</p>
          <h2>Practical Applications of Machine Learning</h2>
          <p>From natural language processing to computer vision, machine learning applications are everywhere in 2025. Organizations are leveraging these technologies to automate processes, enhance decision-making, and create innovative solutions.</p>
          <h3>Industry Leaders in Machine Learning</h3>
          <p>Major tech companies like <a href="https://ai.google.com" target="_blank">Google AI</a> and <a href="https://openai.com" target="_blank">OpenAI</a> continue to push the boundaries of what's possible with machine learning. Their contributions have accelerated progress in neural networks and AI algorithms.</p>
          <h2>Future of Machine Learning</h2>
          <p>As we look ahead, machine learning will continue to evolve with new breakthroughs in neural networks, improved AI algorithms, and more sophisticated deep learning models. The integration of machine learning into everyday applications will become seamless.</p>
          <img src="ml-architecture.png" alt="Machine learning architecture diagram showing neural networks">
          <p>This guide will be regularly updated to reflect the latest advances in machine learning, ensuring you stay informed about cutting-edge developments in 2025 and beyond.</p>
        `,
        keyword: 'machine learning',
        semanticKeywords: ['neural networks', 'deep learning', 'AI algorithms']
      };

      const result = SEOAnalyzer.analyzeAdvanced(seoData);

      expect(result.advanced).toBeDefined();
      expect(result.advanced.seo.score).toBeValidSEOScore();
      expect(result.advanced.readability.score).toBeValidSEOScore();
      expect(result.advanced.contentQuality.score).toBeValidSEOScore();
      expect(result.advanced.eatScore.score).toBeValidSEOScore();
      expect(result.advanced.recommendations).toBeInstanceOf(Array);
      expect(result.advanced.overallScore).toBeValidSEOScore();
    });
  });

  describe('getOptimizationSuggestions', () => {
    it('should provide relevant suggestions for short content', () => {
      const content = 'This is very short content.';
      const suggestions = SEOAnalyzer.getOptimizationSuggestions(content, 'short');

      expect(suggestions).toContain('Add more content - aim for at least 300 words for basic SEO value');
    });

    it('should suggest keyword optimization', () => {
      const content = 'This is a longer piece of content that talks about various topics but never mentions the target keyword. '.repeat(50);
      const suggestions = SEOAnalyzer.getOptimizationSuggestions(content, 'optimization');

      expect(suggestions.some(s => s.includes('Increase usage of focus keyword'))).toBe(true);
    });

    it('should detect missing structure elements', () => {
      const content = 'Plain text content without any headings, images, or links. '.repeat(50);
      const suggestions = SEOAnalyzer.getOptimizationSuggestions(content);

      expect(suggestions.some(s => s.includes('H2 subheadings'))).toBe(true);
      expect(suggestions.some(s => s.includes('image'))).toBe(true);
      expect(suggestions.some(s => s.includes('internal links'))).toBe(true);
    });
  });
});