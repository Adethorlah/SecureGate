# CODE_STYLE.md — SecureGate Code Style Rules

## Core Principle

Write code that is:

- easy to read
- easy to explain
- easy to debug
- easy to maintain

Prioritise clarity over cleverness.

---

## Table of Contents

1. [General Rules](#general-rules)
2. [Naming Rules](#naming-rules)
3. [Validation Rules](#validation-rules)
4. [Error Handling Style](#error-handling-style)
5. [API Response Style](#api-response-style)
6. [Comments](#comments)
7. [Imports](#imports)
8. [File Size & Organisation](#file-size--organisation)
9. [UI Style Rules](#ui-style-rules)
10. [Quick Reference Checklist](#quick-reference-checklist)
11. [Final Rule](#final-rule)

---

## General Rules

### 1. Prefer Explicit Code

Use descriptive names. A reader should understand the variable without hunting for context.

```ts
// Good
const existingUser = await prisma.user.findUnique({ where: { email } })
const hasActiveSession = session !== null && session.expires > new Date()

// Bad
const u = await prisma.user.findUnique({ where: { email } })
const x = session !== null && session.expires > new Date()
```

### 2. Small Functions Only

Functions should do **one thing**. If a function name contains "and", it's likely doing too much.

```ts
// Good
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function createUser(data: CreateUserInput): Promise<User> {
  return prisma.user.create({ data })
}

// Bad
async function handleSignupAndSendEmailAndCreateSession(input: any) {
  // too many responsibilities
}
```

Split route handlers into distinct phases:

1. Validate input (Zod)
2. Execute business logic (actions/)
3. Return safe response

### 3. Avoid Deep Nesting

Prefer early returns and guard clauses over nested conditionals.

```ts
// Good
if (!user) {
  return { error: "Invalid email or password" }
}
if (!user.emailVerified) {
  return { error: "Please verify your email first" }
}
// proceed with login logic

// Bad
if (user) {
  if (user.emailVerified) {
    // login logic
  } else {
    // error
  }
} else {
  // error
}
```

### 4. Keep Components Focused

```tsx
// Good — single responsibility
function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = calculateStrength(password)
  return <ProgressBar value={strength} />
}

// Bad — mixing concerns
function AuthForm() {
  // signup logic, login logic, password strength, validation, API calls...
}
```

### 5. Use Strong TypeScript Types

```ts
// Good
type SignupInput = {
  name: string
  email: string
  password: string
}

type SafeResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

// Bad
function signup(input: any): Promise<any> {
  // ...
}
```

**Never use:**

- `any`
- loose typed responses
- unsafe type casting

---

## Naming Rules

### Variables

```ts
// Good
verificationToken
passwordResetToken
hashedPassword
existingUser
plainTextPassword
isTokenExpired

// Bad
x
data
obj
item
tmp
```

### Booleans

Use readable boolean naming with prefixes.

```ts
// Good
isVerified
isExpired
isAuthenticated
hasValidSession
shouldRedirect
canReset

// Bad
verified
expired
auth
```

### Functions

Use verb-noun pairs that describe the action.

```ts
// Good
generateVerificationToken()
sendPasswordResetEmail()
validateSignupInput()
hashPassword()

// Bad
handleToken()
doEmail()
process()
```

---

## Validation Rules

- Use Zod for **all** server-side request validation
- Never validate only on the frontend — client checks are UX only
- Every auth-related endpoint must validate:

| Field | Validation |
|---|---|
| email | Valid email format, required |
| password | Min length, required |
| token | Non-empty, required |
| name | Min length, required (for signup) |

```ts
// Good
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Bad — no validation or manual validation
function signup(name: string, email: string, password: string) {
  if (!email.includes("@")) {
    return { error: "Invalid email" }
  }
}
```

---

## Error Handling Style

```ts
// Good
try {
  const user = await prisma.user.findUnique({ where: { email } })
} catch (error) {
  console.error("Failed to find user:", error)
  return { error: "Something went wrong. Please try again later." }
}

// Bad
try {
  const user = await prisma.user.findUnique({ where: { email } })
} catch (error: any) {
  return { error: error.message } // leaks Prisma/DB details
}
```

**Never expose:**

- Prisma errors
- Database errors
- Stack traces
- Raw exceptions
- Internal implementation details

**Always return safe fallback messages:**

```
"Something went wrong. Please try again later."
```

---

## API Response Style

Responses must remain predictable, safe, and minimal.

```ts
// Good — consistent shape
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

// Good — server action return
type ActionResult = {
  error?: string
  success?: boolean
}
```

**Rules:**

- Same shape for success and error responses
- No inconsistent field names (`data` vs `payload` vs `result`)
- No exposing raw database records — strip sensitive fields
- Return only what the client needs

---

## Comments

Do not overcomment obvious code. Comments should explain **why**, not **what**.

```ts
// Bad — states the obvious
// Check if user exists
const user = await prisma.user.findUnique({ where: { email } })

// Bad — redundant
// Return error message
return { error: "Invalid credentials" }

// Good — explains rationale
// Use bcryptjs (not native bcrypt) to avoid platform-specific compilation issues
const hashedPassword = await bcrypt.hash(password, 12)

// Good — security decision rationale
// Return generic error to prevent credential enumeration
return { error: "Invalid email or password" }
```

**Only comment:**

- security decisions and their rationale
- unusual logic that isn't obvious
- important edge cases
- middleware redirect reasoning
- why a particular library or approach was chosen

---

## Imports

```ts
// Good — organised and clean
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
import { generateToken } from "@/lib/token"

// Bad — messy and unused
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { someUnusedImport } from "@/lib/never-used"
```

**Rules:**

- Group by: external → internal → relative
- Remove unused imports
- Remove dead code
- Remove duplicate utilities
- Apply the **Boy Scout Rule**: leave imports cleaner than you found them

---

## File Size & Organisation

### When to Refactor

If a file becomes difficult to scan quickly, refactor.

**Warning signs:**

- File exceeds ~200 lines
- Multiple responsibilities in one file
- Deeply nested conditionals
- Repeated code blocks
- Hard to find the relevant function

### Suggested File Max Sizes

| Context | Max Lines |
|---|---|
| Component | 150 |
| Server action | 100 |
| Utility / lib | 200 |
| Email template | 80 |
| Middleware | 60 |

These are guidelines, not hard limits. The principle is: if scanning the file takes more than 30 seconds, it's too large.

### Component File Organisation

```tsx
// 1. Imports
import { useState } from "react"

// 2. Types (if component-specific)
type Props = {
  email: string
}

// 3. Component
export function VerifyEmailForm({ email }: Props) {
  // state, handlers, render
}

// 4. Helpers (if small and component-specific)
function formatTimeLeft(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${seconds % 60}`
}
```

---

## UI Style Rules

The UI should prioritise:

- usability
- accessibility
- speed
- clarity

Not decoration.

**Required:**

- Accessible labels on all form inputs (`<label>` or `aria-label`)
- Real-time validation feedback (not just on submit)
- Loading states for async actions (spinner, disabled button)
- Password strength indicator on signup
- Keyboard-navigable forms
- Focus management after errors

**Avoid:**

- excessive animations
- heavy gradients
- flashy transitions
- visual clutter
- decorative elements that add no functional value

---

## Quick Reference Checklist

Before committing, verify:

- [ ] No `any` types
- [ ] All inputs validated with Zod on server
- [ ] No Prisma/DB errors exposed to client
- [ ] No stack traces in responses
- [ ] Functions do one thing
- [ ] No deeply nested conditionals
- [ ] Descriptive variable names (not `x`, `data`, `obj`)
- [ ] Boolean variables use `is`/`has`/`can` prefixes
- [ ] Unused imports removed
- [ ] Dead code removed
- [ ] Comments explain why, not what
- [ ] Components are focused (one responsibility)
- [ ] Loading states present for async actions
- [ ] Accessible labels on all inputs
- [ ] File is scannable (not too large)

---

## Final Rule

Every piece of code should be understandable during the REFLECTION.md walkthrough.

If you cannot explain it simply, **it is probably too complicated.**
