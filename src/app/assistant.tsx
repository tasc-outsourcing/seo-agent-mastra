"use client"

import { AssistantRuntimeProvider } from "@assistant-ui/react"
import { useChatRuntime } from "@assistant-ui/react-ai-sdk"
import { Thread } from "@/components/assistant-ui/thread"
import { ThreadList } from "@/components/assistant-ui/thread-list"
import ToolUIWrapper from "@/components/assistant-ui/tool-ui"
import { TopNav } from "@/components/top-nav"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"

export const Assistant = () => {
	const { isSignedIn, isLoaded } = useUser()
	const runtime = useChatRuntime({
		api: "/api/chat",
	})

	// Redirect to sign-in if not authenticated
	if (isLoaded && !isSignedIn) {
		redirect("/sign-in")
	}

	// Show loading state while Clerk is loading
	if (!isLoaded) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		)
	}

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<div className="flex h-dvh flex-col bg-background">
				<TopNav />
				<div className="grid flex-1 grid-cols-[280px_1fr] gap-0">
					<ThreadList />
					<div className="relative">
						<Thread />
						<ToolUIWrapper />
					</div>
				</div>
			</div>
		</AssistantRuntimeProvider>
	)
}
