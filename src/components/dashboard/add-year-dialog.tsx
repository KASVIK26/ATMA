'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface AddYearDialogProps {
  branchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const toRomanNumeral = (num: number): string => {
  const romanNumerals = [
    { value: 6, numeral: 'VI' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 3, numeral: 'III' },
    { value: 2, numeral: 'II' },
    { value: 1, numeral: 'I' },
  ]
  return romanNumerals.find(r => r.value === num)?.numeral || ''
}

export function AddYearDialog({
  branchId,
  open,
  onOpenChange,
  onSuccess
}: AddYearDialogProps) {
  const [yearNumber, setYearNumber] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [maxYears, setMaxYears] = useState<number>(4) // Default to 4 years
  const [existingYears, setExistingYears] = useState<number[]>([])
  const [authChecked, setAuthChecked] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Auth check error:', error)
      }
      console.log('Current auth state:', {
        isAuthenticated: !!session,
        user: session?.user
      })
      setAuthChecked(true)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const fetchProgramDetails = async () => {
      try {
        // Get the program duration
        const { data: branch, error: branchError } = await supabase
          .from('branches')
          .select('program_id')
          .eq('id', branchId)
          .single()

        if (branchError) throw branchError

        const { data: program, error: programError } = await supabase
          .from('programs')
          .select('duration')
          .eq('id', branch.program_id)
          .single()

        if (programError) throw programError

        // Convert duration string to number (e.g., "4 years" -> 4)
        const duration = parseInt(program.duration)
        setMaxYears(duration || 4)

        // Fetch existing years
        const { data: years, error: yearsError } = await supabase
          .from('years')
          .select('year_number')
          .eq('branch_id', branchId)
          .order('year_number')

        if (yearsError) throw yearsError

        setExistingYears(years?.map(y => y.year_number) || [])
      } catch (error) {
        console.error('Error fetching program details:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch program details',
        })
      }
    }

    if (open && branchId) {
      fetchProgramDetails()
    }
  }, [branchId, open])

  const handleSubmit = async () => {
    if (!yearNumber) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a year',
      })
      return
    }

    if (!authChecked) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please wait while we verify your authentication',
      })
      return
    }

    const yearNum = parseInt(yearNumber)
    
    if (existingYears.includes(yearNum)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Year ${toRomanNumeral(yearNum)} already exists in this branch`,
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('years')
        .insert([{
          year_number: yearNum,
          branch_id: branchId
        }])
        .select()

      if (error) {
        console.error('Supabase insert error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      toast({
        title: 'Success',
        description: `Year ${toRomanNumeral(yearNum)} added successfully`,
      })
      onOpenChange(false)
      onSuccess()
      setYearNumber('')
    } catch (error) {
      console.error('Error adding year:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add year - Please check your permissions',
      })
    } finally {
      setLoading(false)
    }
  }

  const availableYears = Array.from({ length: maxYears }, (_, i) => i + 1)
    .filter(year => !existingYears.includes(year))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Year</DialogTitle>
          <DialogDescription>
            Add a new year to the branch.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="yearNumber">Year</Label>
            <Select
              value={yearNumber}
              onValueChange={setYearNumber}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    Year {toRomanNumeral(year)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || availableYears.length === 0}>
            {loading ? 'Adding...' : 'Add Year'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 