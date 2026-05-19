import { useState, type ComponentProps } from "react"

type PasswordInputProps = {
  label: string
  error?: string
  isLoading?: boolean
} & ComponentProps<"input">

export function PasswordInput({
  label,
  error,
  isLoading,
  id,
  ...props
}: PasswordInputProps) {
  const [show, setShow] = useState(false)
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-[var(--color-text-primary)]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={show ? "text" : "password"}
          disabled={isLoading}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full rounded-[var(--radius-sm)] border px-3 py-2 pr-10 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] aria-invalid:border-[var(--color-border-error)] aria-invalid:ring-[var(--color-error)] disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-text)] disabled:cursor-not-allowed transition-colors`}
          {...props}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
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
