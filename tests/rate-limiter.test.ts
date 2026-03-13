import { describe, it, expect, vi, beforeEach } from "vitest"

// We need to re-import fresh module for each test to reset state
let checkRateLimit: () => { allowed: boolean; retryAfterMs?: number }

beforeEach(async () => {
  vi.resetModules()
  const mod = await import("../lib/rate-limiter")
  checkRateLimit = mod.checkRateLimit
})

describe("checkRateLimit", () => {
  it("should allow the first request", () => {
    const result = checkRateLimit()
    expect(result.allowed).toBe(true)
  })

  it("should allow up to 10 requests", () => {
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit()
      expect(result.allowed).toBe(true)
    }
  })

  it("should block the 11th request", () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit()
    }
    const result = checkRateLimit()
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })
})
