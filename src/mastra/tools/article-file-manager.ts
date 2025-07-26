import { createTool } from '@mastra/core'
import { z } from 'zod'
import * as fs from 'fs/promises'
import * as path from 'path'

const articleFileManagerTool = createTool({
  id: 'article_file_manager',
  description: 'Manages article files and folder structure for the SEO workflow',
  inputSchema: z.object({
    action: z.enum(['create_folder', 'create_file', 'read_file', 'update_file', 'list_files', 'check_exists', 'batch_create', 'batch_update']),
    articleSlug: z.string().describe('The kebab-case article folder name'),
    fileName: z.string().optional().describe('Name of the file to operate on'),
    content: z.string().optional().describe('Content to write to file'),
    fileType: z.enum(['txt', 'json', 'md']).optional().describe('Type of file to create'),
    files: z.array(z.object({
      fileName: z.string(),
      content: z.string(),
      fileType: z.enum(['txt', 'json', 'md']).optional()
    })).optional().describe('Array of files for batch operations')
  }),
  execute: async ({ context }) => {
    const { action, articleSlug, fileName, content, fileType, files } = context
    try {
      const articlesDir = path.join(process.cwd(), 'generated-articles')
      const articleDir = path.join(articlesDir, articleSlug)

      // Ensure articles directory exists
      await fs.mkdir(articlesDir, { recursive: true })

      switch (action) {
        case 'create_folder': {
          // Create article folder with complete structure
          await fs.mkdir(articleDir, { recursive: true })
          await fs.mkdir(path.join(articleDir, 'references'), { recursive: true })
          await fs.mkdir(path.join(articleDir, 'visuals'), { recursive: true })

          // Create placeholder files
          const placeholderFiles = [
            { name: 'focus-keyword.txt', content: '' },
            { name: 'semantic-keywords.json', content: '[]' },
            { name: 'outline-research.md', content: '# Phase 1: Strategic Research Notes\n\n## Focus Keyword\n\n## Search Intent\n\n## Top SERP Competitor Sections\n\n## PAA Questions\n\n## Semantic Keyword Clusters\n\n## Opportunities to Differentiate\n\n## Strategic Outcome\n' },
            { name: 'persona-brief.md', content: '# Target Persona Brief\n\n## Persona ID\n\n## Role / Title\n\n## Industry Context\n\n## Goals\n\n## Pain Points\n\n## Search Intent Alignment\n\n## Preferred Tone & Voice\n\n## Format Preferences\n\n## Don\'ts\n\n## Auto-Mapping Tags\n' },
            { name: 'serp-tone-analysis.md', content: '# SERP Tone & Structure Analysis\n\n## Competitor Analysis\n\n## Common Content Patterns\n\n## Tone Observations\n\n## Content Gaps\n\n## Strategic Opportunities\n' },
            { name: 'outline.md', content: '# Article Outline\n\n' },
            { name: 'section-bullets.md', content: '# Section Bullet Points\n\n' },
            { name: 'draft-article.md', content: '# Draft Article\n\n' },
            { name: 'enhanced-article.md', content: '# Enhanced Article\n\n' },
            { name: 'seo-metadata.md', content: '# SEO Metadata\n\n```json\n{\n  "title": "",\n  "description": "",\n  "h1": "",\n  "semantic_keywords": []\n}\n```\n' },
            { name: 'faqs.json', content: '{\n  "faqs": [],\n  "schema": {}\n}' }
          ]

          // Use Promise.all for parallel file creation
          await Promise.all(
            placeholderFiles.map(file =>
              fs.writeFile(path.join(articleDir, file.name), file.content, 'utf-8')
            )
          )

          return {
            success: true,
            message: `Created article folder structure for: ${articleSlug}`,
            path: articleDir,
            files_created: placeholderFiles.length + 2 // +2 for directories
          }
        }

        case 'create_file': {
          if (!fileName || content === undefined) {
            return { success: false, error: 'fileName and content are required for create_file' }
          }
          
          const filePath = path.join(articleDir, fileName)
          await fs.writeFile(filePath, content, 'utf-8')
          
          return {
            success: true,
            message: `Created file: ${fileName}`,
            path: filePath
          }
        }

        case 'read_file': {
          if (!fileName) {
            return { success: false, error: 'fileName is required for read_file' }
          }
          
          const filePath = path.join(articleDir, fileName)
          const fileContent = await fs.readFile(filePath, 'utf-8')
          
          return {
            success: true,
            content: fileContent,
            path: filePath
          }
        }

        case 'update_file': {
          if (!fileName || content === undefined) {
            return { success: false, error: 'fileName and content are required for update_file' }
          }
          
          const filePath = path.join(articleDir, fileName)
          await fs.writeFile(filePath, content, 'utf-8')
          
          return {
            success: true,
            message: `Updated file: ${fileName}`,
            path: filePath
          }
        }

        case 'list_files': {
          const files = await fs.readdir(articleDir, { withFileTypes: true })
          const fileList = files.map(file => ({
            name: file.name,
            type: file.isDirectory() ? 'directory' : 'file'
          }))
          
          return {
            success: true,
            files: fileList,
            path: articleDir
          }
        }

        case 'check_exists': {
          try {
            const targetPath = fileName ? path.join(articleDir, fileName) : articleDir
            await fs.access(targetPath)
            return {
              success: true,
              exists: true,
              path: targetPath
            }
          } catch {
            return {
              success: true,
              exists: false,
              path: fileName ? path.join(articleDir, fileName) : articleDir
            }
          }
        }

        case 'batch_create': {
          if (!files || files.length === 0) {
            return { success: false, error: 'No files provided for batch creation' }
          }

          // Create all files in parallel
          const results = await Promise.allSettled(
            files.map(file => 
              fs.writeFile(path.join(articleDir, file.fileName), file.content, 'utf-8')
            )
          )

          const successful = results.filter(r => r.status === 'fulfilled').length
          const failed = results.filter(r => r.status === 'rejected').length

          return {
            success: true,
            message: `Batch file creation completed: ${successful} successful, ${failed} failed`,
            filesCreated: successful,
            filesFailed: failed,
            path: articleDir
          }
        }

        case 'batch_update': {
          if (!files || files.length === 0) {
            return { success: false, error: 'No files provided for batch update' }
          }

          // Update all files in parallel
          const results = await Promise.allSettled(
            files.map(file => 
              fs.writeFile(path.join(articleDir, file.fileName), file.content, 'utf-8')
            )
          )

          const successful = results.filter(r => r.status === 'fulfilled').length
          const failed = results.filter(r => r.status === 'rejected').length

          return {
            success: true,
            message: `Batch file update completed: ${successful} successful, ${failed} failed`,
            filesUpdated: successful,
            filesFailed: failed,
            path: articleDir
          }
        }

        default:
          return { success: false, error: `Unknown action: ${action}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
})

export { articleFileManagerTool }