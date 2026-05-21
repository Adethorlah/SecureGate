import { type ComponentProps } from "react"
import { Spinner } from "./Spinner"

type ButtonProps = {
  isLoading?: boolean
  variant?: "primary" | "secondary" | "danger"
} & ComponentProps<"button">

export function Button({
  isLoading,
  variant = "primary",
  children,
  ...props
}: ButtonProps) {
  const base =
    "rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"

  const variants = {
    primary:
      "bg-[var(--color-accent)] text-[var(--color-accent-text)] hover:bg-[var(--color-accent-hover)]",
    secondary:
      "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-gray-100",
    danger:
      "bg-[var(--color-error)] text-white hover:bg-red-700",
  }

  return (
    <button
      className={`${base} ${variants[variant]} disabled:cursor-not-allowed disabled:opacity-50 w-full flex items-center justify-center`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  )
}
