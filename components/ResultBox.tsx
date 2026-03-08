import { useState, useEffect } from "react"
import type { StructuredResult } from "../lib/types"

interface Props {
  result: StructuredResult
  activeTabId: number | null
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

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900 p-4 flex flex-col gap-3">
      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        {result.agent === "writing" && (
          <button
            onClick={replace}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              replaced ? "bg-violet-600 text-white" : "bg-white/10 text-neutral-300 hover:bg-white/20"
            }`}
          >
            {replaced ? "✓ Replaced" : "Replace in Page"}
          </button>
        )}
        <button
          onClick={copy}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            copied ? "bg-emerald-600/80 text-white" : "bg-white/10 text-neutral-300 hover:bg-white/20"
          }`}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>

      {/* Main output */}
      {result.output && (
        <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
          {result.output}
        </p>
      )}

      {/* Key points */}
      {result.structured?.keyPoints && result.structured.keyPoints.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-neutral-500">Key Points</span>
          <ul className="pl-4 flex flex-col gap-1 list-disc">
            {result.structured.keyPoints.map((p, i) => (
              <li key={i} className="text-xs text-neutral-300">{p}</li>
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
              <li key={i} className="text-xs text-neutral-300">{a}</li>
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
              <li key={i} className="text-xs text-red-400">{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
