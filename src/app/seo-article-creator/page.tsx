"use client"

import { useState } from 'react'
import { TopNav } from "@/components/top-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { PenTool, Lightbulb, Clock, CheckCircle, FileText, Loader2 } from "lucide-react"

interface WorkflowStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
}

export default function SEOArticleCreatorPage() {
  const { isSignedIn, isLoaded } = useUser()
  const [userInput, setUserInput] = useState('')
  const [articleType, setArticleType] = useState<'informational' | 'commercial' | 'transactional' | 'hybrid'>('informational')
  const [targetAudience, setTargetAudience] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
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
    if (!userInput.trim()) {
      alert('Please enter a keyword, topic, or context to get started.')
      return
    }

    setIsProcessing(true)
    initializeWorkflow()
    setCurrentStep(0)

    try {
      // This would integrate with your Mastra workflow
      // For now, simulate the workflow steps
      
      // Step 1: Research
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'in-progress' } : step
      ))
      
      // Simulate API call to Mastra workflow
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'completed' } : step
      ))
      setCurrentStep(1)

      // Step 2: Structure
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 1 ? { ...step, status: 'in-progress' } : step
      ))
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 1 ? { ...step, status: 'completed' } : step
      ))
      setCurrentStep(2)

      // Step 3: Content
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 2 ? { ...step, status: 'in-progress' } : step
      ))
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 2 ? { ...step, status: 'completed' } : step
      ))
      setCurrentStep(3)

      // Step 4: Optimization
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 3 ? { ...step, status: 'in-progress' } : step
      ))
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 3 ? { ...step, status: 'completed' } : step
      ))
      setCurrentStep(4)

      // Step 5: Review
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 4 ? { ...step, status: 'in-progress' } : step
      ))
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === 4 ? { ...step, status: 'completed' } : step
      ))

      // Set mock results
      const articleSlug = userInput.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50)
      setResults({
        articleSlug,
        articlePath: `generated-articles/${articleSlug}`,
        focusKeyword: userInput,
        wordCount: 1850,
        seoScore: 94,
        readabilityScore: 87
      })

    } catch (error) {
      console.error('Workflow error:', error)
      setWorkflowSteps(prev => prev.map((step, index) => 
        index === currentStep ? { ...step, status: 'error' } : step
      ))
    } finally {
      setIsProcessing(false)
    }
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Article Request
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userInput">Keyword, Topic, or Context</Label>
                    <Textarea
                      id="userInput"
                      placeholder="Enter your focus keyword, topic idea, or article context. Examples:&#10;• 'business setup in saudi arabia'&#10;• 'AI tools for content marketing'&#10;• 'How to optimize website speed'"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      rows={4}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="articleType">Article Type</Label>
                      <select
                        id="articleType"
                        value={articleType}
                        onChange={(e) => setArticleType(e.target.value as any)}
                        disabled={isProcessing}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="informational">Informational</option>
                        <option value="commercial">Commercial</option>
                        <option value="transactional">Transactional</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
                      <Input
                        id="targetAudience"
                        placeholder="e.g., startup founders, marketers"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleStartWorkflow} 
                    disabled={isProcessing || !userInput.trim()}
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

              {/* Results Section */}
              {results && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Article Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Focus Keyword</div>
                        <div className="font-medium">{results.focusKeyword}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Word Count</div>
                        <div className="font-medium">{results.wordCount} words</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">SEO Score</div>
                        <Badge variant={results.seoScore >= 90 ? 'default' : results.seoScore >= 70 ? 'secondary' : 'destructive'}>
                          {results.seoScore}/100
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Readability</div>
                        <Badge variant={results.readabilityScore >= 80 ? 'default' : results.readabilityScore >= 60 ? 'secondary' : 'destructive'}>
                          {results.readabilityScore}/100
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600 mb-2">Article Location</div>
                      <code className="text-xs bg-gray-100 p-2 rounded block">
                        {results.articlePath}
                      </code>
                    </div>

                    <Button variant="outline" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      View Generated Files
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Workflow Progress */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Workflow Progress
                  </CardTitle>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}