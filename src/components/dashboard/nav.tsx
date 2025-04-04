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
  User,
  ChevronDown,
  FolderOpen,
  Folder,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AddProgramDialog } from './add-program-dialog'
import { AddBranchDialog } from './add-branch-dialog'
import { AddYearDialog } from './add-year-dialog'
import { AddSectionDialog } from './add-section-dialog'
import { toast } from '@/components/ui/use-toast'
import { deleteFile } from '@/lib/storage'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

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
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'program' | 'branch' | 'year' | 'section'
    id: string
    name: string
  } | null>(null)

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
      window.location.href = '/auth/login'
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

  // Update delete handlers to show confirmation first
  const handleDeleteProgram = async (program: Program, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirm({
      type: 'program',
      id: program.id,
      name: program.name
    })
  }

  const handleDeleteBranch = async (branch: Branch, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirm({
      type: 'branch',
      id: branch.id,
      name: branch.name
    })
  }

  const handleDeleteYear = async (year: Year, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirm({
      type: 'year',
      id: year.id,
      name: `Year ${toRoman(year.year_number)}`
    })
  }

  const handleDeleteSection = async (section: Section, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirm({
      type: 'section',
      id: section.id,
      name: section.name
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    
    const { type, id } = deleteConfirm
    setDeleting(id)
    
    try {
      switch (type) {
        case 'program':
          await deleteProgram(id)
          break
        case 'branch':
          await deleteBranch(id)
          break
        case 'year':
          await deleteYear(id)
          break
        case 'section':
          await deleteSection(id)
          break
      }
    } finally {
      setDeleting(null)
      setDeleteConfirm(null)
    }
  }

  // Move delete logic to separate functions
  const deleteProgram = async (programId: string) => {
    try {
      // First verify the program exists and get its branches
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select(`
          id,
          branches (
            id,
            years (
              id,
              sections (
                id
              )
            )
          )
        `)
        .eq('id', programId)
        .single()

      if (programError) {
        console.error('Error finding program:', programError)
        throw new Error('Program not found')
      }

      if (!program) {
        throw new Error('Program not found')
      }

      // Delete files for all sections in the program's hierarchy
      if (program.branches) {
        for (const branch of program.branches) {
          if (branch.years) {
            for (const year of branch.years) {
              if (year.sections) {
                for (const section of year.sections) {
                  try {
                    await Promise.all([
                      deleteFile(section.id, 'timetable'),
                      deleteFile(section.id, 'enrollment')
                    ])
                  } catch (fileError) {
                    console.error(`Error deleting files for section ${section.id}:`, fileError)
                    // Continue with other deletions even if one fails
                  }
                }
              }
            }
          }
        }
      }

      // Delete the program (cascade will handle branches, years, and sections)
      const { error: deleteError } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId)

      if (deleteError) {
        console.error('Error deleting program from database:', deleteError)
        throw deleteError
      }

      toast({
        title: 'Success',
        description: 'Program and all its content deleted successfully'
      })

      fetchUniversityStructure()
    } catch (error) {
      console.error('Error deleting program:', error instanceof Error ? error.message : error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete program'
      })
    }
  }

  const deleteBranch = async (branchId: string) => {
    try {
      // First verify the branch exists
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('id')
        .eq('id', branchId)
        .single()

      if (branchError || !branch) {
        console.error('Error finding branch:', branchError)
        throw new Error('Branch not found')
      }

      // Get all sections that need to have files deleted
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('id')
        .eq('branch_id', branchId)

      if (sectionsError) {
        console.error('Error finding sections:', sectionsError)
        // Continue anyway as there might not be any sections
      }

      // Delete files if there are any sections
      if (sections && sections.length > 0) {
        for (const section of sections) {
          try {
            await Promise.all([
              deleteFile(section.id, 'timetable'),
              deleteFile(section.id, 'enrollment')
            ])
          } catch (fileError) {
            console.error(`Error deleting files for section ${section.id}:`, fileError)
            // Continue with other deletions even if one fails
          }
        }
      }

      // Delete the branch (cascade will handle years and sections)
      const { error: deleteError } = await supabase
        .from('branches')
        .delete()
        .eq('id', branchId)

      if (deleteError) {
        console.error('Error deleting branch from database:', deleteError)
        throw deleteError
      }

      toast({
        title: 'Success',
        description: 'Branch and all its content deleted successfully'
      })

      fetchUniversityStructure()
    } catch (error) {
      console.error('Error deleting branch:', error instanceof Error ? error.message : error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete branch'
      })
    }
  }

  const deleteYear = async (yearId: string) => {
    try {
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('id')
        .eq('year_id', yearId)

      if (sectionsError) throw sectionsError

      await Promise.all(sections?.map(section => 
        Promise.all([
          deleteFile(section.id, 'timetable'),
          deleteFile(section.id, 'enrollment')
        ])
      ) ?? [])

      const { error } = await supabase
        .from('years')
        .delete()
        .eq('id', yearId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Year and all its sections deleted successfully'
      })

      fetchUniversityStructure()
    } catch (error) {
      console.error('Error deleting year:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete year'
      })
    }
  }

  const deleteSection = async (sectionId: string) => {
    try {
      await Promise.all([
        deleteFile(sectionId, 'timetable'),
        deleteFile(sectionId, 'enrollment')
      ])

      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Section deleted successfully'
      })

      fetchUniversityStructure()
    } catch (error) {
      console.error('Error deleting section:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete section'
      })
    }
  }

  return (
    <>
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
                      <div className="flex items-center pl-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={(e) => handleDeleteProgram(program, e)}
                          disabled={!!deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleProgram(program)}
                          >
                            {expandedPrograms.has(program.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 justify-start gap-2 px-2 flex-1"
                            onClick={() => toggleProgram(program)}
                          >
                            {expandedPrograms.has(program.id) ? (
                              <FolderOpen className="h-4 w-4" />
                            ) : (
                              <Folder className="h-4 w-4" />
                            )}
                            {program.name}
                          </Button>
                        </div>
                        {expandedPrograms.has(program.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedProgram(program)
                              setAddBranchOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Branches List */}
                      {expandedPrograms.has(program.id) && (
                        <div className="ml-4 space-y-2">
                          {program.branches.map((branch) => (
                            <div key={branch.id}>
                              <div className="flex items-center pl-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                  onClick={(e) => handleDeleteBranch(branch, e)}
                                  disabled={!!deleting}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center flex-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => toggleBranch(branch)}
                                  >
                                    {expandedBranches.has(branch.id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="h-8 justify-start gap-2 px-2 flex-1"
                                    onClick={() => toggleBranch(branch)}
                                  >
                                    {expandedBranches.has(branch.id) ? (
                                      <FolderOpen className="h-4 w-4" />
                                    ) : (
                                      <Folder className="h-4 w-4" />
                                    )}
                                    {branch.name}
                                  </Button>
                                </div>
                                {expandedBranches.has(branch.id) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
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
                                <div className="ml-4 space-y-2">
                                  {branch.years.map((year) => (
                                    <div key={year.id}>
                                      <div className="flex items-center pl-0">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                          onClick={(e) => handleDeleteYear(year, e)}
                                          disabled={!!deleting}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="flex items-center flex-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => toggleYear(year)}
                                          >
                                            {expandedYears.has(year.id) ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            className="h-8 justify-start gap-2 px-2 flex-1"
                                            onClick={() => toggleYear(year)}
                                          >
                                            {expandedYears.has(year.id) ? (
                                              <FolderOpen className="h-4 w-4" />
                                            ) : (
                                              <Folder className="h-4 w-4" />
                                            )}
                                            Year {toRoman(year.year_number)}
                                          </Button>
                                        </div>
                                        {expandedYears.has(year.id) && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
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
                                            <div key={section.id} className="flex items-center pl-0">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                                onClick={(e) => handleDeleteSection(section, e)}
                                                disabled={!!deleting}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                className="flex-1 justify-start gap-2 h-8 text-sm"
                                                asChild
                                              >
                                                <Link href={`/dashboard/sections/${section.id}`}>
                                                  {section.name}
                                                </Link>
                                              </Button>
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

      {/* Add Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteConfirm?.type}`}
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone and will delete all associated content.`}
        loading={!!deleting}
      />
    </>
  )
} 