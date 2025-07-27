import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { mastra } from '@/mastra'
import { z } from 'zod'
import { sanitizeInput, securityHeaders, auditLogger } from '@/lib/security'
import { apiOptimizer } from '@/lib/api-optimizer'
import { performanceMonitor } from '@/lib/performance-monitor'
import { agentActivityLogger } from '@/lib/agent-activity-logger'
import { createCacheKey } from '@/lib/performance-cache'

export const maxDuration = 300 // 5 minutes for workflow execution

export async function POST(request: NextRequest) {
  const activityId = await agentActivityLogger.startActivity(
    'SEOArticleWorkflow',
    'Processing SEO article generation request',
    { route: '/api/workflow/seo-article' }
  )

  try {
    const { userId } = await auth()
    
    if (!userId) {
      auditLogger.log({ type: 'auth_failure', details: { route: 'seo-article-workflow' } })
      await agentActivityLogger.completeActivity(activityId, undefined, 'Unauthorized access')
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
      // Generate cache key for potential caching
      const cacheKey = createCacheKey('workflow', 'seoArticle', topic, articleType, targetAudience)
      
      // Execute the SEO article workflow using proper Mastra API
      console.log('🚀 Creating workflow run for:', workflowInput)
      
      const run = await workflow.createRunAsync()
      const result = await run.start({
        inputData: workflowInput
      })
      
      console.log('✅ Workflow execution result:', result.status)
      
      if (result.status === 'success') {
        const responseData = {
          success: true,
          result: result.result,
          workflowId: 'seoArticleWorkflow',
          input: workflowInput,
          executionStatus: result.status
        }

        await agentActivityLogger.completeActivity(activityId, {
          status: 'success',
          workflowId: 'seoArticleWorkflow',
          topic: topic.substring(0, 100)
        })

        // Use API optimizer for response
        return await apiOptimizer.optimizeResponse(responseData, request, {
          cacheKey,
          cacheTTL: 300000, // 5 minutes cache for successful results
          enableCompression: true
        })
      } else if (result.status === 'suspended') {
        const responseData = {
          success: false,
          error: 'Workflow suspended - requires human interaction',
          suspendedSteps: result.suspended,
          workflowId: 'seoArticleWorkflow'
        }

        await agentActivityLogger.completeActivity(activityId, {
          status: 'suspended',
          suspendedSteps: result.suspended?.length || 0
        })

        return await apiOptimizer.optimizeResponse(responseData, request, {
          enableCompression: true
        })
      } else {
        const responseData = {
          success: false,
          error: 'Workflow execution failed',
          details: result.error || 'Unknown workflow error',
          workflowId: 'seoArticleWorkflow'
        }

        await agentActivityLogger.completeActivity(activityId, undefined, result.error || 'Workflow failed')

        return await apiOptimizer.optimizeResponse(responseData, request, {
          enableCompression: true
        })
      }
    } catch (error) {
      console.error('❌ API error:', error)
      await agentActivityLogger.completeActivity(activityId, undefined, error instanceof Error ? error.message : 'Unknown error')
      auditLogger.log({
        type: 'api_error',
        userId,
        details: { route: 'seo-article-workflow', error: error instanceof Error ? error.message : 'Unknown error' }
      })

      const errorResponse = { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }

      return await apiOptimizer.optimizeResponse(errorResponse, request, {
        enableCompression: true
      })
    }

  } catch (error) {
    console.error('❌ Critical API error:', error)
    await agentActivityLogger.completeActivity(activityId, undefined, error instanceof Error ? error.message : 'Critical error')
    
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