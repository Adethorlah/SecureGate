type AlertProps = {
  variant: "error" | "success" | "warning"
  children: React.ReactNode
}

export function Alert({ variant, children }: AlertProps) {
  const styles = {
    error:
      "bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error)]",
    success:
      "bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]",
    warning:
      "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]",
  }

  return (
    <div
      role="alert"
      className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${styles[variant]}`}
    >
      {children}
    </div>
  )
}
