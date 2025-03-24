"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

interface ConfirmationScreenProps {
  email: string
}

export function ConfirmationScreen({ email }: ConfirmationScreenProps) {
  const handleGmailRedirect = () => {
    window.open('https://mail.google.com', '_blank')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We sent a verification link to <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <p className="text-sm text-purple-900">
              Please check your email and click the verification link to complete your registration.
              After verification, you can sign in to your account.
            </p>
          </div>
          <Button 
            className="w-full gap-2" 
            onClick={handleGmailRedirect}
          >
            <Mail className="h-4 w-4" />
            Open Gmail
          </Button>
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              Can&apos;t find the email? Check your spam folder.
            </p>
            <p className="text-sm text-gray-500">
              After verifying your email, you can <a href="/auth/login" className="text-primary hover:underline">sign in here</a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 