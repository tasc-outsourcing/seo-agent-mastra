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
      // For now, return mock data to demonstrate the interface
      // TODO: Implement actual agent orchestration
      const result = {
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
      
      return NextResponse.json({
        success: true,
        result,
        workflowId: 'seoArticleWorkflow',
        input: workflowInput
      })
    } catch (error) {
      console.error('API error:', error)
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
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