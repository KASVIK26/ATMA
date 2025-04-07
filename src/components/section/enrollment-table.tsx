import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Student {
  [key: string]: string | number
}

interface EnrollmentTableProps {
  fileUrl: string | null
}

export function EnrollmentTable({ fileUrl }: EnrollmentTableProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [columns, setColumns] = useState<string[]>([])
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
        if (!fileExtension || !['xlsx', 'xls', 'docx'].includes(fileExtension)) {
          throw new Error('Invalid file type. Only .xlsx, .xls, and .docx files are supported.')
        }

        // Get the blob with the correct type
        const blob = await response.blob()
        const file = new File([blob], filename, { 
          type: `application/${fileExtension === 'docx' ? 'vnd.openxmlformats-officedocument.wordprocessingml.document' : 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'}`
        })

        // Create form data with file
        const formData = new FormData()
        formData.append('file', file)

        // Send to backend for parsing
        const parseResponse = await fetch('http://localhost:8002/parse-enrollment', {
          method: 'POST',
          body: formData,
        })

        if (!parseResponse.ok) {
          const errorText = await parseResponse.text()
          throw new Error(errorText || 'Failed to parse enrollment data')
        }

        const data = await parseResponse.json()
        
        if (data.status === 'error') {
          throw new Error(data.message || 'Failed to parse enrollment data')
        }

        if (!data.data?.students || !Array.isArray(data.data.students)) {
          throw new Error('Invalid data format received from server')
        }

        setStudents(data.data.students)
        
        // Extract unique columns from all students
        const uniqueColumns = new Set<string>()
        data.data.students.forEach((student: Student) => {
          Object.keys(student).forEach(key => uniqueColumns.add(key))
        })
        setColumns(Array.from(uniqueColumns))
      } catch (err) {
        console.error('Error fetching enrollment data:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load enrollment data'
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
        <span className="ml-2">Loading enrollment data...</span>
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

  if (students.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        No enrollment data available
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column}>{student[column] || ''}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
