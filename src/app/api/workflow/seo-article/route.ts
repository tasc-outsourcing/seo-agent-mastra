import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { mastra } from '@/mastra'
import { z } from 'zod'
import { sanitizeInput, securityHeaders, auditLogger } from '@/lib/security'

export const maxDuration = 300 // 5 minutes for workflow execution

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      auditLogger.log({ type: 'auth_failure', details: { route: 'seo-article-workflow' } })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders })
    }

    // Define validation schema
    const workflowSchema = z.object({
      topic: z.string().min(1).max(500).transform(sanitizeInput),
      articleType: z.enum(['informational', 'how-to', 'comparison', 'listicle']).optional(),
      targetAudience: z.string().max(200).optional().transform(val => val ? sanitizeInput(val) : undefined),
      researchOption: z.enum(['new', 'existing']).optional(),
      existingResearch: z.string().max(10000).optional().transform(val => val ? sanitizeInput(val) : undefined)
    })

    const body = await request.json()
    
    // Validate input
    const validationResult = workflowSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input',
        details: validationResult.error.flatten()
      }, { status: 400, headers: securityHeaders })
    }
    
    const { topic, articleType, targetAudience, researchOption, existingResearch } = validationResult.data

    // Get the SEO article workflow
    const workflow = mastra.getWorkflow('seoArticleWorkflow')
    
    if (!workflow) {
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
      console.log('Creating workflow run for:', workflowInput)
      
      const run = await workflow.createRunAsync()
      const result = await run.start({
        inputData: workflowInput
      })
      
      console.log('Workflow execution result:', result.status)
      
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
        return NextResponse.json({
          success: false,
          error: 'Workflow execution failed',
          details: result.error || 'Unknown workflow error',
          workflowId: 'seoArticleWorkflow'
        }, { status: 500, headers: securityHeaders })
      }
    } catch (error) {
      console.error('API error:', error)
      auditLogger.log({
        type: 'api_error',
        userId,
        details: { route: 'seo-article-workflow', error: error instanceof Error ? error.message : 'Unknown error' }
      })
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500, headers: securityHeaders })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check workflow status or get workflow info
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      auditLogger.log({ type: 'auth_failure', details: { route: 'seo-article-workflow' } })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: securityHeaders })
  }
}