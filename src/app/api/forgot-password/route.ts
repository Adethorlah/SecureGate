import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { forgotPasswordSchema } from "@/lib/validation"
import { generateToken, createExpiry } from "@/lib/token"
import { sendPasswordResetEmail } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

    const { allowed } = await rateLimit(`forgot-password:${ip}`, {
      limit: 5,
      window: 600,
    })

    if (!allowed) {
      return NextResponse.json(
        {
          error: "TOO_MANY_REQUESTS",
          message: "Too many attempts. Please try again later.",
        },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, emailVerified: true },
    })

    if (user && user.emailVerified) {
      await prisma.passwordResetToken.deleteMany({
        where: { email },
      })

      const token = generateToken()
      const expiresAt = createExpiry(60)

      await prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expiresAt,
          user: { connect: { email } },
        },
      })

      await sendPasswordResetEmail({
        email: user.email,
        name: user.name ?? "",
        token,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    )
  }
}
