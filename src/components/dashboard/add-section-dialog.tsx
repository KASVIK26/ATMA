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
import { uploadFile, deleteFile } from '@/lib/storage'

interface AddSectionDialogProps {
  yearId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddSectionDialog({
  yearId,
  open,
  onOpenChange,
  onSuccess
}: AddSectionDialogProps) {
  const [name, setName] = useState('')
  const [timetableFile, setTimetableFile] = useState<File | null>(null)
  const [enrollmentFile, setEnrollmentFile] = useState<File | null>(null)
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

  useEffect(() => {
    const verifyAccess = async () => {
      if (!yearId) return

      try {
        // Verify the year exists and user has access
        const { data: yearData, error: yearError } = await supabase
          .from('years')
          .select(`
            id, 
            branch_id,
            sections (name)
          `)
          .eq('id', yearId)
          .single()

        if (yearError) {
          console.error('Error verifying year access:', yearError)
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to verify access to this year',
          })
          onOpenChange(false)
          return
        }

        if (!yearData) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Year not found or access denied',
          })
          onOpenChange(false)
          return
        }

        // Check for duplicate section name
        const existingSections = yearData.sections as { name: string }[]
        if (existingSections.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'A section with this name already exists',
          })
          return
        }
      } catch (error) {
        console.error('Error in access verification:', error)
      }
    }

    if (open && name) {
      verifyAccess()
    }
  }, [yearId, open, onOpenChange, name])

  const handleSubmit = async () => {
    if (!authChecked) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please wait while we verify your authentication',
      })
      return
    }

    if (!name || !timetableFile || !enrollmentFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all fields and upload both files',
      })
      return
    }

    // Validate file types
    if (!timetableFile.type.match(/(pdf|jpe?g|png)$/i)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Timetable must be a PDF, JPG, or PNG file',
      })
      return
    }

    if (!enrollmentFile.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Enrollment list must be an Excel file',
      })
      return
    }

    setLoading(true)
    try {
      console.log('Starting section creation process...')

      // First create the section to get its ID
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .insert([{
          name: name.trim(),
          year_id: yearId
        }])
        .select()
        .single()

      if (sectionError) {
        console.error('Error creating section:', sectionError)
        throw new Error('Failed to create section')
      }

      if (!sectionData) {
        throw new Error('No section data returned')
      }

      console.log('Section created:', sectionData)

      // Upload timetable file
      const timetablePath = await uploadFile(timetableFile, 'timetable', sectionData.id)
      if (!timetablePath) {
        throw new Error('Failed to upload timetable file')
      }
      console.log('Timetable file uploaded:', timetablePath)

      // Upload enrollment file
      const enrollmentPath = await uploadFile(enrollmentFile, 'enrollment', sectionData.id)
      if (!enrollmentPath) {
        // If enrollment upload fails, delete the timetable file
        await deleteFile(sectionData.id, 'timetable')
        throw new Error('Failed to upload enrollment file')
      }
      console.log('Enrollment file uploaded:', enrollmentPath)

      toast({
        title: 'Success',
        description: 'Section added successfully',
      })
      onOpenChange(false)
      onSuccess()
      setName('')
      setTimetableFile(null)
      setEnrollmentFile(null)
    } catch (error) {
      console.error('Error adding section:', {
        error,
        yearId,
        name,
        timetableFile: timetableFile?.name,
        enrollmentFile: enrollmentFile?.name,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error 
          ? error.message 
          : 'Failed to add section - Please check your permissions',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
          <DialogDescription>
            Add a new section with timetable and enrollment list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Section Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Section A"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timetable">Timetable</Label>
            <Input
              id="timetable"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setTimetableFile(file)
              }}
            />
            <p className="text-sm text-muted-foreground">
              Upload timetable (PDF, JPG, or PNG)
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="enrollment">Enrollment List</Label>
            <Input
              id="enrollment"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setEnrollmentFile(file)
              }}
            />
            <p className="text-sm text-muted-foreground">
              Upload enrollment list (Excel file)
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Section'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 