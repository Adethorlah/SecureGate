"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageCenter } from "@/components/layout/PageCenter"
import { AuthForm } from "@/components/auth/AuthForm"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator"
import { resetPassword } from "@/actions/reset-password"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [password, setPassword] = useState("")

  if (!token) {
    return (
      <AuthForm
        title="Invalid link"
        subtitle="This password reset link is invalid or has expired."
        footer={
          <Link href="/forgot-password" className="text-[var(--color-accent)] hover:underline">
            Request a new reset link
          </Link>
        }
      >
        <Alert variant="error">
          This password reset link is invalid or has expired. Please request a new one.
        </Alert>
      </AuthForm>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    formData.set("token", token as string)
    const result = await resetPassword(formData)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push("/login")
  }

  return (
    <AuthForm
      title="Reset your password"
      subtitle="Enter your new password"
      footer={
        <Link href="/login" className="text-[var(--color-accent)] hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <PasswordInput
            label="New password"
            name="password"
            placeholder="At least 8 characters"
            isLoading={isLoading}
            required
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordStrengthIndicator password={password} />
        </div>
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" isLoading={isLoading}>
          Reset password
        </Button>
      </form>
    </AuthForm>
  )
}

export default function ResetPasswordPage() {
  return (
    <PageCenter>
      <Suspense
        fallback={
          <AuthForm title="Loading..." subtitle="Please wait">
            <div className="flex justify-center py-4">
              <div className="animate-spin h-8 w-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full" />
            </div>
          </AuthForm>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </PageCenter>
  )
}
