import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

type RateLimitConfig = {
  limit: number
  window: number
}

// Fallback in-memory store for local development if Redis is not configured
const memoryStore = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })

    const ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.window} s`),
      analytics: true,
    })

    const { success, remaining } = await ratelimit.limit(identifier)
    return { allowed: success, remaining }
  }

  // Fallback to in-memory rate limiting
  console.warn("Using in-memory rate limiter because Upstash Redis is not configured.")
  
  const now = Date.now()
  const entry = memoryStore.get(identifier)

  if (!entry || entry.resetAt < now) {
    memoryStore.set(identifier, { count: 1, resetAt: now + config.window * 1000 })
    return { allowed: true, remaining: config.limit - 1 }
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: config.limit - entry.count }
}
