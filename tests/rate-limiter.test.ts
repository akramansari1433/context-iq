import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock chrome.storage.session
const sessionStore: Record<string, unknown> = {}
const chromeMock = {
  storage: {
    session: {
      get: vi.fn(async (key: string) => ({ [key]: sessionStore[key] })),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(sessionStore, items)
      })
    }
  }
}
vi.stubGlobal("chrome", chromeMock)

let checkRateLimit: () => Promise<{ allowed: boolean; retryAfterMs?: number }>

beforeEach(async () => {
  vi.resetModules()
  // Clear session store between tests
  for (const key of Object.keys(sessionStore)) delete sessionStore[key]
  const mod = await import("../lib/rate-limiter")
  checkRateLimit = mod.checkRateLimit
})

describe("checkRateLimit", () => {
  it("should allow the first request", async () => {
    const result = await checkRateLimit()
    expect(result.allowed).toBe(true)
  })

  it("should allow up to 10 requests", async () => {
    for (let i = 0; i < 10; i++) {
      const result = await checkRateLimit()
      expect(result.allowed).toBe(true)
    }
  })

  it("should block the 11th request", async () => {
    for (let i = 0; i < 10; i++) {
      await checkRateLimit()
    }
    const result = await checkRateLimit()
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })
})
