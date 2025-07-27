import { z } from 'zod';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Required API Keys
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('file:./storage.db'),
  
  // Optional Authentication (Clerk)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  
  // Optional External APIs
  EXA_API_KEY: z.string().optional(),
  
  // Optional Database (Turso)
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
  
  // Optional Google Integration
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().optional(),
  
  // Optional MongoDB
  MONGODB_URI: z.string().url().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Validates environment variables and returns typed configuration
 * Throws an error if required variables are missing
 */
export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Failed to validate environment variables');
  }
  
  return parsed.data;
}

/**
 * Get validated environment variables
 * Cached after first call
 */
let env: z.infer<typeof envSchema> | undefined;

// Make cache accessible for testing
if (typeof global !== 'undefined') {
  (global as any).__envCache = undefined;
}

export function getEnv() {
  // Check global cache for testing
  if (typeof global !== 'undefined' && (global as any).__envCache === undefined) {
    env = undefined;
  }
  
  if (!env) {
    env = validateEnv();
  }
  return env;
}

/**
 * Check if a specific feature is enabled based on environment variables
 */
export function isFeatureEnabled(feature: 'clerk' | 'exa' | 'google' | 'mongodb' | 'turso'): boolean {
  const config = getEnv();
  
  switch (feature) {
    case 'clerk':
      return !!(config.CLERK_SECRET_KEY && config.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    case 'exa':
      return !!config.EXA_API_KEY;
    case 'google':
      return !!(config.GOOGLE_SERVICE_ACCOUNT_KEY && config.GOOGLE_DRIVE_FOLDER_ID);
    case 'mongodb':
      return !!config.MONGODB_URI;
    case 'turso':
      return !!(config.TURSO_DATABASE_URL && config.TURSO_AUTH_TOKEN);
    default:
      return false;
  }
}

/**
 * Get API key with proper error handling
 */
export function getApiKey(key: 'openai' | 'exa'): string {
  const config = getEnv();
  
  switch (key) {
    case 'openai':
      return config.OPENAI_API_KEY;
    case 'exa':
      if (!config.EXA_API_KEY) {
        throw new Error('EXA_API_KEY is required but not configured');
      }
      return config.EXA_API_KEY;
    default:
      throw new Error(`Unknown API key: ${key}`);
  }
}

// Type exports
export type Env = z.infer<typeof envSchema>;