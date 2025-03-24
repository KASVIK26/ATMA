export interface University {
  id: string
  name: string
  location: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalStudents: number
  totalPrograms: number
  totalBranches: number
  academicYear: string
}

export interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
} 