/**
 * Shared DOM content extraction logic.
 *
 * IMPORTANT: Functions in this file are injected into page contexts via
 * chrome.scripting.executeScript, so they must be self-contained with
 * no imports or external references.
 */

const REMOVE_SELECTORS =
  "script, style, nav, footer, aside, header, [role=banner], [role=navigation], " +
  "[role=complementary], .sidebar, .comments, .ad, .advertisement, .social-share"

const MAIN_SELECTORS = "article, main, [role=main]"

/** Extract body text from the current page. Used by content script and popup fallback. */
export function extractBodyText(charLimit = 60000): string {
  const clone = document.body.cloneNode(true) as HTMLElement
  clone.querySelectorAll(REMOVE_SELECTORS).forEach((el) => el.remove())
  const mainContent = clone.querySelector(MAIN_SELECTORS) as HTMLElement | null
  const textSource = mainContent ?? clone
  return textSource.innerText.slice(0, charLimit).trim()
}

/** Extract headings (h1–h3) from the current page. */
export function extractHeadings(): string[] {
  return Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((el) => el.textContent?.trim() ?? "")
    .filter(Boolean)
    .slice(0, 15)
}

/**
 * Extract tab content for multi-tab research mode.
 * Self-contained for chrome.scripting.executeScript injection.
 */
export function extractTabContent(charLimit: number): { title: string; content: string } {
  const clone = document.body.cloneNode(true) as HTMLElement
  clone
    .querySelectorAll(
      "script, style, nav, footer, aside, header, [role=banner], [role=navigation], " +
        "[role=complementary], .sidebar, .comments, .ad, .advertisement, .social-share"
    )
    .forEach((el) => el.remove())

  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((el) => el.textContent?.trim())
    .filter(Boolean)
    .join(" · ")

  const body = clone.innerText.trim()
  const combined = headings ? `[Topics: ${headings}]\n\n${body}` : body

  return {
    title: document.title,
    content: combined.slice(0, charLimit).trim()
  }
}
