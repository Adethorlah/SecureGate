# SOFTWARE_PRINCIPLES.md — SecureGate Software Engineering Principles

## Purpose

This document defines the engineering laws and software principles guiding SecureGate.

These principles should influence:

- architecture
- security decisions
- validation
- route design
- middleware
- database handling
- deployment

---

## Table of Contents

1. [Murphy's Law](#1-murphys-law)
2. [YAGNI](#2-yagni)
3. [Law of Leaky Abstractions](#3-law-of-leaky-abstractions)
4. [Kerckhoffs's Principle](#4-kerckhoffss-principle)
5. [Defensive Programming](#5-defensive-programming)
6. [Gall's Law](#6-galls-law)
7. [Boy Scout Rule](#7-boy-scout-rule)
8. [Principle of Least Surprise](#8-principle-of-least-surprise)
9. [Technical Debt Awareness](#9-technical-debt-awareness)
10. [Security by Design](#10-security-by-design)
11. [Minimal Attack Surface](#11-minimal-attack-surface)
12. [Production Thinking](#12-production-thinking)
13. [When Principles Conflict](#13-when-principles-conflict)
14. [Principles Quick Reference](#14-principles-quick-reference)
15. [Final Principle](#final-principle)

---

## 1. Murphy's Law

> "Anything that can go wrong will go wrong."

### Application Inside SecureGate

Assume:

- users submit invalid data
- attackers brute-force login
- tokens expire at the worst moment
- sessions become invalid mid-request
- database queries fail
- email delivery fails silently
- users manipulate URLs manually
- network requests timeout

### In Practice

```ts
// Good — assumes failure at every step
export async function verifyEmail(token: string) {
  const storedToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!storedToken || storedToken.expires < new Date()) {
    // Clean up expired token if it exists
    if (storedToken) {
      await prisma.verificationToken.delete({ where: { id: storedToken.id } })
    }
    return { error: "This link has expired. Please request a new one." }
  }
  // ...
}

// Bad — assumes happy path
export async function verifyEmail(token: string) {
  const storedToken = await prisma.verificationToken.findUnique({
    where: { token },
  })
  // assumes token exists and is valid
  await prisma.user.update({
    where: { email: storedToken.email }, // crashes if storedToken is null
    data: { emailVerified: new Date() },
  })
}
```

### Because of This

- tokens expire
- rate limiting exists
- middleware protects routes
- validation exists everywhere
- safe fallbacks are required

---

## 2. YAGNI

> "You Aren't Gonna Need It"

### Application Inside SecureGate

SecureGate intentionally avoids:

- social login (OAuth)
- MFA / 2FA
- RBAC / roles / permissions
- analytics / tracking
- feature-heavy dashboards
- admin panels
- event systems / webhooks
- background queues

### In Practice

```ts
// ❌ "We might need roles later"
model User {
  role String @default("user") // YAGNI violation
}

// ✓ Only what's needed now
model User {
  name           String
  email          String    @unique
  hashedPassword String
  emailVerified  DateTime?
}
```

**Question every addition:** "Do we need this today?" If not, don't add it.

### The Goal

Focused execution. Avoid feature creep.

---

## 3. Law of Leaky Abstractions

> All non-trivial abstractions leak.

### Application Inside SecureGate

Libraries like:

- Prisma
- NextAuth
- Resend

simplify development but do not remove complexity.

### What This Means

| Abstraction | What Leaks | What to Know |
|---|---|---|
| Prisma | SQL, connection pooling, migrations | Prisma schema ≠ database state. Migrations affect real tables. |
| NextAuth | Session handling, JWT, cookies | NextAuth handles sessions but you must still validate auth state. |
| Resend | Email delivery, DNS, spam filters | Emails can fail silently. Always handle send failures. |

### In Practice

```ts
// Good — aware of the abstraction
// Prisma findUnique returns null if not found — handle it
const user = await prisma.user.findUnique({ where: { email } })
if (!user) {
  return { error: "Invalid email or password" }
}

// Bad — assumes Prisma always returns a user
const user = await prisma.user.findUnique({ where: { email } })
await sendEmail(user.email) // crashes if user is null
```

---

## 4. Kerckhoffs's Principle

> A cryptosystem should be secure even if everything about the system, except the key, is public knowledge.

### Application Inside SecureGate

Security must depend on:

- strong hashing (bcrypt, 12 rounds)
- secure secrets (NEXTAUTH_SECRET, RESEND_API_KEY)
- correct token handling (single-use, expiry)
- proper session management

**NOT** hidden implementation details.

### In Practice

```ts
// Good — security depends on strong secrets, not obscurity
const hashedPassword = await bcrypt.hash(password, 12)

// Bad — security depends on hiding the algorithm
const hashedPassword = myCustomObfuscationFunction(password) // security through obscurity
```

### Because of This

- secrets stay in environment variables
- bcrypt hashing is required (not custom algorithms)
- tokens expire
- sessions remain protected

---

## 5. Defensive Programming

> Never trust anything outside your direct control.

### Application Inside SecureGate

**Never trust:**

- frontend validation (UX only, not security)
- user input (always validate server-side)
- happy paths (assume every step can fail)
- valid sessions (check on every request)
- third-party services (Resend, database can fail)

### In Practice

```ts
// Good — defensive
async function login(email: string, password: string) {
  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { error: "Invalid email or password" }
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword)
  if (!isValid) {
    return { error: "Invalid email or password" }
  }

  // ...
}

// Bad — trusts everything
async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  // crashes if user is null
  const isValid = await bcrypt.compare(password, user.hashedPassword)
}
```

### Always

- validate and fail safely
- check for null/undefined at every boundary
- catch errors and return safe responses

---

## 6. Gall's Law

> "A complex system that works evolved from a simple system that worked."

### Application Inside SecureGate

Build in phases:

```
Phase 1: Scaffold + basic auth
Phase 2: Email verification
Phase 3: Password reset
Phase 4: Security hardening
Phase 5: Polish
```

### In Practice

```ts
// ❌ Trying to build everything at once
// signup + login + verification + password reset + OAuth + MFA + admin panel
// Result: fragile, hard to debug, security holes

// ✓ Build one phase at a time
// Phase 1: signup + login + hashing
// Phase 2: add verification
// Phase 3: add password reset
```

### The Rule

Never attempt all features simultaneously. Each phase must work completely before moving to the next.

---

## 7. Boy Scout Rule

> "Leave the code better than you found it."

### Application Inside SecureGate

Always clean up when you touch a file:

- remove unused imports
- improve variable naming (rename `x` to `existingUser`)
- simplify duplicated logic
- clean messy handlers
- add missing validation
- fix inconsistent formatting

### In Practice

```diff
- const u = await prisma.user.findUnique({ where: { email } })
+ const existingUser = await prisma.user.findUnique({ where: { email } })
```

### The Mindset

If you see something that can be improved with low risk, improve it. Don't wait for a "cleanup ticket."

---

## 8. Principle of Least Surprise

> The system should behave in a way that users (and developers) expect.

### Application Inside SecureGate

Users should understand:

- what failed (clear error message)
- what succeeded (clear success message)
- what happens next (predictable flow)

### In Practice

```ts
// Good — predictable
// User submits login form → loading state → success redirect OR inline error

// Bad — surprising
// User submits login form → page reloads → toast notification → no error on form
```

### UX Implications

- Forms show errors inline, not in toasts or alerts
- Loading states show immediately on submit
- Redirects are predictable (login → dashboard, logout → login)
- Error messages tell the user what to do next

---

## 9. Technical Debt Awareness

> Every shortcut creates future cost.

### Application Inside SecureGate

Some shortcuts may help short-term speed, but recognise the cost:

| Shortcut | Cost |
|---|---|
| Skipping validation | Security vulnerability |
| Using `any` | Lost type safety, harder refactoring |
| Hardcoding values | Fragile, hard to change |
| Ignoring error handling | Silent failures, hard to debug |
| Copy-pasting code | Duplication, inconsistency |

### The Rule

Always recognise:

- what was simplified
- what should later be refactored
- what may become fragile at scale

Document it if it's intentional. Fix it if it's cheap.

---

## 10. Security by Design

> Security is not added later. It is built in from the start.

### Application Inside SecureGate

Security must exist:

| Layer | Security |
|---|---|
| Architecture | Minimal models, server-side logic |
| Validation | Zod on every endpoint |
| Middleware | Auth + verification checks |
| Token handling | crypto.randomBytes, single-use, expiry |
| Error handling | Generic messages, no leaks |
| Environment | Secrets in env vars, never in code |

### In Practice

```ts
// Security is not an afterthought — it's in the template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)     // validation
    if (!parsed.success) {
      return NextResponse.json(               // safe error
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }
    // business logic...
  } catch (error) {
    console.error(error)
    return NextResponse.json(                 // safe fallback
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    )
  }
}
```

---

## 11. Minimal Attack Surface

> Every unnecessary feature increases complexity, bugs, and risk.

### Application Inside SecureGate

| Feature | Attack Surface | Included? |
|---|---|---|
| Signup | Low | ✓ Required |
| Login | Low | ✓ Required |
| Email verification | Low | ✓ Required |
| Password reset | Low | ✓ Required |
| OAuth login | Medium | ✗ Not needed |
| MFA | Medium | ✗ Not needed |
| Admin panel | High | ✗ Not needed |
| File upload | High | ✗ Not needed |
| API for third parties | High | ✗ Not needed |

### The Rule

If a feature does not directly support authentication, verification, or password recovery, **it increases attack surface without justification.**

---

## 12. Production Thinking

> Write code as if attackers will test it.

### Application Inside SecureGate

Write code assuming:

- attackers will test every endpoint
- users will misuse every form
- secrets may leak (so use env vars)
- APIs may fail (so handle errors)
- rate limits will be hit (so handle gracefully)
- tokens will be tampered with (so validate server-side)

### In Practice

```ts
// Production thinking: what if this endpoint gets 1000 requests/second?
// Answer: rate limiting + efficient queries + minimal response size

// Production thinking: what if the database goes down?
// Answer: catch Prisma errors, return safe fallback
```

### Reliability Matters

A system that fails safely is more reliable than one that crashes.

---

## 13. When Principles Conflict

Sometimes principles pull in opposite directions. Here's how to resolve:

| Conflict | Resolution |
|---|---|
| YAGNI vs. "might need this soon" | When in doubt, leave it out. Add it when you actually need it. |
| Security by Design vs. Simplicity | Security wins. A slightly more complex auth flow is better than an insecure one. |
| Gall's Law vs. Production Thinking | Build phases are sequential but each phase must be production-ready before moving on. |
| Boy Scout Rule vs. YAGNI | Improving existing code is not scope creep. Refactoring is allowed. Adding new features is not. |
| Defensive Programming vs. Clean Code | Defensive checks (null guards, early returns) are clean code, not clutter. |

### General Rule

**Security concerns always override convenience concerns.**

---

## 14. Principles Quick Reference

| # | Principle | Core Question | Key File |
|---|---|---|---|
| 1 | Murphy's Law | "What can go wrong?" | Every file |
| 2 | YAGNI | "Do we need this now?" | schema.prisma, AGENTS.md |
| 3 | Leaky Abstractions | "What is the ORM hiding?" | prisma/, middleware/ |
| 4 | Kerckhoffs's | "Is security in the keys or the algorithm?" | lib/auth, .env.local |
| 5 | Defensive Programming | "Am I trusting anything?" | Every route handler |
| 6 | Gall's Law | "Does the simple version work first?" | Project roadmap |
| 7 | Boy Scout Rule | "Is this file cleaner than I found it?" | Every commit |
| 8 | Least Surprise | "Is this predictable?" | UI components, error messages |
| 9 | Tech Debt Awareness | "What am I deferring?" | Code reviews |
| 10 | Security by Design | "Is security built in or bolted on?" | Architecture, middleware |
| 11 | Minimal Attack Surface | "Does this increase risk?" | Feature decisions |
| 12 | Production Thinking | "Will this survive production?" | Error handling, rate limiting |

---

## Final Principle

SecureGate is not judged by feature quantity.

It is judged by:

- engineering discipline
- security awareness
- reliability
- clarity
- explainability
- defensive thinking
