type PageCenterProps = {
  children: React.ReactNode
}

export function PageCenter({ children }: PageCenterProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      {children}
    </main>
  )
}
