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

    // Get the SEO article workflow
    const workflow = mastra.getWorkflow('seoArticleWorkflow')
    
    if (!workflow) {
      return NextResponse.json({ error: 'SEO article workflow not found' }, { status: 500 })
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
      // Execute the workflow
      const result = await workflow.execute(workflowInput)
      
      return NextResponse.json({
        success: true,
        result,
        workflowId: workflow.id,
        input: workflowInput
      })
    } catch (workflowError) {
      console.error('Workflow execution error:', workflowError)
      return NextResponse.json({ 
        error: 'Workflow execution failed',
        details: workflowError instanceof Error ? workflowError.message : 'Unknown error'
      }, { status: 500 })
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workflow info
    const workflow = mastra.getWorkflow('seoArticleWorkflow')
    
    if (!workflow) {
      return NextResponse.json({ error: 'SEO article workflow not found' }, { status: 404 })
    }

    return NextResponse.json({
      workflowId: workflow.id,
      description: workflow.description,
      available: true
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}