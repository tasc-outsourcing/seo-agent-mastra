"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SEOAnalyzer } from "@/lib/seo-analyzer"
import { FileText, Clock, Eye, Hash, Target, Link, Image } from "lucide-react"

interface ContentStatisticsProps {
  content: string
  keyword?: string
}

export function ContentStatistics({ content, keyword }: ContentStatisticsProps) {
  const stats = useMemo(() => {
    if (!content.trim()) return null
    return SEOAnalyzer.analyzeContent(content, keyword)
  }, [content, keyword])

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Content Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No content to analyze</p>
        </CardContent>
      </Card>
    )
  }

  const getReadingTime = (wordCount: number) => {
    // Average reading speed: 200-250 words per minute
    const minutes = Math.ceil(wordCount / 225)
    return minutes === 1 ? '1 min' : `${minutes} mins`
  }

  const getFleschRating = (score?: number) => {
    if (!score) return { text: 'Unknown', color: 'gray' }
    if (score >= 90) return { text: 'Very Easy', color: 'green' }
    if (score >= 80) return { text: 'Easy', color: 'green' }
    if (score >= 70) return { text: 'Fairly Easy', color: 'yellow' }
    if (score >= 60) return { text: 'Standard', color: 'yellow' }
    if (score >= 50) return { text: 'Fairly Difficult', color: 'orange' }
    if (score >= 30) return { text: 'Difficult', color: 'red' }
    return { text: 'Very Difficult', color: 'red' }
  }

  const fleschRating = getFleschRating(stats.fleschReadingEase)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Content Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Basic Metrics */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Hash className="w-3 h-3" />
              Words
            </div>
            <div className="text-2xl font-bold">{stats.wordCount.toLocaleString()}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-3 h-3" />
              Reading Time
            </div>
            <div className="text-2xl font-bold">{getReadingTime(stats.wordCount)}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <FileText className="w-3 h-3" />
              Sentences
            </div>
            <div className="text-2xl font-bold">{stats.sentenceCount}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <FileText className="w-3 h-3" />
              Paragraphs
            </div>
            <div className="text-2xl font-bold">{stats.paragraphCount}</div>
          </div>

          {/* SEO Metrics */}
          {keyword && stats.keywordDensity && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Target className="w-3 h-3" />
                Keyword Density
              </div>
              <div className="text-2xl font-bold">{stats.keywordDensity.toFixed(1)}%</div>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Link className="w-3 h-3" />
              Links
            </div>
            <div className="text-2xl font-bold">
              {stats.linkCount.internal + stats.linkCount.external}
            </div>
            <div className="text-xs text-gray-500">
              {stats.linkCount.internal} internal, {stats.linkCount.external} external
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Image className="w-3 h-3" />
              Images
            </div>
            <div className="text-2xl font-bold">{stats.imageCount}</div>
          </div>

          {/* Readability */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Eye className="w-3 h-3" />
              Readability
            </div>
            <div className="space-y-1">
              <Badge variant={fleschRating.color as any} className="text-xs">
                {fleschRating.text}
              </Badge>
              {stats.fleschReadingEase && (
                <div className="text-xs text-gray-500">
                  Score: {stats.fleschReadingEase.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="mt-6 pt-4 border-t space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Detailed Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-gray-600">Avg. sentence length:</span>
              <span className="font-medium ml-1">{stats.averageSentenceLength.toFixed(1)} words</span>
            </div>
            <div>
              <span className="text-gray-600">Avg. paragraph length:</span>
              <span className="font-medium ml-1">{stats.averageParagraphLength.toFixed(1)} words</span>
            </div>
            <div>
              <span className="text-gray-600">Passive voice:</span>
              <span className="font-medium ml-1">{stats.passiveVoicePercentage.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-600">Transition words:</span>
              <span className="font-medium ml-1">{stats.transitionWordPercentage.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-600">Complex words:</span>
              <span className="font-medium ml-1">{stats.complexWordCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Syllables:</span>
              <span className="font-medium ml-1">{stats.syllableCount}</span>
            </div>
          </div>
        </div>

        {/* Headings Breakdown */}
        {Object.values(stats.headingCount).some(count => count > 0) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Heading Structure</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.headingCount).map(([tag, count]) => (
                count > 0 && (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag.toUpperCase()}: {count}
                  </Badge>
                )
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}