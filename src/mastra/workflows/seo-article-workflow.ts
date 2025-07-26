import { Workflow, Step } from "@mastra/core"
import { z } from "zod"

// Input schema for the SEO article workflow
const seoArticleWorkflowSchema = z.object({
  userInput: z.string().describe("The keyword, topic, or context provided by the user"),
  articleType: z.enum(['informational', 'commercial', 'transactional', 'hybrid']).optional(),
  targetAudience: z.string().optional().describe("Specific audience if provided"),
  urgency: z.enum(['standard', 'rush']).default('standard')
})

export const seoArticleWorkflow = new Workflow({
  name: "SEO Article Creation Workflow",
  triggerSchema: seoArticleWorkflowSchema,
})

// Phase 1-3: Research & Analysis
.addStep(
  new Step({
    id: "research_phase",
    description: "Execute SEO research phases 1-3",
    inputSchema: z.object({
      userInput: z.string(),
      articleType: z.string().optional(),
      targetAudience: z.string().optional()
    }),
    outputSchema: z.object({
      articleSlug: z.string(),
      focusKeyword: z.string(),
      semanticKeywords: z.array(z.string()),
      researchComplete: z.boolean()
    }),
    execute: async ({ userInput, articleType, targetAudience }) => {
      // This will be handled by the SEO Research Agent
      // For now, create a basic slug from user input
      const articleSlug = userInput
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)

      return {
        articleSlug,
        focusKeyword: userInput,
        semanticKeywords: [],
        researchComplete: false // Will be updated by agent
      }
    }
  })
)

// Phase 4-6: Structure & Planning  
.addStep(
  new Step({
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
    execute: async ({ articleSlug, focusKeyword, semanticKeywords, researchComplete }) => {
      if (!researchComplete) {
        throw new Error("Research phase must be complete before structure phase")
      }

      return {
        folderCreated: false, // Will be updated by agent
        outlineComplete: false,
        bulletsComplete: false
      }
    }
  })
)

// Phase 7-8: Content Creation
.addStep(
  new Step({
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
    execute: async ({ articleSlug, folderCreated, outlineComplete, bulletsComplete }) => {
      if (!folderCreated || !outlineComplete || !bulletsComplete) {
        throw new Error("Structure phase must be complete before content phase")
      }

      return {
        draftComplete: false, // Will be updated by agent
        enhancedComplete: false
      }
    }
  })
)

// Phase 9-15: Optimization & Polish
.addStep(
  new Step({
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
    execute: async ({ articleSlug, draftComplete, enhancedComplete }) => {
      if (!draftComplete || !enhancedComplete) {
        throw new Error("Content phase must be complete before optimization phase")
      }

      return {
        metadataComplete: false, // Will be updated by agent
        faqsComplete: false,
        sgeOptimized: false,
        uxEnhanced: false,
        yoastOptimized: false,
        linksAdded: false,
        finalReview: false,
        articlePath: `generated-articles/${articleSlug}`
      }
    }
  })
)

// Human review point (optional)
.addStep(
  new Step({
    id: "human_review",
    description: "Present completed article for human review",
    inputSchema: z.object({
      articleSlug: z.string(),
      articlePath: z.string(),
      finalReview: z.boolean()
    }),
    outputSchema: z.object({
      reviewComplete: z.boolean(),
      deliveryReady: z.boolean(),
      summary: z.string()
    }),
    execute: async ({ articleSlug, articlePath, finalReview }) => {
      if (!finalReview) {
        throw new Error("Final review must be complete")
      }

      return {
        reviewComplete: true,
        deliveryReady: true,
        summary: `SEO-optimized article '${articleSlug}' has been created and is ready for delivery at: ${articlePath}`
      }
    }
  })
)