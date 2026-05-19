import { type ComponentProps } from "react"

type InputProps = {
  label: string
  error?: string
  isLoading?: boolean
} & ComponentProps<"input">

export function Input({
  label,
  error,
  isLoading,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-[var(--color-text-primary)]"
      >
        {label}
      </label>
      <input
        id={inputId}
        disabled={isLoading}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] aria-invalid:border-[var(--color-border-error)] aria-invalid:ring-[var(--color-error)] disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-text)] disabled:cursor-not-allowed transition-colors`}
        {...props}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-sm text-[var(--color-text-error)]"
        >
          {error}
        </p>
      )}
    </div>
  )
}
