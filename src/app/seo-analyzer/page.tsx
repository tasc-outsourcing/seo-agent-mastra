"use client"

import { useState } from 'react'
import { TopNav } from "@/components/top-nav"
import { SEOPanel } from "@/components/seo/seo-panel"
import { ContentStatistics } from "@/components/seo/content-statistics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { BarChart3 } from "lucide-react"

export default function SEOAnalyzerPage() {
  const { isSignedIn, isLoaded } = useUser()
  const [content, setContent] = useState('')

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

  const handleAnalysisResult = (results: any) => {
    console.log('SEO Analysis Results:', results)
    // You can add additional logic here to handle the results
    // For example, saving to database, showing notifications, etc.
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <TopNav />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              TASC SEO Analyzer
            </h1>
            <p className="text-muted-foreground mt-2">
              Analyze your blog content for SEO optimization and readability using Yoast-inspired scoring algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Input */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content to Analyze</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="content">Blog Content (HTML or Plain Text)</Label>
                    <Textarea
                      id="content"
                      placeholder="Paste your blog content here for analysis..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Content Statistics */}
              <ContentStatistics content={content} />
            </div>

            {/* SEO Analysis Panel */}
            <div>
              <SEOPanel 
                content={content} 
                onAnalyze={handleAnalysisResult}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}