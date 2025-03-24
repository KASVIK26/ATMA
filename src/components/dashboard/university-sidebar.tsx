'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddProgramDialog } from './add-program-dialog'
import { AddBranchDialog } from './add-branch-dialog'
import { AddYearDialog } from './add-year-dialog'
import { AddSectionDialog } from './add-section-dialog'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface TreeItem {
  id: string
  name: string
  type: 'program' | 'branch' | 'year' | 'section'
  children?: TreeItem[]
  isExpanded?: boolean
}

export function UniversitySidebar() {
  const [items, setItems] = useState<TreeItem[]>([])
  const [selectedItem, setSelectedItem] = useState<TreeItem | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState({
    program: false,
    branch: false,
    year: false,
    section: false
  })

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

      // Fetch programs
      const { data: programs } = await supabase
        .from('programs')
        .select('id, name')
        .eq('university_id', userData.university_id)
        .order('name')

      if (!programs) return

      const structuredData: TreeItem[] = await Promise.all(
        programs.map(async (program) => {
          // Fetch branches for each program
          const { data: branches } = await supabase
            .from('branches')
            .select('id, name')
            .eq('program_id', program.id)
            .order('name')

          const branchItems: TreeItem[] = await Promise.all(
            (branches || []).map(async (branch) => {
              // Fetch years for each branch
              const { data: years } = await supabase
                .from('years')
                .select('id, year_number')
                .eq('branch_id', branch.id)
                .order('year_number')

              const yearItems: TreeItem[] = await Promise.all(
                (years || []).map(async (year) => {
                  // Fetch sections for each year
                  const { data: sections } = await supabase
                    .from('sections')
                    .select('id, name')
                    .eq('year_id', year.id)
                    .order('name')

                  return {
                    id: year.id,
                    name: `Year ${year.year_number}`,
                    type: 'year' as const,
                    children: (sections || []).map(section => ({
                      id: section.id,
                      name: section.name,
                      type: 'section' as const
                    }))
                  }
                })
              )

              return {
                id: branch.id,
                name: branch.name,
                type: 'branch' as const,
                children: yearItems
              }
            })
          )

          return {
            id: program.id,
            name: program.name,
            type: 'program' as const,
            children: branchItems
          }
        })
      )

      setItems(structuredData)
    } catch (error) {
      console.error('Error fetching university structure:', error)
    }
  }

  useEffect(() => {
    fetchUniversityStructure()
  }, [])

  const toggleExpand = (item: TreeItem) => {
    const updateItemsRecursively = (items: TreeItem[]): TreeItem[] => {
      return items.map(i => {
        if (i.id === item.id) {
          return { ...i, isExpanded: !i.isExpanded }
        }
        if (i.children) {
          return { ...i, children: updateItemsRecursively(i.children) }
        }
        return i
      })
    }

    setItems(updateItemsRecursively(items))
  }

  const handleAddClick = (item: TreeItem) => {
    setSelectedItem(item)
    switch (item.type) {
      case 'program':
        setAddDialogOpen(prev => ({ ...prev, branch: true }))
        break
      case 'branch':
        setAddDialogOpen(prev => ({ ...prev, year: true }))
        break
      case 'year':
        setAddDialogOpen(prev => ({ ...prev, section: true }))
        break
    }
  }

  const renderItem = (item: TreeItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpandable = hasChildren || item.type !== 'section'

    return (
      <div key={item.id} className="w-full">
        <div 
          className={cn(
            "flex items-center gap-2 w-full rounded-md hover:bg-accent hover:text-accent-foreground py-1.5 px-2",
            level > 0 && "ml-4"
          )}
        >
          {isExpandable && (
            <ChevronRight 
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                item.isExpanded && "rotate-90"
              )}
              onClick={() => toggleExpand(item)}
            />
          )}
          <span className="flex-1">{item.name}</span>
          {item.type !== 'section' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 hover:bg-background"
              onClick={() => handleAddClick(item)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        {item.isExpanded && item.children && (
          <div className="mt-1">
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="font-semibold mb-4">University Structure</div>
      <Button
        variant="outline"
        size="sm"
        className="w-full mb-4"
        onClick={() => setAddDialogOpen(prev => ({ ...prev, program: true }))}
      >
        Add Program
      </Button>

      <div className="space-y-1">
        {items.map(item => renderItem(item))}
      </div>

      <AddProgramDialog
        open={addDialogOpen.program}
        onOpenChange={(open) => setAddDialogOpen(prev => ({ ...prev, program: open }))}
        onSuccess={fetchUniversityStructure}
      />

      {selectedItem?.type === 'program' && (
        <AddBranchDialog
          programId={selectedItem.id}
          open={addDialogOpen.branch}
          onOpenChange={(open) => setAddDialogOpen(prev => ({ ...prev, branch: open }))}
          onSuccess={fetchUniversityStructure}
        />
      )}

      {selectedItem?.type === 'branch' && (
        <AddYearDialog
          branchId={selectedItem.id}
          open={addDialogOpen.year}
          onOpenChange={(open) => setAddDialogOpen(prev => ({ ...prev, year: open }))}
          onSuccess={fetchUniversityStructure}
        />
      )}

      {selectedItem?.type === 'year' && (
        <AddSectionDialog
          yearId={selectedItem.id}
          open={addDialogOpen.section}
          onOpenChange={(open) => setAddDialogOpen(prev => ({ ...prev, section: open }))}
          onSuccess={fetchUniversityStructure}
        />
      )}
    </div>
  )
} 