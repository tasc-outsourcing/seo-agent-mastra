import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Step 1: Get blog topic
const getBlogTopicStep = createStep({
  id: 'get-blog-topic',
  inputSchema: z.object({}),
  outputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string().optional(),
    articleType: z.string().optional(),
  }),
  resumeSchema: z.object({
    topic: z.string(),
    targetAudience: z.string().optional(),
    articleType: z.string().optional(),
  }),
  suspendSchema: z.object({
    message: z.object({
      topic: z.string(),
      targetAudience: z.string().optional(),
      articleType: z.string().optional(),
    }),
  }),
  execute: async ({ resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        topic: resumeData.topic || '',
      };
    }

    await suspend({
      message: {
        topic: 'What blog topic would you like to research for TASC?',
        targetAudience: 'Technical professionals and business decision-makers',
        articleType: 'Technical analysis or strategic consulting insights',
      },
    });

    return {
      topic: '',
    };
  },
});

// Step 2: Deep Research
const deepResearchStep = createStep({
  id: 'deep-research',
  inputSchema: z.object({
    topic: z.string(),
    targetAudience: z.string().optional(),
    articleType: z.string().optional(),
  }),
  outputSchema: z.object({
    researchData: z.any(),
    summary: z.string(),
    keyInsights: z.array(z.string()),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      relevance: z.string(),
    })),
  }),
  execute: async ({ inputData, mastra }) => {
    const { topic, targetAudience, articleType } = inputData;

    try {
      const agent = mastra.getAgent('blogArticleAgent');
      const researchPrompt = `Conduct comprehensive research for a TASC blog article on: "${topic}"

Target Audience: ${targetAudience || 'Technical professionals and business decision-makers'}
Article Type: ${articleType || 'Technical analysis or strategic consulting insights'}

Research Requirements:
1. Find current trends and developments related to this topic
2. Identify key industry insights and expert opinions
3. Gather relevant statistics and data points
4. Find case studies or real-world examples
5. Identify potential challenges and opportunities
6. Research competitive landscape and market positioning

Use the TASC context tool to ensure research aligns with company guidelines and target audience.

Return findings in a structured format with:
- Key insights and learnings
- Relevant sources and citations
- Industry trends and developments
- Potential article angles and approaches
- SEO keywords and topics to cover`;

      const result = await agent.generate(
        [
          {
            role: 'user',
            content: researchPrompt,
          },
        ],
        {
          maxSteps: 20,
          experimental_output: z.object({
            keyInsights: z.array(z.string()),
            sources: z.array(
              z.object({
                title: z.string(),
                url: z.string(),
                relevance: z.string(),
                summary: z.string(),
              }),
            ),
            trends: z.array(z.string()),
            articleAngles: z.array(z.string()),
            seoKeywords: z.array(z.string()),
            challenges: z.array(z.string()),
            opportunities: z.array(z.string()),
          }),
        },
      );

      const resultData = result.object || {
        keyInsights: [],
        sources: [],
        trends: [],
        articleAngles: [],
        seoKeywords: [],
        challenges: [],
        opportunities: [],
      };

      const summary = `Deep research completed for TASC blog article on "${topic}":\n\nKey Insights: ${resultData.keyInsights.length}\nSources Found: ${resultData.sources.length}\nTrends Identified: ${resultData.trends.length}\nArticle Angles: ${resultData.articleAngles.length}`;

      return {
        researchData: resultData,
        summary,
        keyInsights: resultData.keyInsights,
        sources: resultData.sources,
      };
    } catch (error: any) {
      console.log({ error });
      return {
        researchData: { error: error.message },
        summary: `Error during research: ${error.message}`,
        keyInsights: [],
        sources: [],
      };
    }
  },
});

// Step 3: Research Approval
const researchApprovalStep = createStep({
  id: 'research-approval',
  inputSchema: z.object({
    researchData: z.any(),
    summary: z.string(),
    keyInsights: z.array(z.string()),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      relevance: z.string(),
    })),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
    feedback: z.string().optional(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    feedback: z.string().optional(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        researchData: inputData.researchData,
      };
    }

    await suspend({
      summary: inputData.summary,
      keyInsights: inputData.keyInsights,
      sources: inputData.sources,
      message: `Research completed for TASC blog article. Review the findings and approve to proceed with article creation, or provide feedback for additional research. [approve/reject]`,
    });

    return {
      approved: false,
      researchData: inputData.researchData,
    };
  },
});

// Define the blog research workflow
export const blogResearchWorkflow = createWorkflow({
  id: 'blog-research-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
    feedback: z.string().optional(),
  }),
  steps: [getBlogTopicStep, deepResearchStep, researchApprovalStep],
});

blogResearchWorkflow.then(getBlogTopicStep).then(deepResearchStep).then(researchApprovalStep).commit(); 