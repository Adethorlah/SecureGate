# DB_MIGRATION.md — SecureGate Database & Migration Rules

## Purpose

This document defines how database schema design and migrations should be handled inside SecureGate.

The database should remain:

- minimal
- secure
- predictable
- maintainable

Avoid unnecessary complexity.

---

## Table of Contents

1. [Core Database Philosophy](#core-database-philosophy)
2. [Required Models](#required-models)
3. [Prisma Schema](#prisma-schema)
4. [User Model Rules](#user-model-rules)
5. [VerificationToken Rules](#verificationtoken-rules)
6. [PasswordResetToken Rules](#passwordresettoken-rules)
7. [Index Strategy](#index-strategy)
8. [Migration Workflow](#migration-workflow)
9. [Migration Safety Rules](#migration-safety-rules)
10. [Environment Variable Rules](#environment-variable-rules)
11. [Local Development Rules](#local-development-rules)
12. [Common Pitfalls](#common-pitfalls)
13. [Security Rules](#security-rules)
14. [Final Rule](#final-rule)

---

## Core Database Philosophy

The database exists to support:

- authentication
- verification
- password recovery
- session integrity

Nothing more.

If a model does not support one of these four concerns, **it probably should not exist.**

---

## Required Models

Only three models:

| Model | Purpose |
|---|---|
| `User` | Store user identity and credentials |
| `VerificationToken` | Email verification flow |
| `PasswordResetToken` | Password reset flow |

**Do not add:**

- Profile models
- Session models (NextAuth handles this)
- Audit logs
- API key models
- Preference / settings models

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  hashedPassword String
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model VerificationToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime
  createdAt DateTime @default(now())

  @@index([email])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime
  createdAt DateTime @default(now())

  @@index([email])
}
```

---

## User Model Rules

### Fields

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `name` | `String` | Required | Display name |
| `email` | `String` | `@unique`, Required | Login identifier |
| `hashedPassword` | `String` | Required | bcrypt hash only |
| `emailVerified` | `DateTime?` | Nullable | Null = unverified |
| `createdAt` | `DateTime` | `@default(now())` | Timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Timestamp |

### Rules

- **Never store plain passwords** — only bcrypt hashes in `hashedPassword`
- `emailVerified` is `null` until user verifies — no separate `isVerified` boolean
- `email` is unique — enforced at database level with `@unique`
- No additional fields unless they support auth concerns

### What NOT to Add

❌ `role` — no RBAC
❌ `image` — no profile pictures
❌ `phone` — no phone auth
❌ `lastLoginAt` — not required for scope
❌ `status` — no account status enum
❌ `twoFactorSecret` — no 2FA (out of scope)

---

## VerificationToken Rules

### Fields

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `email` | `String` | Required | Target user |
| `token` | `String` | `@unique`, Required | Crypto token |
| `expires` | `DateTime` | Required | Expiry timestamp |
| `createdAt` | `DateTime` | `@default(now())` | Timestamp |

### Rules

| Rule | Value |
|---|---|
| Generation | `crypto.randomBytes(32).toString("hex")` |
| Expiry | **15 minutes** from creation |
| Single-use | Deleted after successful verification |
| Reuse | Never allowed |
| Index | `@@index([email])` for lookup performance |

### Token Lifecycle

```
Create → Store in DB → Send via email →
  User clicks →
    ├── Token found + not expired → delete token → verify user
    ├── Token found + expired → delete token → return error
    └── Token not found → return error
```

---

## PasswordResetToken Rules

### Fields

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `email` | `String` | Required | Target user |
| `token` | `String` | `@unique`, Required | Crypto token |
| `expires` | `DateTime` | Required | Expiry timestamp |
| `createdAt` | `DateTime` | `@default(now())` | Timestamp |

### Rules

| Rule | Value |
|---|---|
| Generation | `crypto.randomBytes(32).toString("hex")` |
| Expiry | **1 hour** from creation |
| Single-use | Deleted after successful password reset |
| Reuse | Never allowed |
| Index | `@@index([email])` for lookup performance |

### Token Lifecycle

```
Create → Store in DB → Send via email →
  User clicks →
    ├── Token found + not expired → delete token → update password
    ├── Token found + expired → delete token → return error
    └── Token not found → return error
```

---

## Index Strategy

```prisma
model VerificationToken {
  // ...
  @@index([email])
  @@index([token])   // auto from @unique
}

model PasswordResetToken {
  // ...
  @@index([email])
  @@index([token])   // auto from @unique
}
```

### Rationale

| Query | Index Needed |
|---|---|
| Find user by email | `@unique` on User.email |
| Find token by value | `@unique` on Token.token |
| Find tokens by email (cleanup) | `@@index([email])` on both token models |

No additional indexes needed for this scope. Do not prematurely optimise.

---

## Migration Workflow

### Standard Flow

```bash
# 1. Edit schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_user_model

# 3. Generate Prisma Client
npx prisma generate

# 4. Verify migration
npx prisma migrate status

# 5. Inspect database
npx prisma studio
```

### Production Flow

```bash
# Generate migration without applying
npx prisma migrate dev --create-only --name add_user_model

# Apply migration in production
npx prisma migrate deploy
```

### Reset (Development Only)

```bash
# WARNING: Drops all data
npx prisma migrate reset
```

---

## Migration Safety Rules

### Before Running Migrations

- [ ] Schema is reviewed and correct
- [ ] `DATABASE_URL` environment variable is set
- [ ] Database server is reachable (`prisma db push --dry-run`)
- [ ] No uncommitted migration files from previous attempts
- [ ] You know whether this is dev (`migrate dev`) or prod (`migrate deploy`)

### After Migration

- [ ] Inspect tables manually (`prisma studio` or SQL client)
- [ ] Confirm field types match the schema
- [ ] Confirm `@unique` constraints exist
- [ ] Confirm indexes exist (`@@index`)
- [ ] Confirm `@default` values are set correctly
- [ ] Run a test query (insert and select a row)
- [ ] Confirm app still starts (`npm run dev`)

### Migration Commands Reference

| Command | When to Use |
|---|---|
| `prisma migrate dev` | Development — creates and applies migration |
| `prisma migrate dev --create-only` | Development — creates migration file without applying |
| `prisma migrate deploy` | Production — applies pending migrations |
| `prisma migrate reset` | Development — drops DB, recreates, reapplies all migrations |
| `prisma migrate status` | Both — shows migration state |
| `prisma db push` | Development — syncs schema without migration files |
| `prisma generate` | Both — regenerates Prisma Client |

---

## Environment Variable Rules

```env
# Required
DATABASE_URL="postgresql://user:password@host:port/database"

# Never commit this file
```

### Rules

- `DATABASE_URL` must be set in `.env.local` (development) and Vercel (production)
- Never hardcode database credentials in source code
- Never commit `.env.local` to version control
- Connection string must use environment variable, not hardcoded value
- Use a read-only user for local inspection if possible

---

## Local Development Rules

### Verification Steps

Use Prisma Studio or a SQL client to:

- [ ] Inspect users table — confirm hashed passwords look like bcrypt hashes (start with `$2a$` or `$2b$`)
- [ ] Confirm token creation — check VerificationToken and PasswordResetToken tables
- [ ] Confirm token deletion after use — verify tokens are removed after successful verification/reset
- [ ] Confirm `emailVerified` is set — check non-null DateTime after verification
- [ ] Confirm `emailVerified` is null — for unverified users
- [ ] Confirm `@unique` constraint works — try inserting duplicate email

### Why Manual Verification Matters

> "Prisma schema is not the database itself."
>
> Migrations affect real database structure. Always verify that the actual database matches what the schema describes. ORM abstractions can hide differences between the schema file and the real database state.

---

## Common Pitfalls

### 1. Token Stored Plain Text

```prisma
// ❌ Token stored as-is — vulnerable if DB is compromised
token String @unique

// ✓ Token is cryptographically generated and single-use
// Storage in plain text is acceptable for single-use tokens
// with short expiry, but consider hashing for defence-in-depth
```

### 2. Missing Index

```prisma
// ❌ No index on email — slow lookups at scale
model VerificationToken {
  email String
  // ...
}

// ✓ Index on frequently queried field
model VerificationToken {
  email String
  // ...
  @@index([email])
}
```

### 3. Soft Delete Instead of Hard Delete

```prisma
// ❌ Soft delete — used tokens remain in DB, can be abused
model VerificationToken {
  deletedAt DateTime?
}

// ✓ Hard delete — token is gone after use
// (delete the record in the same transaction as the verification)
```

### 4. Wrong Expiry Type

```prisma
// ❌ String expiry — no DB-level validation
expires String

// ✓ DateTime — DB enforces type, can compare natively
expires DateTime
```

### 5. Missing Unique Constraint on Token

```prisma
// ❌ No unique constraint — duplicate tokens possible
token String

// ✓ Unique constraint — ensures token uniqueness
token String @unique
```

---

## Security Rules

- Sensitive data must never leak into logs
- Passwords (`hashedPassword`) must never appear in frontend responses
- Token values must never appear in frontend responses (only "success" / "error")
- Database errors must never be exposed to the client
- Connection strings must never be committed
- Token tables must be cleaned up: delete expired tokens periodically or on-access

### Prisma Query Safety

```ts
// Good — select only needed fields
const user = await prisma.user.findUnique({
  where: { email },
  select: { id: true, name: true, email: true, emailVerified: true },
})

// Bad — returns all fields including hashedPassword
const user = await prisma.user.findUnique({
  where: { email },
})
```

Always use `select` to avoid accidentally exposing `hashedPassword` or other sensitive fields in API responses.

---

## Final Rule

The database should remain simple enough to reason about quickly during debugging and reflection analysis.

If you cannot explain a model or migration in one sentence, **it is probably too complex.**
