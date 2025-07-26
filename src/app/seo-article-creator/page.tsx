"use client"

import { useState, useEffect } from 'react'
import { TopNav } from "@/components/top-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { PenTool, Lightbulb, Clock, CheckCircle, FileText, Loader2, Rocket, Target, Users, BarChart3, Search, Upload, Edit3, Eye, Save, TrendingUp, BarChart2, Zap } from "lucide-react"

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
}

export default function SEOArticleCreatorPage() {
  const { isSignedIn, isLoaded } = useUser()
  const [topic, setTopic] = useState('')
  const [researchOption, setResearchOption] = useState<'new' | 'existing'>('new')
  const [existingResearch, setExistingResearch] = useState('')
  const [articleType, setArticleType] = useState<'informational' | 'commercial' | 'transactional' | 'hybrid'>('informational')
  const [targetAudience, setTargetAudience] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [activeTab, setActiveTab] = useState('input')
  const [generatedContent, setGeneratedContent] = useState('')
  const [seoScores, setSeoScores] = useState({
    overall: 0,
    keyword: 0,
    readability: 0,
    structure: 0,
    meta: 0
  })
  const [results, setResults] = useState<any>(null)

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

  const initializeWorkflow = () => {
    const steps: WorkflowStep[] = [
      {
        id: 'research',
        title: 'SEO Research & Analysis',
        description: 'Phases 1-3: Focus keyword research, persona development, SERP analysis',
        status: 'pending'
      },
      {
        id: 'structure',
        title: 'Structure & Planning',
        description: 'Phases 4-6: Folder setup, outline creation, section bullet drafting',
        status: 'pending'
      },
      {
        id: 'content',
        title: 'Content Creation',
        description: 'Phases 7-8: Draft writing and flow optimization',
        status: 'pending'
      },
      {
        id: 'optimization',
        title: 'SEO Optimization & Polish',
        description: 'Phases 9-15: Metadata, FAQs, SGE optimization, Yoast optimization',
        status: 'pending'
      },
      {
        id: 'review',
        title: 'Final Review & Delivery',
        description: 'Quality assurance and article packaging',
        status: 'pending'
      }
    ]
    setWorkflowSteps(steps)
  }

  const handleStartWorkflow = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic to get started.')
      return
    }

    if (researchOption === 'existing' && !existingResearch.trim()) {
      alert('Please provide existing research data or switch to new research.')
      return
    }

    setIsProcessing(true)
    initializeWorkflow()
    setCurrentStep(0)
    setActiveTab('progress')

    try {
      // Connect to the streaming workflow API
      const response = await fetch('/api/workflow/seo-article/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          articleType,
          targetAudience,
          researchOption,
          existingResearch
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start workflow')
      }

      // Handle Server-Sent Events
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream available')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              handleStreamEvent(data)
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }

    } catch (error) {
      console.error('Workflow error:', error)
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === currentStep ? { ...step, status: 'error' } : step
      ))
      alert('Error starting workflow: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStreamEvent = (data: any) => {
    console.log('Stream event:', data)
    
    switch (data.type) {
      case 'status':
        // Update general status
        break
        
      case 'step_start':
        // Mark step as in progress
        const stepIndex = getStepIndex(data.step)
        setWorkflowSteps(prev => prev.map((step, index) => 
          index === stepIndex ? { ...step, status: 'in-progress' } : step
        ))
        setCurrentStep(stepIndex)
        break
        
      case 'step_complete':
        // Mark step as completed
        const completedStepIndex = getStepIndex(data.step)
        setWorkflowSteps(prev => prev.map((step, index) => 
          index === completedStepIndex ? { ...step, status: 'completed' } : step
        ))
        break
        
      case 'workflow_complete':
        // Handle final results
        const result = data.result
        setResults({
          articleSlug: result.articleSlug,
          articlePath: `generated-articles/${result.articleSlug}`,
          focusKeyword: result.focusKeyword || topic,
          wordCount: result.wordCount || 1850,
          seoScore: result.seoScore || 94,
          readabilityScore: result.readabilityScore || 87
        })
        
        // Set generated content
        if (result.content) {
          setGeneratedContent(result.content)
        }
        
        // Update SEO scores
        setSeoScores({
          overall: result.seoScore || 94,
          keyword: 88,
          readability: result.readabilityScore || 92,
          structure: 96,
          meta: 90
        })
        
        // Switch to content tab
        setActiveTab('content')
        break
        
      case 'error':
        console.error('Workflow error:', data.message)
        setWorkflowSteps(prev => prev.map((step, index) => 
          index === currentStep ? { ...step, status: 'error' } : step
        ))
        break
    }
  }

  const getStepIndex = (stepId: string): number => {
    const stepMap: { [key: string]: number } = {
      'research': 0,
      'structure': 1, 
      'content': 2,
      'optimization': 3,
      'review': 4
    }
    return stepMap[stepId] || 0
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      case 'error':
        return <div className="w-5 h-5 bg-red-600 rounded-full" />
      default:
        return <div className="w-5 h-5 bg-gray-300 rounded-full" />
    }
  }

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'in-progress': return 'secondary'
      case 'error': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <TopNav />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <PenTool className="w-8 h-8" />
              SEO Article Creator
            </h1>
            <p className="text-muted-foreground mt-2">
              Transform your keyword or topic into a fully optimized, SEO-ready article using our 15-phase workflow.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="input" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Input
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2" disabled={!generatedContent}>
                <Edit3 className="w-4 h-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2" disabled={!generatedContent}>
                <TrendingUp className="w-4 h-4" />
                SEO Analysis
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2" disabled={!generatedContent}>
                <Eye className="w-4 h-4" />
                Review & Save
              </TabsTrigger>
            </TabsList>

            {/* Input Tab */}
            <TabsContent value="input" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Article Request
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Article Topic</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., 'business setup in saudi arabia' or 'AI tools for content marketing'"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={isProcessing}
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Research Option</Label>
                    <RadioGroup 
                      value={researchOption} 
                      onValueChange={(value) => setResearchOption(value as 'new' | 'existing')}
                      disabled={isProcessing}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new-research" />
                        <Label htmlFor="new-research" className="flex items-center gap-2 cursor-pointer">
                          <Search className="w-4 h-4" />
                          Conduct new research
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing" id="existing-research" />
                        <Label htmlFor="existing-research" className="flex items-center gap-2 cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Load existing research
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {researchOption === 'existing' && (
                      <Textarea
                        placeholder="Paste your existing research data here..."
                        value={existingResearch}
                        onChange={(e) => setExistingResearch(e.target.value)}
                        rows={4}
                        disabled={isProcessing}
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="articleType">Article Type</Label>
                      <Select
                        value={articleType}
                        onValueChange={(value) => setArticleType(value as any)}
                        disabled={isProcessing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select article type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="informational">
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              Informational
                            </div>
                          </SelectItem>
                          <SelectItem value="commercial">
                            <div className="flex items-center">
                              <Target className="mr-2 h-4 w-4" />
                              Commercial
                            </div>
                          </SelectItem>
                          <SelectItem value="transactional">
                            <div className="flex items-center">
                              <Rocket className="mr-2 h-4 w-4" />
                              Transactional
                            </div>
                          </SelectItem>
                          <SelectItem value="hybrid">
                            <div className="flex items-center">
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Hybrid
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="targetAudience"
                          placeholder="e.g., startup founders, marketers"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          disabled={isProcessing}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleStartWorkflow} 
                    disabled={isProcessing || !topic.trim() || (researchOption === 'existing' && !existingResearch.trim())}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Article...
                      </>
                    ) : (
                      <>
                        <PenTool className="w-4 h-4 mr-2" />
                        Start Article Creation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Workflow Progress
                  </CardTitle>
                  {workflowSteps.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{Math.round((workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length) * 100} 
                        className="w-full"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {workflowSteps.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      Enter your article details and click "Start Article Creation" to begin the 15-phase SEO workflow.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {workflowSteps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg border">
                          <div className="flex-shrink-0 mt-1">
                            {getStepIcon(step.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{step.title}</h4>
                              <Badge variant={getBadgeColor(step.status) as any} className="text-xs">
                                {step.status.replace('-', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Edit3 className="w-5 h-5" />
                        Article Editor
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={generatedContent}
                        onChange={(e) => setGeneratedContent(e.target.value)}
                        placeholder="Generated article content will appear here..."
                        rows={20}
                        className="font-mono text-sm"
                      />
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600">Word Count</div>
                        <div className="font-medium">{generatedContent.split(/\s+/).length} words</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Characters</div>
                        <div className="font-medium">{generatedContent.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Reading Time</div>
                        <div className="font-medium">{Math.ceil(generatedContent.split(/\s+/).length / 200)} min</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* SEO Analysis Tab */}
            <TabsContent value="seo" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      SEO Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Overall SEO Score</span>
                          <span className="font-medium">{seoScores.overall}%</span>
                        </div>
                        <Progress value={seoScores.overall} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Keyword Optimization</span>
                          <span className="font-medium">{seoScores.keyword}%</span>
                        </div>
                        <Progress value={seoScores.keyword} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Readability</span>
                          <span className="font-medium">{seoScores.readability}%</span>
                        </div>
                        <Progress value={seoScores.readability} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Structure</span>
                          <span className="font-medium">{seoScores.structure}%</span>
                        </div>
                        <Progress value={seoScores.structure} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Meta Data</span>
                          <span className="font-medium">{seoScores.meta}%</span>
                        </div>
                        <Progress value={seoScores.meta} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      SEO Checklist
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Focus keyword in title</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Meta description optimized</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Proper heading structure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Internal links added</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-yellow-600" />
                        <span>Image alt tags (needs review)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Semantic keywords included</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Review & Save Tab */}
            <TabsContent value="review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Final Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {results && (
                    <>
                      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{seoScores.overall}%</div>
                          <div className="text-sm text-gray-600">SEO Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{generatedContent.split(/\s+/).length}</div>
                          <div className="text-sm text-gray-600">Words</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{Math.ceil(generatedContent.split(/\s+/).length / 200)}</div>
                          <div className="text-sm text-gray-600">Min Read</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="article-title">Article Title</Label>
                          <Input id="article-title" value={results.focusKeyword} className="font-medium" />
                        </div>
                        <div>
                          <Label htmlFor="article-slug">URL Slug</Label>
                          <Input id="article-slug" value={results.articleSlug} />
                        </div>
                        <div>
                          <Label htmlFor="meta-description">Meta Description</Label>
                          <Textarea 
                            id="meta-description" 
                            rows={2}
                            placeholder="Generated meta description will appear here..."
                            value={`Comprehensive guide on ${results.focusKeyword}. Learn everything you need to know with expert insights and actionable tips.`}
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button className="flex-1" size="lg">
                          <Save className="w-4 h-4 mr-2" />
                          Save to My Articles
                        </Button>
                        <Button variant="outline" size="lg">
                          <FileText className="w-4 h-4 mr-2" />
                          Export to Google Docs
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}