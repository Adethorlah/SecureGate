"use client"

import { PageCenter } from "@/components/layout/PageCenter"
import { Button } from "@/components/ui/Button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <PageCenter>
      <div className="w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-[var(--shadow-md)] text-center space-y-4">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Something went wrong
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Please try again later.
        </p>
        <Button onClick={reset}>
          Try again
        </Button>
      </div>
    </PageCenter>
  )
}
