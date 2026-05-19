"use server"

import { loginSchema } from "@/lib/validation"
import type { ActionResult } from "@/types"

export async function login(_prevState: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  return { success: true }
}
