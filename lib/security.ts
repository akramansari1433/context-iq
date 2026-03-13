const MAX_INPUT_LENGTH = 10_000

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /system\s*:\s*/i,
  /\bact\s+as\b/i,
  /forget\s+(all\s+)?(your|previous)\s+/i,
  /override\s+(system|safety|instructions)/i,
  /\bdo\s+not\s+follow\b.*\binstructions\b/i,
]

export function validateInput(text: string): { valid: boolean; reason?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: true }
  }

  if (text.length > MAX_INPUT_LENGTH) {
    return { valid: false, reason: `Input too long (${text.length} chars). Maximum is ${MAX_INPUT_LENGTH}.` }
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { valid: false, reason: "Input contains disallowed patterns." }
    }
  }

  return { valid: true }
}

export function sanitizeInput(text: string): string {
  // Strip control characters (keep newlines and tabs)
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim()
}
