'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AddProgramDialog } from '@/components/dashboard/add-program-dialog'
import { supabase } from '@/lib/supabase'

interface Program {
  id: string
  name: string
  duration: string
  created_at: string
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      
      // Get current user's university_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (!userData?.university_id) return

      // Fetch programs for the user's university
      const { data: programsData, error } = await supabase
        .from('programs')
        .select('*')
        .eq('university_id', userData.university_id)
        .order('name')

      if (error) throw error

      setPrograms(programsData || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Programs</h1>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Program
        </Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : programs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No programs found. Add your first program to get started.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <CardTitle>{program.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Duration: {program.duration}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddProgramDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchPrograms}
      />
    </div>
  )
} 