function getStrength(password: string): { level: "weak" | "fair" | "strong"; score: number } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { level: "weak", score }
  if (score <= 3) return { level: "fair", score }
  return { level: "strong", score }
}

const colors = {
  weak: "var(--color-error)",
  fair: "var(--color-warning)",
  strong: "var(--color-success)",
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null

  const { level, score } = getStrength(password)

  return (
    <div className="space-y-1">
      <div className="h-1 w-full rounded-full bg-gray-200">
        <div
          className="h-1 rounded-full transition-all"
          style={{
            width: `${(score / 5) * 100}%`,
            backgroundColor: colors[level],
          }}
        />
      </div>
      <p className="text-xs capitalize text-[var(--color-text-secondary)]">
        {level}
      </p>
    </div>
  )
}
