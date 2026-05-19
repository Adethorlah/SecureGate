import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Authenticated + verified users trying to access auth pages → redirect to dashboard
    if (token && token.emailVerified) {
      if (
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password"
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    // Authenticated but unverified → redirect to verify-email
    if (token && !token.emailVerified) {
      if (pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/verify-email", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname

        // Public routes — always allowed
        if (
          pathname === "/login" ||
          pathname === "/signup" ||
          pathname === "/forgot-password" ||
          pathname === "/reset-password" ||
          pathname === "/verify-email" ||
          pathname === "/" ||
          pathname.startsWith("/api/auth")
        ) {
          return true
        }

        // Protected routes — require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
