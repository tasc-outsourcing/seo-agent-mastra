import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { getArticleModel } from '@/lib/db-models'
import { createGoogleDoc, updateGoogleDoc, getGoogleDocUrl } from '@/lib/google-docs'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    await connectDB()

    const Article = await getArticleModel()
    const article = await Article.findOne({ _id: params.id, userId })
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Prepare content for Google Doc
    const docContent = `${article.title}\n\n${article.content.replace(/<[^>]*>/g, '')}\n\nMeta Description: ${article.metaDescription || 'Not set'}\nFocus Keyword: ${article.focusKeyword || 'Not set'}\nSemantic Keywords: ${article.semanticKeywords.join(', ')}`

    let googleDocId = article.googleDocId
    let isNewDoc = false

    try {
      if (googleDocId) {
        // Update existing Google Doc
        await updateGoogleDoc(googleDocId, docContent)
      } else {
        // Create new Google Doc
        googleDocId = await createGoogleDoc(article.title, docContent)
        isNewDoc = true
        
        if (googleDocId) {
          // Save Google Doc ID to article
          article.googleDocId = googleDocId
          await article.save()
        }
      }

      if (!googleDocId) {
        return NextResponse.json({ error: 'Failed to create/update Google Doc' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        googleDocId,
        googleDocUrl: getGoogleDocUrl(googleDocId),
        isNewDoc,
        message: isNewDoc ? 'Google Doc created successfully' : 'Google Doc updated successfully'
      })

    } catch (googleError) {
      console.error('Google Docs API error:', googleError)
      
      // Check if Google credentials are configured
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        return NextResponse.json({ 
          error: 'Google Docs integration not configured. Please set up Google Service Account credentials.' 
        }, { status: 503 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to export to Google Docs. Please check your Google API configuration.' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error exporting to Google Doc:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}