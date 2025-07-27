import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"
import { validateEnv } from "@/lib/env"
import { AgentChatAnnouncements } from "@/components/agent-chat-announcements"

// Validate environment variables on startup (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnv();
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    // In production, you might want to exit the process
    // if (process.env.NODE_ENV === 'production') {
    //   process.exit(1);
    // }
  }
}

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

export const metadata: Metadata = {
	title: "TASC Blog Article Agent v2 - Powered by Mastra",
	description: "AI-powered blog article generation system using Claude Code and Mastra",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ClerkProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						{children}
						<Toaster />
						<AgentChatAnnouncements />
					</ThemeProvider>
				</ClerkProvider>
			</body>
		</html>
	)
}
