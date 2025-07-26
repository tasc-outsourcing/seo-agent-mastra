"use client"

import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import Link from "next/link"
import { BarChart3, MessageSquare, PenTool, FileText } from "lucide-react"

export function TopNav() {
	const { isSignedIn, isLoaded } = useUser()

	return (
		<nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center justify-between">
				<div className="flex items-center space-x-6">
					<Link href="/" className="text-lg font-semibold hover:opacity-80">
						TASC Blog Article Agent v2
					</Link>
					
					{isSignedIn && (
						<nav className="flex items-center space-x-4">
							<Link href="/">
								<Button variant="ghost" size="sm" className="flex items-center gap-2">
									<MessageSquare className="w-4 h-4" />
									Assistant
								</Button>
							</Link>
							<Link href="/articles">
								<Button variant="ghost" size="sm" className="flex items-center gap-2">
									<FileText className="w-4 h-4" />
									My Articles
								</Button>
							</Link>
							<Link href="/seo-article-creator">
								<Button variant="ghost" size="sm" className="flex items-center gap-2">
									<PenTool className="w-4 h-4" />
									Article Creator
								</Button>
							</Link>
							<Link href="/seo-analyzer">
								<Button variant="ghost" size="sm" className="flex items-center gap-2">
									<BarChart3 className="w-4 h-4" />
									SEO Analyzer
								</Button>
							</Link>
						</nav>
					)}
				</div>

				<div className="flex items-center space-x-4">
					<ThemeToggle />
					
					{isLoaded && (
						<>
							{isSignedIn ? (
								<UserButton 
									afterSignOutUrl="/"
									appearance={{
										elements: {
											avatarBox: "h-8 w-8"
										}
									}}
								/>
							) : (
								<div className="flex items-center space-x-2">
									<SignInButton mode="modal">
										<Button variant="ghost" size="sm">
											Sign In
										</Button>
									</SignInButton>
									<SignUpButton mode="modal">
										<Button size="sm">
											Sign Up
										</Button>
									</SignUpButton>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</nav>
	)
} 