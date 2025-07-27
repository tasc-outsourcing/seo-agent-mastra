import { google } from 'googleapis'
import { getEnv, isFeatureEnabled } from '@/lib/env'
import { auditLogger } from '@/lib/security'

let auth: any = null

// Initialize Google auth if configured
if (isFeatureEnabled('google')) {
  try {
    const env = getEnv()
    const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY!)
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive'
      ]
    })
  } catch (error) {
    console.error('Failed to initialize Google auth:', error)
    auditLogger.log({
      type: 'api_error',
      details: { 
        service: 'google',
        error: 'Failed to parse Google credentials'
      }
    })
  }
}

export async function createGoogleDoc(title: string, content: string): Promise<string | null> {
  if (!isFeatureEnabled('google')) {
    throw new Error('Google integration not configured. Please set GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_DRIVE_FOLDER_ID')
  }

  if (!auth) {
    throw new Error('Google authentication failed to initialize')
  }

  const env = getEnv()
  const GOOGLE_FOLDER_ID = env.GOOGLE_DRIVE_FOLDER_ID

  try {
    const docs = google.docs({ version: 'v1', auth })
    const drive = google.drive({ version: 'v3', auth })

    // Create the document
    const createResponse = await docs.documents.create({
      requestBody: {
        title: title
      }
    })

    const documentId = createResponse.data.documentId!

    // Add content to the document
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: 1
              },
              text: content
            }
          }
        ]
      }
    })

    // Move to folder if specified
    if (GOOGLE_FOLDER_ID) {
      await drive.files.update({
        fileId: documentId,
        addParents: GOOGLE_FOLDER_ID,
        fields: 'id, parents'
      })
    }

    // Set permissions for editors (more restrictive than 'anyone')
    await drive.permissions.create({
      fileId: documentId,
      requestBody: {
        role: 'writer',
        type: 'domain',
        domain: 'tascoutsourcing.com' // Restrict to company domain
      }
    }).catch(async (error) => {
      // Fallback to link sharing if domain restriction fails
      console.warn('Domain restriction failed, using link sharing:', error)
      await drive.permissions.create({
        fileId: documentId,
        requestBody: {
          role: 'writer',
          type: 'anyone',
          allowFileDiscovery: false
        }
      })
    })

    return documentId
  } catch (error) {
    console.error('Failed to create Google Doc:', error)
    auditLogger.log({
      type: 'api_error',
      details: { 
        service: 'google',
        action: 'createDoc',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    throw error
  }
}

export async function updateGoogleDoc(documentId: string, content: string): Promise<void> {
  if (!isFeatureEnabled('google')) {
    throw new Error('Google integration not configured')
  }

  if (!auth) {
    throw new Error('Google authentication not initialized')
  }

  try {
    const docs = google.docs({ version: 'v1', auth })

    // Get current document to find the end index
    const doc = await docs.documents.get({ documentId })
    const endIndex = doc.data.body?.content?.[doc.data.body.content.length - 1]?.endIndex || 1

    // Clear existing content and add new content
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            deleteContentRange: {
              range: {
                startIndex: 1,
                endIndex: endIndex - 1
              }
            }
          },
          {
            insertText: {
              location: {
                index: 1
              },
              text: content
            }
          }
        ]
      }
    })
  } catch (error) {
    console.error('Failed to update Google Doc:', error)
    auditLogger.log({
      type: 'api_error',
      details: { 
        service: 'google',
        action: 'updateDoc',
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    throw error
  }
}

export function getGoogleDocUrl(documentId: string): string {
  return `https://docs.google.com/document/d/${documentId}/edit`
}