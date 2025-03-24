import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string
          name: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          role: string
          university_id: string
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role: string
          university_id: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: string
          university_id?: string
          created_at?: string
        }
      }
      programs: {
        Row: {
          id: string
          name: string
          duration: string
          university_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          duration: string
          university_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          duration?: string
          university_id?: string
          created_at?: string
        }
      }
      branches: {
        Row: {
          id: string
          name: string
          program_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          program_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          program_id?: string
          created_at?: string
        }
      }
      years: {
        Row: {
          id: string
          year_number: number
          branch_id: string
          created_at: string
        }
        Insert: {
          id?: string
          year_number: number
          branch_id: string
          created_at?: string
        }
        Update: {
          id?: string
          year_number?: number
          branch_id?: string
          created_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          name: string
          timetable_file_id: string
          enrollment_file_id: string
          year_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          timetable_file_id: string
          enrollment_file_id: string
          year_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          timetable_file_id?: string
          enrollment_file_id?: string
          year_id?: string
          created_at?: string
        }
      }
    }
  }
} 