import { describe, it, expect, beforeEach } from 'vitest';
import { 
  sanitizeInput, 
  sanitizeUrl, 
  maskSensitiveData,
  RateLimiter,
  generateSecureToken,
  hashData,
  inputSchemas
} from '../security';

describe('Security Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeInput('Hello <b>world</b>')).toBe('Hello world');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('JAVASCRIPT:void(0)')).toBe('void(0)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('click me onclick=alert(1)')).toBe('click me alert(1)');
      expect(sanitizeInput('test onmouseover=hack()')).toBe('test hack()');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid http/https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(sanitizeUrl('http://localhost:3000')).toBe('http://localhost:3000/');
    });

    it('should reject javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeUrl('JAVASCRIPT:void(0)')).toBeNull();
    });

    it('should reject other protocols', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
      expect(sanitizeUrl('ftp://example.com')).toBeNull();
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
      expect(sanitizeUrl('')).toBeNull();
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask API keys', () => {
      expect(maskSensitiveData('sk-1234567890abcdef')).toMatch(/sk-1\*+ef/);
      expect(maskSensitiveData('api_key: "abc123def456"')).toMatch(/api_key: "abc1\*+56"/);
    });

    it('should mask bearer tokens', () => {
      expect(maskSensitiveData('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'))
        .toMatch(/Bearer \*+/);
    });

    it('should partially mask email addresses', () => {
      expect(maskSensitiveData('user@example.com')).toBe('us***@example.com');
      expect(maskSensitiveData('admin@company.org')).toBe('ad***@company.org');
    });

    it('should mask MongoDB URIs', () => {
      expect(maskSensitiveData('mongodb://user:pass@host:27017'))
        .toMatch(/mongodb:\/\/\*+/);
      expect(maskSensitiveData('mongodb+srv://user:pass@cluster.mongodb.net'))
        .toMatch(/mongodb\+srv:\/\/\*+/);
    });

    it('should mask secrets and passwords', () => {
      expect(maskSensitiveData('secret: mysecretvalue123')).toMatch(/secret: \*+/);
      expect(maskSensitiveData('password=SuperSecret123!')).toMatch(/password=\*+/);
    });
  });

  describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        windowMs: 1000, // 1 second
        maxRequests: 3
      });
    });

    it('should allow requests within limit', () => {
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
      expect(limiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      expect(limiter.isAllowed('user2')).toBe(true);
      expect(limiter.isAllowed('user2')).toBe(true);
      expect(limiter.isAllowed('user2')).toBe(true);
      expect(limiter.isAllowed('user2')).toBe(false);
    });

    it('should track different identifiers separately', () => {
      expect(limiter.isAllowed('user3')).toBe(true);
      expect(limiter.isAllowed('user4')).toBe(true);
      expect(limiter.isAllowed('user3')).toBe(true);
      expect(limiter.isAllowed('user4')).toBe(true);
    });

    it('should reset limits after window expires', async () => {
      expect(limiter.isAllowed('user5')).toBe(true);
      expect(limiter.isAllowed('user5')).toBe(true);
      expect(limiter.isAllowed('user5')).toBe(true);
      expect(limiter.isAllowed('user5')).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(limiter.isAllowed('user5')).toBe(true);
    });

    it('should reset specific identifier', () => {
      expect(limiter.isAllowed('user6')).toBe(true);
      expect(limiter.isAllowed('user6')).toBe(true);
      expect(limiter.isAllowed('user6')).toBe(true);
      expect(limiter.isAllowed('user6')).toBe(false);
      
      limiter.reset('user6');
      
      expect(limiter.isAllowed('user6')).toBe(true);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate tokens of correct length', () => {
      expect(generateSecureToken()).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(generateSecureToken(16)).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('hashData', () => {
    it('should generate consistent hashes', () => {
      const data = 'test data';
      expect(hashData(data)).toBe(hashData(data));
    });

    it('should generate different hashes for different data', () => {
      expect(hashData('data1')).not.toBe(hashData('data2'));
    });

    it('should generate 64-character hex hashes', () => {
      expect(hashData('test')).toHaveLength(64);
      expect(hashData('test')).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('inputSchemas', () => {
    describe('articleContent', () => {
      it('should validate and sanitize article content', () => {
        const input = {
          title: '<script>alert("xss")</script>Title',
          content: 'Content with <b>HTML</b>',
          keyword: 'test keyword',
          metaDescription: 'Description'
        };
        
        const result = inputSchemas.articleContent.parse(input);
        
        expect(result.title).toBe('alert("xss")Title');
        expect(result.content).toBe('Content with HTML');
      });

      it('should enforce length limits', () => {
        expect(() => inputSchemas.articleContent.parse({
          title: 'a'.repeat(201),
          content: 'test',
          keyword: 'test'
        })).toThrow();
      });
    });

    describe('searchQuery', () => {
      it('should validate and sanitize search queries', () => {
        const result = inputSchemas.searchQuery.parse({
          query: 'search <script>alert(1)</script>',
          limit: 50
        });
        
        expect(result.query).toBe('search alert(1)');
        expect(result.limit).toBe(50);
      });

      it('should apply default limit', () => {
        const result = inputSchemas.searchQuery.parse({
          query: 'search term'
        });
        
        expect(result.limit).toBe(10);
      });

      it('should enforce limit bounds', () => {
        expect(() => inputSchemas.searchQuery.parse({
          query: 'test',
          limit: 101
        })).toThrow();
      });
    });

    describe('url', () => {
      it('should validate URLs', () => {
        expect(inputSchemas.url.parse('https://example.com')).toBe('https://example.com');
      });

      it('should reject invalid URLs', () => {
        expect(() => inputSchemas.url.parse('javascript:alert(1)')).toThrow();
        expect(() => inputSchemas.url.parse('not-a-url')).toThrow();
      });
    });
  });
});