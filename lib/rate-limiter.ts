const MAX_REQUESTS = 10
const WINDOW_MS = 60_000 // 1 minute
const STORAGE_KEY = "contextiq_rate_timestamps"

async function getTimestamps(): Promise<number[]> {
  try {
    const result = await chrome.storage.session.get(STORAGE_KEY)
    return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []
  } catch {
    return []
  }
}

async function setTimestamps(timestamps: number[]): Promise<void> {
  try {
    await chrome.storage.session.set({ [STORAGE_KEY]: timestamps })
  } catch {
    // storage.session unavailable — silently allow
  }
}

export async function checkRateLimit(): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const now = Date.now()
  const timestamps = (await getTimestamps()).filter((t) => t > now - WINDOW_MS)

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = timestamps[0]
    const retryAfterMs = oldestInWindow + WINDOW_MS - now
    return { allowed: false, retryAfterMs }
  }

  timestamps.push(now)
  await setTimestamps(timestamps)
  return { allowed: true }
}
