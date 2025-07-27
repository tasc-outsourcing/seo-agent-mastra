# Upgrade Guide: v1.0.0 to v2.0.0

This guide helps you upgrade from TASC Blog Article Agent v1 to v2.0.0, which includes significant security improvements, new features, and breaking changes.

## Breaking Changes

### 1. Environment Variables

The application now validates environment variables on startup. Missing required variables will prevent the application from starting.

**Action Required:**
- Update your `.env.local` file with all required variables
- Use `.env.example` as a template
- Ensure `OPENAI_API_KEY` and `DATABASE_URL` are set

### 2. Authentication Required

All API routes now require authentication using Clerk.

**Action Required:**
- Set up a Clerk account at https://clerk.com
- Add Clerk environment variables:
  ```bash
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
  CLERK_SECRET_KEY=your_secret
  ```
- Update API calls to include authentication headers

### 3. Tool Changes

The research tools have been consolidated into a single unified tool.

**Before (v1):**
```typescript
import { blogResearchTool, tascWebSearchTool, tascDeepResearchTool } from './tools'
```

**After (v2):**
```typescript
import { unifiedResearchTool } from './tools/unified-research'
```

**Action Required:**
- Update any custom code that directly imports old research tools
- Use `unifiedResearchTool` for all research operations

### 4. API Response Format

All API responses now include security headers and follow a consistent format.

**Action Required:**
- Update frontend code to handle new response headers
- Check for authentication errors (401 status)

## New Features

### 1. Security Enhancements

- Environment variable validation
- Input sanitization on all endpoints
- Rate limiting (100 requests/minute)
- Security headers on all responses
- Audit logging for security events

### 2. SEO Improvements

- Advanced SEO scoring (0-100 scale)
- Content quality assessments
- Technical SEO validation
- Semantic keyword analysis
- Real-time recommendations

### 3. New Agents

- SEO Orchestrator Agent
- SEO Research Agent
- SEO Structure Agent
- SEO Content Agent
- SEO Optimization Agent

### 4. Docker Support

```bash
# New Docker commands
make dev      # Start development environment
make prod     # Start production environment
make logs     # View logs
make clean    # Clean up
```

## Migration Steps

### Step 1: Backup Your Data

```bash
# Backup your database
cp storage.db storage.db.backup

# Backup your environment file
cp .env.local .env.local.backup
```

### Step 2: Update Dependencies

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

### Step 3: Update Environment Variables

```bash
# Copy new example file
cp .env.example .env.local

# Edit and add your existing values
# Add new required values (Clerk keys)
```

### Step 4: Run Database Migrations

The application will automatically handle database migrations on first run.

### Step 5: Update Your Code

#### If you have custom agents:
```typescript
// Update tool imports
import { unifiedResearchTool } from '@/mastra/tools/unified-research'

// Update agent configuration
const myAgent = new Agent({
  // ... your config
  tools: {
    unifiedResearchTool, // Use new unified tool
  }
})
```

#### If you have custom API calls:
```typescript
// Add authentication
const response = await fetch('/api/articles', {
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  },
})
```

### Step 6: Test Your Application

```bash
# Run tests
npm test

# Start development server
npm run dev

# Test key features:
# - Authentication flow
# - Article creation
# - SEO analysis
# - API endpoints
```

## Troubleshooting

### Environment Validation Errors

If you see "Failed to validate environment variables":
1. Check the console for specific missing variables
2. Refer to `.env.example` for all required variables
3. Ensure no typos in variable names

### Authentication Errors

If you get 401 Unauthorized errors:
1. Verify Clerk keys are correctly set
2. Check middleware configuration
3. Ensure auth tokens are being sent with requests

### Tool Not Found Errors

If you see "Tool not found" errors:
1. Update to use `unifiedResearchTool`
2. Check tool registration in `src/mastra/index.ts`
3. Verify tool imports are correct

### Rate Limiting Issues

If you hit rate limits:
1. Default is 100 requests/minute
2. Implement request throttling in your client
3. Contact admin to increase limits if needed

## Support

If you encounter issues during the upgrade:

1. Check the [CHANGELOG.md](CHANGELOG.md) for detailed changes
2. Review the updated documentation
3. Submit an issue on GitHub with:
   - Error messages
   - Steps to reproduce
   - Environment details

## Rollback Plan

If you need to rollback to v1:

```bash
# Restore backups
cp storage.db.backup storage.db
cp .env.local.backup .env.local

# Checkout v1 code
git checkout v1.0.0

# Reinstall v1 dependencies
rm -rf node_modules package-lock.json
npm install
```

Remember to test thoroughly in a staging environment before upgrading production systems.