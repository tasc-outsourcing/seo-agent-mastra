import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { mastra } from '@/mastra'
import { z } from 'zod'
import { sanitizeInput, auditLogger, securityHeaders } from '@/lib/security'

export const maxDuration = 300 // 5 minutes for workflow execution

// Workflow input validation schema
const workflowInputSchema = z.object({
  topic: z.string().min(1).max(500).transform(sanitizeInput),
  articleType: z.enum(['informational', 'commercial', 'transactional', 'hybrid']).optional(),
  targetAudience: z.string().max(200).optional().transform(val => val ? sanitizeInput(val) : undefined),
  researchOption: z.enum(['new', 'existing']).optional(),
  existingResearch: z.string().max(10000).optional().transform(val => val ? sanitizeInput(val) : undefined)
})

export async function POST(request: NextRequest) {
  let userId: string | null = null
  
  try {
    const authResult = await auth()
    userId = authResult.userId
    
    if (!userId) {
      auditLogger.log({
        type: 'auth_failure',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: { path: '/api/workflow/seo-article', method: 'POST' }
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = workflowInputSchema.safeParse(body)
    if (!validationResult.success) {
      auditLogger.log({
        type: 'invalid_input',
        userId,
        details: { 
          path: '/api/workflow/seo-article',
          errors: validationResult.error.flatten()
        }
      })
      return NextResponse.json({ 
        error: 'Invalid input',
        details: validationResult.error.flatten()
      }, { status: 400, headers: securityHeaders })
    }
    
    const { topic, articleType, targetAudience, researchOption, existingResearch } = validationResult.data

    // Get the SEO article workflow
    const workflow = mastra.getWorkflow('seoArticleWorkflow')
    
    if (!workflow) {
      auditLogger.log({
        type: 'api_error',
        userId,
        details: { 
          path: '/api/workflow/seo-article',
          error: 'Workflow not found'
        }
      })
      return NextResponse.json({ error: 'SEO article workflow not found' }, { status: 500, headers: securityHeaders })
    }

    // Prepare workflow input
    const workflowInput = {
      userInput: topic,
      articleType: articleType || 'informational',
      targetAudience: targetAudience || 'technical professionals',
      urgency: 'standard' as const,
      // Add research data if provided
      ...(researchOption === 'existing' && existingResearch && {
        existingResearch
      })
    }

    try {
      // Execute the SEO article workflow using proper Mastra API
      console.log(`[Workflow] User ${userId} starting SEO article workflow for topic: "${topic}"`)
      
      const run = await workflow.createRunAsync()
      const result = await run.start({
        inputData: workflowInput
      })
      
      console.log(`[Workflow] Execution result for user ${userId}: ${result.status}`)
      
      if (result.status === 'success') {
        return NextResponse.json({
          success: true,
          result: result.result,
          workflowId: 'seoArticleWorkflow',
          input: workflowInput,
          executionStatus: result.status
        }, { headers: securityHeaders })
      } else if (result.status === 'suspended') {
        return NextResponse.json({
          success: false,
          error: 'Workflow suspended - requires human interaction',
          suspendedSteps: result.suspended,
          workflowId: 'seoArticleWorkflow'
        }, { status: 202, headers: securityHeaders })
      } else {
        auditLogger.log({
          type: 'api_error',
          userId,
          details: { 
            path: '/api/workflow/seo-article',
            error: 'Workflow execution failed',
            workflowError: result.error
          }
        })
        return NextResponse.json({
          success: false,
          error: 'Workflow execution failed',
          details: result.error || 'Unknown workflow error',
          workflowId: 'seoArticleWorkflow'
        }, { status: 500, headers: securityHeaders })
      }
    } catch (error) {
      console.error('Workflow execution error:', error)
      auditLogger.log({
        type: 'api_error',
        userId,
        details: { 
          path: '/api/workflow/seo-article',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500, headers: securityHeaders })
    }

  } catch (error) {
    console.error('API error:', error)
    auditLogger.log({
      type: 'api_error',
      userId: userId || 'unknown',
      details: { 
        path: '/api/workflow/seo-article',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: securityHeaders })
  }
}

// GET endpoint to check workflow status or get workflow info
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      auditLogger.log({
        type: 'auth_failure',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: { path: '/api/workflow/seo-article', method: 'GET' }
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders })
    }

    // Get workflow info
    const workflow = mastra.getWorkflow('seoArticleWorkflow')
    
    if (!workflow) {
      return NextResponse.json({ error: 'SEO article workflow not found' }, { status: 404, headers: securityHeaders })
    }

    return NextResponse.json({
      workflowId: workflow.id,
      description: workflow.description,
      available: true
    }, { headers: securityHeaders })

  } catch (error) {
    console.error('API error:', error)
    auditLogger.log({
      type: 'api_error',
      details: { 
        path: '/api/workflow/seo-article',
        method: 'GET',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500, headers: securityHeaders })
  }
}