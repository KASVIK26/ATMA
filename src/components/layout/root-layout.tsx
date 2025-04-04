"use client"

import { AuthProvider } from '@/lib/auth'
import { Toaster } from '@/components/ui/toaster'

export function RootLayoutContent({
  children,
  className,
}: {
  children: React.ReactNode
  className: string
}) {
  return (
    <body className={className}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </body>
  )
} 