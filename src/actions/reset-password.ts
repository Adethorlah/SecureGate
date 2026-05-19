"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { resetPasswordSchema } from "@/lib/validation"
import type { ActionResult } from "@/types"

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { token, password } = parsed.data

  try {
    const storedToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!storedToken || storedToken.expires < new Date()) {
      if (storedToken) {
        await prisma.passwordResetToken.delete({
          where: { id: storedToken.id },
        })
      }
      return {
        error: "This password reset link is invalid or has expired.",
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email: storedToken.email },
      data: { hashedPassword },
    })

    await prisma.passwordResetToken.delete({
      where: { id: storedToken.id },
    })

    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return { error: "Something went wrong. Please try again later." }
  }
}
