import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardClient } from "./DashboardClient"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  if (!session.user.emailVerified) {
    redirect("/verify-email")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-[480px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-[var(--shadow-md)]">
        <DashboardClient
          user={{
            name: session.user.name ?? "",
            email: session.user.email ?? "",
          }}
        />
      </div>
    </main>
  )
}
