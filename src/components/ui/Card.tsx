type CardProps = {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={`w-full max-w-[400px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-[var(--shadow-md)] ${className ?? ""}`}
    >
      {children}
    </div>
  )
}
