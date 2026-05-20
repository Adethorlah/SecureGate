import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { resetPasswordSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    const storedToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!storedToken) {
      return NextResponse.json({ status: "INVALID_TOKEN" }, { status: 400 })
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: storedToken.id },
      })
      return NextResponse.json({ status: "TOKEN_EXPIRED" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email: storedToken.email },
      data: { passwordHash },
    })

    await prisma.passwordResetToken.delete({
      where: { id: storedToken.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    )
  }
}
