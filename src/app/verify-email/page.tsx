"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageCenter } from "@/components/layout/PageCenter"
import { AuthForm } from "@/components/auth/AuthForm"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Spinner } from "@/components/ui/Spinner"
import { useToast } from "@/components/ui/ToastProvider"

type VerifyStatus = "SUCCESS" | "INVALID_TOKEN" | "TOKEN_EXPIRED" | "ALREADY_VERIFIED"

function VerifyEmailContent() {
  const router = useRouter()
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    token ? "loading" : "idle"
  )
  const [resendEmail, setResendEmail] = useState("")
  const [resending, setResending] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    if (!token) return
    if (status !== "loading") return
    if (doneRef.current) return
    doneRef.current = true

    let cancelled = false
    const safeToken = token

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(safeToken)}`)
        const result = await res.json()
        if (cancelled) return
        const s: VerifyStatus = result.status

        if (s === "SUCCESS" || s === "ALREADY_VERIFIED") {
          setStatus("success")
          setTimeout(() => router.push("/login"), 2000)
        } else {
          setStatus("error")
          if (s === "TOKEN_EXPIRED") {
            showToast("This verification link has expired.", "error")
          } else {
            showToast("This verification link is invalid.", "error")
          }
        }
      } catch {
        if (!cancelled) {
          setStatus("error")
          showToast("Something went wrong. Please try again later.", "error")
        }
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [token, status, router, showToast])

  async function handleResend() {
    if (!resendEmail.trim()) {
      showToast("Please enter your email address", "error")
      return
    }
    setResending(true)
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
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

  if (status === "idle") {
    return (
      <AuthForm
        title="Check your email"
        subtitle="We sent a verification link to your email. Click it to activate your account."
        footer={
          <Link href="/signup" className="text-[var(--color-accent)] hover:underline">
            Back to sign up
          </Link>
        }
      >
        <div />
      </AuthForm>
    )
  }

  if (status === "loading") {
    return (
      <AuthForm title="Verifying your email" subtitle="Please wait...">
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      </AuthForm>
    )
  }

  if (status === "success") {
    return (
      <AuthForm
        title="Email verified!"
        subtitle="Your account is now active. Redirecting to sign in..."
      >
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      </AuthForm>
    )
  }

  return (
    <AuthForm
      title="Verification failed"
      subtitle="We could not verify your email."
    >
      <div className="space-y-4">
        <Input
          label="Enter your email"
          name="resend-email"
          type="email"
          placeholder="name@example.com"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          disabled={resending}
        />
        <Button onClick={handleResend} isLoading={resending}>
          Resend verification email
        </Button>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={() => router.push("/login")}>
            Back to Login
          </Button>
          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            <Link
              href="/signup"
              className="text-[var(--color-accent)] hover:underline"
            >
              Create a new account
            </Link>
          </p>
        </div>
      </div>
    </AuthForm>
  )
}

export default function VerifyEmailPage() {
  return (
    <PageCenter>
      <Suspense
        fallback={
          <AuthForm title="Verifying your email" subtitle="Please wait...">
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          </AuthForm>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </PageCenter>
  )
}
