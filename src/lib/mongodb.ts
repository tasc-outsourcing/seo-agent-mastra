import mongoose from 'mongoose'
import { getEnv, isFeatureEnabled } from '@/lib/env'
import { auditLogger } from '@/lib/security'

declare global {
  var mongoose: any
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  // Check if MongoDB is configured
  if (!isFeatureEnabled('mongodb')) {
    throw new Error('MongoDB is not configured. Please set MONGODB_URI environment variable')
  }
  
  const env = getEnv()
  const MONGODB_URI = env.MONGODB_URI!

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    auditLogger.log({
      type: 'api_error',
      details: { 
        service: 'mongodb',
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    })
    throw e
  }

  return cached.conn
}

export default connectDB