import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnv, getEnv, isFeatureEnabled, getApiKey } from '../env';

describe('Environment Utils', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env for each test
    process.env = { ...originalEnv };
    // Clear the cached env
    (global as any).__envCache = undefined;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should validate required environment variables', () => {
      process.env = {
        OPENAI_API_KEY: 'test-key',
        DATABASE_URL: 'file:test.db',
        NODE_ENV: 'test'
      };

      expect(() => validateEnv()).not.toThrow();
    });

    it('should throw on missing required variables', () => {
      process.env = {
        DATABASE_URL: 'file:test.db'
      };

      expect(() => validateEnv()).toThrow('Failed to validate environment variables');
    });

    it('should use default DATABASE_URL if not provided', () => {
      process.env = {
        OPENAI_API_KEY: 'test-key'
      };

      const env = validateEnv();
      expect(env.DATABASE_URL).toBe('file:./storage.db');
    });

    it('should validate NODE_ENV values', () => {
      process.env = {
        OPENAI_API_KEY: 'test-key',
        NODE_ENV: 'invalid'
      };

      expect(() => validateEnv()).toThrow();
    });
  });

  describe('isFeatureEnabled', () => {
    beforeEach(() => {
      process.env = {
        OPENAI_API_KEY: 'test-key',
        DATABASE_URL: 'file:test.db'
      };
    });

    it('should check Clerk feature', () => {
      expect(isFeatureEnabled('clerk')).toBe(false);

      process.env.CLERK_SECRET_KEY = 'test-secret';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-public';
      
      // Clear cache to pick up new env
      (global as any).__envCache = undefined;
      
      expect(isFeatureEnabled('clerk')).toBe(true);
    });

    it('should check Exa feature', () => {
      expect(isFeatureEnabled('exa')).toBe(false);

      process.env.EXA_API_KEY = 'test-exa-key';
      (global as any).__envCache = undefined;
      
      expect(isFeatureEnabled('exa')).toBe(true);
    });

    it('should check Google feature', () => {
      expect(isFeatureEnabled('google')).toBe(false);

      process.env.GOOGLE_SERVICE_ACCOUNT_KEY = '{"type":"service_account"}';
      process.env.GOOGLE_DRIVE_FOLDER_ID = 'folder-id';
      (global as any).__envCache = undefined;
      
      expect(isFeatureEnabled('google')).toBe(true);
    });

    it('should check MongoDB feature', () => {
      expect(isFeatureEnabled('mongodb')).toBe(false);

      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (global as any).__envCache = undefined;
      
      expect(isFeatureEnabled('mongodb')).toBe(true);
    });

    it('should check Turso feature', () => {
      expect(isFeatureEnabled('turso')).toBe(false);

      process.env.TURSO_DATABASE_URL = 'libsql://test.turso.io';
      process.env.TURSO_AUTH_TOKEN = 'test-token';
      (global as any).__envCache = undefined;
      
      expect(isFeatureEnabled('turso')).toBe(true);
    });
  });

  describe('getApiKey', () => {
    beforeEach(() => {
      process.env = {
        OPENAI_API_KEY: 'test-openai-key',
        DATABASE_URL: 'file:test.db'
      };
    });

    it('should return OpenAI API key', () => {
      expect(getApiKey('openai')).toBe('test-openai-key');
    });

    it('should throw for missing Exa API key', () => {
      expect(() => getApiKey('exa')).toThrow('EXA_API_KEY is required but not configured');
    });

    it('should return Exa API key when configured', () => {
      process.env.EXA_API_KEY = 'test-exa-key';
      (global as any).__envCache = undefined;
      
      expect(getApiKey('exa')).toBe('test-exa-key');
    });

    it('should throw for unknown API key', () => {
      expect(() => getApiKey('unknown' as any)).toThrow('Unknown API key: unknown');
    });
  });

  describe('getEnv', () => {
    it('should cache environment after first call', () => {
      process.env = {
        OPENAI_API_KEY: 'test-key',
        DATABASE_URL: 'file:test.db'
      };

      const env1 = getEnv();
      const env2 = getEnv();
      
      expect(env1).toStrictEqual(env2); // Same values
    });
  });
});