import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';

// Mock environment variables for tests
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.DATABASE_URL = 'file:test.db';
process.env.NODE_ENV = 'test';

// Add custom matchers
expect.extend({
  toBeValidSEOScore(received: unknown) {
    const pass = typeof received === 'number' && received >= 0 && received <= 100;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid SEO score (0-100)`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid SEO score (0-100)`,
        pass: false,
      };
    }
  },
});

// Declare custom matchers for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidSEOScore(): T
  }
  interface AsymmetricMatchersContaining {
    toBeValidSEOScore(): any
  }
}