'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UniversitySidebar } from '@/components/dashboard/university-sidebar'

export default function StructurePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">University Structure</h1>
        <p className="text-muted-foreground">
          Manage your university's programs, branches, years, and sections
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <UniversitySidebar />
        </CardContent>
      </Card>
    </div>
  )
} 