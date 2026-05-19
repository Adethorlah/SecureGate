"use server"

import { prisma } from "@/lib/prisma"
import { verifyEmailSchema } from "@/lib/validation"
import type { ActionResult } from "@/types"

export async function verifyEmail(token: string): Promise<ActionResult> {
  const parsed = verifyEmailSchema.safeParse({ token })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  try {
    const storedToken = await prisma.verificationToken.findUnique({
      where: { token: parsed.data.token },
    })

    if (!storedToken || storedToken.expires < new Date()) {
      if (storedToken) {
        await prisma.verificationToken.delete({
          where: { id: storedToken.id },
        })
      }
      return { error: "This verification link is invalid or has expired." }
    }

    await prisma.user.update({
      where: { email: storedToken.email },
      data: { emailVerified: new Date() },
    })

    await prisma.verificationToken.delete({
      where: { id: storedToken.id },
    })

    return { success: true }
  } catch (error) {
    console.error("Verify email error:", error)
    return { error: "Something went wrong. Please try again later." }
  }
}
