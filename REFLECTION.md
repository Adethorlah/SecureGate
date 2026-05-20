# SecureGate — Engineering Reflection

## Q1: What authentication strategy did you choose and why?

**JWT sessions** (NextAuth default).

The project is deployed on Vercel, which is a serverless environment. Database-backed sessions would require a session table lookup on every request, adding latency and complexity. JWT is stateless — the token itself carries the user identity, which eliminates a database round-trip on every page load. For v1 scope (single-user, no session revocation beyond logout), JWT is the simpler, faster choice. Justification is documented in `src/lib/auth.ts`.

## Q2: How does the system prevent email enumeration?

Three specific mechanisms:

1. **Signup** (`src/app/api/auth/signup/route.ts:27-30`): If the email already exists, the API returns `{ "success": true }` — the same response as a successful new registration. No distinction is made.

2. **Forgot password** (`src/app/api/auth/forgot-password/route.ts:56-58`): The email-sending logic is wrapped inside a conditional that checks if the user exists and is verified, but the API always returns `{ "success": true }` whether or not that condition was met.

3. **Login** (`src/app/api/auth/[...nextauth]/route.ts` via `src/lib/auth.ts:52-62`): The `authorize` function throws `INVALID_CREDENTIALS` for both "user not found" and "password mismatch" — the caller cannot distinguish which one failed.

## Q3: Where does rate limiting apply and what are the limits?

Rate limiting is applied in three endpoints using an in-memory store (`src/lib/rate-limit.ts`):

| Endpoint | Identifier | Limit | Window | File |
|---|---|---|---|---|
| Login | Client IP | 5 requests | 10 minutes | `src/lib/auth.ts:33-35` |
| Forgot password | Client IP | 3 requests | 1 hour | `src/app/api/auth/forgot-password/route.ts:22-25` |
| Resend verification | Email | 3 requests | 1 hour | `src/app/api/auth/resend-verification/route.ts:22-25` |

On breach, each returns HTTP 429 with `{ "error": "TOO_MANY_REQUESTS", "message": "Too many attempts. Please try again later." }`.

The current store is in-memory (resets on server restart). A production upgrade would replace it with Upstash Redis (`@upstash/ratelimit`) using the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables already configured in `.env`.

## Q4: What happens when a user tries to sign up with an already-registered email?

The server returns `{ "success": true }` unconditionally (`src/app/api/auth/signup/route.ts:28-30`). No error message, no distinction. This prevents an attacker from determining whether a given email has an account.

## Q5: How are verification and reset tokens handled securely?

- **Generation**: `crypto.randomBytes(32).toString("hex")` — cryptographically secure 64-character hex string (`src/lib/token.ts:3-5`).
- **Expiry**: Verification tokens expire in 15 minutes; password reset tokens expire in 1 hour (`src/lib/token.ts:7-9`).
- **Single-use**: Tokens are deleted from the database immediately after successful use (`src/app/api/auth/verify-email/route.ts:62-64`, `src/app/api/auth/reset-password/route.ts:38-40`).
- **One token per user per type**: Before creating a new token, any existing token of the same type for the same user is deleted (`src/app/api/auth/signup/route.ts:39-41`, `src/app/api/auth/forgot-password/route.ts:40-42`).
- **Transport**: Tokens travel as URL query parameters. Hex encoding is URL-safe and requires no additional encoding.

## Q6: What dead code or unnecessary abstractions did you remove? (Boy Scout Rule)

During the v2 migration, the following unused code was removed — files that were either never imported, never called, or superseded by the API route pattern:

| File | Reason |
|---|---|
| `src/actions/signup.ts`, `verify-email.ts`, `login.ts`, `logout.ts`, `forgot-password.ts`, `reset-password.ts`, `check-rate-limit.ts` | 7 server actions — all never called. The frontend uses `fetch()` to API routes directly. These would drift from the route handlers over time. |
| `src/lib/env.ts` | Zod env validation — never imported anywhere. Env vars were read directly via `process.env`. |
| `src/components/forms/FormField.tsx` | Unused component — never imported. |
| `src/components/ui/Alert.tsx` | Unused component — never imported. |
| `src/components/feedback/` | Empty directory. |
| `src/emails/` | Empty directory — email templates are inline in `src/lib/email.ts`. |

These removals follow the Boy Scout Rule: leave the codebase cleaner than you found it. No feature was affected.

## Q7: How did the middleware evolve from v1 to v2, and what principle does that demonstrate? (Gall's Law)

**v1 middleware** (`src/middleware.ts` before migration):
- Used `withAuth()` callback with a large `authorized()` function containing a manual allowlist of every public route (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/`, and 6 API route prefixes).
- Had custom redirect logic for verified vs. unverified users.
- The matcher covered all routes except static assets.

**v2 middleware** (after migration):
```ts
export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/dashboard/:path*"],
}
```

This demonstrates **Gall's Law**: "A complex system that works is invariably found to have evolved from a simple system that worked." The v1 approach tried to handle all edge cases in middleware (public route allowlisting, unverified-user redirects, etc.). The v2 approach pushes that responsibility where it belongs:

- **Authentication check**: Default NextAuth middleware on `/dashboard` only — redirects to `/login` if no session.
- **Verification check**: Server-side in `src/app/dashboard/page.tsx:13-15` — redirects to `/verify-email` if `emailVerified` is null.
- **Public route access**: Not handled by middleware at all — routes are public by default.

The simpler system is more maintainable, has fewer failure modes, and each concern is handled at the correct layer.

## Q8: Why are emails constructed with full URLs instead of relative paths?

Email clients render links in isolation — they have no concept of the application's origin. A relative path like `/verify-email?token=xxx` would resolve to the email client's own domain (e.g., `https://mail.google.com/verify-email?token=xxx`), which would fail.

All email links in `src/lib/email.ts` use `APP_URL` (or `NEXTAUTH_URL` as fallback) to construct absolute URLs:
```
${APP_URL}/verify-email?token=${token}
```

This guarantees the link points to the correct deployment regardless of which email client opens it.

## Q9: What is the derived user status model and why?

There is no `UserStatus` enum. Status is derived from the `emailVerified` field:

| Derived State | Database Condition | Can log in? |
|---|---|---|
| Pending verification | `emailVerified IS NULL` | No |
| Active | `emailVerified IS NOT NULL` | Yes |

This avoids an additional column and keeps the data model aligned with NextAuth's Credentials provider, which natively works with the `emailVerified` pattern. The check in `src/lib/auth.ts:61-63` throws `EMAIL_NOT_VERIFIED` during login, and the dashboard page checks it again server-side.

## Q10: What would you change for production scale?

1. **Rate limiting**: Replace the in-memory `Map` in `src/lib/rate-limit.ts` with Upstash Redis (`@upstash/ratelimit`) to persist counts across server restarts and multiple instances.
2. **Email failover**: The current fallback (console.log with the URL) works for development but should be replaced with a retry queue or secondary email provider for production.
3. **Database connection pooling**: The Prisma client in `src/lib/prisma.ts` uses the default pool size. For Vercel serverless, this should be configured to match the concurrent invocation limit.
4. **Session revocation**: JWT sessions cannot be revoked server-side. If session revocation becomes a requirement, the system should migrate to database-backed sessions or a blocklist approach.
