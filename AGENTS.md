# AGENTS.md

# SecureGate — AI Engineering Instructions

## Project Overview

SecureGate is a standalone authentication and account security application built for a live engineering assessment.

The goal is NOT to build a large SaaS platform.

The goal is to demonstrate:

* Secure authentication architecture
* Defensive programming
* Proper session management
* Secure token lifecycle handling
* Production-aware engineering decisions
* Clean and maintainable code structure
* Understanding of software engineering laws and principles

This project must remain intentionally focused and security-first.

---

# Core Product Scope

SecureGate includes ONLY:

* User registration
* Email verification
* Login/logout
* Password hashing
* Session handling
* Protected routes
* Forgot password flow
* Password reset flow
* Rate limiting
* Basic dashboard protection
* Secure environment variable handling

DO NOT add:

* OAuth/social login
* MFA/2FA
* Roles/permissions
* Admin systems
* Analytics
* Billing
* Chat
* Complex dashboards
* Notifications beyond required auth emails
* Feature creep of any kind

YAGNI applies strongly.

---

# Required Stack

Use only:

* Next.js 14 App Router
* TypeScript
* Prisma
* PostgreSQL
* NextAuth/Auth.js
* bcryptjs
* Zod
* Resend
* Tailwind CSS
* Vercel

Do not replace the stack unless explicitly instructed.

---

# Engineering Philosophy

## 1. Security First

Every input is untrusted.

Every endpoint is a possible attack surface.

Every token must expire.

Every password must be hashed.

Never trust client-side validation.

Never expose internal system details.

Never leak whether an email exists in the system.

Never return stack traces to users.

Always think:
"What can go wrong here?"

Murphy's Law governs this project.

---

## 2. Minimal Complexity

Prefer simple, reliable implementations over clever abstractions.

Avoid overengineering.

Avoid premature abstractions.

Avoid deep folder nesting.

Avoid unnecessary utilities unless duplication becomes meaningful.

This is an assessment project, not a production enterprise monolith.

---

## 3. Defensive Programming

Always validate:

* request body
* query params
* tokens
* sessions
* passwords
* environment variables

Use Zod for server-side validation.

Never assume data exists.

Always handle:

* expired tokens
* missing users
* deleted sessions
* malformed requests
* network failures

---

## 4. Production-Oriented Thinking

Write code as if attackers will test it.

Ensure:

* tokens are single-use
* sessions are protected
* passwords are never stored in plain text
* secrets are environment-based
* redirects are safe
* middleware is strict
* API responses are sanitized

---

# Authentication Rules

## Password Hashing

Use bcryptjs.

Required:

* bcrypt.hash(password, 12)

Never:

* store plain passwords
* log passwords
* expose password values anywhere

---

## Login Errors

Always return generic auth errors.

Correct:
"Invalid email or password"

Incorrect:

* "Email does not exist"
* "Password incorrect"

Prevent credential enumeration.

---

## Verification Tokens

Verification tokens must:

* use crypto.randomBytes()
* expire after 15 minutes
* be deleted after successful verification
* be validated server-side only

---

## Password Reset Tokens

Password reset tokens must:

* expire after 1 hour
* be single-use
* be securely generated
* be deleted after password reset

Never allow reuse.

---

## Protected Routes

/dashboard must only be accessible to:

* authenticated users
* verified users

Unauthenticated users:
redirect to /login

Authenticated but unverified users:
redirect to /verify-email

---

## Rate Limiting

Apply rate limiting to:

* login endpoint
* forgot-password endpoint

Required behavior:

* 5 attempts max
* 10 minute window

Prevent brute-force attacks.

---

# UI/UX Rules

The UI should be:

* clean
* simple
* accessible
* fast
* mobile-friendly

This is NOT a branding exercise.

Prioritize:

* usability
* clarity
* validation feedback
* loading states
* predictable flows

Required:

* accessible labels
* real validation messages
* loading indicators
* password strength indicator

Avoid:

* excessive animations
* unnecessary gradients
* decorative complexity

---

# Folder Structure Guidance

Prefer a clean structure similar to:

src/
app/
components/
lib/
actions/
prisma/
types/
emails/

Keep auth-related logic grouped logically.

Avoid scattering authentication logic across unrelated files.

---

# API & Error Handling Rules

Never expose:

* database errors
* Prisma errors
* stack traces
* secret values
* internal implementation details

Use safe fallback responses:

"Something went wrong. Please try again later."

---

# Environment Variable Rules

Use environment variables for:

* DATABASE_URL
* NEXTAUTH_SECRET
* NEXTAUTH_URL
* RESEND_API_KEY
* Upstash credentials

Never hardcode secrets.

Never commit .env.local.

Always assume the repository may become public accidentally.

---

# Middleware Rules

Middleware must:

* validate authentication
* validate verification state
* redirect safely
* avoid redirect loops
* fail safely if session is invalid

---

# Code Quality Rules

Prefer:

* readable naming
* small focused functions
* clear separation of concerns
* explicit logic

Avoid:

* giant files
* duplicated validation logic
* deeply nested conditionals
* magic strings
* silent failures

Apply the Boy Scout Rule:
leave code cleaner than you found it.

---

# Reflection Awareness

This project includes a REFLECTION.md engineering analysis.

Code should therefore be:

* explainable
* intentional
* easy to reference
* logically structured

Avoid clever code that is difficult to explain.

Every major security decision should have a clear rationale.

---

# Deployment Rules

Deployment target:
Vercel

Before deployment verify:

* environment variables exist
* auth flows work end-to-end
* email verification works
* password reset works
* protected routes redirect correctly
* rate limiting functions correctly

---

# Final Principle

SecureGate is not judged by feature quantity.

It is judged by:

* security discipline
* engineering thinking
* reliability
* defensive architecture
* clarity of implementation
* ability to explain decisions

Build narrowly.
Build carefully.
Build defensively.
