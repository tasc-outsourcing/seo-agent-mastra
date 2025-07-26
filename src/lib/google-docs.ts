import { google } from 'googleapis'

const GOOGLE_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
const GOOGLE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID

if (!GOOGLE_CREDENTIALS) {
  console.warn('Google Service Account credentials not found')
}

let auth: any = null

if (GOOGLE_CREDENTIALS) {
  try {
    const credentials = JSON.parse(GOOGLE_CREDENTIALS)
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive'
      ]
    })
  } catch (error) {
    console.error('Failed to parse Google credentials:', error)
  }
}

export async function createGoogleDoc(title: string, content: string): Promise<string | null> {
  if (!auth) {
    throw new Error('Google authentication not configured')
  }

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

    // Set permissions for editors
    await drive.permissions.create({
      fileId: documentId,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    })

    return documentId
  } catch (error) {
    console.error('Failed to create Google Doc:', error)
    throw error
  }
}

export async function updateGoogleDoc(documentId: string, content: string): Promise<void> {
  if (!auth) {
    throw new Error('Google authentication not configured')
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
    throw error
  }
}

export function getGoogleDocUrl(documentId: string): string {
  return `https://docs.google.com/document/d/${documentId}/edit`
}