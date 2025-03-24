'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface AddBranchDialogProps {
  programId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddBranchDialog({
  programId,
  open,
  onOpenChange,
  onSuccess
}: AddBranchDialogProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Auth check error:', error)
      }
      console.log('Current auth state:', {
        isAuthenticated: !!session,
        user: session?.user
      })
      setAuthChecked(true)
    }
    checkAuth()
  }, [])

  const handleSubmit = async () => {
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a branch name',
      })
      return
    }

    if (!authChecked) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please wait while we verify your authentication',
      })
      return
    }

    setLoading(true)
    try {
      if (!programId) {
        throw new Error('Program ID is missing or invalid')
      }

      // Log current session state
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current session during branch creation:', {
        session: session ? 'exists' : 'none',
        userId: session?.user?.id
      })

      console.log('Attempting to add branch with:', {
        name: name.trim(),
        program_id: programId
      })

      // First verify the program exists and user has access
      const { data: programCheck, error: programError } = await supabase
        .from('programs')
        .select('id, university_id')
        .eq('id', programId)
        .single()

      if (programError) {
        console.error('Error checking program:', {
          error: programError,
          code: programError.code,
          message: programError.message,
          details: programError.details
        })
        throw new Error(`Failed to verify program exists: ${programError.message}`)
      }

      if (!programCheck) {
        throw new Error('Program not found or you don\'t have access to it')
      }

      console.log('Program check successful:', programCheck)

      // Now attempt to insert the branch
      const { data, error } = await supabase
        .from('branches')
        .insert([{
          name: name.trim(),
          program_id: programId
        }])
        .select()

      if (error) {
        console.error('Supabase insert error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          requestDetails: {
            name: name.trim(),
            program_id: programId,
            timestamp: new Date().toISOString()
          }
        })
        throw new Error(error.message || 'Failed to add branch - Possible RLS policy violation')
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned after inserting branch')
      }

      console.log('Branch added successfully:', data)
      toast({
        title: 'Success',
        description: 'Branch added successfully',
      })
      onOpenChange(false)
      onSuccess()
      setName('')
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `${error.message} (This might be a permissions issue)`
        : 'Unknown error occurred'
      console.error('Error adding branch:', {
        error,
        errorType: error instanceof Error ? 'Error' : typeof error,
        programId,
        name,
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Branch</DialogTitle>
          <DialogDescription>
            Add a new branch to the program.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Branch Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Branch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 