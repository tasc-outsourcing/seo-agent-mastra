"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScoreIndicator } from "@/components/ui/score-indicator"
import { AssessmentItem } from "./assessment-item"
import { SEOAnalyzer, SEOData } from "@/lib/seo-analyzer"
import { Search, BookOpen, BarChart3 } from "lucide-react"

interface SEOPanelProps {
  content: string
  onAnalyze?: (results: any) => void
}

export function SEOPanel({ content, onAnalyze }: SEOPanelProps) {
  const [seoData, setSeoData] = useState<SEOData>({
    title: '',
    metaDescription: '',
    url: '',
    content: content || '',
    keyword: '',
    synonyms: [],
    relatedKeywords: []
  })

  const [isCornerstone, setIsCornerstone] = useState(false)

  // Update content when prop changes
  useMemo(() => {
    setSeoData(prev => ({ ...prev, content: content || '' }))
  }, [content])

  // Analyze content in real-time
  const analysis = useMemo(() => {
    if (!seoData.content.trim()) {
      return null
    }
    return SEOAnalyzer.analyze(seoData, isCornerstone)
  }, [seoData, isCornerstone])

  const handleFieldChange = (field: keyof SEOData, value: string) => {
    setSeoData(prev => ({ ...prev, [field]: value }))
  }

  const handleAnalyze = () => {
    if (analysis && onAnalyze) {
      onAnalyze(analysis)
    }
  }

  return (
    <div className="space-y-6">
      {/* SEO Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            SEO Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Focus Keyword</Label>
              <Input
                id="keyword"
                placeholder="Enter your focus keyword"
                value={seoData.keyword}
                onChange={(e) => handleFieldChange('keyword', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL Slug</Label>
              <Input
                id="url"
                placeholder="article-url-slug"
                value={seoData.url}
                onChange={(e) => handleFieldChange('url', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">SEO Title</Label>
            <Input
              id="title"
              placeholder="Enter your SEO title (30-60 characters)"
              value={seoData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className={(seoData.title?.length || 0) > 60 ? 'border-red-300' : ''}
            />
            <div className="text-xs text-gray-500">
              {seoData.title?.length || 0}/60 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              placeholder="Enter your meta description (120-156 characters)"
              value={seoData.metaDescription}
              onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
              rows={3}
              className={(seoData.metaDescription?.length || 0) > 156 ? 'border-red-300' : ''}
            />
            <div className="text-xs text-gray-500">
              {seoData.metaDescription?.length || 0}/156 characters
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="cornerstone"
              checked={isCornerstone}
              onChange={(e) => setIsCornerstone(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="cornerstone">Mark as cornerstone content</Label>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              SEO Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Overall Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <ScoreIndicator score={analysis.seoScore} size="lg" showText={false} />
                <div className="mt-2">
                  <div className="font-semibold">SEO Score</div>
                  <div className="text-sm text-gray-600">Search optimization</div>
                </div>
              </div>
              
              <div className="text-center">
                <ScoreIndicator score={analysis.readabilityScore} size="lg" showText={false} />
                <div className="mt-2">
                  <div className="font-semibold">Readability</div>
                  <div className="text-sm text-gray-600">Content readability</div>
                </div>
              </div>

              <div className="text-center">
                <ScoreIndicator 
                  score={Math.round((analysis.seoScore + analysis.readabilityScore) / 2)} 
                  size="lg" 
                  showText={false} 
                />
                <div className="mt-2">
                  <div className="font-semibold">Overall</div>
                  <div className="text-sm text-gray-600">Combined score</div>
                </div>
              </div>
            </div>

            {/* Detailed Assessments */}
            <Tabs defaultValue="seo" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="seo" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  SEO Analysis
                </TabsTrigger>
                <TabsTrigger value="readability" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Readability
                </TabsTrigger>
              </TabsList>

              <TabsContent value="seo" className="mt-4">
                <div className="space-y-3">
                  {analysis.seoAssessments.map((assessment, index) => (
                    <AssessmentItem key={index} assessment={assessment} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="readability" className="mt-4">
                <div className="space-y-3">
                  {analysis.readabilityAssessments.map((assessment, index) => (
                    <AssessmentItem key={index} assessment={assessment} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {onAnalyze && (
              <div className="mt-6 pt-4 border-t">
                <Button onClick={handleAnalyze} className="w-full">
                  Apply Analysis to Content
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}