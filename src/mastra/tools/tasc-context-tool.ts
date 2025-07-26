import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { TASC_CONTEXT, CUSTOM_CONTEXT } from "@/config/tasc-context"

export const tascContextTool = createTool({
	id: "tasc-context",
	description: "Provides TASC-specific context, rules, and guidelines for blog article creation",
	inputSchema: z.object({
		contextType: z.enum(["company", "guidelines", "audience", "topics", "seo", "quality", "custom"]).describe("Type of context to retrieve"),
		articleType: z.string().optional().describe("Type of article being created for context-specific guidance"),
	}),
	outputSchema: z.object({
		context: z.string().describe("Relevant TASC context and guidelines"),
		recommendations: z.array(z.string()).describe("Specific recommendations for the article"),
		guidelines: z.array(z.string()).describe("Applicable guidelines and rules"),
	}),
	execute: async ({ context }) => {
		const { contextType, articleType } = context
		
		let contextData: any = {}
		let recommendations: string[] = []
		let guidelines: string[] = []

		switch (contextType) {
			case "company":
				contextData = TASC_CONTEXT.company
				recommendations = [
					"Maintain TASC's professional and authoritative tone",
					"Ensure content aligns with TASC's mission and expertise",
					"Use language that's accessible to both technical and business audiences"
				]
				break

			case "guidelines":
				contextData = TASC_CONTEXT.articleGuidelines
				guidelines = [
					...TASC_CONTEXT.articleGuidelines.structure,
					...TASC_CONTEXT.articleGuidelines.writingStyle,
					...TASC_CONTEXT.articleGuidelines.contentRequirements
				]
				break

			case "audience":
				contextData = TASC_CONTEXT.audiences
				recommendations = [
					"Write for technical professionals and business decision-makers",
					"Provide insights valuable to industry analysts and consultants",
					"Make content accessible to general business audience"
				]
				break

			case "topics":
				contextData = TASC_CONTEXT.topics
				recommendations = [
					"Focus on technical analysis methodologies and strategic consulting",
					"Include industry trends and technology implementation strategies",
					"Cover business process optimization and market analysis"
				]
				break

			case "seo":
				contextData = TASC_CONTEXT.seo
				guidelines = [
					"Use long-tail keywords related to technical analysis",
					"Keep meta descriptions under 160 characters",
					"Include primary keywords in title tags",
					"Create internal linking opportunities"
				]
				break

			case "quality":
				contextData = TASC_CONTEXT.qualityStandards
				guidelines = [
					"Fact-check all information and verify sources",
					"Provide original insights and unique perspectives",
					"Ensure every article delivers actionable value",
					"Maintain high professional standards"
				]
				break

			case "custom":
				contextData = CUSTOM_CONTEXT
				recommendations = [
					"Apply custom TASC-specific rules and guidelines",
					"Use proprietary methodologies when relevant",
					"Include industry-specific examples and case studies"
				]
				break
		}

		return {
			context: `TASC Context for ${contextType}:\n\n${JSON.stringify(contextData, null, 2)}`,
			recommendations,
			guidelines
		}
	},
}) 