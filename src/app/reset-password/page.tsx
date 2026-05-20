"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageCenter } from "@/components/layout/PageCenter"
import { AuthForm } from "@/components/auth/AuthForm"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { Button } from "@/components/ui/Button"
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator"
import { useToast } from "@/components/ui/ToastProvider"

function ResetPasswordContent() {
  const router = useRouter()
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isLoading, setIsLoading] = useState(false)
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
        <div />
      </AuthForm>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const passwordValue = formData.get("password")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: passwordValue }),
      })
      const result = await res.json()

      if (result.error) {
        showToast(result.error, "error")
        setIsLoading(false)
        return
      }

      showToast("Password reset successfully! You can now sign in.", "success")
      setTimeout(() => router.push("/login"), 1500)
    } catch {
      showToast("Something went wrong. Please try again later.", "error")
      setIsLoading(false)
    }
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
