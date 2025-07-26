import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { Article } from '@/models/Article'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const articles = await Article.find({ userId })
      .sort({ updatedAt: -1 })
      .select('-content') // Exclude content for list view
      .lean()

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, slug, content, metaDescription, focusKeyword, semanticKeywords } = body

    // Handle MongoDB connection errors gracefully
    try {
      await connectDB()
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({ 
        error: 'Database connection failed' 
      }, { status: 503 })
    }

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