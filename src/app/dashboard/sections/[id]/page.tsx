'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { FileText, Download, Upload, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { EnrollmentTable } from '@/components/section/enrollment-table'
import { TimetableView } from '@/components/section/timetable-view'

interface Section {
  id: string
  name: string
  year_id: string
  created_at: string
  year: {
    year_number: number
    branch: {
      name: string
      program: {
        name: string
      }
    }
  }
}

interface FileState {
  exists: boolean
  uploading: boolean
  deleting: boolean
  url: string | null
}

export default function SectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [section, setSection] = useState<Section | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [files, setFiles] = useState<{
    timetable: FileState
    enrollment: FileState
  }>({
    timetable: { exists: false, uploading: false, deleting: false, url: null },
    enrollment: { exists: false, uploading: false, deleting: false, url: null }
  })
  const { toast } = useToast()

  useEffect(() => {
    async function fetchSection() {
      try {
        const { data: section, error: sectionError } = await supabase
          .from('sections')
          .select(`
            id,
            name,
            year_id,
            created_at,
            years!sections_year_id_fkey (
              year_number,
              branches!years_branch_id_fkey (
                name,
                programs!branches_program_id_fkey (
                  name
                )
              )
            )
          `)
          .eq('id', resolvedParams.id)
          .single()

        if (sectionError) throw sectionError
        if (!section) throw new Error('Section not found')

        const transformedSection: Section = {
          id: section.id,
          name: section.name,
          year_id: section.year_id,
          created_at: section.created_at,
          year: {
            year_number: (section.years as any).year_number,
            branch: {
              name: (section.years as any).branches.name,
              program: {
                name: (section.years as any).branches.programs.name
              }
            }
          }
        }

        setSection(transformedSection)
      } catch (err) {
        console.error('Error in fetchSection:', err)
        setError(err instanceof Error ? err.message : 'Failed to load section details')
      } finally {
        setLoading(false)
      }
    }

    fetchSection()
  }, [resolvedParams.id])

  useEffect(() => {
    if (section) {
      checkFiles(section.id)
    }
  }, [section])

  const checkFiles = async (sectionId: string) => {
    try {
      // Check timetable files
      const { data: timetableFiles, error: timetableError } = await supabase.storage
        .from('timetables')
        .list('', {
          search: sectionId
        })

      if (timetableError) throw timetableError

      // Check enrollment files
      const { data: enrollmentFiles, error: enrollmentError } = await supabase.storage
        .from('enrollments')
        .list('', {
          search: sectionId
        })

      if (enrollmentError) throw enrollmentError

      // Get URLs for existing files
      let timetableUrl = null
      let enrollmentUrl = null

      if (timetableFiles?.length) {
        const { data } = await supabase.storage
          .from('timetables')
          .createSignedUrl(timetableFiles[0].name, 3600)
        timetableUrl = data?.signedUrl || null
      }

      if (enrollmentFiles?.length) {
        const { data } = await supabase.storage
          .from('enrollments')
          .createSignedUrl(enrollmentFiles[0].name, 3600)
        enrollmentUrl = data?.signedUrl || null
      }

      setFiles({
        timetable: { 
          exists: Boolean(timetableFiles?.length), 
          uploading: false,
          deleting: false,
          url: timetableUrl
        },
        enrollment: { 
          exists: Boolean(enrollmentFiles?.length), 
          uploading: false,
          deleting: false,
          url: enrollmentUrl
        }
      })
    } catch (err) {
      console.error('Error checking files:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to check file status'
      })
    }
  }

  const handleDownload = async (type: 'timetable' | 'enrollment') => {
    if (!section) return

    setDownloading(type)
    try {
      const bucket = type === 'timetable' ? 'timetables' : 'enrollments'
      
      const { data: fileList, error: listError } = await supabase.storage
        .from(bucket)
        .list('', {
          search: section.id
        })

      if (listError) throw listError
      if (!fileList || fileList.length === 0) {
        throw new Error(`No ${type} file found`)
      }

      const latestFile = fileList[fileList.length - 1]
      const { data: signedURL, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(latestFile.name, 60)

      if (signedError || !signedURL) {
        throw new Error('Failed to generate download URL')
      }

      const a = document.createElement('a')
      a.href = signedURL.signedUrl
      a.download = latestFile.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} download started`
      })
    } catch (err) {
      console.error(`Error downloading ${type}:`, err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : `Failed to download ${type} file`
      })
    } finally {
      setDownloading(null)
    }
  }

  const handleUpload = async (type: 'timetable' | 'enrollment') => {
    if (!section) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type === 'timetable' ? '.docx' : '.docx,.xlsx,.xls'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setFiles(prev => ({
        ...prev,
        [type]: { ...prev[type], uploading: true }
      }))

      try {
        const bucket = type === 'timetable' ? 'timetables' : 'enrollments'
        const fileName = `${section.id}-${type}${file.name.substring(file.name.lastIndexOf('.'))}`

        // Remove existing files
        const { data: existingFiles } = await supabase.storage
          .from(bucket)
          .list('', {
            search: section.id
          })

        if (existingFiles?.length) {
          await supabase.storage
            .from(bucket)
            .remove(existingFiles.map(f => f.name))
        }

        // Upload new file
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { 
            cacheControl: '3600',
            upsert: true 
          })

        if (uploadError) throw uploadError

        await checkFiles(section.id)
        toast({
          title: 'Success',
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`
        })
      } catch (err) {
        console.error(`Error uploading ${type}:`, err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to upload ${type} file`
        })
      } finally {
        setFiles(prev => ({
          ...prev,
          [type]: { ...prev[type], uploading: false }
        }))
      }
    }

    input.click()
  }

  const handleDelete = async (type: 'timetable' | 'enrollment') => {
    if (!section) return

    setFiles(prev => ({
      ...prev,
      [type]: { ...prev[type], deleting: true }
    }))

    try {
      const bucket = type === 'timetable' ? 'timetables' : 'enrollments'
      
      const { data: fileList } = await supabase.storage
        .from(bucket)
        .list('', {
          search: section.id
        })

      if (!fileList?.length) {
        throw new Error(`No ${type} file found`)
      }

      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove(fileList.map(f => f.name))

      if (deleteError) throw deleteError

      await checkFiles(section.id)
      toast({
        title: 'Success',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`
      })
    } catch (err) {
      console.error(`Error deleting ${type}:`, err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete ${type} file`
      })
    } finally {
      setFiles(prev => ({
        ...prev,
        [type]: { ...prev[type], deleting: false }
      }))
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!section) return <div className="p-8">Section not found</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="text-sm text-muted-foreground mb-2">
          {section.year?.branch?.program?.name} / {section.year?.branch?.name} / Year {section.year?.year_number}
        </div>
        <h1 className="text-3xl font-bold">{section.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="mr-2" /> Timetable
          </h2>
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => handleDownload('timetable')}
              disabled={downloading === 'timetable' || files.timetable.uploading}
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading === 'timetable' ? 'Downloading...' : 'Download Timetable'}
            </Button>
            <Button
              size="icon"
              className="w-10 h-10"
              onClick={() => handleUpload('timetable')}
              disabled={files.timetable.uploading}
            >
              <Upload className="h-4 w-4" />
            </Button>
            {files.timetable.exists && (
              <Button
                size="icon"
                variant="destructive"
                className="w-10 h-10"
                onClick={() => handleDelete('timetable')}
                disabled={files.timetable.deleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="mr-2" /> Enrollment List
          </h2>
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => handleDownload('enrollment')}
              disabled={downloading === 'enrollment' || files.enrollment.uploading}
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading === 'enrollment' ? 'Downloading...' : 'Download Enrollment List'}
            </Button>
            <Button
              size="icon"
              className="w-10 h-10"
              onClick={() => handleUpload('enrollment')}
              disabled={files.enrollment.uploading}
            >
              <Upload className="h-4 w-4" />
            </Button>
            {files.enrollment.exists && (
              <Button
                size="icon"
                variant="destructive"
                className="w-10 h-10"
                onClick={() => handleDelete('enrollment')}
                disabled={files.enrollment.deleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Display parsed data */}
      {files.timetable.url && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Timetable</h2>
          <TimetableView fileUrl={files.timetable.url} />
        </div>
      )}

      {files.enrollment.url && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Enrollment List</h2>
          <EnrollmentTable fileUrl={files.enrollment.url} />
        </div>
      )}
    </div>
  )
} 