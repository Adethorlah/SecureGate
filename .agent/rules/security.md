# SECURITY.md — SecureGate Security Rules

## Core Security Philosophy

Authentication systems are high-risk systems.

Every decision must prioritise:

- user safety
- data protection
- session integrity
- defensive programming

Assume attackers will test every endpoint.

**Murphy's Law applies everywhere.**

---

## Table of Contents

1. [Threat Model](#threat-model)
2. [Password Security](#password-security)
3. [Authentication Security](#authentication-security)
4. [Email Verification Security](#email-verification-security)
5. [Password Reset Security](#password-reset-security)
6. [Rate Limiting Rules](#rate-limiting-rules)
7. [Input Validation Rules](#input-validation-rules)
8. [Safe Error Messaging](#safe-error-messaging)
9. [Forgot Password Privacy Rule](#forgot-password-privacy-rule)
10. [Session Security](#session-security)
11. [Middleware Security](#middleware-security)
12. [HTTP Security Headers](#http-security-headers)
13. [CSRF & XSS Protection](#csrf--xss-protection)
14. [Environment Variable Security](#environment-variable-security)
15. [Logging Rules](#logging-rules)
16. [Deployment Security](#deployment-security)
17. [Security Checklist](#security-checklist)
18. [Final Rule](#final-rule)

---

## Threat Model

### Attacker Profiles

| Attacker | Capabilities | Defences |
|---|---|---|
| Brute-forcer | Automated login attempts | Rate limiting, generic error messages |
| Token manipulator | Modify URL tokens, reuse expired links | Single-use tokens, expiry validation, server-side verification |
| Email enumerator | Probe endpoints to discover registered emails | Generic responses for forgot-password, login |
| Session hijacker | Steal or manipulate session cookies | HttpOnly cookies, secure flag, session expiry |
| Request tamperer | Modify payloads, bypass client-side validation | Zod validation on every endpoint, never trust client |
| CSRF attacker | Cross-site request forgery | SameSite cookies, CSRF tokens via NextAuth |

### Assume

Users may:

- brute-force login
- reuse expired links
- modify tokens in transit
- spam forgot-password requests
- manipulate request payloads manually
- delete session cookies and expect errors
- send malformed data to every endpoint

The system must remain stable under all conditions.

---

## Password Security

### Required Rules

Passwords must:

- be hashed using **bcryptjs**
- use **12 salt rounds**
- never be stored in plain text
- never be logged
- never be returned in responses
- never be exposed in error messages

```ts
// Required
const hashedPassword = await bcrypt.hash(password, 12)

// Never
const hashedPassword = await bcrypt.hash(password, 8)  // too weak
const hashedPassword = password                          // plain text
```

### Validation Requirements

| Rule | Value |
|---|---|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Hashing algorithm | bcryptjs |
| Salt rounds | 12 |
| Plain text storage | Never |
| Logging | Never |
| Returned in API | Never |

---

## Authentication Security

- Use secure session handling through **NextAuth**
- Protected routes must verify: **authenticated session** + **verified email status**
- Never trust client-side auth state (always validate server-side)
- Sessions use HttpOnly, Secure, SameSite cookies

### Login Error Handling

| Scenario | Response |
|---|---|
| Email not found | "Invalid email or password" |
| Password wrong | "Invalid email or password" |
| Email unverified | "Please verify your email before signing in" |
| Rate limited | "Too many attempts. Please try again later." |

The first two must be **identical** to prevent credential enumeration.

---

## Email Verification Security

Verification tokens must:

- use **crypto.randomBytes()** — not `Math.random()` or simple UUIDs
- **expire after 15 minutes**
- be **single-use** — deleted after successful verification
- be validated **server-side only**

```ts
// Good
const token = crypto.randomBytes(32).toString("hex")

// Bad
const token = Math.random().toString(36)       // not cryptographically secure
const token = uuidv4()                          // not designed for security tokens
```

### Token Lifecycle

```
Generate → Store (hashed) → Send via email → Receive → Validate →
  ├── Valid + not expired → delete token → proceed
  ├── Expired → delete token → return error
  └── Invalid → return error (no hint about why)
```

---

## Password Reset Security

Password reset tokens must:

- **expire after 1 hour**
- be **single-use**
- be **securely generated** (crypto.randomBytes)
- be **deleted after use**
- never allow reuse

```ts
// Token generation (same as verification)
const resetToken = crypto.randomBytes(32).toString("hex")
const hashedToken = await bcrypt.hash(resetToken, 12)
const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
```

### Token Validation Flow

```
1. User clicks reset link
2. Extract token from URL
3. Find hashed token in DB
4. Compare using bcrypt.compare
5. Check expiry
6. If valid → delete token → allow password reset
7. If invalid/expired → return generic error
```

---

## Rate Limiting Rules

### Endpoints

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/auth/login` | 5 attempts | 10 minutes |
| `POST /api/auth/forgot-password` | 5 attempts | 10 minutes |

### Purpose

- Prevent brute-force attacks
- Prevent email spamming via forgot-password
- Protect database from excessive queries

### Implementation

```ts
// Pseudocode
const key = `rate_limit:${identifier}:${action}`
const attempts = await redis.get(key)

if (attempts >= 5) {
  return { error: "Too many attempts. Please try again later." }
}

await redis.incr(key)
await redis.expire(key, 600) // 10 minutes
```

**Rules:**

- Key by IP + email for login
- Key by IP for forgot-password
- Return generic error when rate limited (no hint about whether the email exists)
- Reset counter on successful action

---

## Input Validation Rules

All user input must be validated using **Zod**.

```ts
// Validate everything, every time
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// Never
function login(email: string, password: string) {
  // trust that caller has validated
}
```

### What to Validate

| Input | Location |
|---|---|
| Emails | All auth endpoints |
| Passwords | Signup, login, reset-password |
| Tokens | Verify-email, reset-password |
| Request payloads | Every API route |
| Query parameters | Every API route |

**Never trust incoming requests.** Client-side validation is UX only.

---

## Safe Error Messaging

**Never reveal:**

- whether an email exists in the system
- database structure or schema
- stack traces
- internal implementation details
- auth internals (hash algorithm, token format, etc.)

### Error Message Reference

| Scenario | Safe Response |
|---|---|
| Login failure | "Invalid email or password" |
| Token expired | "This link has expired. Please request a new one." |
| Token invalid | "This link is invalid. Please request a new one." |
| Rate limited | "Too many attempts. Please try again later." |
| General error | "Something went wrong. Please try again later." |
| Forgot password | "If an account exists for this email, a reset link has been sent." |

---

## Forgot Password Privacy Rule

Forgot-password responses must **always** return the same message regardless of whether the email exists:

> "If an account exists for this email, a reset link has been sent."

**Never return:**

- "No account found with this email"
- "A reset link has been sent" (variations that reveal the email exists)
- Different response times for existing vs non-existing accounts

This prevents **email enumeration attacks**.

---

## Session Security

### Rules

- Sessions use HttpOnly, Secure, SameSite cookies
- Session expiry is enforced server-side
- Invalid sessions are destroyed immediately
- Never expose session tokens to client-side JavaScript

### Attack Scenarios

| Attack | Mitigation |
|---|---|
| Session hijacking via XSS | HttpOnly cookies, CSP headers |
| Session fixation | NextAuth generates new session on login |
| Expired session reuse | Server-side expiry check on every request |
| Deleted session access | Redirect to /login, destroy invalid state |

### Session Validation Flow

```
Request to protected route →
  Check session exists →
    ├── No session → redirect /login
    ├── Session expired → destroy session → redirect /login
    └── Session valid → check email verified →
        ├── Not verified → redirect /verify-email
        └── Verified → allow access
```

---

## Middleware Security

Middleware must:

- protect routes before they render
- validate auth state on every protected route
- validate verification state
- prevent redirect loops (check current path before redirecting)
- fail safely — if session validation errors, treat as unauthenticated

```ts
// Example middleware pattern
export function middleware(request: NextRequest) {
  const session = await getToken({ req: request })

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (!session.emailVerified && !request.nextUrl.pathname.startsWith("/verify-email")) {
    return NextResponse.redirect(new URL("/verify-email", request.url))
  }

  return NextResponse.next()
}
```

---

## HTTP Security Headers

### Required Headers

```ts
// next.config.js or middleware
const headers = [
  {
    key: "X-Frame-Options",
    value: "DENY",                     // Prevent clickjacking
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",                  // Prevent MIME type sniffing
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-XSS-Protection",
    value: "0",                        // Deprecated but disables legacy behaviour
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]
```

| Header | Purpose |
|---|---|
| `X-Frame-Options: DENY` | Prevents clickjacking |
| `X-Content-Type-Options: nosniff` | Prevents MIME sniffing |
| `Referrer-Policy: strict-origin-when-cross-origin` | Controls referrer info leakage |
| `Strict-Transport-Security` | Enforces HTTPS |
| `Content-Security-Policy` | Prevents XSS (see below) |

### Content-Security-Policy

```ts
{
  key: "Content-Security-Policy",
  value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
}
```

This blocks inline scripts, external resources, and iframe embedding.

---

## CSRF & XSS Protection

### CSRF

- NextAuth includes built-in CSRF protection via double-submit cookie pattern
- All POST/PUT/DELETE requests include CSRF tokens
- SameSite cookies set to `Lax` (default in NextAuth)
- Never expose mutation endpoints without CSRF protection

### XSS

- React's JSX escapes output by default (auto-escapes `{...}` expressions)
- Never use `dangerouslySetInnerHTML`
- CSP header blocks inline scripts
- No user-generated content rendered as HTML
- All URLs validated before redirect

---

## Environment Variable Security

### Required Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Session encryption key |
| `NEXTAUTH_URL` | Application base URL |
| `RESEND_API_KEY` | Email service API key |
| `UPSTASH_REDIS_REST_URL` | Rate limiting (if using Upstash) |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting auth |

### Rules

- Secrets must only exist in `.env.local` or Vercel environment variables
- Never hardcode secrets in source code
- Never commit `.env.local` to version control
- Never expose secrets in frontend code or API responses
- Validate environment variables at startup

```ts
// Validate env vars at startup
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().startsWith("re_"),
})

export const env = envSchema.parse(process.env)
```

---

## Logging Rules

**Never log:**

- passwords (plain or hashed)
- tokens (verification or reset)
- secrets (API keys, session secrets)
- session cookies
- complete request bodies

### Safe Logging

```ts
// Good
console.log(`Login attempt from IP: ${sanitizedIp}`)
console.log(`Password reset requested for user: ${userId}`)

// Bad
console.log(`Login attempt: ${JSON.stringify(req.body)}`)  // may contain password
console.log(`Reset token: ${token}`)                        // exposes token
```

**Log only:**

- action type (login, signup, reset)
- timestamp
- sanitised identifier (user ID, never email in error logs)
- outcome (success or failure type — but no details)

---

## Deployment Security

### Pre-Deployment Verification

- [ ] Environment variables exist in Vercel dashboard
- [ ] No secrets committed to repository
- [ ] `.env.local` in `.gitignore`
- [ ] Auth flows work end-to-end in production
- [ ] Tokens expire correctly (verify with test)
- [ ] Rate limiting functions in production
- [ ] Security headers present in response
- [ ] HTTPS enforced (Vercel default)
- [ ] Generic error messages used everywhere
- [ ] No console.log leaking sensitive data
- [ ] Email sending works (Resend API key valid)
- [ ] Redirect flows are correct (no redirect loops)

---

## Security Checklist

### Authentication

- [ ] Passwords hashed with bcryptjs, 12 rounds
- [ ] Login returns generic error messages
- [ ] Rate limiting on login and forgot-password
- [ ] Session validated on every protected route
- [ ] CSRF protection enabled

### Email Verification

- [ ] Tokens generated with crypto.randomBytes
- [ ] Tokens expire after 15 minutes
- [ ] Tokens deleted after successful verification
- [ ] Expired tokens return safe error

### Password Reset

- [ ] Tokens expire after 1 hour
- [ ] Tokens are single-use
- [ ] Tokens deleted after password change
- [ ] Generic error on invalid/expired token

### Data Protection

- [ ] No plain text passwords stored
- [ ] No secrets in source code
- [ ] Environment variables validated at startup
- [ ] No sensitive data in logs

### HTTP Security

- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy set
- [ ] Content-Security-Policy set
- [ ] HSTS enabled
- [ ] HTTPS enforced

---

## Final Rule

Security is not a feature.

**It is the foundation of SecureGate.**
