# ARCHITECTURE.md — SecureGate Architecture Rules

## Purpose

SecureGate is a focused authentication and security system.

The architecture must prioritise:

- Security
- Simplicity
- Reliability
- Clear separation of concerns
- Production-aware structure
- Minimal attack surface

This is not a large SaaS platform. Do not overengineer the architecture.

---

## Table of Contents

1. [Core Architectural Principles](#core-architectural-principles)
2. [System Layers](#system-layers)
3. [Request Flow](#request-flow)
4. [Authentication Architecture](#authentication-architecture)
5. [Token Architecture](#token-architecture)
6. [Database Philosophy](#database-philosophy)
7. [Failure Handling](#failure-handling)
8. [Architectural Decision Records](#architectural-decision-records)
9. [Scalability Philosophy](#scalability-philosophy)
10. [Final Rule](#final-rule)

---

## Core Architectural Principles

### 1. Build Narrow, Not Wide

SecureGate only needs:

- Authentication
- Session management
- Email verification
- Password reset
- Route protection
- Rate limiting

**Do NOT add:**

- Admin panels
- RBAC systems
- OAuth providers
- Microservices
- Event systems
- WebSockets
- Background queues
- Feature-heavy dashboards

YAGNI applies strongly. Every new feature must justify its existence against the core scope.

### 2. Security-Critical Logic Must Stay Server-Side

Never trust the client.

The client must never:

- decide authentication state
- verify tokens
- hash passwords
- validate permissions
- manage sensitive logic

All critical operations must happen on the server. Client-side validation is only for UX feedback, never for security enforcement.

### 3. Keep the System Layered

Recommended structure:

```
src/
  app/          — routes, pages, layouts, API handlers
  components/   — reusable UI components
  lib/          — auth utilities, token utils, email helpers, validation, rate limiting
  actions/      — server actions (signup, password reset, verification)
  emails/       — React Email templates
  prisma/       — schema, migrations
  middleware/   — route protection, auth checks
  types/        — shared TypeScript types
```

---

## System Layers

### app/

**Contains:**

- routes
- layouts
- pages
- API route handlers

**Must NOT contain:**

- large business logic
- repeated validation
- database utilities

Route handlers should be thin — parse input, delegate to lib/ or actions/, return response.

### components/

Contains reusable UI components only.

**Examples:**

- forms
- buttons
- input fields
- loaders / spinners
- auth cards
- password strength indicator

**Rules:**

- Keep components small and focused
- One component = one responsibility
- No business logic in components
- Components receive data via props, never fetch it directly

### lib/

Contains all reusable server-side logic:

- auth utilities (session helpers, password hashing wrappers)
- token utilities (generation, validation, expiry checks)
- email helpers (sending via Resend)
- validation helpers (Zod schemas)
- rate limiting logic
- environment variable validation

This is the backbone of the application. Keep it organised but not over-split.

### actions/

Contains server actions that correspond to user intents:

- `signup.ts`
- `login.ts`
- `logout.ts`
- `verify-email.ts`
- `forgot-password.ts`
- `reset-password.ts`

**Rules:**

- Each action does one thing well
- Actions call into lib/ for utilities
- Actions return safe response objects, never throw to the client
- Always validate input with Zod before processing

### emails/

Contains React Email templates.

**Templates:**

- `verification-email.tsx`
- `password-reset-email.tsx`

**Rules:**

- Keep templates minimal, readable, lightweight
- No marketing-style design
- Plain text fallback included
- No tracking pixels or external assets

### middleware/

Responsible for:

- authentication checks (is user logged in?)
- verification checks (is email verified?)
- route protection
- redirect logic

**Rules:**

- Middleware stays defensive and minimal
- Avoid redirect loops — check current path before redirecting
- Fail safely — if session is invalid, treat as unauthenticated
- No business logic in middleware

**Redirect flow:**

```
Request → [Middleware]
  ├── Unauthenticated → redirect /login
  ├── Authenticated + unverified + not on /verify-email → redirect /verify-email
  ├── Authenticated + verified → allow
  └── Public route → allow
```

---

## Request Flow

```
Client Request
    │
    ▼
middleware.ts ──► auth check ──► redirect or allow
    │
    ▼
app/ route or API handler
    │
    ├── validates input (Zod) ← lib/validation
    ├── executes action ← actions/
    │       └── uses utilities ← lib/
    │       └── reads/writes DB ← prisma/
    ├── sends email if needed ← lib/email + emails/
    └── returns safe response
```

Every layer has a single responsibility. Data flows down, responses flow up.

---

## Authentication Architecture

### Flow

```
1. User signs up
2. Password is hashed (bcryptjs, 12 rounds)
3. User stored in DB
4. Verification token generated (crypto.randomBytes)
5. Verification email sent
6. User verifies account (token validated server-side)
7. User logs in → session created
8. Protected routes validated through middleware
```

### Session Rules

- Use NextAuth session handling
- Protected routes must verify: authenticated state + verified email state
- Redirect unauthenticated users to `/login`
- Redirect authenticated but unverified users to `/verify-email`

### Login Error Handling

- Always return: `"Invalid email or password"`
- Never reveal whether the email exists or the password was wrong
- Never: `"Email does not exist"` or `"Password incorrect"`

---

## Token Architecture

Both verification tokens and password reset tokens follow the same contract:

| Property | Requirement |
|---|---|
| Generation | `crypto.randomBytes()` |
| Storage | Hashed in database |
| Expiry | Must expire automatically |
| Single-use | Deleted after successful use |
| Reuse | Never allowed |
| Validation | Server-side only |

### Verification Token

- Expires after **15 minutes**
- Deleted after successful verification

### Password Reset Token

- Expires after **1 hour**
- Deleted after password reset
- Single-use — never allow reuse

---

## Database Philosophy

### Models

Keep models minimal. Required only:

- **User** — id, name, email, hashedPassword, emailVerified, createdAt, updatedAt
- **VerificationToken** — id, email, token, expires, createdAt
- **PasswordResetToken** — id, email, token, expires, createdAt

### Rules

- No unnecessary relations
- No polymorphic associations
- No soft deletes (hard delete tokens after use)
- Index on email and token fields for query performance
- Use `@unique` constraints where appropriate (email on User)

---

## Failure Handling

Every route must assume:

- invalid input
- missing fields
- expired tokens
- missing users
- deleted sessions
- malformed requests
- network failures (email delivery, database connection)

**Murphy's Law applies everywhere.**

### Response Safety

- Never expose database errors to the client
- Never expose Prisma errors
- Never return stack traces
- Never leak whether an email exists
- Never expose internal implementation details

**Safe fallback response:**

```
"Something went wrong. Please try again later."
```

### Expected Error States by Feature

| Feature | Possible Failures |
|---|---|
| Signup | Missing fields, invalid email, weak password, duplicate email, email send failure |
| Login | Missing fields, invalid credentials, unverified email, rate limited |
| Verify email | Invalid token, expired token, missing user, already verified |
| Forgot password | Invalid email, rate limited, email send failure |
| Reset password | Invalid token, expired token, missing user, weak password |

Handle every case. Never assume success.

---

## Architectural Decision Records

### ADR-1: Server Actions over API Routes for Mutations

**Decision:** Use Next.js server actions for auth mutations instead of API routes.

**Rationale:** Server actions provide type safety, avoid manual fetch boilerplate, and keep auth logic co-located with the app. API routes remain available for any future webhook or external integration needs.

### ADR-2: bcryptjs over bcrypt

**Decision:** Use bcryptjs (pure JS) instead of native bcrypt.

**Rationale:** bcryptjs avoids native compilation issues, works consistently across platforms, and is sufficient for this scope. The performance difference is negligible at auth-level traffic.

### ADR-3: Zod over Manual Validation

**Decision:** Use Zod for all server-side validation.

**Rationale:** Zod provides declarative schemas, type inference, readable error messages, and composable validation. Manual validation is error-prone and verbose.

### ADR-4: Single Database for All State

**Decision:** Use one PostgreSQL database for users, sessions, and tokens.

**Rationale:** No need for separate stores (e.g., Redis for tokens). PostgreSQL handles the load for this scope. Adding Redis would be premature optimisation.

### ADR-5: Middleware over Per-Route Guards

**Decision:** Use Next.js middleware for route protection instead of per-page auth checks.

**Rationale:** Middleware runs before the page loads, preventing render of protected content. Per-route guards are repetitive and easy to miss.

---

## Scalability Philosophy

This architecture is intentionally optimised for:

- clarity
- maintainability
- assessment reliability

**Not** enterprise scale.

Do not prematurely optimise. Do not add caching layers, read replicas, or message queues unless there is measurable evidence they are needed.

If the system grows beyond this scope in the future, the clear layering makes it straightforward to extract services or add infrastructure. For now, keep it simple.

---

## Final Rule

If a feature or abstraction does not improve:

- security
- reliability
- maintainability
- clarity

**it probably should not exist.**
