import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { inputSchemas, auditLogger, securityHeaders } from '@/lib/security';
import { getEnv } from '@/lib/env';

// Request schema with validation
const requestSchema = z.object({
  action: z.enum(['analyze', 'generate', 'optimize']),
  data: inputSchemas.articleContent,
});

/**
 * Secure API route example with authentication and input validation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      auditLogger.log({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        details: { path: '/api/secure-example' },
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: securityHeaders }
      );
    }
    
    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      auditLogger.log({
        type: 'invalid_input',
        userId,
        details: { 
          errors: validationResult.error.flatten(),
          path: '/api/secure-example',
        },
      });
      
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.flatten() },
        { status: 400, headers: securityHeaders }
      );
    }
    
    const { action, data } = validationResult.data;
    
    // 3. Check environment configuration
    const env = getEnv();
    if (!env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 503, headers: securityHeaders }
      );
    }
    
    // 4. Process the request based on action
    let result;
    switch (action) {
      case 'analyze':
        // Perform analysis with sanitized data
        result = {
          action: 'analyze',
          status: 'success',
          data: {
            title: data.title,
            wordCount: data.content.split(' ').length,
            keywordFound: data.content.toLowerCase().includes(data.keyword.toLowerCase()),
          },
        };
        break;
        
      case 'generate':
        // Generate content (placeholder)
        result = {
          action: 'generate',
          status: 'success',
          data: {
            generated: `Generated content for "${data.title}" with keyword "${data.keyword}"`,
          },
        };
        break;
        
      case 'optimize':
        // Optimize content (placeholder)
        result = {
          action: 'optimize',
          status: 'success',
          data: {
            optimized: true,
            suggestions: [
              `Add more instances of "${data.keyword}"`,
              'Improve meta description',
              'Add internal links',
            ],
          },
        };
        break;
    }
    
    // 5. Return successful response with security headers
    return NextResponse.json(result, {
      status: 200,
      headers: securityHeaders,
    });
    
  } catch (error) {
    // 6. Error handling with logging
    console.error('API Error:', error);
    auditLogger.log({
      type: 'api_error',
      userId: (await auth()).userId || 'unknown',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        path: '/api/secure-example',
      },
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders }
    );
  }
}

// GET endpoint to check API status
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  
  return NextResponse.json({
    status: 'ok',
    authenticated: !!userId,
    timestamp: new Date().toISOString(),
  }, {
    headers: securityHeaders,
  });
}