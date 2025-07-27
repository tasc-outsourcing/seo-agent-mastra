import { authMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isFeatureEnabled } from "@/lib/env"
import { RateLimiter, auditLogger, securityHeaders } from "@/lib/security"

// Rate limiter for API routes (100 requests per minute)
const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/api/health",
];

// API routes that require authentication
const protectedApiRoutes = [
  "/api/chat",
  "/api/articles",
  "/api/workflows",
  "/api/agents",
];

/**
 * Enhanced middleware with security features
 */
export function secureMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Add security headers to all responses
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const identifier = `api:${ip}`;
    
    if (!apiRateLimiter.isAllowed(identifier)) {
      auditLogger.log({
        type: 'rate_limit',
        ip,
        details: { path: pathname },
      });
      
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: response.headers }
      );
    }
  }
  
  // Check if Clerk is enabled
  if (!isFeatureEnabled('clerk')) {
    console.warn('⚠️  Clerk authentication is not configured. Running without authentication.');
    return response;
  }
  
  // Apply Clerk authentication
  return authMiddleware({
    publicRoutes,
    ignoredRoutes: [],
    beforeAuth: (req) => {
      // Additional security checks before auth
      const url = new URL(req.url);
      
      // Prevent open redirects
      const redirectParam = url.searchParams.get('redirect');
      if (redirectParam) {
        try {
          const redirectUrl = new URL(redirectParam, req.url);
          if (redirectUrl.origin !== url.origin) {
            return NextResponse.redirect(new URL('/', req.url));
          }
        } catch {
          return NextResponse.redirect(new URL('/', req.url));
        }
      }
    },
    afterAuth: (auth, req) => {
      const { pathname } = req.nextUrl;
      
      // Check if API route requires authentication
      if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
        if (!auth.userId && !auth.isPublicRoute) {
          auditLogger.log({
            type: 'auth_failure',
            ip: req.ip || 'unknown',
            details: { path: pathname },
          });
          
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401, headers: response.headers }
          );
        }
      }
      
      // Add user context to headers for downstream use
      if (auth.userId) {
        response.headers.set('x-user-id', auth.userId);
      }
      
      return response;
    },
  })(request);
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    "/api/:path*",
  ],
}

export default secureMiddleware;