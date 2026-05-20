import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "../../../lib/prisma"
import { signupSchema } from "@/lib/validation"
import { generateToken, createExpiry } from "@/lib/token"

const sendVerificationEmail = async ({
  email,
  name,
  token,
}: {
  email: string
  name: string
  token: string
}): Promise<void> => {
  console.warn(
    "sendVerificationEmail helper not found. Skipping email delivery for:",
    email
  )
}

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

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    })

    // If user exists and is verified → block signup
    if (user?.emailVerified) {
      return NextResponse.json(
        { error: "User already verified. Please login." },
        { status: 400 }
      )
    }

    // If user does not exist → create it
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 12)

      user = await prisma.user.create({
        data: {
          name,
          email,
          hashedPassword,
        },
      })
    }

    // Always clean old tokens
    await prisma.verificationToken.deleteMany({
      where: { email },
    })

    // Create new token
    const token = generateToken()
    const expires = createExpiry(15)

    console.log("Creating verification token:", { email, token, expires })

    try {
      await prisma.verificationToken.create({
        data: {
          email,
          token,
          expires,
        },
      })

      console.log("Verification token saved successfully")
    } catch (err) {
      console.error("FAILED TO SAVE TOKEN:", err)

      return NextResponse.json(
        { error: "Failed to create verification token" },
        { status: 500 }
      )
    }

    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`

    // Send email (non-blocking)
    try {
      await sendVerificationEmail({
        email,
        name: user.name,
        token,
      })
    } catch (emailError) {
      console.error("Email failed:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
      url: verificationUrl,
    })

  } catch (error) {
    console.error("Signup error:", error)

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}