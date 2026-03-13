import { describe, it, expect } from "vitest"
import { buildUserPrompt, SYSTEM_PROMPT } from "../lib/prompts"

describe("SYSTEM_PROMPT", () => {
  it("should be a non-empty string", () => {
    expect(SYSTEM_PROMPT).toBeTruthy()
    expect(typeof SYSTEM_PROMPT).toBe("string")
  })

  it("should mention JSON response format", () => {
    expect(SYSTEM_PROMPT).toContain("JSON")
  })
})

describe("buildUserPrompt", () => {
  it("should include fix_grammar instructions", () => {
    const prompt = buildUserPrompt("fix_grammar", "", "some text")
    expect(prompt).toContain("Fix grammar")
    expect(prompt).toContain("some text")
  })

  it("should include tone for rewrite intent", () => {
    const prompt = buildUserPrompt("rewrite", "", "hello", "casual")
    expect(prompt).toContain("casual")
  })

  it("should handle emojify tone for change_tone", () => {
    const prompt = buildUserPrompt("change_tone", "", "hello world", "emojify")
    expect(prompt).toContain("emojis")
  })

  it("should include page context for non-writing intents", () => {
    const prompt = buildUserPrompt("bullet_summary", "page content here", "")
    expect(prompt).toContain("page content here")
  })

  it("should NOT include page context for writing intents", () => {
    const prompt = buildUserPrompt("fix_grammar", "page content here", "selected text")
    expect(prompt).not.toContain("page content here")
  })

  it("should include user instruction when provided", () => {
    const prompt = buildUserPrompt("solve", "context", "", undefined, "use Python")
    expect(prompt).toContain("use Python")
  })

  it("should handle draft intent with user input", () => {
    const prompt = buildUserPrompt("draft", "", "", "professional", "write an email")
    expect(prompt).toContain("Draft")
    expect(prompt).toContain("write an email")
  })

  it("should end with JSON-only instruction", () => {
    const prompt = buildUserPrompt("explain", "ctx", "")
    expect(prompt).toContain("Respond ONLY with valid JSON")
  })

  it("should use larger page limit for multi_tab_summary", () => {
    const longContext = "x".repeat(15000)
    const prompt = buildUserPrompt("multi_tab_summary", longContext, "")
    // Should include more than 8000 chars (default limit)
    expect(prompt.length).toBeGreaterThan(10000)
  })
})
