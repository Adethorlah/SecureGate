"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PageCenter } from "@/components/layout/PageCenter"
import { AuthForm } from "@/components/auth/AuthForm"
import { Input } from "@/components/ui/Input"
import { PasswordInput } from "@/components/ui/PasswordInput"
import { Button } from "@/components/ui/Button"
import { Alert } from "@/components/ui/Alert"
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator"
import { signup } from "@/actions/signup"

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push("/verify-email")
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
            isLoading={isLoading}
            required
          />
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
            Create account
          </Button>
        </form>
      </AuthForm>
    </PageCenter>
  )
}
