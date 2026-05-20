"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageCenter } from "@/components/layout/PageCenter"
import { AuthForm } from "@/components/auth/AuthForm"
import { Input } from "@/components/ui/Input"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/ToastProvider"

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await signIn("credentials", {
      email,
      password,
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
      setIsLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <PageCenter>
      <AuthForm
        title="Welcome back"
        subtitle="Sign in to your account"
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[var(--color-accent)] hover:underline">
              Sign up
            </Link>
          </>
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
          <div>
            <PasswordInput
              label="Password"
              name="password"
              placeholder="Enter your password"
              isLoading={isLoading}
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
          <Button type="submit" isLoading={isLoading}>
            Sign in
          </Button>
        </form>
      </AuthForm>
    </PageCenter>
  )
}
