# COMPONENT_BUILDER.md — SecureGate Component Builder Rules

## Purpose

This document defines how UI components should be designed and structured inside SecureGate.

The UI should prioritise:

- clarity
- usability
- accessibility
- predictability
- fast interaction

Not visual complexity.

---

## Table of Contents

1. [Core Component Philosophy](#core-component-philosophy)
2. [CSS Variable Tokens](#css-variable-tokens)
3. [Component Categories](#component-categories)
4. [Component Template](#component-template)
5. [State Management Rules](#state-management-rules)
6. [UI Components](#ui-components)
7. [Form Components](#form-components)
8. [Authentication Components](#authentication-components)
9. [Feedback Components](#feedback-components)
10. [Validation UX Rules](#validation-ux-rules)
11. [Password UX Rules](#password-ux-rules)
12. [Accessibility Rules](#accessibility-rules)
13. [Styling Rules](#styling-rules)
14. [Dashboard Component Rules](#dashboard-component-rules)
15. [Final Rule](#final-rule)

---

## Core Component Philosophy

Every component should:

- solve one problem
- remain reusable
- remain readable
- stay lightweight

Avoid giant multi-purpose components. **One component = one responsibility.**

---

## CSS Variable Tokens

All colour values must use CSS custom properties, not hardcoded hex values.

### Global Variables

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f9fafb;
  --color-border: #e5e7eb;
  --color-border-focus: #2563eb;
  --color-border-error: #dc2626;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-error: #dc2626;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-text: #ffffff;
  --color-error: #dc2626;
  --color-error-bg: #fef2f2;
  --color-success: #16a34a;
  --color-success-bg: #f0fdf4;
  --color-warning: #d97706;
  --color-warning-bg: #fffbeb;
  --color-disabled-bg: #f3f4f6;
  --color-disabled-text: #9ca3af;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### Usage

```tsx
// Good — uses CSS variables
<button
  className="bg-[var(--color-accent)] text-[var(--color-accent-text)]
    hover:bg-[var(--color-accent-hover)]
    disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-text)]"
>
  Sign in
</button>

// Bad — hardcoded hex values
<button className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400">
  Sign in
</button>
```

---

## Component Categories

```
components/
  forms/        — FormField, FormError, FormWrapper
  auth/         — LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm, PasswordStrengthIndicator
  ui/           — Button, Input, Card, Loader, Alert, Link
  feedback/     — Spinner, ErrorMessage, SuccessMessage, Toast
  layout/       — AuthLayout, DashboardLayout, PageCenter
```

---

## Component Template

```tsx
import { type ComponentProps } from "react"

// 1. Types
type Props = {
  label: string
  error?: string
  isLoading?: boolean
} & ComponentProps<"input">

// 2. Component
export function Input({ label, error, isLoading, id, ...props }: Props) {
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
        className={`
          w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm
          bg-[var(--color-surface)] text-[var(--color-text-primary)]
          border-[var(--color-border)]
          focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]
          aria-invalid:border-[var(--color-border-error)] aria-invalid:ring-[var(--color-error)]
          disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-text)] disabled:cursor-not-allowed
          transition-colors
        `}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-sm text-[var(--color-text-error)]">
          {error}
        </p>
      )}
    </div>
  )
}
```

---

## State Management Rules

- Prefer **local component state** (`useState`)
- Avoid unnecessary global state management
- This project does **not** require: Redux, Zustand, or complex client stores
- Form state lives in the form component
- Loading state is passed as props from parent

```tsx
// Good — local state
export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  // ...
}

// Bad — global state for form
import { useAuthStore } from "@/stores/auth"
```

---

## UI Components

### Button

| State | Style |
|---|---|
| Default | `bg-[var(--color-accent)] text-[var(--color-accent-text)]` |
| Hover | `bg-[var(--color-accent-hover)]` |
| Focus | `ring-2 ring-[var(--color-border-focus)]` |
| Disabled | `bg-[var(--color-disabled-bg)] text-[var(--color-disabled-text)] cursor-not-allowed` |
| Loading | Same as disabled, spinner replaces children |

```tsx
type ButtonProps = {
  isLoading?: boolean
  variant?: "primary" | "secondary" | "danger"
} & ComponentProps<"button">

export function Button({ isLoading, variant = "primary", children, ...props }: ButtonProps) {
  const base = "rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2"
  const variants = {
    primary: "bg-[var(--color-accent)] text-[var(--color-accent-text)] hover:bg-[var(--color-accent-hover)]",
    secondary: "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-gray-100",
    danger: "bg-[var(--color-error)] text-white hover:bg-red-700",
  }

  return (
    <button
      className={`${base} ${variants[variant]} disabled:cursor-not-allowed disabled:opacity-50`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  )
}
```

### Card

```tsx
type CardProps = {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={`
        w-full max-w-[400px] rounded-[var(--radius-lg)]
        border border-[var(--color-border)]
        bg-[var(--color-bg)] p-8
        shadow-[var(--shadow-md)]
        ${className ?? ""}
      `}
    >
      {children}
    </div>
  )
}
```

### Input

(See full template in [Component Template](#component-template) section.)

### Loader / Spinner

```tsx
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-5 w-5 text-current ${className ?? ""}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
```

---

## Form Components

### FormField

Wraps a label, input, and error message into a consistent unit.

```tsx
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
```

### Form Rules

All forms must include:

- `<label>` elements linked via `htmlFor` / `id`
- Inline validation messages below the relevant field
- Loading states on submit button
- Disabled submit state during loading
- Keyboard-navigable fields (Tab, Enter to submit)
- Focus on first error field after validation

---

## Authentication Components

### Examples

| Component | Route | Purpose |
|---|---|---|
| `LoginForm` | `/login` | Email + password sign in |
| `SignupForm` | `/signup` | Name + email + password registration |
| `ForgotPasswordForm` | `/forgot-password` | Email input for reset request |
| `ResetPasswordForm` | `/reset-password` | New password + confirm |
| `VerifyEmailCard` | `/verify-email` | Resend verification or success |
| `PasswordStrengthIndicator` | Inline | Real-time strength feedback |

### AuthForm Wrapper

```tsx
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
```

### SignupForm Usage

```tsx
export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)
    // ... validate, call server action, handle errors
  }

  return (
    <AuthForm
      title="Create your account"
      subtitle="Enter your details to get started"
      footer={<>Already have an account? <Link href="/login">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input label="Name" type="text" placeholder="John Doe" />
        <Input label="Email" type="email" placeholder="name@example.com" />
        <Input label="Password" type="password" />
        <Button type="submit" isLoading={isLoading}>
          Create account
        </Button>
        {error && <Alert variant="error">{error}</Alert>}
      </form>
    </AuthForm>
  )
}
```

---

## Feedback Components

### Alert

```tsx
type AlertProps = {
  variant: "error" | "success" | "warning"
  children: React.ReactNode
}

export function Alert({ variant, children }: AlertProps) {
  const styles = {
    error: "bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error)]",
    success: "bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]",
    warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]",
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
```

### Loading State Rules

- Every async action must show loading feedback
- Submit button must be disabled during loading
- Prevent duplicate submissions (button remains disabled until response)

```tsx
// Good
<Button type="submit" isLoading={isLoading}>
  {isLoading ? "Signing in..." : "Sign in"}
</Button>

// Bad — no loading state
<button type="submit">Sign in</button>
```

---

## Validation UX Rules

Validation must be:

- **immediate** — validate on blur or on keystroke, not just on submit
- **readable** — plain language the user understands
- **human-friendly** — tell the user what to fix, not just what's wrong

**Good:**

- "Password must contain at least 8 characters"
- "Please enter a valid email address"
- "Passwords must match"

**Bad:**

- "Validation error"
- "Input invalid"
- "Field error #3"

### Implementation

```tsx
function validateEmail(email: string): string | undefined {
  if (!email) return "Email is required"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address"
  }
}
```

---

## Password UX Rules

Password inputs should support:

- **Show/hide toggle** — eye icon button inside the input
- **Strength indicator** — visual bar below the input
- **Validation feedback** — inline messages as user types

### Strength Indicator

```tsx
type StrengthLevel = "weak" | "fair" | "strong"

function getStrength(password: string): { level: StrengthLevel; score: number } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { level: "weak", score }
  if (score <= 3) return { level: "fair", score }
  return { level: "strong", score }
}

const colors = {
  weak: "var(--color-error)",
  fair: "var(--color-warning)",
  strong: "var(--color-success)",
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null

  const { level, score } = getStrength(password)

  return (
    <div className="space-y-1">
      <div className="h-1 w-full rounded-full bg-gray-200">
        <div
          className="h-1 rounded-full transition-all"
          style={{
            width: `${(score / 5) * 100}%`,
            backgroundColor: colors[level],
          }}
        />
      </div>
      <p className="text-xs capitalize text-[var(--color-text-secondary)]">
        {level}
      </p>
    </div>
  )
}
```

### Password Field

```tsx
export function PasswordInput(props: ComponentProps<"input">) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 pr-10 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)]"
        {...props}
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
```

---

## Accessibility Rules

Components must support:

| Requirement | Implementation |
|---|---|
| Keyboard navigation | Tab through fields, Enter to submit, Escape to close |
| Labels | `<label htmlFor="...">` on every input |
| Focus states | Visible `ring` outline, never `outline: none` alone |
| Readable contrast | WCAG AA minimum (4.5:1 text, 3:1 large text) |
| Error announcements | `role="alert"` on error messages |
| Loading announcements | `aria-live="polite"` on loading regions |
| Touch targets | Min 44x44px on mobile |

### Example

```tsx
// Accessible input pattern
<label htmlFor="email" className="text-sm font-medium">
  Email
</label>
<input
  id="email"
  type="email"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && (
  <p id="email-error" role="alert" className="text-sm text-red-600">
    {error}
  </p>
)}
```

---

## Styling Rules

### Do

- Use Tailwind utility classes consistently
- Reference CSS variables for colours (`var(--color-*)`)
- Use consistent spacing (`space-y-4`, `p-8`, `gap-4`)
- Use readable typography (`text-sm`, `font-medium`, `leading-relaxed`)
- Keep layouts clean and restrained

### Don't

- Hardcode hex colour values in components
- Add excessive animations (`animate-bounce`, `animate-ping`)
- Use heavy shadows (`shadow-2xl`)
- Add noisy visual effects (gradients on backgrounds, glows)
- Mix styling approaches (Tailwind + CSS modules + inline styles)

### Layout Component

```tsx
export function PageCenter({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      {children}
    </main>
  )
}
```

---

## Dashboard Component Rules

The dashboard exists only to demonstrate:

- protected access
- authenticated state
- verification protection

```tsx
export function DashboardContent({ user }: { user: { name: string; email: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Welcome, {user.name}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Signed in as {user.email}
        </p>
      </div>
      <Button variant="secondary">Sign out</Button>
    </div>
  )
}
```

**Do not overbuild dashboard UI.** No charts, no activity feeds, no settings panels, no sidebar navigation.

---

## Final Rule

The UI should never distract from the authentication flow.

**SecureGate is a security-focused product.**
