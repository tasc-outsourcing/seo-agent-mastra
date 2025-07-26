// TASC Blog Article Agent v2 - Context and Rules Configuration
// This file contains all the context, rules, and guidelines for creating high-quality blog articles

export const TASC_CONTEXT = {
	// Company Information
	company: {
		name: "TASC (Technical Analysis and Strategic Consulting)",
		description: "Expert technical analysis and strategic consulting services",
		mission: "To provide cutting-edge technical analysis and strategic insights",
		tone: "Professional, authoritative, yet accessible to both technical and business audiences"
	},

	// Article Guidelines
	articleGuidelines: {
		structure: [
			"Compelling headline that captures attention",
			"Clear introduction that sets context",
			"Logical flow with well-organized sections",
			"Actionable insights and takeaways",
			"Strong conclusion that reinforces key points"
		],
		
		writingStyle: [
			"Professional but not overly technical",
			"Clear and concise language",
			"Use of examples and case studies",
			"Data-driven insights when available",
			"Engaging and informative tone"
		],

		contentRequirements: [
			"Accurate and up-to-date information",
			"Proper citations and sources",
			"SEO optimization with relevant keywords",
			"Internal linking opportunities",
			"Call-to-action elements"
		]
	},

	// Target Audiences
	audiences: {
		primary: "Technical professionals and business decision-makers",
		secondary: "Industry analysts and consultants",
		tertiary: "General business audience interested in technical insights"
	},

	// Topics and Themes
	topics: {
		primary: [
			"Technical analysis methodologies",
			"Strategic consulting insights",
			"Industry trends and analysis",
			"Technology implementation strategies",
			"Business process optimization"
		],
		secondary: [
			"Market analysis",
			"Performance optimization",
			"Risk assessment",
			"Change management",
			"Digital transformation"
		]
	},

	// SEO Guidelines
	seo: {
		keywordStrategy: "Focus on long-tail keywords related to technical analysis and consulting",
		metaDescription: "Clear, compelling descriptions under 160 characters",
		titleTags: "Include primary keyword, keep under 60 characters",
		internalLinking: "Link to related TASC content and services"
	},

	// Quality Standards
	qualityStandards: {
		accuracy: "All information must be fact-checked and verified",
		originality: "Content should be original and provide unique insights",
		value: "Every article must provide actionable value to readers",
		professionalism: "Maintain high professional standards in all content"
	}
}

// You can add your specific context and rules here
export const CUSTOM_CONTEXT = {
	// Add your specific rules, guidelines, and context here
	// Example:
	// specificRules: [
	//   "Always include at least one case study",
	//   "Use TASC's proprietary methodologies when relevant",
	//   "Include specific industry examples",
	//   "Reference TASC's past successful projects"
	// ],
	
	// Example:
	// industryContext: {
	//   "Your industry insights and background information"
	// },
	
	// Example:
	// brandGuidelines: {
	//   "Your specific brand voice and style requirements"
	// }
} 