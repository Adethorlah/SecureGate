"use client"

import { Button } from "@/components/ui/Button"

type DashboardContentProps = {
  user: {
    name: string
    email: string
  }
  onLogout: () => void
  isLoading: boolean
}

export function DashboardContent({ user, onLogout, isLoading }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Welcome, {user.name}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Signed in as {user.email}
        </p>
      </div>
      <Button
        variant="secondary"
        onClick={onLogout}
        isLoading={isLoading}
      >
        Sign out
      </Button>
    </div>
  )
}
