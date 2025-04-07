'use client'

import { useEffect, useState } from 'react'
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
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { uploadFile, deleteFile } from '@/lib/storage'

interface AddSectionDialogProps {
  yearId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
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
  const [hasAccess, setHasAccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setHasAccess(false)
          return
        }

        // First get the year to verify it exists
        const { data: year, error: yearError } = await supabase
          .from('years')
          .select(`
            id,
            branches!years_branch_id_fkey (
              id,
              programs!branches_program_id_fkey (
                id,
                university_id
              )
            )
          `)
          .eq('id', yearId)
          .single()

        if (yearError) {
          console.error('Error fetching year:', yearError.message)
          setHasAccess(false)
          return
        }

        if (!year) {
          console.error('Year not found')
          setHasAccess(false)
          return
        }

        // Then verify user has access to this university
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('university_id')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError.message)
          setHasAccess(false)
          return
        }

        // Check if user's university matches the year's university
        const yearUniversityId = year.branches?.programs?.university_id
        setHasAccess(userData.university_id === yearUniversityId)
      } catch (error) {
        console.error('Error verifying access:', error)
        setHasAccess(false)
      }
    }

    if (open) {
      verifyAccess()
    }
  }, [yearId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || loading || !hasAccess) return

    // Validate required files
    if (!timetableFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please upload a timetable file'
      })
      return
    }

    if (!enrollmentFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please upload an enrollment file'
      })
      return
    }

    setLoading(true)
    let createdSectionId: string | null = null

    try {
      // First create the section
      const { data: section, error: sectionError } = await supabase
        .from('sections')
        .insert([{ 
          name: name.trim(), 
          year_id: yearId,
          timetable_file_id: null,
          enrollment_file_id: null
        }])
        .select()
        .single()

      if (sectionError) {
        console.error('Error creating section:', sectionError.message)
        throw new Error('Failed to create section')
      }

      if (!section) {
        throw new Error('Section created but no data returned')
      }

      createdSectionId = section.id

      // Then upload the files
      try {
        const [timetableUrl, enrollmentUrl] = await Promise.all([
          uploadFile(section.id, 'timetable', timetableFile),
          uploadFile(section.id, 'enrollment', enrollmentFile)
        ])

        if (!timetableUrl || !enrollmentUrl) {
          throw new Error('Failed to upload one or more files')
        }

        toast({
          title: 'Success',
          description: 'Section created successfully with files'
        })

        setName('')
        setTimetableFile(null)
        setEnrollmentFile(null)
        onOpenChange(false)
        await onSuccess()
      } catch (uploadError) {
        console.error('Error uploading files:', uploadError instanceof Error ? uploadError.message : uploadError)
        
        // If file upload fails, clean up
        if (createdSectionId) {
          // First try to delete any uploaded files
          try {
            await Promise.all([
              deleteFile(createdSectionId, 'timetable').catch(() => {}),
              deleteFile(createdSectionId, 'enrollment').catch(() => {})
            ])
          } catch (deleteError) {
            console.error('Error cleaning up files:', deleteError)
          }

          // Then delete the section
          try {
            const { error: deleteError } = await supabase
              .from('sections')
              .delete()
              .eq('id', createdSectionId)

            if (deleteError) {
              console.error('Error deleting section:', deleteError.message)
            }
          } catch (deleteError) {
            console.error('Error deleting section:', deleteError)
          }
        }

        throw new Error('Failed to upload files')
      }
    } catch (error) {
      console.error('Error in section creation:', error instanceof Error ? error.message : error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create section'
      })
    } finally {
      setLoading(false)
    }
  }

  const validateTimetableFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ]
    return validTypes.includes(file.type)
  }

  const validateEnrollmentFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]
    return validTypes.includes(file.type)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
          <DialogDescription>
            Create a new section with timetable and enrollment list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Section Name</Label>
              <Input
                id="name"
                placeholder="Enter section name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timetable">Timetable</Label>
              <Input
                id="timetable"
                type="file"
                accept=".docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (!validateTimetableFile(file)) {
                      toast({
                        variant: 'destructive',
                        title: 'Invalid File',
                        description: 'Please upload a DOCX file for timetable'
                      })
                      e.target.value = ''
                      return
                    }
                    setTimetableFile(file)
                  }
                }}
                required
              />
              <p className="text-sm text-muted-foreground">
                Upload timetable (DOCX file only)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrollment">Enrollment List</Label>
              <Input
                id="enrollment"
                type="file"
                accept=".xlsx,.xls,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (!validateEnrollmentFile(file)) {
                      toast({
                        variant: 'destructive',
                        title: 'Invalid File',
                        description: 'Please upload an Excel or DOCX file for enrollment'
                      })
                      e.target.value = ''
                      return
                    }
                    setEnrollmentFile(file)
                  }
                }}
                required
              />
              <p className="text-sm text-muted-foreground">
                Upload enrollment list (Excel or DOCX file)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!name.trim() || loading || !hasAccess}
              className={!name.trim() ? "opacity-50 cursor-not-allowed" : ""}
            >
              {loading ? 'Creating...' : 'Create Section'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 