"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { DashboardContent } from "@/components/auth/DashboardContent"

type DashboardClientProps = {
  user: {
    name: string
    email: string
  }
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <DashboardContent
      user={user}
      onLogout={handleLogout}
      isLoading={isLoading}
    />
  )
}
