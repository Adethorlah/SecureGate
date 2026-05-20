import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { emailSchema } from "@/lib/validation"
import { generateToken, createExpiry } from "@/lib/token"
import { sendVerificationEmail } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = emailSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    const { allowed } = await rateLimit(`resend-verification:${email}`, {
      limit: 3,
      window: 3600,
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
      select: { id: true, name: true, emailVerified: true },
    })

    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true })
    }

    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    })

    const token = generateToken()
    const expiresAt = createExpiry(15)

    await prisma.verificationToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    await sendVerificationEmail({ email, name: user.name ?? "", token })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    )
  }
}
