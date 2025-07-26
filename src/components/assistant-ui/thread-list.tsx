import type { FC } from "react"
import { ThreadListItemPrimitive, ThreadListPrimitive } from "@assistant-ui/react"
import {
	MessageSquarePlusIcon,
	MoreHorizontalIcon,
	SparklesIcon,
	TrashIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export const ThreadList: FC = () => {
	return (
		<div className="flex h-full flex-col border-r border-border/40 bg-card/30">
			<div className="flex items-center justify-between border-b border-border/40 p-4">
				<div className="flex items-center gap-2">
					<div className="flex items-center justify-center size-6 rounded-md bg-primary/10">
						<SparklesIcon className="size-3.5 text-primary" />
					</div>
					<h2 className="font-semibold text-foreground">Chats</h2>
				</div>
				<ThemeToggle />
			</div>

			<div className="flex-1 overflow-hidden">
				<ThreadListPrimitive.Root className="flex h-full flex-col">
					<div className="p-3">
						<ThreadListNew />
					</div>

					<div className="flex-1 overflow-y-auto px-3 pb-3">
						<ThreadListItems />
					</div>
				</ThreadListPrimitive.Root>
			</div>
		</div>
	)
}

const ThreadListNew: FC = () => {
	return (
		<ThreadListPrimitive.New asChild>
			<Button
				className="w-full justify-start gap-2 rounded-lg border border-border/60 bg-background/50 hover:bg-muted/80 hover:border-border transition-all duration-200 text-foreground"
				variant="ghost"
			>
				<MessageSquarePlusIcon className="size-4" />
				New Chat
			</Button>
		</ThreadListPrimitive.New>
	)
}

const ThreadListItems: FC = () => {
	return (
		<div className="space-y-1">
			<ThreadListPrimitive.Items components={{ ThreadListItem }} />
		</div>
	)
}

const ThreadListItem: FC = () => {
	return (
		<ThreadListItemPrimitive.Root className="group relative flex items-center gap-3 rounded-lg p-3 transition-all duration-200 hover:bg-muted/60 data-[active]:bg-muted data-[active]:border-primary/20 border border-transparent">
			<div className="flex-1 min-w-0">
				<ThreadListItemTitle />
			</div>

			<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				<TooltipIconButton
					tooltip="More options"
					variant="ghost"
					className="size-6 text-muted-foreground hover:text-foreground"
				>
					<MoreHorizontalIcon className="size-3.5" />
				</TooltipIconButton>
			</div>
		</ThreadListItemPrimitive.Root>
	)
}

const ThreadListItemTitle: FC = () => {
	return (
		<div className="flex items-center gap-2">
			<div className="flex items-center justify-center size-5 rounded-sm bg-primary/10 shrink-0">
				<SparklesIcon className="size-3 text-primary" />
			</div>
			<p className="text-sm font-medium text-foreground truncate">
				<ThreadListItemPrimitive.Title fallback="New Chat" />
			</p>
		</div>
	)
}
