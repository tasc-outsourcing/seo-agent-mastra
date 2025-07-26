'use client'

import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'

export function ClerkProvider({ children }: { children: ReactNode }) {
  // Check if Clerk keys are available
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  // If no key, render children without Clerk
  if (!publishableKey) {
    console.warn('Clerk publishable key not found. Authentication disabled.')
    return <>{children}</>
  }
  
  return (
    <BaseClerkProvider publishableKey={publishableKey}>
      {children}
    </BaseClerkProvider>
  )
}