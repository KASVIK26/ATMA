'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Starting auth callback handling...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/login?error=callback')
          return
        }

        if (session?.user) {
          console.log('User authenticated:', session.user.id)
          
          // Try to create profile
          try {
            // Check if profile exists
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('id')
              .eq('id', session.user.id)
              .single()

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Profile check error:', profileError)
              throw profileError
            }

            if (!profile) {
              console.log('Creating profile for user:', session.user.id)
              const { error: createError } = await supabase
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email?.toLowerCase(),
                  full_name: session.user.user_metadata.full_name || 'User',
                })

              if (createError) {
                console.error('Profile creation error:', createError)
                throw createError
              }
              
              console.log('Profile created successfully')
            } else {
              console.log('Profile already exists')
            }

            // User is authenticated and has a profile, redirect to dashboard
            router.push('/dashboard')
          } catch (error) {
            console.error('Profile handling error:', error)
            router.push('/auth/login?error=profile')
            return
          }
        } else {
          console.log('No active session, redirecting to login')
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        router.push('/auth/login?error=callback')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Verifying your email...</h1>
        <p className="text-muted-foreground">Please wait while we confirm your account.</p>
      </div>
    </div>
  )
} 