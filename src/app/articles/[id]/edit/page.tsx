'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { toast } from 'sonner'
import TiptapEditor from '@/components/TiptapEditor'
import { Save, ExternalLink, FileText, Target, BarChart3, ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Article {
  _id: string
  title: string
  slug: string
  content: string
  metaDescription?: string
  focusKeyword?: string
  semanticKeywords: string[]
  seoScore: number
  readabilityScore: number
  status: 'draft' | 'in-progress' | 'review' | 'published'
  googleDocId?: string
  phases: {
    research: boolean
    structure: boolean
    content: boolean
    optimization: boolean
    review: boolean
  }
}

export default function EditArticlePage() {
  const { user } = useUser()
  const { id } = useParams()
  const router = useRouter()
  
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (user && id) {
      fetchArticle()
    }
  }, [user, id])

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/articles/${id}`)
      if (response.ok) {
        const data = await response.json()
        setArticle(data.article)
      } else {
        toast.error('Failed to load article')
        router.push('/articles')
      }
    } catch (error) {
      toast.error('Error loading article')
      router.push('/articles')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!article) return

    setSaving(true)
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          metaDescription: article.metaDescription,
          focusKeyword: article.focusKeyword,
          semanticKeywords: article.semanticKeywords
        })
      })

      if (response.ok) {
        toast.success('Article saved successfully')
        fetchArticle() // Refresh to get updated scores
      } else {
        toast.error('Failed to save article')
      }
    } catch (error) {
      toast.error('Error saving article')
    } finally {
      setSaving(false)
    }
  }

  const handleExportToGoogleDocs = async () => {
    if (!article) return

    setExporting(true)
    try {
      const response = await fetch(`/api/articles/${id}/export-google-doc`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Article exported to Google Docs')
        
        // Update local state with Google Doc ID
        setArticle(prev => prev ? { ...prev, googleDocId: data.googleDocId } : null)
        
        // Open Google Doc in new tab
        window.open(data.googleDocUrl, '_blank')
      } else {
        toast.error('Failed to export to Google Docs')
      }
    } catch (error) {
      toast.error('Error exporting to Google Docs')
    } finally {
      setExporting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to edit articles</h1>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <Button onClick={() => router.push('/articles')}>
            Back to Articles
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/articles">Articles</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Article</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/articles')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Article</h1>
            <p className="text-muted-foreground">Make changes and save your article</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {article.googleDocId && (
            <Button
              variant="outline"
              onClick={() => window.open(`https://docs.google.com/document/d/${article.googleDocId}/edit`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Google Docs
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleExportToGoogleDocs}
            disabled={exporting}
          >
            <FileText className="mr-2 h-4 w-4" />
            {exporting ? 'Exporting...' : article.googleDocId ? 'Update Google Doc' : 'Export to Google Docs'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Article'}
          </Button>
        </div>
      </div>

      {/* SEO Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            SEO Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="relative inline-block">
                <div className="text-3xl font-bold mb-2">
                  <span className={getScoreColor(article.seoScore)}>
                    {article.seoScore}%
                  </span>
                </div>
                <Progress 
                  value={article.seoScore} 
                  className="w-24 mx-auto"
                />
              </div>
              <Badge variant={getScoreBadgeVariant(article.seoScore)} className="flex items-center justify-center w-fit mx-auto">
                <BarChart3 className="mr-1 h-3 w-3" />
                SEO Score
              </Badge>
            </div>
            <div className="text-center space-y-2">
              <div className="relative inline-block">
                <div className="text-3xl font-bold mb-2">
                  <span className={getScoreColor(article.readabilityScore)}>
                    {article.readabilityScore}%
                  </span>
                </div>
                <Progress 
                  value={article.readabilityScore} 
                  className="w-24 mx-auto"
                />
              </div>
              <Badge variant={getScoreBadgeVariant(article.readabilityScore)} className="flex items-center justify-center w-fit mx-auto">
                <FileText className="mr-1 h-3 w-3" />
                Readability
              </Badge>
            </div>
            <div className="text-center space-y-2">
              <div className="relative inline-block">
                <div className="text-3xl font-bold mb-2">
                  <span className={getScoreColor(Math.round((article.seoScore + article.readabilityScore) / 2))}>
                    {Math.round((article.seoScore + article.readabilityScore) / 2)}%
                  </span>
                </div>
                <Progress 
                  value={Math.round((article.seoScore + article.readabilityScore) / 2)} 
                  className="w-24 mx-auto"
                />
              </div>
              <Badge variant={getScoreBadgeVariant(Math.round((article.seoScore + article.readabilityScore) / 2))} className="flex items-center justify-center w-fit mx-auto">
                <CheckCircle className="mr-1 h-3 w-3" />
                Overall
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Article Settings</CardTitle>
          <CardDescription>Update title, SEO settings, and metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={article.title}
                onChange={(e) => setArticle(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Enter article title"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={article.slug}
                onChange={(e) => setArticle(prev => prev ? { ...prev, slug: e.target.value } : null)}
                placeholder="article-slug"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={article.metaDescription || ''}
              onChange={(e) => setArticle(prev => prev ? { ...prev, metaDescription: e.target.value } : null)}
              placeholder="Enter meta description (150-160 characters recommended)"
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {(article.metaDescription || '').length}/160 characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="focusKeyword">Focus Keyword</Label>
              <div className="flex">
                <Target className="mr-2 h-4 w-4 mt-3 text-muted-foreground" />
                <Input
                  id="focusKeyword"
                  value={article.focusKeyword || ''}
                  onChange={(e) => setArticle(prev => prev ? { ...prev, focusKeyword: e.target.value } : null)}
                  placeholder="Main keyword to optimize for"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="semanticKeywords">Semantic Keywords</Label>
              <Input
                id="semanticKeywords"
                value={article.semanticKeywords.join(', ')}
                onChange={(e) => setArticle(prev => prev ? { 
                  ...prev, 
                  semanticKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                } : null)}
                placeholder="Related keywords (comma-separated)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
          <CardDescription>Edit your article content with the rich text editor</CardDescription>
        </CardHeader>
        <CardContent>
          <TiptapEditor
            content={article.content}
            onChange={(content) => setArticle(prev => prev ? { ...prev, content } : null)}
          />
        </CardContent>
      </Card>
    </div>
  )
}