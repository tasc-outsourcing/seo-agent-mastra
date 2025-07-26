import mongoose, { Schema, Document } from 'mongoose'

export interface IArticle extends Document {
  title: string
  slug: string
  content: string
  metaDescription?: string
  focusKeyword?: string
  semanticKeywords: string[]
  seoScore: number
  readabilityScore: number
  status: 'draft' | 'in-progress' | 'review' | 'published'
  userId: string
  userEmail: string
  createdAt: Date
  updatedAt: Date
  phases: {
    research: boolean
    structure: boolean
    content: boolean
    optimization: boolean
    review: boolean
  }
  googleDocId?: string
  workflowData?: any
}

const ArticleSchema = new Schema<IArticle>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  metaDescription: {
    type: String,
    trim: true
  },
  focusKeyword: {
    type: String,
    trim: true
  },
  semanticKeywords: [{
    type: String,
    trim: true
  }],
  seoScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  readabilityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'review', 'published'],
    default: 'draft'
  },
  userId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  phases: {
    research: { type: Boolean, default: false },
    structure: { type: Boolean, default: false },
    content: { type: Boolean, default: false },
    optimization: { type: Boolean, default: false },
    review: { type: Boolean, default: false }
  },
  googleDocId: {
    type: String
  },
  workflowData: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
})

// Index for efficient queries
ArticleSchema.index({ userId: 1, createdAt: -1 })
ArticleSchema.index({ slug: 1 })
ArticleSchema.index({ status: 1 })

// Use a function to get the model to avoid build-time issues
function getArticleModel() {
  if (!mongoose.models.Article) {
    return mongoose.model<IArticle>('Article', ArticleSchema)
  }
  return mongoose.models.Article as mongoose.Model<IArticle>
}

export const Article = mongoose.models.Article || getArticleModel()