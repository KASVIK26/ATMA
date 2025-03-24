import './globals.css'
import { Inter } from 'next/font/google'
import { RootLayoutContent } from '@/components/layout/root-layout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'University Attendance Management System',
  description: 'Track and manage university attendance efficiently',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <RootLayoutContent className={inter.className}>
        {children}
      </RootLayoutContent>
    </html>
  )
}
