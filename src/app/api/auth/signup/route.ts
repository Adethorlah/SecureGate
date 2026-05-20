import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signupSchema } from "@/lib/validation"
import { generateToken, createExpiry } from "@/lib/token"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    })

    if (existingUser) {
      return NextResponse.json({ success: true })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true },
    })

    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    })

    const token = generateToken()
    const expiresAt = createExpiry(15)

    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    await sendVerificationEmail({
      email: user.email,
      name: user.name ?? "",
      token,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    )
  }
}
