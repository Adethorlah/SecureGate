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
  onChange,
  ...props
}: PasswordInputProps) {
  const [show, setShow] = useState(false)
  const [hasContent, setHasContent] = useState(() => {
    const value = (props as any).value
    return typeof value === "string" && value.length > 0
  })
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-")

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHasContent(e.target.value.length > 0)
    onChange?.(e)
  }

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
          onChange={handleChange}
        />
        {hasContent && (
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            {show ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
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
