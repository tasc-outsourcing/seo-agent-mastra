/**
 * Security utilities for deep research agent
 */

/**
 * Sanitizes user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Simple audit logger for security events
 */
export class SecurityAuditLogger {
  log(event: {
    type: 'api_error' | 'invalid_input';
    details: any;
  }): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ...event,
    };
    
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry));
  }
}

export const auditLogger = new SecurityAuditLogger();