"use client"

import { useState } from "react"
import Link from "next/link"
import { PageCenter } from "@/components/layout/PageCenter"
import { AuthForm } from "@/components/auth/AuthForm"
import { Input } from "@/components/ui/Input"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { Button } from "@/components/ui/Button"
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator"
import { useToast } from "@/components/ui/ToastProvider"

export default function SignupPage() {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [created, setCreated] = useState(false)
  const [createdEmail, setCreatedEmail] = useState("")
  const [resending, setResending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const body = { name, email, password }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result = await res.json()

      if (result.error) {
        showToast(result.error, "error")
        setIsLoading(false)
        return
      }

      setCreatedEmail(email)
      setCreated(true)
    } catch {
      showToast("Something went wrong. Please try again later.", "error")
    }
    setIsLoading(false)
  }

  async function handleResend() {
    setResending(true)
    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: createdEmail }),
      })
      const result = await res.json()
      if (result.error) {
        showToast(result.error, "error")
      } else {
        showToast("Verification email sent!", "success")
      }
    } catch {
      showToast("Something went wrong. Please try again later.", "error")
    }
    setResending(false)
  }

  if (created) {
    return (
      <PageCenter>
        <AuthForm
          title="Verify your email"
          subtitle="Almost done! We sent a verification link to your email. Click the link to activate your account."
          footer={
            <Link href="/login" className="text-[var(--color-accent)] hover:underline">
              Go to sign in
            </Link>
          }
        >
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 7L2 7" />
              </svg>
              <span>Check your inbox and click the verification link. It expires in 15 minutes.</span>
            </div>
            <p className="text-center text-sm">
              Didn&apos;t receive it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[var(--color-accent)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            </p>
          </div>
        </AuthForm>
      </PageCenter>
    )
  }

  return (
    <PageCenter>
      <AuthForm
        title="Create your account"
        subtitle="Enter your details to get started"
        footer={
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--color-accent)] hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Name"
            name="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            isLoading={isLoading}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isLoading={isLoading}
            required
          />
          <div>
            <PasswordInput
              label="Password"
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
            Create account
          </Button>
        </form>
      </AuthForm>
    </PageCenter>
  )
}
