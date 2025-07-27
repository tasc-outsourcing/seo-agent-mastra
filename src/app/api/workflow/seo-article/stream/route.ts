import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { mastra } from '@/mastra'
import { z } from 'zod'
import { sanitizeInput, auditLogger } from '@/lib/security'

export const maxDuration = 300 // 5 minutes for workflow execution

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      auditLogger.log({ type: 'auth_failure', details: { route: 'seo-article-workflow-stream' } })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      }, { status: 400 })
    }
    
    const { topic, articleType, targetAudience, researchOption, existingResearch } = validationResult.data

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Helper function to send SSE data
        const sendSSE = (data: any) => {
          const sseData = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(sseData))
        }

        // Start the workflow execution
        executeWorkflowWithProgress(
          { topic, articleType, targetAudience, researchOption, existingResearch },
          sendSSE,
          controller,
          mastra
        )
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      }
    })

  } catch (error) {
    console.error('Stream API error:', error)
    auditLogger.log({
      type: 'api_error',
      details: { route: 'seo-article-workflow-stream', error: error instanceof Error ? error.message : 'Unknown error' }
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function executeWorkflowWithProgress(
  input: any,
  sendSSE: (data: any) => void,
  controller: ReadableStreamDefaultController,
  mastra: any
) {
  try {
    const { topic, articleType, targetAudience, researchOption, existingResearch } = input

    // Send initial status
    sendSSE({
      type: 'status',
      step: 'initializing',
      message: 'Starting SEO article workflow...',
      progress: 0
    })

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

    // Get the SEO article workflow
    const workflow = mastra.getWorkflow('seoArticleWorkflow')
    
    if (!workflow) {
      throw new Error('SEO article workflow not found')
    }

    sendSSE({
      type: 'status',
      step: 'starting',
      message: 'Executing SEO article workflow...',
      progress: 10
    })

    // Execute the workflow with streaming
    console.log('Creating workflow run for streaming:', workflowInput)
    
    const run = await workflow.createRunAsync()
    const result = await run.stream({
      inputData: workflowInput
    })

    // Stream the workflow execution
    let stepCount = 0
    const totalSteps = 5 // Research, Structure, Content, Optimization, Review
    
    for await (const chunk of result.stream) {
      stepCount++
      const progress = Math.min((stepCount / totalSteps) * 90, 90) // Leave 10% for final processing
      
      sendSSE({
        type: 'step_progress',
        step: `step_${stepCount}`,
        message: `Processing step ${stepCount} of ${totalSteps}...`,
        progress: progress,
        data: chunk
      })
    }

    // Get the final result
    const finalResult = await result.result
    
    if (finalResult.status === 'success') {
      sendSSE({
        type: 'workflow_complete',
        result: finalResult.result,
        message: 'SEO article workflow completed successfully!',
        progress: 100
      })
    } else if (finalResult.status === 'suspended') {
      sendSSE({
        type: 'workflow_suspended',
        message: 'Workflow suspended - requires human interaction',
        suspendedSteps: finalResult.suspended
      })
    } else {
      throw new Error(finalResult.error || 'Workflow execution failed')
    }

  } catch (error) {
    console.error('Workflow execution error:', error)
    sendSSE({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  } finally {
    controller.close()
  }
}