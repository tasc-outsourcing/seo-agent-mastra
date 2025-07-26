import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { getArticleModel } from '@/lib/db-models'
import { SEOAnalyzer, SEOData } from '@/lib/seo-analyzer'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    await connectDB()

    const Article = await getArticleModel()
    const article = await Article.findOne({ _id: params.id, userId }).lean()
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, metaDescription, focusKeyword, semanticKeywords } = body

    const params = await context.params
    await connectDB()

    const Article = await getArticleModel()
    const article = await Article.findOne({ _id: params.id, userId })
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Update article fields
    article.title = title
    article.content = content
    article.metaDescription = metaDescription
    article.focusKeyword = focusKeyword
    article.semanticKeywords = semanticKeywords || []

    // Recalculate SEO scores if content was updated
    if (content) {
      const seoData: SEOData = {
        content,
        title,
        metaDescription,
        keyword: focusKeyword
      }

      const analysis = SEOAnalyzer.analyze(seoData)
      article.seoScore = analysis.seoScore
      article.readabilityScore = analysis.readabilityScore
    }

    await article.save()

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    await connectDB()

    const Article = await getArticleModel()
    const article = await Article.findOneAndDelete({ _id: params.id, userId })
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}