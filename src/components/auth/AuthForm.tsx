import { Card } from "@/components/ui/Card"
import Link from "next/link"

type AuthFormProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthForm({ title, subtitle, children, footer }: AuthFormProps) {
  return (
    <Card>
      <div className="space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>
        {children}
        {footer && (
          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            {footer}
          </p>
        )}
      </div>
    </Card>
  )
}
