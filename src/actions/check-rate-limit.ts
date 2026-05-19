"use server"

import { rateLimit } from "@/lib/rate-limit"
import type { ActionResult } from "@/types"

export async function checkRateLimit(email: string): Promise<ActionResult> {
  const { allowed } = await rateLimit(`login:${email}`, {
    limit: 5,
    window: 600,
  })

  if (!allowed) {
    return { error: "Too many attempts. Please try again later." }
  }

  return { success: true }
}
