type CharacterType = "upper" | "lower" | "number" | "special"

function getTypes(password: string): Set<CharacterType> {
  const types = new Set<CharacterType>()
  if (/[A-Z]/.test(password)) types.add("upper")
  if (/[a-z]/.test(password)) types.add("lower")
  if (/[0-9]/.test(password)) types.add("number")
  if (/[^A-Za-z0-9]/.test(password)) types.add("special")
  return types
}

function getStrength(password: string): { level: "weak" | "fair" | "strong" } {
  const types = getTypes(password)
  const typeCount = types.size

  if (password.length < 8 || typeCount <= 1) return { level: "weak" }
  if (password.length >= 8 && typeCount >= 2 && password.length < 12) return { level: "fair" }
  if (password.length >= 12 && typeCount >= 3) return { level: "strong" }
  if (password.length >= 12 && typeCount === 2) return { level: "fair" }

  return { level: "weak" }
}

const levelColors = {
  weak: "var(--color-error)",
  fair: "var(--color-warning)",
  strong: "var(--color-success)",
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null

  const { level } = getStrength(password)

  return (
    <p
      className="mt-2 text-xs font-medium capitalize transition-colors"
      style={{ color: levelColors[level] }}
    >
      Password strength: {level}
    </p>
  )
}
