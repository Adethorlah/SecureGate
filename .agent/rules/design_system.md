# DESIGN_SYSTEM.md — SecureGate Design System Rules

## Design Philosophy

SecureGate is a security-focused authentication application.

The design should communicate:

- trust
- clarity
- simplicity
- reliability
- professionalism

Not entertainment.

---

## Table of Contents

1. [Core UX Principles](#core-ux-principles)
2. [Design Tokens](#design-tokens)
3. [Layout Rules](#layout-rules)
4. [Component Design](#component-design)
5. [Form Design Rules](#form-design-rules)
6. [Password UX](#password-ux)
7. [Error Message Rules](#error-message-rules)
8. [Loading States](#loading-states)
9. [Accessibility Rules](#accessibility-rules)
10. [Mobile Responsiveness](#mobile-responsiveness)
11. [Dashboard Rules](#dashboard-rules)
12. [Email Design Rules](#email-design-rules)
13. [Accessibility Compliance Checklist](#accessibility-compliance-checklist)
14. [Final Rule](#final-rule)

---

## Core UX Principles

### 1. Clarity Over Creativity

Authentication flows must feel:

- obvious
- predictable
- calm
- easy to understand

Avoid experimental UX. Users should never have to guess what to do next.

### 2. Reduce Cognitive Load

Every screen should focus on **one action**.

| Screen | Primary Action |
|---|---|
| `/signup` | Create account |
| `/login` | Sign in |
| `/forgot-password` | Request reset link |
| `/reset-password` | Set new password |
| `/verify-email` | Confirm email |
| `/dashboard` | View protected content |

Avoid clutter — no secondary actions, no promotional content, no sidebar distractions.

### 3. Fast Interaction

Forms should:

- load quickly
- respond immediately to input
- show loading states during submission
- show validation feedback instantly (not just on submit)
- prevent double submissions

---

## Design Tokens

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#ffffff` | Page background |
| `--color-surface` | `#f9fafb` | Card / input background |
| `--color-border` | `#e5e7eb` | Borders, dividers |
| `--color-text-primary` | `#111827` | Headings, primary text |
| `--color-text-secondary` | `#6b7280` | Labels, placeholders, hints |
| `--color-accent` | `#2563eb` | Buttons, links, active states |
| `--color-accent-hover` | `#1d4ed8` | Hover state for accent |
| `--color-error` | `#dc2626` | Error messages, error borders |
| `--color-success` | `#16a34a` | Success states, verified badges |
| `--color-warning` | `#d97706` | Warning / weak password |

### Spacing Scale

| Token | Value |
|---|---|
| `--space-xs` | `0.25rem` (4px) |
| `--space-sm` | `0.5rem` (8px) |
| `--space-md` | `1rem` (16px) |
| `--space-lg` | `1.5rem` (24px) |
| `--space-xl` | `2rem` (32px) |
| `--space-2xl` | `3rem` (48px) |

### Typography

| Token | Value | Usage |
|---|---|---|
| `--font-family` | `Inter, system-ui, sans-serif` | All text |
| `--font-size-sm` | `0.875rem` | Labels, hints |
| `--font-size-base` | `1rem` | Body text, input values |
| `--font-size-lg` | `1.25rem` | Card titles |
| `--font-size-xl` | `1.5rem` | Page headings |
| `--font-size-2xl` | `1.875rem` | Primary heading (signup/login) |
| `--line-height` | `1.5` | Body text |
| `--font-weight-normal` | `400` | Body |
| `--font-weight-medium` | `500` | Labels, buttons |
| `--font-weight-semibold` | `600` | Headings |

### Border Radius

| Token | Value |
|---|---|
| `--radius-sm` | `0.25rem` (4px) — inputs |
| `--radius-md` | `0.5rem` (8px) — cards, buttons |
| `--radius-lg` | `0.75rem` (12px) — auth card container |

### Breakpoints

| Name | Value |
|---|---|
| Mobile | `< 640px` |
| Tablet | `640px - 1024px` |
| Desktop | `> 1024px` |

---

## Layout Rules

- Use centred auth cards with generous spacing
- Card max-width: `400px` (auth screens), `480px` (dashboard)
- Card padding: `--space-xl` (`2rem`)
- Card shadow: subtle (`0 1px 3px rgba(0,0,0,0.1)`)
- Background: solid light (`--color-bg`) — no patterns, gradients, or illustrations
- Vertical centering: flexbox on full-viewport-height container

```tsx
// Layout structure
<main className="flex min-h-screen items-center justify-center bg-white px-4">
  <div className="w-full max-w-[400px] rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
    {/* auth form content */}
  </div>
</main>
```

---

## Component Design

### Buttons

| State | Style |
|---|---|
| Default | Solid accent background, white text, `--radius-md` |
| Hover | Slightly darker accent (`--color-accent-hover`) |
| Focus | Ring outline (`ring-2 ring-blue-500`) |
| Disabled | Muted background, cursor not allowed |
| Loading | Spinner replaces text, button disabled |

```tsx
<button
  disabled={isLoading}
  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:cursor-not-allowed disabled:opacity-50"
>
  {isLoading ? <Spinner /> : "Sign in"}
</button>
```

### Input Fields

| State | Style |
|---|---|
| Default | White background, `--color-border`, `--radius-sm` |
| Focus | Blue border, ring outline, no shadow |
| Error | Red border, red error text below |
| Disabled | Muted background, muted text |
| With value | Normal styling, placeholder hidden on focus |

```tsx
<input
  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
    focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
    aria-invalid:border-red-500 aria-invalid:ring-red-500"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
```

### Links

- Accent color (`--color-accent`)
- Underline on hover only
- Focus ring for keyboard navigation
- Never use `target="_blank"` without `rel="noopener noreferrer"`

### Auth Card

- Centered vertically and horizontally
- Rounded corners (`--radius-lg`)
- Subtle border and shadow
- Top: logo / app name (text only, no image)
- Middle: form content
- Bottom: navigation links (e.g., "Don't have an account? Sign up")

---

## Form Design Rules

All forms must include:

- `<label>` elements (never rely on placeholders alone)
- Placeholders where useful (e.g., `name@example.com` for email)
- Inline validation messages below the relevant field
- Loading states on submit button
- Disabled submit state (during loading or if form is invalid)

**Form structure template:**

```tsx
<form onSubmit={handleSubmit} noValidate>
  <div>
    <label htmlFor="email">Email</label>
    <input id="email" type="email" ... />
    {error && <p role="alert">{error}</p>}
  </div>
  <button type="submit" disabled={isLoading}>
    {isLoading ? <Spinner /> : "Submit"}
  </button>
</form>
```

---

## Password UX

Password fields must support:

- Visibility toggle (eye icon to show/hide password)
- Strength indicator below the field
- Clear validation messaging

### Strength Indicator

| Score | Label | Color |
|---|---|---|
| 0-2 | Weak | Red (`--color-error`) |
| 3 | Fair | Yellow (`--color-warning`) |
| 4-5 | Strong | Green (`--color-success`) |

**Rules:**

- Show indicator only after user starts typing
- Update in real-time as the user types
- Never display the actual password value
- Always show a visual progress bar (not just text)

---

## Error Message Rules

Error messages must be:

- short (one line)
- clear (user can understand the problem)
- non-technical (no jargon, no error codes)
- safe (no internal details leaked)

**Good:**

- "Invalid email or password"
- "Password must be at least 8 characters"
- "Please enter a valid email address"
- "This link has expired. Please request a new one."

**Bad:**

- "PrismaClientKnownRequestError"
- "ECONNREFUSED"
- "Token validation failed at line 42"
- "User not found in database"

Errors must be displayed inline (next to the relevant field) and via `role="alert"` for screen readers.

---

## Loading States

Every async action must show:

- Loading spinner inside the submit button
- Button disabled during loading
- Prevent duplicate submissions (button remains disabled)

**Never:**

- Use full-page loaders for form submissions
- Block the entire UI during loading
- Use toast notifications for inline form errors

---

## Accessibility Rules

All forms must include:

- `<label>` elements linked to inputs via `htmlFor`/`id`
- Keyboard accessibility (Tab through all fields, Enter to submit)
- Visible focus states (ring outline, not `outline: none` alone)
- Readable contrast (WCAG AA minimum — 4.5:1 for text)

**Specific requirements:**

- Error messages use `role="alert"`
- Loading states announce via `aria-live="polite"`
- Password visibility toggle has `aria-label="Show password"` / `"Hide password"`
- Links are distinguishable from surrounding text (underline on hover + color)
- Focus order follows visual order (top to bottom, left to right)

---

## Mobile Responsiveness

SecureGate must work well on mobile, tablet, and desktop.

### Mobile (`< 640px`)

- Full-width auth card with `px-4` gutters
- No side-by-side layouts
- Touch-friendly targets (min 44px tap area)
- Stack form fields vertically

### Tablet (`640px - 1024px`)

- Centered auth card at `max-w-[400px]`
- Comfortable padding

### Desktop (`> 1024px`)

- Same centered layout
- Additional whitespace feels natural, not empty

**Testing checklist:**

- [ ] All forms usable at 320px width
- [ ] No horizontal scroll
- [ ] Touch targets at least 44x44px
- [ ] Font size at least 16px on inputs (prevents iOS zoom)

---

## Dashboard Rules

The dashboard should remain **minimal**.

It only exists to demonstrate:

- protected routes
- authenticated access
- verification checks

**What the dashboard includes:**

- Welcome message with user name
- Signed in email display
- Logout button
- Minimal content area (placeholder)

**What the dashboard avoids:**

- Charts / graphs / analytics
- Activity feeds
- Notification panels
- Sidebars with multiple sections
- Settings pages

The dashboard is a proof of protected access, not a feature.

---

## Email Design Rules

Verification and reset emails should be:

- simple (plain structure, no complex layouts)
- lightweight (minimal HTML, no images)
- readable (large enough text, good contrast)
- trustworthy (clean design, clear sender name)

**Structure:**

```
[App Name]

Hi [name],

[One sentence about the action]

[Button: Verify email / Reset password]

This link expires in [time].

If you did not request this, you can safely ignore this email.

— SecureGate
```

**Rules:**

- No marketing-style design
- No tracking pixels
- No external images or assets
- Plain text alternative required
- Single call-to-action button
- Link expiry clearly stated
- Sender name: "SecureGate" (not a person's name)

---

## Accessibility Compliance Checklist

- [ ] All inputs have associated `<label>` elements
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 large text)
- [ ] Error messages use `role="alert"`
- [ ] Loading states announced via `aria-live`
- [ ] Keyboard navigation works end-to-end
- [ ] Password visibility toggle has clear aria labels
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Form submission prevented when loading
- [ ] Focus moves to first error on validation failure

---

## Final Rule

A user should never feel confused about:

- what is happening
- what failed
- what to do next

If the UI requires explanation, it needs to be simpler.
