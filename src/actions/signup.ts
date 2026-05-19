"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signupSchema } from "@/lib/validation"
import { generateToken, createExpiry } from "@/lib/token"
import { sendVerificationEmail } from "@/lib/email"
import type { ActionResult } from "@/types"

export async function signup(formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, email, password } = parsed.data

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return { error: "Something went wrong. Please try again later." }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, hashedPassword },
      select: { id: true, name: true, email: true },
    })

    const token = generateToken()
    const expires = createExpiry(15)

    await prisma.verificationToken.create({
      data: {
        email: user.email,
        token,
        expires,
      },
    })

    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token,
    })

    return { success: true }
  } catch (error) {
    console.error("Signup error:", error)
    return { error: "Something went wrong. Please try again later." }
  }
}
