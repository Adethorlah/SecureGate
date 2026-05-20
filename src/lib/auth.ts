import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"

function getIp(req: any): string | undefined {
  if (!req?.headers) return undefined
  const h = req.headers as Record<string, string | string[] | undefined>
  const fwd = h["x-forwarded-for"]
  if (fwd) return (Array.isArray(fwd) ? fwd[0] : fwd).split(",")[0].trim()
  const real = h["x-real-ip"]
  if (real) return Array.isArray(real) ? real[0] : real
  return undefined
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("INVALID_CREDENTIALS")
        }

        const ip = getIp(req) ?? "unknown"

        const { allowed } = await rateLimit(`login:${ip}`, {
          limit: 5,
          window: 600,
        })

        if (!allowed) {
          throw new Error("TOO_MANY_REQUESTS")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            emailVerified: true,
          },
        })

        if (!user) {
          throw new Error("INVALID_CREDENTIALS")
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isValid) {
          throw new Error("INVALID_CREDENTIALS")
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.emailVerified = (user as any).emailVerified
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
  },
}
