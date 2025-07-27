import { z } from 'zod';

/**
 * Environment variable validation schema for deep research agent
 */
const envSchema = z.object({
  // Required API Keys
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  EXA_API_KEY: z.string().min(1, 'EXA_API_KEY is required for web search'),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Validates environment variables and returns typed configuration
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
 */
let env: z.infer<typeof envSchema> | undefined;

export function getEnv() {
  if (!env) {
    env = validateEnv();
  }
  return env;
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
      return config.EXA_API_KEY;
    default:
      throw new Error(`Unknown API key: ${key}`);
  }
}

export type Env = z.infer<typeof envSchema>;