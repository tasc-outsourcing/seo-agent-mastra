import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';

/**
 * Masks sensitive data in strings (API keys, tokens, etc.)
 */
export function maskSensitiveData(text: string): string {
  let masked = text;
  
  // Mask API Keys (sk-xxxx format)
  masked = masked.replace(/sk[-_][a-zA-Z0-9]+/g, (match) => {
    return match.substring(0, 4) + '*'.repeat(match.length - 6) + match.substring(match.length - 2);
  });
  
  // Mask API key patterns
  masked = masked.replace(/api[-_]?key[:=]\s*["']?([a-zA-Z0-9_\-]+)["']?/gi, (match, key) => {
    const prefix = match.substring(0, match.indexOf(key));
    const hasQuotes = match.includes('"');
    const maskedKey = key.substring(0, 4) + '*'.repeat(key.length - 6) + key.substring(key.length - 2);
    return hasQuotes ? prefix + maskedKey + '"' : prefix + maskedKey;
  });
  
  // Mask Bearer tokens
  masked = masked.replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, (match) => {
    return 'Bearer ' + '*'.repeat(match.length - 7);
  });
  
  // Mask email addresses (partial mask)
  masked = masked.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, local, domain) => {
    return local.substring(0, 2) + '***@' + domain;
  });
  
  // Mask MongoDB URIs
  masked = masked.replace(/mongodb(\+srv)?:\/\/[^@]+@[^/]+/g, (match) => {
    const protocol = match.match(/^mongodb(\+srv)?:\/\//)?.[0] || 'mongodb://';
    return protocol + '*'.repeat(match.length - protocol.length);
  });
  
  // Mask secrets
  masked = masked.replace(/secret[:=]\s*["']?([a-zA-Z0-9_\-]{10,})["']?/gi, (match) => {
    const prefix = match.match(/^secret[:=]\s*/i)?.[0] || 'secret: ';
    return prefix + '*'.repeat(match.length - prefix.length);
  });
  
  // Mask passwords
  masked = masked.replace(/password[:=]\s*["']?([^"'\s]{8,})["']?/gi, (match) => {
    const prefix = match.match(/^password[:=]\s*/i)?.[0] || 'password=';
    return prefix + '*'.repeat(match.length - prefix.length);
  });
  
  return masked;
}

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validates and sanitizes URLs
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Hash sensitive data for storage
 */
export function hashData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

/**
 * Simple in-memory rate limiter
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(
      timestamp => now - timestamp < this.config.windowMs
    );
    
    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

/**
 * Input validation schemas
 */
export const inputSchemas = {
  // Article content validation
  articleContent: z.object({
    title: z.string().min(1).max(200).transform(sanitizeInput),
    content: z.string().min(1).max(50000).transform(sanitizeInput),
    keyword: z.string().min(1).max(100).transform(sanitizeInput),
    metaDescription: z.string().max(160).optional().transform(val => val ? sanitizeInput(val) : undefined),
  }),
  
  // Search query validation
  searchQuery: z.object({
    query: z.string().min(1).max(500).transform(sanitizeInput),
    limit: z.number().min(1).max(100).default(10),
  }),
  
  // URL validation
  url: z.string().url().refine(url => {
    const sanitized = sanitizeUrl(url);
    return sanitized !== null;
  }, 'Invalid URL'),
};

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
};

/**
 * Audit logger for security events
 */
export class SecurityAuditLogger {
  log(event: {
    type: 'auth_failure' | 'rate_limit' | 'invalid_input' | 'api_error';
    userId?: string;
    ip?: string;
    details: any;
  }): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ...event,
      // Mask any sensitive data in details
      details: typeof event.details === 'string' 
        ? maskSensitiveData(event.details)
        : event.details,
    };
    
    // In production, this would send to a proper logging service
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry));
  }
}

export const auditLogger = new SecurityAuditLogger();