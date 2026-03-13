import { useState, useEffect } from "react"
import type { StructuredResult } from "../lib/types"

interface Props {
  result: StructuredResult
  activeTabId: number | null
}

// Simple heuristic: if output contains common code patterns, treat it as code
function looksLikeCode(text: string): boolean {
  const codeIndicators = [
    /^(def |class |function |const |let |var |import |from |#include|public |private )/m,
    /[{}()];?\s*$/m,
    /\b(return |if \(|for \(|while \(|=>)/,
    /^\s{2,}(def|class|for|if|while|return)\b/m,
  ]
  return codeIndicators.some((pattern) => pattern.test(text))
}

export function ResultBox({ result, activeTabId }: Props) {
  const [replaced, setReplaced] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setReplaced(false)
    setCopied(false)
  }, [result])

  const copy = () => {
    const text = result.output || result.structured?.keyPoints?.join("\n") || ""
    if (text) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const replace = () => {
    if (!result.output || !activeTabId) return
    chrome.tabs.sendMessage(
      activeTabId,
      { type: "REPLACE_SELECTED_TEXT", text: result.output },
      (res) => { if (res?.success) setReplaced(true) }
    )
  }

  const isCode = result.output ? looksLikeCode(result.output) : false

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 flex flex-col gap-3">
      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        {result.agent === "writing" && (
          <button
            onClick={replace}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              replaced ? "bg-violet-600 text-white" : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
            }`}
          >
            {replaced ? "✓ Replaced" : "Replace in Page"}
          </button>
        )}
        <button
          onClick={copy}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            copied ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
          }`}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>

      {/* Main output */}
      {result.output && (
        isCode ? (
          <pre className="text-xs text-emerald-700 leading-relaxed whitespace-pre-wrap bg-neutral-100 rounded-lg p-3 border border-neutral-200 overflow-x-auto font-mono">
            {result.output}
          </pre>
        ) : (
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
            {result.output}
          </p>
        )
      )}

      {/* Key points */}
      {result.structured?.keyPoints && result.structured.keyPoints.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-neutral-500">
            {isCode ? "Approach" : "Key Points"}
          </span>
          <ul className="pl-4 flex flex-col gap-1 list-disc">
            {result.structured.keyPoints.map((p, i) => (
              <li key={i} className="text-xs text-neutral-600">{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action items */}
      {result.structured?.actionItems && result.structured.actionItems.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-neutral-500">Action Items</span>
          <ul className="pl-4 flex flex-col gap-1 list-disc">
            {result.structured.actionItems.map((a, i) => (
              <li key={i} className="text-xs text-neutral-600">{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {result.structured?.risks && result.structured.risks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-neutral-500">Risks</span>
          <ul className="pl-4 flex flex-col gap-1 list-disc">
            {result.structured.risks.map((r, i) => (
              <li key={i} className="text-xs text-red-600">{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
