import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { mastra } from '@/mastra'

export const maxDuration = 300 // 5 minutes for workflow execution

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { topic, articleType, targetAudience, researchOption, existingResearch } = body

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

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
      }
    })

  } catch (error) {
    console.error('Stream API error:', error)
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

    // Using mock workflow for demonstration
    // TODO: Implement actual workflow integration

    // Prepare workflow input
    const workflowInput = {
      userInput: topic,
      articleType: articleType || 'informational',
      targetAudience: targetAudience || 'technical professionals',
      urgency: 'standard' as const
    }

    // Simulate step-by-step execution with progress updates
    const steps = [
      { id: 'research', name: 'SEO Research & Analysis', progress: 20 },
      { id: 'structure', name: 'Structure & Planning', progress: 40 },
      { id: 'content', name: 'Content Creation', progress: 60 },
      { id: 'optimization', name: 'SEO Optimization & Polish', progress: 80 },
      { id: 'review', name: 'Final Review & Delivery', progress: 100 }
    ]

    for (const step of steps) {
      sendSSE({
        type: 'step_start',
        step: step.id,
        name: step.name,
        progress: step.progress - 20
      })

      // Simulate step execution time
      await new Promise(resolve => setTimeout(resolve, 2000))

      sendSSE({
        type: 'step_complete',
        step: step.id,
        name: step.name,
        progress: step.progress
      })
    }

    // Generate mock result to demonstrate the interface
    // TODO: Implement actual agent orchestration
    const mockResult = {
      articleSlug: topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50),
      focusKeyword: topic,
      wordCount: 1850,
      seoScore: 94,
      readabilityScore: 87,
      content: `# ${topic}\n\nThis is a comprehensive guide about ${topic}. This article has been generated using our SEO workflow to ensure maximum search engine visibility and user engagement.\n\n## Introduction\n\nContent generated here...\n\n## Main Content\n\nDetailed information about ${topic}...\n\n## Conclusion\n\nWrapping up the discussion on ${topic}...`,
      metadata: {
        title: topic,
        description: `Comprehensive guide on ${topic}. Learn everything you need to know with expert insights and actionable tips.`,
        keywords: [topic, 'guide', 'tips', 'expert']
      }
    }
    
    sendSSE({
      type: 'workflow_complete',
      result: mockResult,
      message: 'SEO article workflow completed successfully!'
    })

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