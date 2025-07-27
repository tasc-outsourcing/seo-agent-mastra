import { Mastra } from "@mastra/core/mastra"
import { PinoLogger } from "@mastra/loggers"
import { LibSQLStore } from "@mastra/libsql"
import { blogResearchWorkflow } from "./workflows/blog-research-workflow"
import { seoArticleWorkflow } from "./workflows/seo-article-workflow"
import { blogArticleAgent } from "./agents"
import { seoOrchestratorAgent } from "./agents/seo-orchestrator"
import { seoResearchAgent } from "./agents/seo-research-agent"
import { seoStructureAgent } from "./agents/seo-structure-agent"
import { seoContentAgent } from "./agents/seo-content-agent"
import { seoOptimizationAgent } from "./agents/seo-optimization-agent"
import { getEnv, isFeatureEnabled } from "@/lib/env"

export const mastra = new Mastra({
	workflows: { blogResearchWorkflow, seoArticleWorkflow },
	agents: { 
		blogArticleAgent,
		seoOrchestratorAgent,
		seoResearchAgent,
		seoStructureAgent,
		seoContentAgent,
		seoOptimizationAgent
	},
	storage: new LibSQLStore({
		url: isFeatureEnabled('turso') ? getEnv().TURSO_DATABASE_URL! : "file:./storage.db",
		authToken: isFeatureEnabled('turso') ? getEnv().TURSO_AUTH_TOKEN : undefined,
	}),
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
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
