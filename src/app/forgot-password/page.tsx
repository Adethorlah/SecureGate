"use client"

import { useState } from "react"
import Link from "next/link"
import { PageCenter } from "@/components/layout/PageCenter"
import { AuthForm } from "@/components/auth/AuthForm"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { forgotPassword } from "@/actions/forgot-password"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    const result = await forgotPassword(formData)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setSent(true)
    setIsLoading(false)
  }

  if (sent) {
    return (
      <PageCenter>
        <AuthForm
          title="Check your email"
          subtitle="If an account exists for this email, a reset link has been sent."
          footer={
            <Link href="/login" className="text-[var(--color-accent)] hover:underline">
              Back to sign in
            </Link>
          }
        >
          <Alert variant="success">
            If an account exists for this email, a reset link has been sent.
          </Alert>
        </AuthForm>
      </PageCenter>
    )
  }

  return (
    <PageCenter>
      <AuthForm
        title="Forgot password?"
        subtitle="Enter your email and we'll send you a reset link"
        footer={
          <Link href="/login" className="text-[var(--color-accent)] hover:underline">
            Back to sign in
          </Link>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="name@example.com"
            isLoading={isLoading}
            required
          />
          {error && <Alert variant="error">{error}</Alert>}
          <Button type="submit" isLoading={isLoading}>
            Send reset link
          </Button>
        </form>
      </AuthForm>
    </PageCenter>
  )
}
