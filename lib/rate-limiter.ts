const MAX_REQUESTS = 10
const WINDOW_MS = 60_000 // 1 minute

const timestamps: number[] = []

export function checkRateLimit(): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()

  // Remove timestamps outside the sliding window
  while (timestamps.length > 0 && timestamps[0] <= now - WINDOW_MS) {
    timestamps.shift()
  }

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = timestamps[0]
    const retryAfterMs = oldestInWindow + WINDOW_MS - now
    return { allowed: false, retryAfterMs }
  }

  timestamps.push(now)
  return { allowed: true }
}
