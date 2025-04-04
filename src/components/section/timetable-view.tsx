import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { TimetableTable } from "./timetable-table"

interface TimeSlot {
  timeSlot: string
  subject: string
  location?: string | null
}

interface Schedule {
  [key: string]: TimeSlot[]
}

interface TimetableData {
  schedule: Schedule
  daysPerWeek: number
  periodsPerDay: number
}

interface TimetableViewProps {
  fileUrl: string | null
}

export function TimetableView({ fileUrl }: TimetableViewProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timetableData, setTimetableData] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      if (!fileUrl) return

      setLoading(true)
      setError(null)

      try {
        // Download the file from Supabase storage
        const response = await fetch(fileUrl)
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`)
        }

        // Extract filename and extension from URL
        const urlParts = fileUrl.split('/')
        const fullFilename = urlParts[urlParts.length - 1]
        const filename = fullFilename.split('?')[0] // Remove any query parameters
        
        // Ensure the file has the correct extension
        const fileExtension = filename.split('.').pop()?.toLowerCase()
        if (!fileExtension || fileExtension !== 'docx') {
          throw new Error('Invalid file type. Only .docx files are supported for timetables.')
        }

        // Get the blob with the correct type
        const blob = await response.blob()
        const file = new File([blob], filename, { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })

        // Create form data with file
        const formData = new FormData()
        formData.append('file', file)

        // Send to backend for parsing
        const parseResponse = await fetch('http://localhost:8002/parse-timetable', {
          method: 'POST',
          body: formData,
        })

        if (!parseResponse.ok) {
          const errorText = await parseResponse.text()
          console.error('Timetable parsing error:', errorText)
          throw new Error(`Failed to parse timetable: ${errorText}`)
        }

        const data = await parseResponse.json()
        console.log('Received timetable data:', data)
        
        if (data.status === 'error') {
          throw new Error(data.message || 'Failed to parse timetable data')
        }

        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid data format received from server')
        }

        setTimetableData(data.data)
      } catch (err) {
        console.error('Error fetching timetable data:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load timetable data'
        setError(errorMessage)
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fileUrl, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading timetable data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    )
  }

  return <TimetableTable fileUrl={fileUrl} />
}
