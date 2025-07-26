import { Mastra } from "@mastra/core/mastra"
import { PinoLogger } from "@mastra/loggers"
import { LibSQLStore } from "@mastra/libsql"
import { weatherWorkflow } from "./workflows"
import { blogResearchWorkflow } from "./workflows/blog-research-workflow"
import { seoArticleWorkflow } from "./workflows/seo-article-workflow"
import { weatherAgent, blogArticleAgent } from "./agents"
import { seoOrchestratorAgent } from "./agents/seo-orchestrator"
import { seoResearchAgent } from "./agents/seo-research-agent"
import { seoStructureAgent } from "./agents/seo-structure-agent"
import { seoContentAgent } from "./agents/seo-content-agent"
import { seoOptimizationAgent } from "./agents/seo-optimization-agent"

export const mastra = new Mastra({
	workflows: { weatherWorkflow, blogResearchWorkflow, seoArticleWorkflow },
	agents: { 
		weatherAgent, 
		blogArticleAgent,
		seoOrchestratorAgent,
		seoResearchAgent,
		seoStructureAgent,
		seoContentAgent,
		seoOptimizationAgent
	},
	storage: new LibSQLStore({
		url: process.env.TURSO_DATABASE_URL || "file:./storage.db",
		authToken: process.env.TURSO_AUTH_TOKEN,
	}),
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
		// Add custom serializers for performance tracking
		serializers: {
			performance: (perf: any) => ({
				duration: perf.duration,
				stepCount: perf.stepCount,
				toolCalls: perf.toolCalls,
				memoryUsage: process.memoryUsage(),
				timestamp: new Date().toISOString()
			}),
			workflow: (workflow: any) => ({
				id: workflow.id,
				status: workflow.status,
				startTime: workflow.startTime,
				endTime: workflow.endTime,
				duration: workflow.endTime ? workflow.endTime - workflow.startTime : null
			}),
			agent: (agent: any) => ({
				name: agent.name,
				toolsUsed: agent.toolsUsed,
				executionTime: agent.executionTime
			})
		}
	}),
	server: {
		port: 4111,
		host: "localhost",
		build: {
			openAPIDocs: true,
			swaggerUI: true,
		},
	},
})
