"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<{ email: string }>
  signOut: () => Promise<void>
  createProfile: (userId: string, email: string, fullName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      // Try to create profile if user exists
      if (session?.user) {
        try {
          await createProfile(
            session.user.id,
            session.user.email!,
            session.user.user_metadata.full_name || 'User'
          )
        } catch (error) {
          console.error('Profile creation error during session check:', error)
        }
      }
      setLoading(false)
    })

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      // Try to create profile when auth state changes
      if (session?.user) {
        try {
          await createProfile(
            session.user.id,
            session.user.email!,
            session.user.user_metadata.full_name || 'User'
          )
        } catch (error) {
          console.error('Profile creation error during auth state change:', error)
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const createProfile = async (userId: string, email: string, fullName: string) => {
    console.log('Creating user profile...', { userId, email, fullName })
    
    try {
      // First check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Profile check error:', checkError)
        throw new Error('Failed to check profile existence')
      }

      if (existingProfile) {
        console.log('Profile already exists, skipping creation')
        return
      }

      // Create new profile
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email.toLowerCase(),
          full_name: fullName,
        })

      if (insertError) {
        console.error('Insert Error:', insertError)
        throw new Error(insertError.message || 'Failed to create user profile')
      }

      console.log('User profile created successfully')
    } catch (error) {
      console.error('Profile creation error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('Starting signup process...')
    
    if (!email || !password || !fullName) {
      throw new Error('All fields are required')
    }

    const emailLower = email.toLowerCase()

    try {
      // 1. Create the auth user first
      console.log('Creating auth user...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailLower,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      })

      if (authError) {
        console.error('Auth Error:', authError)
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      console.log('Auth user created successfully:', authData.user.id)

      // 2. Wait a moment for the auth user to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 3. Create user profile
      try {
        await createProfile(authData.user.id, emailLower, fullName)
      } catch (profileError) {
        console.error('Profile creation error during signup:', profileError)
        // Don't throw here as the user is already created
      }

      console.log('Signup process completed successfully')
      return { email: emailLower }
    } catch (error) {
      console.error('Registration Error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to complete user registration')
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('Starting sign in process...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    })
    
    if (error) {
      console.error('Sign in error:', error)
      throw error
    }
    
    console.log('Sign in successful:', data.user?.id)
    
    // After successful sign in, ensure profile exists
    if (data.user) {
      try {
        await createProfile(data.user.id, data.user.email!, data.user.user_metadata.full_name)
      } catch (error) {
        console.error('Profile creation error during sign in:', error)
        // Don't throw here as the user is already signed in
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, createProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 