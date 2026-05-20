import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY ?? "")

const APP_URL = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"

type SendVerificationEmailProps = {
  email: string
  name: string
  token: string
}

type SendPasswordResetEmailProps = {
  email: string
  name: string
  token: string
}

export async function sendVerificationEmail({
  email,
  name,
  token,
}: SendVerificationEmailProps) {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`

  try {
    const { error: sendError } = await resend.emails.send({
      from: "SecureGate <onboarding@resend.dev>",
      to: email,
      subject: "Verify your SecureGate account",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 480px; margin: 0 auto;">
            <h1 style="font-size: 1.25rem; margin-bottom: 0.5rem;">SecureGate</h1>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">Hi ${name},</p>
            <p style="margin-bottom: 1.5rem;">
              Click the link below to verify your email. This link expires in 15 minutes.
            </p>
            <a
              href="${verificationUrl}"
              style="display: inline-block; background-color: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 500;"
            >
              Verify email
            </a>
            <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 1rem;">
              If you did not create an account, you can safely ignore this email.
            </p>
          </body>
        </html>
      `,
    })

    if (sendError) {
      console.error("Resend API returned an error:", sendError)
      console.log(`\nVerification URL: ${verificationUrl}\n`)
    }
  } catch (error) {
    console.error("Failed to send verification email:", error)
    console.log(`\nVerification URL: ${verificationUrl}\n`)
  }
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: SendPasswordResetEmailProps) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  try {
    const { error: sendError } = await resend.emails.send({
      from: "SecureGate <onboarding@resend.dev>",
      to: email,
      subject: "Reset your SecureGate password",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 480px; margin: 0 auto;">
            <h1 style="font-size: 1.25rem; margin-bottom: 0.5rem;">SecureGate</h1>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">Hi ${name},</p>
            <p style="margin-bottom: 1.5rem;">
              Click the link below to reset your password. This link expires in 1 hour.
            </p>
            <a
              href="${resetUrl}"
              style="display: inline-block; background-color: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 500;"
            >
              Reset password
            </a>
            <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 1rem;">
              If you did not request this, you can safely ignore this email.
            </p>
          </body>
        </html>
      `,
    })

    if (sendError) {
      console.error("Resend API returned an error:", sendError)
      console.log(`\nPassword reset URL: ${resetUrl}\n`)
    }
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    console.log(`\nPassword reset URL: ${resetUrl}\n`)
  }
}
