'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ExternalLink, Edit, FileText, Calendar, Target, MoreHorizontal, Trash2, Copy, Eye } from 'lucide-react'
import Link from 'next/link'

interface Article {
  _id: string
  title: string
  slug: string
  status: 'draft' | 'in-progress' | 'review' | 'published'
  seoScore: number
  readabilityScore: number
  focusKeyword?: string
  createdAt: string
  updatedAt: string
  googleDocId?: string
  phases: {
    research: boolean
    structure: boolean
    content: boolean
    optimization: boolean
    review: boolean
  }
}

export default function ArticlesPage() {
  const { user } = useUser()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchArticles()
    }
  }, [user])

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles')
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles)
      } else {
        setError('Failed to fetch articles')
      }
    } catch (error) {
      setError('Error loading articles')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default'
      case 'review': return 'secondary'
      case 'in-progress': return 'destructive'
      default: return 'outline'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPhaseProgress = (phases: Article['phases']) => {
    const completed = Object.values(phases).filter(Boolean).length
    const total = Object.keys(phases).length
    return `${completed}/${total}`
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your articles</h1>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Articles</h1>
          <p className="text-muted-foreground">Manage your SEO-optimized content</p>
        </div>
        <Link href="/seo-article-creator">
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Create New Article
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {articles.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating SEO-optimized articles with our 15-phase workflow
            </p>
            <Link href="/seo-article-creator">
              <Button>Create Your First Article</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Articles Overview</CardTitle>
            <CardDescription>
              {articles.length} article{articles.length !== 1 ? 's' : ''} created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SEO Score</TableHead>
                  <TableHead>Readability</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Focus Keyword</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article._id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{article.title}</div>
                        <div className="text-sm text-muted-foreground">/{article.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(article.status)}>
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={getScoreColor(article.seoScore)}>
                        {article.seoScore}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={getScoreColor(article.readabilityScore)}>
                        {article.readabilityScore}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{getPhaseProgress(article.phases)}</span>
                        <Progress 
                          value={(Object.values(article.phases).filter(Boolean).length / 5) * 100} 
                          className="w-16"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {article.focusKeyword && (
                        <Badge variant="outline" className="flex items-center">
                          <Target className="mr-1 h-3 w-3" />
                          {article.focusKeyword}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(article.updatedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(article._id)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/articles/${article._id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit article
                            </Link>
                          </DropdownMenuItem>
                          {article.googleDocId && (
                            <DropdownMenuItem
                              onClick={() => window.open(`https://docs.google.com/document/d/${article.googleDocId}/edit`, '_blank')}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open in Google Docs
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}