import { useState } from "react"
import type { PageContext, Intent, StructuredResult } from "../lib/types"
import { ResultBox } from "./ResultBox"

interface Props {
  context: PageContext
  activeTabId: number | null
}

const ACTIONS: { label: string; intent: Intent; icon: string }[] = [
  { label: "Bullet Summary", intent: "bullet_summary", icon: "📌" },
  { label: "Key Insights", intent: "key_insights", icon: "💡" },
  { label: "Action Items", intent: "action_items", icon: "✅" },
  { label: "Risk Flags", intent: "risk_flags", icon: "⚠️" },
]

export function SummarizeTab({ context, activeTabId }: Props) {
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
      { type: "RUN_AGENT", payload: { intent, context } },
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

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-neutral-500">
        Analyze the current page content using the tools below.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(({ label, intent, icon }) => (
          <button
            key={intent}
            onClick={() => run(intent)}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              activeIntent === intent
                ? "bg-violet-600 text-white"
                : "bg-white/10 text-neutral-300 hover:bg-white/20"
            }`}
          >
            <span>{icon}</span>
            <span>{activeIntent === intent ? "Analyzing..." : label}</span>
          </button>
        ))}
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
