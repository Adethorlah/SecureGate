"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageCenter } from "@/components/layout/PageCenter"
import { AuthForm } from "@/components/auth/AuthForm"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { Spinner } from "@/components/ui/Spinner"
import { useToast } from "@/components/ui/ToastProvider"

type VerifyStatus = "SUCCESS" | "INVALID_TOKEN" | "TOKEN_EXPIRED" | "ALREADY_VERIFIED"

function VerifyEmailContent() {
  const router = useRouter()
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "signin">(
    token ? "loading" : "idle"
  )
  const [resendEmail, setResendEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const effectRan = useRef(false)

  useEffect(() => {
    if (!token) return
    if (effectRan.current) return
    effectRan.current = true

    const safeToken = token

    async function verify() {
      try {
        const res = await fetch(`/api/verify-email?token=${encodeURIComponent(safeToken)}`)
        const result = await res.json()
        const s: VerifyStatus = result.status

        if (s === "SUCCESS" || s === "ALREADY_VERIFIED") {
          setStatus("success")
        } else {
          setStatus("error")
          if (s === "TOKEN_EXPIRED") {
            showToast("This verification link has expired.", "error")
          } else {
            showToast("This verification link is invalid.", "error")
          }
        }
      } catch {
        setStatus("error")
        showToast("Something went wrong. Please try again later.", "error")
      }
    }

    verify()
  }, [token, showToast])

  useEffect(() => {
    if (status !== "success") return
    const timer = setTimeout(() => setStatus("signin"), 2500)
    return () => clearTimeout(timer)
  }, [status])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoginLoading(true)

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    })

    if (!result?.ok) {
      const error = result?.error
      if (error === "EMAIL_NOT_VERIFIED") {
        showToast("Please verify your email before logging in.", "error")
      } else if (error === "TOO_MANY_REQUESTS") {
        showToast("Too many login attempts. Try again in 10 minutes.", "error")
      } else {
        showToast("Invalid email or password.", "error")
      }
      setLoginLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  async function handleResend() {
    if (!resendEmail.trim()) {
      showToast("Please enter your email address", "error")
      return
    }
    setResending(true)
    try {
      const res = await fetch("/api/resend-verification", {
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
        subtitle="Your email has been successfully verified."
      >
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      </AuthForm>
    )
  }

  if (status === "signin") {
    return (
      <PageCenter>
        <AuthForm
          title="Sign in"
          subtitle="Your email is verified. Sign in to your account."
          footer={
            <>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[var(--color-accent)] hover:underline">
                Sign up
              </Link>
            </>
          }
        >
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              isLoading={loginLoading}
              required
            />
            <div>
              <PasswordInput
                label="Password"
                name="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                isLoading={loginLoading}
                required
              />
              <div className="mt-1 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-[var(--color-accent)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button type="submit" isLoading={loginLoading}>
              Sign in
            </Button>
          </form>
        </AuthForm>
      </PageCenter>
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
