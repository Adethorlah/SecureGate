"use client"

import { useState } from "react"
import Link from "next/link"
import { PageCenter } from "@/components/layout/PageCenter"
import { AuthForm } from "@/components/auth/AuthForm"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/ToastProvider"

export default function ForgotPasswordPage() {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const result = await res.json()

      if (result.error) {
        showToast(result.error, "error")
        setIsLoading(false)
        return
      }
    } catch {
      showToast("Something went wrong. Please try again later.", "error")
      setIsLoading(false)
      return
    }

    showToast("If an account exists for this email, a reset link has been sent.", "success")
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
          <div />
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
          <Button type="submit" isLoading={isLoading}>
            Send reset link
          </Button>
        </form>
      </AuthForm>
    </PageCenter>
  )
}
