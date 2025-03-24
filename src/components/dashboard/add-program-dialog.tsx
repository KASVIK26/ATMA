'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

interface AddProgramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddProgramDialog({
  open,
  onOpenChange,
  onSuccess
}: AddProgramDialogProps) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Program name is required'
      })
      return
    }

    const durationNum = parseInt(duration)
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Duration must be between 1 and 6 years'
      })
      return
    }

    try {
      setLoading(true)

      // Get current user's university_id
      const { data: authData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Auth error:', userError)
        throw new Error('Authentication failed')
      }

      if (!authData?.user) {
        throw new Error('No authenticated user found')
      }

      // Get user's university_id
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('university_id')
        .eq('id', authData.user.id)
        .single()

      if (userDataError) {
        console.error('User data error:', userDataError)
        throw new Error('Failed to fetch user data')
      }

      if (!userData?.university_id) {
        throw new Error('No university associated with user')
      }

      // First check if a program with the same name exists
      const { data: existingProgram } = await supabase
        .from('programs')
        .select('id')
        .eq('university_id', userData.university_id)
        .eq('name', name.trim())
        .single()

      if (existingProgram) {
        throw new Error('A program with this name already exists')
      }

      // Add program
      const { data, error: insertError } = await supabase
        .from('programs')
        .insert([{
          name: name.trim(),
          duration: `${durationNum} years`,
          university_id: userData.university_id
        }])

      if (insertError) {
        console.error('Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        })
        throw new Error(`Failed to add program: ${insertError.message}`)
      }

      // Verify the program was created
      const { data: verifyData, error: verifyError } = await supabase
        .from('programs')
        .select()
        .eq('university_id', userData.university_id)
        .eq('name', name.trim())
        .single()

      if (verifyError || !verifyData) {
        console.error('Verify error:', verifyError)
        throw new Error('Program creation could not be verified')
      }

      toast({
        title: 'Success',
        description: 'Program added successfully'
      })

      onOpenChange(false)
      onSuccess?.()
      setName('')
      setDuration('')
    } catch (error) {
      console.error('Error adding program:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add program'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Program</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Program Name</Label>
            <Input
              id="name"
              placeholder="Enter program name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (in years)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="6"
              placeholder="Enter program duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Program'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 