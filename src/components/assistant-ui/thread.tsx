import {
	ActionBarPrimitive,
	BranchPickerPrimitive,
	ComposerPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
} from "@assistant-ui/react"
import type { FC } from "react"
import {
	ArrowDownIcon,
	CheckIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CopyIcon,
	PencilIcon,
	RefreshCwIcon,
	SendHorizontalIcon,
	SparklesIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { MarkdownText } from "@/components/assistant-ui/markdown-text"
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button"
import {
	ComposerAttachments,
	ComposerAddAttachment,
	UserMessageAttachments,
} from "@/components/assistant-ui/attachment"

export const Thread: FC = () => {
	return (
		<ThreadPrimitive.Root className="bg-background flex h-full flex-col overflow-hidden border-l border-border/40">
			<div className="flex items-center justify-between border-b border-border/40 bg-card/30 px-6 py-4">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
						<SparklesIcon className="size-4 text-primary" />
					</div>
					<div>
						<h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
						<p className="text-sm text-muted-foreground">Powered by Mastra</p>
					</div>
				</div>
			</div>

			<ThreadPrimitive.Viewport
				className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-gradient-to-b from-background/50 to-background px-4 pt-8"
				style={{
					["--thread-max-width" as string]: "48rem",
				}}
			>
				<ThreadWelcome />

				<ThreadPrimitive.Messages
					components={{
						UserMessage: UserMessage,
						EditComposer: EditComposer,
						AssistantMessage: AssistantMessage,
					}}
				/>

				<ThreadPrimitive.If empty={false}>
					<div className="min-h-8 flex-grow" />
				</ThreadPrimitive.If>

				<div className="sticky bottom-0 mt-6 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-gradient-to-t from-background via-background/95 to-transparent pb-6 pt-8">
					<ThreadScrollToBottom />
					<Composer />
				</div>
			</ThreadPrimitive.Viewport>
		</ThreadPrimitive.Root>
	)
}

const ThreadScrollToBottom: FC = () => {
	return (
		<ThreadPrimitive.ScrollToBottom asChild>
			<TooltipIconButton
				tooltip="Scroll to bottom"
				variant="outline"
				className="absolute -top-12 rounded-full border-border/60 bg-background/80 backdrop-blur-sm hover:bg-muted/80 disabled:invisible"
			>
				<ArrowDownIcon className="size-4" />
			</TooltipIconButton>
		</ThreadPrimitive.ScrollToBottom>
	)
}

const ThreadWelcome: FC = () => {
	return (
		<ThreadPrimitive.Empty>
			<div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
				<div className="flex w-full flex-grow flex-col items-center justify-center py-12">
					<div className="mb-6 flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
						<SparklesIcon className="size-8 text-primary" />
					</div>
					<h2 className="mb-2 text-2xl font-semibold text-foreground">
						How can I help you today?
					</h2>
					<p className="text-muted-foreground text-center max-w-md">
						I'm your AI assistant powered by Mastra. Ask me anything and I'll do my best
						to help you.
					</p>
				</div>
				<ThreadWelcomeSuggestions />
			</div>
		</ThreadPrimitive.Empty>
	)
}

const ThreadWelcomeSuggestions: FC = () => {
	return (
		<div className="mt-6 flex w-full items-stretch justify-center gap-3">
			<ThreadPrimitive.Suggestion
				className="group flex max-w-sm grow basis-0 flex-col items-start justify-center rounded-xl border border-border/60 bg-card/50 p-4 transition-all duration-200 ease-in hover:border-border hover:bg-card/80 hover:shadow-sm hover:-translate-y-0.5"
				prompt="What is the weather in Tokyo?"
				method="replace"
				autoSend
			>
				<div className="mb-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
					🌤️ Weather Check
				</div>
				<span className="line-clamp-2 text-ellipsis text-sm text-muted-foreground">
					What is the weather in Tokyo?
				</span>
			</ThreadPrimitive.Suggestion>

			<ThreadPrimitive.Suggestion
				className="group flex max-w-sm grow basis-0 flex-col items-start justify-center rounded-xl border border-border/60 bg-card/50 p-4 transition-all duration-200 ease-in hover:border-border hover:bg-card/80 hover:shadow-sm hover:-translate-y-0.5"
				prompt="What is assistant-ui?"
				method="replace"
				autoSend
			>
				<div className="mb-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
					💡 Learn More
				</div>
				<span className="line-clamp-2 text-ellipsis text-sm text-muted-foreground">
					What is assistant-ui?
				</span>
			</ThreadPrimitive.Suggestion>
		</div>
	)
}

const Composer: FC = () => {
	return (
		<ComposerPrimitive.Root className="focus-within:ring-2 focus-within:ring-primary/20 flex w-full flex-wrap items-end rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm px-2.5 shadow-sm transition-all ease-in hover:border-border">
			<ComposerAttachments />
			<ComposerAddAttachment />
			<ComposerPrimitive.Input
				rows={1}
				autoFocus
				placeholder="Type your message..."
				className="placeholder:text-muted-foreground max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
			/>
			<ComposerAction />
		</ComposerPrimitive.Root>
	)
}

const ComposerAction: FC = () => {
	return (
		<>
			<ThreadPrimitive.If running={false}>
				<ComposerPrimitive.Send asChild>
					<TooltipIconButton
						tooltip="Send message"
						variant="default"
						className="my-2.5 size-8 p-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105"
					>
						<SendHorizontalIcon className="size-4" />
					</TooltipIconButton>
				</ComposerPrimitive.Send>
			</ThreadPrimitive.If>
			<ThreadPrimitive.If running>
				<ComposerPrimitive.Cancel asChild>
					<TooltipIconButton
						tooltip="Stop generation"
						variant="outline"
						className="my-2.5 size-8 p-2 border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors"
					>
						<CircleStopIcon />
					</TooltipIconButton>
				</ComposerPrimitive.Cancel>
			</ThreadPrimitive.If>
		</>
	)
}

const UserMessage: FC = () => {
	return (
		<MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 [&:where(>*)]:col-start-2 w-full max-w-[var(--thread-max-width)] py-6">
			<UserActionBar />

			<UserMessageAttachments />

			<div className="max-w-[calc(var(--thread-max-width)*0.75)] break-words rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-sm col-start-2 row-start-2">
				<MessagePrimitive.Content />
			</div>

			<BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
		</MessagePrimitive.Root>
	)
}

const UserActionBar: FC = () => {
	return (
		<ActionBarPrimitive.Root
			hideWhenRunning
			autohide="not-last"
			className="flex flex-col items-end col-start-1 row-start-2 mr-3 mt-3"
		>
			<ActionBarPrimitive.Edit asChild>
				<TooltipIconButton
					tooltip="Edit message"
					variant="ghost"
					className="size-7 text-muted-foreground hover:text-foreground hover:bg-muted/60"
				>
					<PencilIcon className="size-3.5" />
				</TooltipIconButton>
			</ActionBarPrimitive.Edit>
		</ActionBarPrimitive.Root>
	)
}

const EditComposer: FC = () => {
	return (
		<ComposerPrimitive.Root className="bg-muted/50 border border-border/60 my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-3 rounded-xl p-4">
			<ComposerPrimitive.Input className="text-foreground flex min-h-[2.5rem] w-full resize-none bg-transparent outline-none" />

			<div className="flex items-center justify-end gap-2">
				<ComposerPrimitive.Cancel asChild>
					<Button variant="ghost" size="sm">
						Cancel
					</Button>
				</ComposerPrimitive.Cancel>
				<ComposerPrimitive.Send asChild>
					<Button size="sm">Update</Button>
				</ComposerPrimitive.Send>
			</div>
		</ComposerPrimitive.Root>
	)
}

const AssistantMessage: FC = () => {
	return (
		<MessagePrimitive.Root className="grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr] relative w-full max-w-[var(--thread-max-width)] py-6">
			<div className="flex items-start gap-3 col-span-2 col-start-1 row-start-1">
				<div className="mt-1 flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10 shrink-0">
					<SparklesIcon className="size-4 text-primary" />
				</div>
				<div className="text-foreground max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7 prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border/60">
					<MessagePrimitive.Content components={{ Text: MarkdownText }} />
				</div>
			</div>

			<AssistantActionBar />

			<BranchPicker className="col-start-2 row-start-2 ml-11 mr-2" />
		</MessagePrimitive.Root>
	)
}

const AssistantActionBar: FC = () => {
	return (
		<ActionBarPrimitive.Root
			hideWhenRunning
			autohide="not-last"
			autohideFloat="single-branch"
			className="text-muted-foreground flex gap-1 col-start-3 row-start-1 mt-1 data-[floating]:bg-background data-[floating]:absolute data-[floating]:rounded-lg data-[floating]:border data-[floating]:border-border/60 data-[floating]:p-1.5 data-[floating]:shadow-sm data-[floating]:backdrop-blur-sm"
		>
			<ActionBarPrimitive.Copy asChild>
				<TooltipIconButton
					tooltip="Copy to clipboard"
					variant="ghost"
					className="size-7 hover:bg-muted/60"
				>
					<MessagePrimitive.If copied>
						<CheckIcon className="size-3.5 text-green-600" />
					</MessagePrimitive.If>
					<MessagePrimitive.If copied={false}>
						<CopyIcon className="size-3.5" />
					</MessagePrimitive.If>
				</TooltipIconButton>
			</ActionBarPrimitive.Copy>
			<ActionBarPrimitive.Reload asChild>
				<TooltipIconButton
					tooltip="Regenerate response"
					variant="ghost"
					className="size-7 hover:bg-muted/60"
				>
					<RefreshCwIcon className="size-3.5" />
				</TooltipIconButton>
			</ActionBarPrimitive.Reload>
		</ActionBarPrimitive.Root>
	)
}

const BranchPicker: FC<{ className?: string }> = ({ className }) => {
	return (
		<BranchPickerPrimitive.Root
			hideWhenSingleBranch
			className={cn("text-muted-foreground flex items-center gap-1 text-xs", className)}
		>
			<BranchPickerPrimitive.Previous asChild>
				<TooltipIconButton tooltip="Previous version" variant="ghost" className="size-6">
					<ChevronLeftIcon className="size-3" />
				</TooltipIconButton>
			</BranchPickerPrimitive.Previous>
			<span className="font-medium">
				<BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
			</span>
			<BranchPickerPrimitive.Next asChild>
				<TooltipIconButton tooltip="Next version" variant="ghost" className="size-6">
					<ChevronRightIcon className="size-3" />
				</TooltipIconButton>
			</BranchPickerPrimitive.Next>
		</BranchPickerPrimitive.Root>
	)
}

const CircleStopIcon = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 16 16"
			fill="currentColor"
			width="16"
			height="16"
		>
			<rect width="10" height="10" x="3" y="3" rx="2" />
		</svg>
	)
}
