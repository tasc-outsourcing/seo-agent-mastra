"use client"

import type { FC, ReactNode } from "react"
import { makeAssistantToolUI } from "@assistant-ui/react"
import { Card, CardContent } from "@/components/ui/card"
import {
	CheckCircle,
	LoaderCircle,
	OctagonX,
	SearchIcon,
	TriangleAlert,
} from "lucide-react"

type ToolStatus = "running" | "complete" | "requires-action" | "incomplete"

const statusIconMap: Record<ToolStatus, ReactNode> = {
	running: <LoaderCircle className="animate-spin text-blue-500 size-4" />,
	complete: <CheckCircle className="text-emerald-500 size-4" />,
	"requires-action": <TriangleAlert className="text-amber-500 size-4" />,
	incomplete: <OctagonX className="text-rose-500 size-4" />,
}

const statusColorMap: Record<ToolStatus, string> = {
	running: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
	complete:
		"border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
	"requires-action":
		"border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
	incomplete: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30",
}

const SearchWebToolUi = makeAssistantToolUI({
	toolName: "SEARCH_WEB",
	render: ({ status }) => {
		return (
			<Card className={`mb-4 transition-all duration-200 ${statusColorMap[status.type]}`}>
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center size-8 rounded-lg bg-background/80 border border-border/40">
							<SearchIcon className="size-4 text-primary" />
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<span className="font-medium text-foreground">Web Search</span>
								{statusIconMap[status.type]}
							</div>
							<p className="text-sm text-muted-foreground mt-1">
								{status.type === "running" && "Searching the web..."}
								{status.type === "complete" && "Search completed successfully"}
								{status.type === "requires-action" && "Waiting for user input"}
								{status.type === "incomplete" && "Search failed to complete"}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		)
	},
})

const ToolUIWrapper: FC = () => {
	return (
		<div className="fixed bottom-6 right-6 max-w-sm z-50">
			<SearchWebToolUi />
		</div>
	)
}

export const ToolsByNameComponents = {
	SEARCH_WEB: SearchWebToolUi,
}

export default ToolUIWrapper
