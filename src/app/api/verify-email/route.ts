import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyEmailSchema } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")

    const parsed = verifyEmailSchema.safeParse({ token })

    if (!parsed.success) {
      return NextResponse.json(
        { status: "INVALID_TOKEN", error: "Invalid verification token." },
        { status: 400 }
      )
    }

    const storedToken = await prisma.verificationToken.findUnique({
      where: { token: parsed.data.token },
      include: { user: true },
    })

    if (!storedToken) {
      return NextResponse.json(
        { status: "INVALID_TOKEN", error: "This verification link is invalid." },
        { status: 400 }
      )
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({
        where: { id: storedToken.id },
      })
      return NextResponse.json(
        { status: "TOKEN_EXPIRED", error: "This verification link has expired." },
        { status: 400 }
      )
    }

    if (storedToken.user.emailVerified) {
      await prisma.verificationToken.delete({
        where: { id: storedToken.id },
      })
      return NextResponse.json({ status: "ALREADY_VERIFIED", error: "Email already verified." })
    }

    await prisma.user.update({
      where: { id: storedToken.userId },
      data: { emailVerified: new Date() },
    })

    await prisma.verificationToken.delete({
      where: { id: storedToken.id },
    })

    return NextResponse.json({ status: "SUCCESS" })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json(
      { status: "ERROR", error: "Something went wrong. Please try again later." },
      { status: 500 }
    )
  }
}
