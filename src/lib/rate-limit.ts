type RateLimitConfig = {
  limit: number
  window: number
}

const store = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + config.window * 1000 })
    return { allowed: true, remaining: config.limit - 1 }
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: config.limit - entry.count }
}

setInterval(() => {
  const now = Date.now()
  store.forEach((value, key) => {
    if (value.resetAt < now) {
      store.delete(key)
    }
  })
}, 60_000)
