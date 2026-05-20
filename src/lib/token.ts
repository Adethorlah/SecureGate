export function generateToken(): string {
  return crypto.randomUUID()
}

export function createExpiry(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}
