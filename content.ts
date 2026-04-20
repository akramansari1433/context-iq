import { extractBodyText, extractHeadings } from "./lib/extract-content"
import type { PageContext } from "./lib/types"

// ── Editable selection tracking ──────────────────────────────────────────────

interface EditableState {
  element: HTMLInputElement | HTMLTextAreaElement
  selectionStart: number
  selectionEnd: number
}

let lastEditableState: EditableState | null = null

function captureEditableSelection() {
  const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement
  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    if (start !== end) {
      lastEditableState = {
        element: el,
        selectionStart: start,
        selectionEnd: end
      }
    }
  }
}

// Capture on mouseup (after drag-select) and keyup (after shift+arrow select)
document.addEventListener("mouseup", captureEditableSelection)
document.addEventListener("keyup", captureEditableSelection)

// ── Page context extraction ──────────────────────────────────────────────────

function getPageContext(): PageContext {
  const url = window.location.href

  // Prefer editable selection if available, otherwise page selection
  let selectedText = window.getSelection()?.toString().trim() ?? ""
  let isEditableSelection = false

  if (lastEditableState) {
    const { element, selectionStart, selectionEnd } = lastEditableState
    const editableSelected = element.value
      .slice(selectionStart, selectionEnd)
      .trim()
    if (editableSelected) {
      selectedText = editableSelected
      isEditableSelection = true
    }
  }

  return {
    title: document.title,
    url,
    domain: new URL(url).hostname,

    bodyText: extractBodyText(),
    headings: extractHeadings(),
    selectedText,
    metaDescription:
      (document.querySelector('meta[name="description"]') as HTMLMetaElement)
        ?.content ?? "",
    isEditableSelection
  }
}

// ── Message handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_CONTEXT") {
    sendResponse({ success: true, data: getPageContext() })
    return true
  }

  if (message.type === "REPLACE_SELECTED_TEXT") {
    if (!lastEditableState) {
      sendResponse({
        success: false,
        error:
          "No editable selection tracked. Select text in an input or textarea first."
      })
      return true
    }

    const { element, selectionStart, selectionEnd } = lastEditableState
    const newText = message.text as string
    const original = element.value

    // Replace just the selected range with the new text
    element.value =
      original.slice(0, selectionStart) + newText + original.slice(selectionEnd)

    // Move cursor to end of inserted text
    element.selectionStart = selectionStart
    element.selectionEnd = selectionStart + newText.length
    element.focus()

    // Trigger framework event listeners (React, Vue, Angular all listen to these)
    element.dispatchEvent(new Event("input", { bubbles: true }))
    element.dispatchEvent(new Event("change", { bubbles: true }))

    // Keep state pointing to the element with the new selection so chained replaces work
    lastEditableState = {
      element,
      selectionStart,
      selectionEnd: selectionStart + newText.length
    }
    sendResponse({ success: true })
    return true
  }

  return true
})
