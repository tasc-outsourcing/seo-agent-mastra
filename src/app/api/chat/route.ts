import { mastra } from "@/mastra"
import { Message } from "ai"

// export const runtime = "edge";
export const maxDuration = 30

export async function POST(req: Request) {
	const { messages }: { messages: Array<Message> } = await req.json()

	const arofloAgent = mastra.getAgent("weatherAgent")

	if (!arofloAgent) {
		throw new Error("Aroflo agent not found")
	}

	try {
		const stream = await arofloAgent.stream(messages)
		return stream.toDataStreamResponse()
	} catch (error) {
		console.error("Agent stream error:", error)
		return new Response("An error occurred while processing your request", {
			status: 500,
		})
	}
}
