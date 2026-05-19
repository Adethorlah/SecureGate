"use server"

import { prisma } from "@/lib/prisma"
import { forgotPasswordSchema } from "@/lib/validation"
import { generateToken, createExpiry } from "@/lib/token"
import { sendPasswordResetEmail } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limit"
import type { ActionResult } from "@/types"

export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email } = parsed.data

  const { allowed } = await rateLimit(`forgot-password:${email}`, {
    limit: 5,
    window: 600,
  })

  if (!allowed) {
    return {
      success: true,
      message:
        "If an account exists for this email, a reset link has been sent.",
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    })

    if (user) {
      const token = generateToken()
      const expires = createExpiry(60)

      await prisma.passwordResetToken.create({
        data: { email: user.email, token, expires },
      })

      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token,
      })
    }

    return {
      success: true,
      message:
        "If an account exists for this email, a reset link has been sent.",
    }
  } catch (error) {
    console.error("Forgot password error:", error)
    return {
      success: true,
      message:
        "If an account exists for this email, a reset link has been sent.",
    }
  }
}
