import { useState } from "react"
import type { PageContext, Intent, StructuredResult } from "../lib/types"
import { ResultBox } from "./ResultBox"

interface Props {
  context: PageContext
  activeTabId: number | null
}

const ACTIONS: { label: string; intent: Intent; icon: string }[] = [
  { label: "Explain", intent: "explain", icon: "🧠" },
  { label: "Debug", intent: "debug", icon: "🐛" },
  { label: "Solve", intent: "solve", icon: "⚡" },
  { label: "Extract Data", intent: "extract", icon: "📤" },
]

export function SolveTab({ context, activeTabId }: Props) {
  const [userInput, setUserInput] = useState("")
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
        payload: { intent, context, userInput: userInput || undefined },
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
          Question or instruction (optional)
        </label>
        <textarea
          className="w-full rounded-lg bg-neutral-900 border border-white/10 text-neutral-100 text-xs p-3 resize-none focus:outline-none focus:border-violet-500/50 placeholder-neutral-600 min-h-[70px]"
          placeholder="e.g. 'What does this error mean?' or 'How do I fix this?'"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
      </div>

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
            <span>{activeIntent === intent ? "Working..." : label}</span>
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
