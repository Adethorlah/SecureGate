type FormFieldProps = {
  label: string
  error?: string
  children: React.ReactNode
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      {children}
      {error && (
        <p role="alert" className="text-sm text-[var(--color-text-error)]">
          {error}
        </p>
      )}
    </div>
  )
}
