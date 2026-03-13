import { useState } from "react"
import type { PageContext, Intent, StructuredResult } from "../lib/types"
import { ResultBox } from "./ResultBox"

interface Props {
  context: PageContext
  activeTabId: number | null
}

export function SolveTab({ context, activeTabId }: Props) {
  const [instructions, setInstructions] = useState("")
  const [result, setResult] = useState<StructuredResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIntent, setActiveIntent] = useState<Intent | null>(null)

  const run = (intent: Intent) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setActiveIntent(intent)

    chrome.runtime.sendMessage(
      {
        type: "RUN_AGENT",
        payload: { intent, context, userInput: instructions || undefined },
      },
      (response) => {
        setLoading(false)
        setActiveIntent(null)
        if (response?.success) {
          setResult(response.data as StructuredResult)
        } else {
          setError(response?.error ?? "Unknown error occurred")
        }
      }
    )
  }

  const pageTitle = context.title?.slice(0, 60) || context.domain || "Current page"

  return (
    <div className="flex flex-col gap-3">
      {/* Page being analyzed */}
      <div className="rounded-lg bg-neutral-900 border border-white/5 px-3 py-2 flex items-center gap-2">
        <span className="text-neutral-500 text-xs">Reading:</span>
        <span className="text-neutral-300 text-xs truncate">{pageTitle}</span>
      </div>

      {/* Instructions */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
          Instructions (optional)
        </label>
        <textarea
          className="w-full rounded-lg bg-neutral-900 border border-white/10 text-neutral-100 text-xs p-3 resize-none focus:outline-none focus:border-violet-500/50 placeholder-neutral-600"
          style={{ minHeight: 70 }}
          placeholder="e.g. 'Solve using Python', 'Explain in simple terms', 'Use dynamic programming'..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => run("explain")}
          disabled={loading}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            activeIntent === "explain"
              ? "bg-violet-600 text-white"
              : "bg-white/10 text-neutral-300 hover:bg-white/20"
          }`}
        >
          <span>🧠</span>
          <span>{activeIntent === "explain" ? "Explaining..." : "Explain"}</span>
        </button>
        <button
          onClick={() => run("solve")}
          disabled={loading}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            activeIntent === "solve"
              ? "bg-violet-600 text-white"
              : "bg-white/10 text-neutral-300 hover:bg-white/20"
          }`}
        >
          <span>⚡</span>
          <span>{activeIntent === "solve" ? "Solving..." : "Solve"}</span>
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="w-5 h-5 rounded-full border-2 border-neutral-700 border-t-violet-500 animate-spin" />
          <span className="text-xs text-neutral-500">Thinking...</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {result && !loading && <ResultBox result={result} activeTabId={activeTabId} />}
    </div>
  )
}
