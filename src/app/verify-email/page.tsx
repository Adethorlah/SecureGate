"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageCenter } from "@/components/layout/PageCenter"
import { AuthForm } from "@/components/auth/AuthForm"
import { Alert } from "@/components/ui/Alert"
import { Button } from "@/components/ui/Button"
import { verifyEmail } from "@/actions/verify-email"

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  )
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setMessage("No verification token provided.")
      return
    }

    async function verify() {
      const result = await verifyEmail(token as string)
      if (result.success) {
        setStatus("success")
        setMessage("Your email has been verified successfully!")
      } else {
        setStatus("error")
        setMessage(result.error ?? "Something went wrong. Please try again later.")
      }
    }

    verify()
  }, [token])

  if (status === "loading") {
    return (
      <AuthForm title="Verifying your email" subtitle="Please wait...">
        <div className="flex justify-center py-4">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full" />
        </div>
      </AuthForm>
    )
  }

  return (
    <AuthForm
      title="Email Verification"
      subtitle={
        status === "success"
          ? "Your account is now active."
          : "We could not verify your email."
      }
    >
      <div className="space-y-4">
        <Alert variant={status === "success" ? "success" : "error"}>
          {message}
        </Alert>
        {status === "success" ? (
          <Button onClick={() => router.push("/login")}>
            Sign in
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => router.push("/login")}>
            Back to login
          </Button>
        )}
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
              <div className="animate-spin h-8 w-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full" />
            </div>
          </AuthForm>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </PageCenter>
  )
}
