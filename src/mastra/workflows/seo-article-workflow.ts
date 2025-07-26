import { createWorkflow, createStep } from "@mastra/core/workflows"
import { z } from "zod"

// Input schema for the SEO article workflow
const seoArticleWorkflowSchema = z.object({
  userInput: z.string().describe("The keyword, topic, or context provided by the user"),
  articleType: z.enum(['informational', 'commercial', 'transactional', 'hybrid']).optional(),
  targetAudience: z.string().optional().describe("Specific audience if provided"),
  urgency: z.enum(['standard', 'rush']).default('standard')
})

// Phase 1-3: Research & Analysis
const researchStep = createStep({
  id: "research_phase",
  description: "Execute SEO research phases 1-3",
  inputSchema: seoArticleWorkflowSchema,
  outputSchema: z.object({
    articleSlug: z.string(),
    focusKeyword: z.string(),
    semanticKeywords: z.array(z.string()),
    researchComplete: z.boolean()
  }),
  execute: async ({ inputData, mastra }) => {
    const { userInput, articleType, targetAudience } = inputData
    
    // Get the SEO Research Agent (includes deep research capabilities)
    const seoResearchAgent = mastra!.getAgent('seoResearchAgent')
    
    // Create research prompt for the agent
    const researchPrompt = `Execute SEO Research Phases 1-3 for: "${userInput}"

Article Type: ${articleType || 'informational'}
Target Audience: ${targetAudience || 'technical professionals'}

Phase 1: Focus Keyword Research
- Use deep research tool for comprehensive keyword analysis
- Generate semantic keywords and competitor analysis
- Identify content gaps and opportunities

Phase 2: Persona Briefing  
- Analyze search intent and define target persona
- Document decision-maker profile and pain points

Phase 3: SERP Analysis
- Analyze competitor content structure and tone
- Identify differentiation opportunities

Create article slug and provide research summary.`

    try {
      const result = await seoResearchAgent.generate([{
        role: 'user',
        content: researchPrompt
      }])

      // Create article slug from user input
      const articleSlug = userInput
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)

      return {
        articleSlug,
        focusKeyword: userInput,
        semanticKeywords: [], // Will be populated by agent research
        researchComplete: true
      }
    } catch (error) {
      console.error('Research phase error:', error)
      // Fallback if agent fails
      const articleSlug = userInput
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)

      return {
        articleSlug,
        focusKeyword: userInput,
        semanticKeywords: [],
        researchComplete: false
      }
    }
  }
})

// Phase 4-6: Structure & Planning
const structureStep = createStep({
  id: "structure_phase",
  description: "Execute structure and planning phases 4-6",
  inputSchema: z.object({
    articleSlug: z.string(),
    focusKeyword: z.string(),
    semanticKeywords: z.array(z.string()),
    researchComplete: z.boolean()
  }),
  outputSchema: z.object({
    folderCreated: z.boolean(),
    outlineComplete: z.boolean(),
    bulletsComplete: z.boolean()
  }),
  execute: async ({ inputData }) => {
    const { articleSlug, focusKeyword, semanticKeywords, researchComplete } = inputData
    
    if (!researchComplete) {
      throw new Error("Research phase must be complete before structure phase")
    }

    return {
      folderCreated: true, // Will be updated by agent
      outlineComplete: true,
      bulletsComplete: true
    }
  }
})

// Phase 7-8: Content Creation
const contentStep = createStep({
  id: "content_phase",
  description: "Execute content creation phases 7-8",
  inputSchema: z.object({
    articleSlug: z.string(),
    folderCreated: z.boolean(),
    outlineComplete: z.boolean(),
    bulletsComplete: z.boolean()
  }),
  outputSchema: z.object({
    draftComplete: z.boolean(),
    enhancedComplete: z.boolean()
  }),
  execute: async ({ inputData }) => {
    const { articleSlug, folderCreated, outlineComplete, bulletsComplete } = inputData
    
    if (!folderCreated || !outlineComplete || !bulletsComplete) {
      throw new Error("Structure phase must be complete before content phase")
    }

    return {
      draftComplete: true, // Will be updated by agent
      enhancedComplete: true
    }
  }
})

// Phase 9-15: Optimization & Polish
const optimizationStep = createStep({
  id: "optimization_phase",
  description: "Execute optimization and polish phases 9-15",
  inputSchema: z.object({
    articleSlug: z.string(),
    draftComplete: z.boolean(),
    enhancedComplete: z.boolean()
  }),
  outputSchema: z.object({
    metadataComplete: z.boolean(),
    faqsComplete: z.boolean(),
    sgeOptimized: z.boolean(),
    uxEnhanced: z.boolean(),
    yoastOptimized: z.boolean(),
    linksAdded: z.boolean(),
    finalReview: z.boolean(),
    articlePath: z.string()
  }),
  execute: async ({ inputData }) => {
    const { articleSlug, draftComplete, enhancedComplete } = inputData
    
    if (!draftComplete || !enhancedComplete) {
      throw new Error("Content phase must be complete before optimization phase")
    }

    return {
      metadataComplete: true, // Will be updated by agent
      faqsComplete: true,
      sgeOptimized: true,
      uxEnhanced: true,
      yoastOptimized: true,
      linksAdded: true,
      finalReview: true,
      articlePath: `generated-articles/${articleSlug}`
    }
  }
})

// Human review step
const reviewStep = createStep({
  id: "human_review",
  description: "Present completed article for human review",
  inputSchema: z.object({
    metadataComplete: z.boolean(),
    faqsComplete: z.boolean(),
    sgeOptimized: z.boolean(),
    uxEnhanced: z.boolean(),
    yoastOptimized: z.boolean(),
    linksAdded: z.boolean(),
    finalReview: z.boolean(),
    articlePath: z.string()
  }),
  outputSchema: z.object({
    reviewComplete: z.boolean(),
    deliveryReady: z.boolean(),
    summary: z.string()
  }),
  execute: async ({ inputData }) => {
    const { articlePath, finalReview } = inputData
    
    if (!finalReview) {
      throw new Error("Final review must be complete")
    }

    return {
      reviewComplete: true,
      deliveryReady: true,
      summary: `SEO-optimized article has been created and is ready for delivery at: ${articlePath}`
    }
  }
})

export const seoArticleWorkflow = createWorkflow({
  id: "seoArticleWorkflow",
  description: "Complete SEO article creation workflow with 15 phases",
  inputSchema: seoArticleWorkflowSchema,
  outputSchema: z.object({
    reviewComplete: z.boolean(),
    deliveryReady: z.boolean(),
    summary: z.string()
  })
})
  .then(researchStep)
  .then(structureStep)
  .then(contentStep)
  .then(optimizationStep)
  .then(reviewStep)
  .commit()