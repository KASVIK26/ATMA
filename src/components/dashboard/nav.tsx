"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutGrid,
  FolderTree,
  ChevronRight,
  Plus,
  LogOut,
  User
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AddProgramDialog } from './add-program-dialog'
import { AddBranchDialog } from './add-branch-dialog'
import { AddYearDialog } from './add-year-dialog'
import { AddSectionDialog } from './add-section-dialog'

interface Program {
  id: string
  name: string
  duration: number
  branches: Branch[]
}

interface Branch {
  id: string
  name: string
  years: Year[]
}

interface Year {
  id: string
  year_number: number
  sections: Section[]
}

interface Section {
  id: string
  name: string
}

export function DashboardNav() {
  const pathname = usePathname()
  const [programs, setPrograms] = useState<Program[]>([])
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set())
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set())
  const [userEmail, setUserEmail] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const [addProgramOpen, setAddProgramOpen] = useState(false)
  const [addBranchOpen, setAddBranchOpen] = useState(false)
  const [addYearOpen, setAddYearOpen] = useState(false)
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [selectedYear, setSelectedYear] = useState<Year | null>(null)

  const fetchUniversityStructure = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (!userData?.university_id) return

      // Fetch programs with duration
      const { data: programsData } = await supabase
        .from('programs')
        .select('id, name, duration')
        .eq('university_id', userData.university_id)
        .order('name')

      if (!programsData) return

      // Fetch complete structure
      const programsWithStructure = await Promise.all(
        programsData.map(async (program) => {
          const { data: branches } = await supabase
            .from('branches')
            .select('id, name')
            .eq('program_id', program.id)
            .order('name')

          const branchesWithYears = await Promise.all(
            (branches || []).map(async (branch) => {
              const { data: years } = await supabase
                .from('years')
                .select('id, year_number')
                .eq('branch_id', branch.id)
                .order('year_number')

              const yearsWithSections = await Promise.all(
                (years || []).map(async (year) => {
                  const { data: sections } = await supabase
                    .from('sections')
                    .select('id, name')
                    .eq('year_id', year.id)
                    .order('name')

                  return {
                    ...year,
                    sections: sections || []
                  }
                })
              )

              return {
                ...branch,
                years: yearsWithSections
              }
            })
          )

          return {
            ...program,
            branches: branchesWithYears
          }
        })
      )

      setPrograms(programsWithStructure)
    } catch (error) {
      console.error('Error fetching university structure:', error)
    }
  }

  useEffect(() => {
    fetchUniversityStructure()
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Auth check error:', error)
        return
      }
      setIsAuthenticated(!!session)
      setUserEmail(session?.user?.email || '')
    }
    checkAuth()
  }, [])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      window.location.href = '/login' // Redirect to login page
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleProgram = (program: Program) => {
    setExpandedPrograms(prev => {
      const next = new Set(prev)
      if (next.has(program.id)) {
        next.delete(program.id)
        setSelectedProgram(null)
      } else {
        next.add(program.id)
        setSelectedProgram(program)
      }
      return next
    })
  }

  const toggleBranch = (branch: Branch) => {
    setExpandedBranches(prev => {
      const next = new Set(prev)
      if (next.has(branch.id)) {
        next.delete(branch.id)
        setSelectedBranch(null)
      } else {
        next.add(branch.id)
        setSelectedBranch(branch)
      }
      return next
    })
  }

  const toggleYear = (year: Year) => {
    setExpandedYears(prev => {
      const next = new Set(prev)
      if (next.has(year.id)) {
        next.delete(year.id)
        setSelectedYear(null)
      } else {
        next.add(year.id)
        setSelectedYear(year)
      }
      return next
    })
  }

  const toRoman = (num: number): string => {
    const romanNumerals = [
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' },
      { value: 2, numeral: 'II' },
      { value: 3, numeral: 'III' },
      { value: 5, numeral: 'V' }
    ]
    return romanNumerals.find(r => r.value === num)?.numeral || num.toString()
  }

  return (
    <div className="flex flex-col h-full">
      {/* ATMA Header */}
      <div className="p-4 border-b">
        <h1 className="font-bold text-2xl">ATMA</h1>
      </div>

      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {/* Dashboard Link */}
            <Button
              variant={pathname === '/dashboard' ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                pathname === '/dashboard' && "bg-accent"
              )}
              asChild
            >
              <Link href="/dashboard">
                <LayoutGrid className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>

            {/* University Structure Section */}
            <div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  <span className="font-medium">University Structure</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAddProgramOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Programs List */}
              <div className="ml-4 space-y-1">
                {programs.map((program) => (
                  <div key={program.id}>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        className="flex-1 justify-start gap-2 h-8"
                        onClick={() => toggleProgram(program)}
                      >
                        <ChevronRight 
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedPrograms.has(program.id) && "rotate-90"
                          )}
                        />
                        {program.name}
                      </Button>
                      {expandedPrograms.has(program.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setSelectedProgram(program)
                            setTimeout(() => setAddBranchOpen(true), 0)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Branches List */}
                    {expandedPrograms.has(program.id) && (
                      <div className="ml-4 space-y-1">
                        {program.branches.map((branch) => (
                          <div key={branch.id}>
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                className="flex-1 justify-start gap-2 h-8 text-sm"
                                onClick={() => toggleBranch(branch)}
                              >
                                <ChevronRight 
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    expandedBranches.has(branch.id) && "rotate-90"
                                  )}
                                />
                                {branch.name}
                              </Button>
                              {expandedBranches.has(branch.id) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setSelectedBranch(branch)
                                    setAddYearOpen(true)
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            {/* Years List */}
                            {expandedBranches.has(branch.id) && (
                              <div className="ml-4 space-y-1">
                                {branch.years.map((year) => (
                                  <div key={year.id}>
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        className="flex-1 justify-start gap-2 h-8 text-sm"
                                        onClick={() => toggleYear(year)}
                                      >
                                        <ChevronRight 
                                          className={cn(
                                            "h-4 w-4 transition-transform",
                                            expandedYears.has(year.id) && "rotate-90"
                                          )}
                                        />
                                        Year {toRoman(year.year_number)}
                                      </Button>
                                      {expandedYears.has(year.id) && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => {
                                            setSelectedYear(year)
                                            setAddSectionOpen(true)
                                          }}
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>

                                    {/* Sections List */}
                                    {expandedYears.has(year.id) && (
                                      <div className="ml-4 space-y-1">
                                        {year.sections.map((section) => (
                                          <Button
                                            key={section.id}
                                            variant="ghost"
                                            className="flex-1 justify-start gap-2 h-8 text-sm w-full"
                                            asChild
                                          >
                                            <Link href={`/dashboard/sections/${section.id}`}>
                                              {section.name}
                                            </Link>
                                          </Button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Info and Sign Out - Fixed at bottom */}
      {isAuthenticated && (
        <div className="border-t mt-auto">
          <div className="p-4 space-y-2">
            <div className="flex items-center">
              <div className="flex items-center flex-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground ml-2 truncate">{userEmail}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={handleSignOut}
            >
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddProgramDialog
        open={addProgramOpen}
        onOpenChange={setAddProgramOpen}
        onSuccess={fetchUniversityStructure}
      />
      
      <AddBranchDialog
        programId={selectedProgram?.id || ''}
        open={addBranchOpen && Boolean(selectedProgram)}
        onOpenChange={(open) => {
          setAddBranchOpen(open)
          if (!open) {
            setSelectedProgram(null)
          }
        }}
        onSuccess={fetchUniversityStructure}
      />
      
      {selectedBranch && (
        <AddYearDialog
          branchId={selectedBranch.id}
          open={addYearOpen}
          onOpenChange={setAddYearOpen}
          onSuccess={fetchUniversityStructure}
          maxYear={selectedProgram?.duration || 4}
        />
      )}
      
      {selectedYear && (
        <AddSectionDialog
          yearId={selectedYear.id}
          open={addSectionOpen}
          onOpenChange={setAddSectionOpen}
          onSuccess={fetchUniversityStructure}
        />
      )}
    </div>
  )
} 