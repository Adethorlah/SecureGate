# API_ROUTE_SCAFFOLDING.md — SecureGate API Route Scaffolding Rules

## Purpose

This document defines how API routes and server actions should be structured inside SecureGate.

The goal is to maintain:

- predictable structure
- security consistency
- defensive programming
- maintainable route handlers
- production-aware request handling

---

## Table of Contents

1. [Core API Philosophy](#core-api-philosophy)
2. [Route Structure](#route-structure)
3. [Route Handler Flow](#route-handler-flow)
4. [Route Handler Template](#route-handler-template)
5. [Validation Rules](#validation-rules)
6. [Signup Route](#signup-route)
7. [Login Route](#login-route)
8. [Forgot Password Route](#forgot-password-route)
9. [Reset Password Route](#reset-password-route)
10. [Email Verification Route](#email-verification-route)
11. [Response Contract](#response-contract)
12. [Error Handling Rules](#error-handling-rules)
13. [Rate Limiting Integration](#rate-limiting-integration)
14. [Security Rules](#security-rules)
15. [Final Rule](#final-rule)

---

## Core API Philosophy

Authentication routes are security-sensitive.

Every route must assume:

- invalid input
- malicious requests
- missing fields
- expired tokens
- replay attempts
- malformed payloads

**Never trust incoming data.**

---

## Route Structure

Recommended file structure:

```
src/app/api/
  auth/
    signup/
      route.ts
    verify-email/
      route.ts
    forgot-password/
      route.ts
    reset-password/
      route.ts
```

Keep routes small and focused. **One route = one responsibility.**

---

## Route Handler Flow

Each route must follow this order:

```
1. Parse request body
2. Validate input using Zod schema
3. Check for edge cases (existing user, expired token, etc.)
4. Execute business logic
5. Handle errors safely (never expose internals)
6. Return predictable response
```

**Never skip validation. Never skip error handling.**

---

## Route Handler Template

```ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// 1. Schema definition
const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// 2. Response type
type RouteResponse = {
  success: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    // 3. Parse request
    const body = await request.json()

    // 4. Validate input
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // 5. Business logic (delegate to actions)
    // const result = await someAction(email, password)

    // 6. Return response
    return NextResponse.json({ success: true })
  } catch (error) {
    // 7. Safe error handling
    console.error("Signup error:", error)
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again later." },
      { status: 500 }
    )
  }
}
```

---

## Validation Rules

All incoming data must be validated.

### Schemas by Route

| Route | Fields to Validate |
|---|---|
| Signup | `name: z.string().min(2)`, `email: z.string().email()`, `password: z.string().min(8)` |
| Login | `email: z.string().email()`, `password: z.string().min(1)` |
| Forgot Password | `email: z.string().email()` |
| Reset Password | `token: z.string().min(1)`, `password: z.string().min(8)` |
| Verify Email | `token: z.string().min(1)` |

### Implementation

```ts
// signup schema
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
})

// login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
})

// reset password schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
})
```

**Never rely only on frontend validation.** Client checks are UX. Server validation is security.

---

## Signup Route

### Responsibilities

1. Validate input
2. Check if user already exists
3. Hash password (bcryptjs, 12 rounds)
4. Create user in database
5. Generate verification token (crypto.randomBytes)
6. Send verification email
7. Return safe success response

### Rules

- Return generic error if email already exists (don't reveal account status)
- Never store plain passwords
- Never expose database errors
- Never expose whether internal operations failed

```ts
// Signup action pattern
export async function signup(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, email, password } = parsed.data

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: "Something went wrong. Please try again later." } // generic
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, hashedPassword },
  })

  const token = crypto.randomBytes(32).toString("hex")
  await prisma.verificationToken.create({
    data: {
      email,
      token,
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  await sendVerificationEmail({ email, name, token })

  return { success: true }
}
```

---

## Login Route

### Responsibilities

1. Validate credentials
2. Find user by email (don't reveal if not found)
3. Compare hashed password with bcrypt.compare
4. If valid → create session via NextAuth
5. Return safe auth response

### Required Error Message

```
"Invalid email or password"
```

### Rules

- **Never reveal** whether email exists
- **Never reveal** whether password partially matches
- Same response for "email not found" and "password wrong"
- Same response time for both cases (constant-time comparison)

```ts
export async function login(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })

  // Generic error — same for missing user or wrong password
  if (!user) {
    return { error: "Invalid email or password" }
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword)
  if (!isValid) {
    return { error: "Invalid email or password" }
  }

  // Create session via NextAuth
  // ...

  return { success: true }
}
```

---

## Forgot Password Route

### Responsibilities

1. Validate email
2. Generate reset token (crypto.randomBytes)
3. Save token with 1-hour expiry
4. Send reset email
5. Always return generic success response

### Required Response

```
"If an account exists for this email, a reset link has been sent"
```

### Rules

- Same response whether email exists or not
- Same response time (no early exit for missing email)
- Prevent email enumeration

```ts
export async function forgotPassword(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email } = parsed.data

  // Always proceed the same way — don't check if user exists upfront
  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    const token = crypto.randomBytes(32).toString("hex")
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    })
    await sendPasswordResetEmail({ email, name: user.name, token })
  }

  // Always return the same response
  return {
    success: true,
    message: "If an account exists for this email, a reset link has been sent.",
  }
}
```

---

## Reset Password Route

### Responsibilities

1. Validate token and new password
2. Find token in database
3. Check token expiry
4. Hash new password (bcryptjs, 12 rounds)
5. Update user password
6. Delete used token (single-use enforcement)
7. Return safe success response

### Rules

- **Never allow token reuse** — delete immediately after successful use
- Expired tokens must be deleted and return generic error
- Invalid tokens return generic error (no hint about why)

```ts
export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { token, password } = parsed.data

  const storedToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!storedToken || storedToken.expires < new Date()) {
    // Clean up expired token if it exists
    if (storedToken) {
      await prisma.passwordResetToken.delete({ where: { id: storedToken.id } })
    }
    return { error: "This link has expired. Please request a new one." }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { email: storedToken.email },
    data: { hashedPassword },
  })

  // Single-use: delete token immediately after use
  await prisma.passwordResetToken.delete({ where: { id: storedToken.id } })

  return { success: true }
}
```

---

## Email Verification Route

### Responsibilities

1. Validate token
2. Find token in database
3. Check token expiry
4. Update user verification status
5. Delete token (single-use)
6. Return safe response

### Rules

- Expired or invalid tokens must fail safely
- Already verified users should get a clear (but safe) message
- Token deleted after successful verification — cannot be reused

```ts
export async function verifyEmail(input: VerifyEmailInput): Promise<ActionResult> {
  const parsed = verifyEmailSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { token } = parsed.data

  const storedToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!storedToken || storedToken.expires < new Date()) {
    if (storedToken) {
      await prisma.verificationToken.delete({ where: { id: storedToken.id } })
    }
    return { error: "This link has expired. Please request a new one." }
  }

  await prisma.user.update({
    where: { email: storedToken.email },
    data: { emailVerified: new Date() },
  })

  await prisma.verificationToken.delete({ where: { id: storedToken.id } })

  return { success: true }
}
```

---

## Response Contract

### Type Definition

```ts
// Every route returns this shape
type ApiResponse<T = undefined> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Server actions return this shape
type ActionResult = {
  success?: boolean
  error?: string
  message?: string
}
```

### Rules

- **Consistent shape** — every endpoint returns the same structure
- **Success** — `{ success: true, data?: ... }`
- **Error** — `{ success: false, error: "..." }`
- No variant field names (`payload`, `result`, `msg`)
- Error messages are always strings, never objects
- HTTP status codes: 200 for success, 400 for validation errors, 429 for rate limits, 500 for internal errors

---

## Error Handling Rules

### Safe Error Handling

```ts
// Good
try {
  // business logic
} catch (error) {
  console.error(`[signup] Error:`, error)
  return NextResponse.json(
    { success: false, error: "Something went wrong. Please try again later." },
    { status: 500 }
  )
}

// Bad
try {
  // business logic
} catch (error: any) {
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  )
}
```

**Never expose:**

- Prisma errors
- Database errors
- Stack traces
- Auth internals (hash algorithm, token format, etc.)
- Implementation details

### Error Messages by Scenario

| Scenario | HTTP Status | Error Message |
|---|---|---|
| Validation failure | 400 | Schema error message (Zod) |
| Invalid credentials | 401 | "Invalid email or password" |
| Resource not found | 404 | "Something went wrong. Please try again later." |
| Token expired | 400 | "This link has expired. Please request a new one." |
| Rate limited | 429 | "Too many attempts. Please try again later." |
| Internal error | 500 | "Something went wrong. Please try again later." |

---

## Rate Limiting Integration

### Pattern

```ts
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const identifier = `${ip}:login`

  const { allowed, remaining } = await rateLimit(identifier, {
    limit: 5,
    window: 600, // 10 minutes
  })

  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please try again later." },
      { status: 429 }
    )
  }

  // proceed with login logic...
}
```

### Where to Apply

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/auth/login` | 5 | 10 minutes |
| `POST /api/auth/forgot-password` | 5 | 10 minutes |
| `POST /api/auth/signup` | 5 | 10 minutes (optional, recommended) |

---

## Security Rules

Every route must consider:

- **brute-force attempts** — rate limiting on login and forgot-password
- **replay attacks** — single-use tokens, short expiry windows
- **token abuse** — validate expiry, delete after use, never log tokens
- **session tampering** — server-side session validation, HttpOnly cookies
- **malformed requests** — Zod validation on every endpoint

**Murphy's Law applies everywhere.** If something can go wrong, assume it will.

### What Every Route Must Check

- [ ] Input validated with Zod
- [ ] Tokens checked for expiry
- [ ] Tokens deleted after use
- [ ] Generic error messages used
- [ ] Rate limiting applied where required
- [ ] No sensitive data in responses
- [ ] No sensitive data in logs
- [ ] Database errors caught and sanitised

---

## Final Rule

If a route becomes difficult to explain simply, **it is probably doing too much.**
