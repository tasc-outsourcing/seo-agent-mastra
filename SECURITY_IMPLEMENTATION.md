# Security Implementation Guide

This guide provides step-by-step instructions for implementing the security improvements identified in the security audit.

## 1. Environment Variable Security

### Step 1: Update all tools to use secure environment access

Replace direct `process.env` access with the secure `getEnv()` and `getApiKey()` functions:

```typescript
// Before (insecure)
const exa = new Exa(process.env.EXA_API_KEY);

// After (secure)
import { getApiKey, isFeatureEnabled } from '@/lib/env';

if (isFeatureEnabled('exa')) {
  const exa = new Exa(getApiKey('exa'));
}
```

### Step 2: Add startup validation

In your main application file or `src/app/layout.tsx`:

```typescript
import { validateEnv } from '@/lib/env';

// Validate environment on startup
if (typeof window === 'undefined') {
  validateEnv();
}
```

### Step 3: Update Docker configurations

Replace environment variable exposure in docker-compose files:

```yaml
# Use .env file instead of direct exposure
env_file:
  - .env
```

## 2. Authentication Implementation

### Step 1: Replace existing middleware

```bash
# Backup existing middleware
cp src/middleware.ts src/middleware.backup.ts

# Use secure middleware
cp src/middleware.secure.ts src/middleware.ts
```

### Step 2: Protect API routes

Update all API routes to include authentication:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

### Step 3: Add role-based access control

```typescript
// In your user metadata or database
interface UserMetadata {
  role: 'admin' | 'editor' | 'viewer';
}

// In protected routes
const { userId, sessionClaims } = await auth();
const userRole = sessionClaims?.metadata?.role || 'viewer';

if (userRole !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## 3. Input Validation & Sanitization

### Step 1: Update all API routes

Use Zod schemas with sanitization:

```typescript
import { inputSchemas, sanitizeInput } from '@/lib/security';

// Define schema
const schema = z.object({
  title: z.string().transform(sanitizeInput),
  content: z.string().transform(sanitizeInput),
});

// Validate input
const result = schema.safeParse(await request.json());
if (!result.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
```

### Step 2: Update tools to use secure versions

```bash
# Update imports in agent files
sed -i '' 's/unified-research/unified-research.secure/g' src/mastra/agents/*.ts
```

## 4. Logging & Monitoring

### Step 1: Implement audit logging

Add logging to all security-relevant events:

```typescript
import { auditLogger } from '@/lib/security';

// Log authentication failures
auditLogger.log({
  type: 'auth_failure',
  userId: userId || 'anonymous',
  ip: request.ip,
  details: { reason: 'Invalid token' }
});
```

### Step 2: Set up monitoring alerts

Configure alerts for:
- Multiple failed authentication attempts
- Rate limit violations
- Unusual API usage patterns

## 5. Security Headers

### Step 1: Update Next.js configuration

Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
          }
        ],
      },
    ];
  },
};
```

## 6. Database Security

### Step 1: Encrypt sensitive data

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  // ... encryption logic
}

export function decrypt(encrypted: string): string {
  // ... decryption logic
}
```

### Step 2: Use parameterized queries

Always use parameterized queries to prevent SQL injection:

```typescript
// Good
const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// Bad - vulnerable to SQL injection
const result = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

## 7. API Key Rotation

### Step 1: Implement key versioning

```typescript
// Store API keys with version
interface APIKey {
  id: string;
  key: string;
  version: number;
  createdAt: Date;
  expiresAt: Date;
  active: boolean;
}
```

### Step 2: Create rotation script

```typescript
// scripts/rotate-api-keys.ts
async function rotateAPIKeys() {
  // 1. Generate new keys
  // 2. Update environment variables
  // 3. Mark old keys for deprecation
  // 4. Notify administrators
}
```

## 8. Testing Security

### Step 1: Add security tests

Create `src/__tests__/security.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { sanitizeInput, sanitizeUrl } from '@/lib/security';

describe('Security Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>'))
        .toBe('alert("xss")');
    });
  });
  
  describe('sanitizeUrl', () => {
    it('should reject javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });
  });
});
```

### Step 2: Add integration tests

Test authentication and authorization:

```typescript
describe('API Security', () => {
  it('should reject unauthenticated requests', async () => {
    const response = await fetch('/api/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });
    expect(response.status).toBe(401);
  });
});
```

## 9. Deployment Security

### Step 1: Use secrets management

For production deployment:

```bash
# Vercel
vercel secrets add openai-api-key "sk-..."

# Update vercel.json
{
  "env": {
    "OPENAI_API_KEY": "@openai-api-key"
  }
}
```

### Step 2: Enable security features

- Enable HTTPS only
- Configure CORS properly
- Set up Web Application Firewall (WAF)
- Enable DDoS protection

## 10. Security Checklist

Before deploying to production:

- [ ] All environment variables validated on startup
- [ ] All API routes require authentication
- [ ] Input validation on all user inputs
- [ ] Security headers configured
- [ ] Audit logging implemented
- [ ] Rate limiting enabled
- [ ] Sensitive data encrypted
- [ ] No secrets in code or git history
- [ ] Security tests passing
- [ ] Dependencies up to date (`npm audit`)

## Monitoring & Maintenance

1. **Weekly Tasks**:
   - Review audit logs for anomalies
   - Check for new dependency vulnerabilities
   - Monitor rate limit violations

2. **Monthly Tasks**:
   - Rotate API keys
   - Review and update security policies
   - Conduct security testing

3. **Quarterly Tasks**:
   - Full security audit
   - Penetration testing
   - Update security documentation

## Resources

- [OWASP Security Checklist](https://owasp.org/www-project-web-security-testing-guide/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Clerk Security Documentation](https://clerk.com/docs/security/overview)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)