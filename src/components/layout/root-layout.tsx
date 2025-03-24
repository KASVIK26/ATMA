"use client"

import { useEffect } from 'react'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from '@/components/ui/toaster'
import { initializeBuckets } from '@/lib/storage'

export function RootLayoutContent({
  children,
  className,
}: {
  children: React.ReactNode
  className: string
}) {
  useEffect(() => {
    // Initialize storage buckets
    initializeBuckets().catch(console.error)
  }, [])

  return (
    <body className={className}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </body>
  )
} 