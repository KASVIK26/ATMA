'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  name: string
  year?: {
    year_number: number
    branch?: {
      name: string
      program?: {
        name: string
      }
    }
  }
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
  const [hasFiles, setHasFiles] = useState({ timetable: false, enrollment: false })
  const { toast } = useToast()

  // Check if files exist in storage
  const checkFiles = async (sectionId: string) => {
    try {
      const { data: timetableFiles } = await supabase.storage
        .from('timetables')
        .list('', {
          search: `${sectionId}-timetable`
        })

      const { data: enrollmentFiles } = await supabase.storage
        .from('enrollments')
        .list('', {
          search: `${sectionId}-enrollment`
        })

      setHasFiles({
        timetable: timetableFiles && timetableFiles.length > 0,
        enrollment: enrollmentFiles && enrollmentFiles.length > 0
      })

      console.log('Files check result:', {
        timetable: timetableFiles?.length > 0,
        enrollment: enrollmentFiles?.length > 0
      })
    } catch (err) {
      console.error('Error checking files:', err)
    }
  }

  useEffect(() => {
    async function fetchSection() {
      try {
        console.log('Fetching section with ID:', resolvedParams.id)
        const { data, error } = await supabase
          .from('sections')
          .select(`
            id,
            name,
            year:year_id (
              id,
              year_number,
              branch:branch_id (
                id,
                name,
                program:program_id (
                  id,
                  name
                )
              )
            )
          `)
          .eq('id', resolvedParams.id)
          .single()

        if (error) throw error
        
        console.log('Section data:', data)
        setSection(data)

        // Check for files in storage
        await checkFiles(data.id)
      } catch (err) {
        console.error('Error fetching section:', err)
        setError('Failed to load section details')
      } finally {
        setLoading(false)
      }
    }

    fetchSection()
  }, [resolvedParams.id])

  const handleDownload = async (type: 'timetable' | 'enrollment') => {
    if (!section) return

    console.log('Download attempt:', {
      type,
      sectionId: section.id
    })
    
    setDownloading(type)
    try {
      const bucket = type === 'timetable' ? 'timetables' : 'enrollments'
      console.log('Attempting download from bucket:', bucket)

      // Get the file list first
      const { data: files } = await supabase.storage
        .from(bucket)
        .list('', {
          search: `${section.id}-${type}`
        })

      if (!files || files.length === 0) {
        throw new Error(`No ${type} file found`)
      }

      // Download the file
      const { data: fileData, error: fileError } = await supabase.storage
        .from(bucket)
        .download(files[0].name)

      if (fileError) {
        console.error('Download error:', fileError)
        throw fileError
      }

      if (!fileData) {
        throw new Error('No file data received')
      }

      // Create a download link
      const url = URL.createObjectURL(fileData)
      const a = document.createElement('a')
      a.href = url
      a.download = `${section.name}_${type}.${files[0].name.split('.').pop()}`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} downloaded successfully`
      })
    } catch (err) {
      console.error(`Error downloading ${type}:`, err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to download ${type} file. ${err instanceof Error ? err.message : ''}`
      })
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!section) return <div className="p-8">Section not found</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="text-sm text-muted-foreground mb-2">
          {section.year?.branch?.program?.name} / {section.year?.branch?.name} / Year {section.year?.year_number}
        </div>
        <h1 className="text-3xl font-bold">{section.name}</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="mr-2" /> Timetable
          </h2>
          <Button
            onClick={() => handleDownload('timetable')}
            className={cn(
              "w-full",
              hasFiles.timetable ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground"
            )}
            disabled={!hasFiles.timetable || downloading === 'timetable'}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloading === 'timetable' ? 'Downloading...' : 
             hasFiles.timetable ? 'Download Timetable' : 'No Timetable Available'}
          </Button>
        </div>

        <div className="p-6 bg-card rounded-lg border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="mr-2" /> Enrollment List
          </h2>
          <Button
            onClick={() => handleDownload('enrollment')}
            className={cn(
              "w-full",
              hasFiles.enrollment ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground"
            )}
            disabled={!hasFiles.enrollment || downloading === 'enrollment'}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloading === 'enrollment' ? 'Downloading...' : 
             hasFiles.enrollment ? 'Download Enrollment List' : 'No Enrollment List Available'}
          </Button>
        </div>
      </div>
    </div>
  )
} 