'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GitBranch, GraduationCap, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AddUniversityDialog } from '@/components/dashboard/add-university-dialog'

interface DashboardStats {
  totalStudents: number
  totalPrograms: number
  totalBranches: number
  academicYear: string
}

function getCurrentAcademicYear() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  if (month >= 7) {
    return `${year}-${year + 1}`
  }
  return `${year - 1}-${year}`
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalPrograms: 0,
    totalBranches: 0,
    academicYear: getCurrentAcademicYear(),
  })
  const [hasUniversity, setHasUniversity] = useState<boolean | null>(null)
  const [universityName, setUniversityName] = useState<string>('')

  const fetchStats = async () => {
    try {
      // Get current user's university_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (!userData?.university_id) {
        setHasUniversity(false)
        return
      }

      setHasUniversity(true)

      // Get university name
      const { data: university } = await supabase
        .from('universities')
        .select('name')
        .eq('id', userData.university_id)
        .single()

      if (university) {
        setUniversityName(university.name)
      }

      // Get total programs
      const { data: programs, count: programsCount } = await supabase
        .from('programs')
        .select('id', { count: 'exact' })
        .eq('university_id', userData.university_id)

      // Then count branches for these programs
      let branchesCount = 0
      let studentsCount = 0

      if (programs && programs.length > 0) {
        const programIds = programs.map(p => p.id)

        // Count branches
        const { count: bCount } = await supabase
          .from('branches')
          .select('id', { count: 'exact' })
          .in('program_id', programIds)

        branchesCount = bCount || 0

        // Get all branches
        const { data: branches } = await supabase
          .from('branches')
          .select('id')
          .in('program_id', programIds)

        if (branches && branches.length > 0) {
          const branchIds = branches.map(b => b.id)

          // Get all years
          const { data: years } = await supabase
            .from('years')
            .select('id')
            .in('branch_id', branchIds)

          if (years && years.length > 0) {
            const yearIds = years.map(y => y.id)

            // For now, just count sections that have enrollment files
            // This will be updated later to actually count students from enrollment files
            const { count: sCount } = await supabase
              .from('sections')
              .select('id', { count: 'exact' })
              .in('year_id', yearIds)
              .not('enrollment_file_id', 'is', null)

            studentsCount = 0 // Set to 0 until enrollment file parsing is implemented
          }
        }
      }

      setStats({
        totalStudents: studentsCount,
        totalPrograms: programsCount || 0,
        totalBranches: branchesCount,
        academicYear: getCurrentAcademicYear(),
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (hasUniversity === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen p-8">
      {hasUniversity ? (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{universityName}</h1>
            <p className="text-muted-foreground">Academic Year: {stats.academicYear}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Programs</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPrograms}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Branches</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBranches}</div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Welcome to the Dashboard</h1>
            <p className="text-muted-foreground mb-8">
              To get started, please add or select your university
            </p>
            <AddUniversityDialog onSuccess={fetchStats} />
          </div>
        </div>
      )}
    </div>
  )
} 