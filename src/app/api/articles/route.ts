import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { getArticleModel } from '@/lib/db-models'
import { z } from 'zod'
import { inputSchemas, auditLogger, securityHeaders } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      auditLogger.log({
        type: 'auth_failure',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: { path: '/api/articles', method: 'GET' }
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders })
    }

    // Handle MongoDB connection errors gracefully
    try {
      await connectDB()
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        articles: [] 
      }, { status: 503 })
    }

    const Article = await getArticleModel()
    const articles = await Article.find({ userId })
      .sort({ updatedAt: -1 })
      .select('-content') // Exclude content for list view
      .lean()

    return NextResponse.json({ articles }, { headers: securityHeaders })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Article creation schema
const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  content: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
  focusKeyword: z.string().min(1).max(100),
  semanticKeywords: z.array(z.string()).max(10).optional()
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      auditLogger.log({
        type: 'auth_failure',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: { path: '/api/articles', method: 'POST' }
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: securityHeaders })
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = createArticleSchema.safeParse(body)
    if (!validationResult.success) {
      auditLogger.log({
        type: 'invalid_input',
        userId,
        details: { 
          path: '/api/articles',
          errors: validationResult.error.flatten()
        }
      })
      return NextResponse.json({ 
        error: 'Invalid input',
        details: validationResult.error.flatten()
      }, { status: 400, headers: securityHeaders })
    }
    
    const { title, slug, content, metaDescription, focusKeyword, semanticKeywords } = validationResult.data

    // Handle MongoDB connection errors gracefully
    try {
      await connectDB()
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({ 
        error: 'Database connection failed' 
      }, { status: 503 })
    }

    const Article = await getArticleModel()

    // Check if slug already exists for this user
    const existingArticle = await Article.findOne({ userId, slug })
    if (existingArticle) {
      return NextResponse.json({ error: 'Article with this slug already exists' }, { status: 400 })
    }

    const article = new Article({
      title,
      slug,
      content: content || '',
      metaDescription,
      focusKeyword,
      semanticKeywords: semanticKeywords || [],
      userId,
      userEmail: 'user@example.com', // Default email since user object not available
      status: 'draft'
    })

    await article.save()

    return NextResponse.json({ article }, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}