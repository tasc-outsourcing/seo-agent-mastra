# Agent Starter

A complete Next.js starter template for building AI agents with Mastra. This starter includes a weather agent with tools and workflows as a working example.

## Features

- 🤖 **Weather Agent**: Complete example agent with tools and workflows
- 🛠️ **Mastra Integration**: Full Mastra setup with storage, logging, and server
- 💬 **Assistant UI**: Beautiful chat interface powered by assistant-ui
- 🎨 **Modern Stack**: Next.js 15, TypeScript, Tailwind CSS
- 📱 **Responsive Design**: Works on desktop and mobile

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd agent-starter
npm install
```

> **Note**: The included `.npmrc` file automatically handles peer dependency conflicts for Mastra packages.

### 2. Environment Setup

Rename `.env.example` to `.env.local` in the root directory with these two required variables:

```bash
# Required: OpenAI API Key for the weather agent
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=file:mastra.db
```

**Get your OpenAI API key:**

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy and paste it into your `.env.local` file

### 3. Run the Application

Start both the Next.js frontend and Mastra backend:

```bash
npm run dev
```

This runs both servers in parallel:

- **Next.js App**: [http://localhost:3000](http://localhost:3000) - Main chat interface
- **Mastra Backend**: [http://localhost:4111](http://localhost:4111) - Agent playground and API

### 4. Test Your Setup

1. **Chat Interface**: Open [http://localhost:3000](http://localhost:3000) and ask about the weather
2. **Mastra Playground**: Open [http://localhost:4111](http://localhost:4111) to test agents directly
3. **API Documentation**: Visit [http://localhost:4111/swagger-ui](http://localhost:4111/swagger-ui) for API docs

## What's Included

### 🤖 Weather Agent (`src/mastra/agents/weather.ts`)

- Intelligent weather information agent
- Uses weather tools for real-time data
- Conversational and helpful responses

### 🛠️ Weather Tools (`src/mastra/tools/weather.ts`)

- Get current weather conditions
- Weather forecasts
- Location-based weather data

### ⚡ Weather Workflow (`src/mastra/workflows/weather.ts`)

- Automated weather data processing
- Multi-step weather analysis
- Customizable workflow steps

## Building Your Own Components

### Creating New Agents

1. **Create an agent file** in `src/mastra/agents/`:

```typescript
// src/mastra/agents/my-agent.ts
import { Agent } from "@mastra/core/agent"
import { openai } from "@ai-sdk/openai"

export const myAgent = new Agent({
	name: "My Agent",
	instructions: "You are a helpful assistant that...",
	model: openai("gpt-4o-mini"),
})
```

2. **Register in the main config** (`src/mastra/index.ts`):

```typescript
import { myAgent } from "./agents/my-agent"

export const mastra = new Mastra({
	agents: {
		weatherAgent,
		myAgent, // Add your new agent
	},
	// ... rest of config
})
```

### Creating New Tools

1. **Create a tool file** in `src/mastra/tools/`:

```typescript
// src/mastra/tools/my-tool.ts
import { createTool } from "@mastra/core/tools"
import { z } from "zod"

export const myTool = createTool({
	id: "my-tool",
	description: "Description of what this tool does",
	inputSchema: z.object({
		input: z.string().describe("Input description"),
	}),
	outputSchema: z.object({
		result: z.string(),
	}),
	execute: async ({ context }) => {
		// Your tool logic here
		return { result: "processed: " + context.input }
	},
})
```

2. **Add to an agent**:

```typescript
export const myAgent = new Agent({
	name: "My Agent",
	instructions: "You can use my-tool to process data...",
	model: openai("gpt-4o-mini"),
	tools: {
		myTool, // Add your tool
	},
})
```

### Creating New Workflows

1. **Create a workflow file** in `src/mastra/workflows/`:

```typescript
// src/mastra/workflows/my-workflow.ts
import { createWorkflow, createStep } from "@mastra/core/workflows"
import { z } from "zod"

const step1 = createStep({
	id: "process-data",
	inputSchema: z.object({ data: z.string() }),
	outputSchema: z.object({ processed: z.string() }),
	execute: async ({ inputData }) => {
		return { processed: `Processed: ${inputData.data}` }
	},
})

export const myWorkflow = createWorkflow({
	id: "my-workflow",
	description: "My custom workflow",
	inputSchema: z.object({ data: z.string() }),
	outputSchema: z.object({ processed: z.string() }),
})
	.then(step1)
	.commit()
```

2. **Register the workflow**:

```typescript
export const mastra = new Mastra({
	workflows: {
		weatherWorkflow,
		myWorkflow, // Add your workflow
	},
	// ... rest of config
})
```

## Using MCP (Model Context Protocol)

Mastra supports MCP for connecting to external tools and services. Here's how to add MCP tools:

1. **Install MCP package**:

```bash
npm install @mastra/mcp
```

2. **Configure MCP client** (`src/mastra/mcp.ts`):

```typescript
import { MCPClient } from "@mastra/mcp"

export const mcp = new MCPClient({
	servers: {
		filesystem: {
			command: "npx",
			args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/folder"],
		},
	},
})
```

3. **Add MCP tools to agents**:

```typescript
const agent = new Agent({
	name: "Agent with MCP Tools",
	instructions: "You can use filesystem tools...",
	model: openai("gpt-4o-mini"),
	tools: await mcp.getTools(),
})
```

## Available Scripts

- `npm run dev` - Start both Next.js and Mastra servers
- `npm run dev:next` - Start only Next.js frontend
- `npm run dev:mastra` - Start only Mastra backend
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- **Mastra Documentation**: [https://mastra.ai/docs](https://mastra.ai/docs)
- **Assistant UI Documentation**: [https://assistant-ui.com](https://assistant-ui.com)
- **MCP Documentation**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)

## Deployment

Deploy your agent starter to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/agent-starter)

## Support

Need help?

- Join the [Mastra Discord](https://discord.gg/mastra) community
- Check the [Mastra Documentation](https://mastra.ai/docs)
- Review the example code in this repository
