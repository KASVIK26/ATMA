'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { University } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/components/ui/use-toast'

interface AddUniversityDialogProps {
  onSuccess?: () => void
}

export function AddUniversityDialog({ onSuccess }: AddUniversityDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedUniversity, setSelectedUniversity] = useState<string>('')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        console.log('Fetching universities...')
        const { data, error } = await supabase
          .from('universities')
          .select('*')
          .order('name')

        if (error) {
          console.error('Error fetching universities:', error)
          throw error
        }

        const universitiesList = [
          { id: 'other', name: 'Other', location: '', created_at: '' }, 
          ...(data || [])
        ]
        console.log('Universities loaded:', universitiesList.length)
        setUniversities(universitiesList)
      } catch (error) {
        console.error('Error in fetchUniversities:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load universities',
        })
      }
    }

    if (open) {
      fetchUniversities()
    }
  }, [open, toast])

  const handleSelect = (value: string) => {
    console.log('Selected university:', value)
    setSelectedUniversity(value)
    if (value !== 'other') {
      const uni = universities.find(u => u.id === value)
      if (uni) {
        console.log('Setting university details:', uni)
        setName(uni.name)
        setLocation(uni.location)
      }
    } else {
      console.log('Clearing university details for new entry')
      setName('')
      setLocation('')
    }
  }

  const handleSubmit = async () => {
    if (!name || !location) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all fields',
      })
      return
    }

    setLoading(true)
    try {
      console.log('Starting university selection process...')
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('User fetch error:', userError)
        throw userError
      }

      if (!user) {
        throw new Error('No authenticated user found')
      }

      console.log('Current user:', user.id)
      let universityId: string

      if (selectedUniversity === 'other') {
        console.log('Creating new university...')
        // Insert new university
        const { data: newUniversity, error: insertError } = await supabase
          .from('universities')
          .insert([{ 
            name: name.trim(), 
            location: location.trim() 
          }])
          .select()
          .single()

        if (insertError) {
          console.error('University insert error:', insertError)
          throw insertError
        }
        
        console.log('New university created:', newUniversity)
        universityId = newUniversity.id
      } else {
        console.log('Using existing university:', selectedUniversity)
        universityId = selectedUniversity
      }

      console.log('Updating user profile with university_id:', universityId)
      // Update user's university_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ university_id: universityId })
        .eq('id', user.id)

      if (updateError) {
        console.error('User update error:', updateError)
        throw updateError
      }

      console.log('University selection completed successfully')
      toast({
        title: 'Success',
        description: selectedUniversity === 'other' ? 'University added successfully' : 'University selected successfully',
      })
      setOpen(false)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process university selection',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add University</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add University</DialogTitle>
          <DialogDescription>
            Select from existing universities or add a new one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select University</Label>
              <Select onValueChange={handleSelect} value={selectedUniversity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a university" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((university) => (
                    <SelectItem 
                      key={university.id} 
                      value={university.id}
                    >
                      {university.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">University Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter university name"
                disabled={selectedUniversity !== 'other' && selectedUniversity !== ''}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
                disabled={selectedUniversity !== 'other' && selectedUniversity !== ''}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : (selectedUniversity === 'other' ? 'Add University' : 'Select University')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 