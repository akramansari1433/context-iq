import { useState } from "react"
import type { PageContext, Intent, ToneOption, StructuredResult } from "../lib/types"
import { ResultBox } from "./ResultBox"

interface Props {
  context: PageContext
  activeTabId: number | null
}

const ACTIONS: { label: string; intent: Intent }[] = [
  { label: "Fix Grammar", intent: "fix_grammar" },
  { label: "Rewrite", intent: "rewrite" },
  { label: "Change Tone", intent: "change_tone" },
  { label: "Expand", intent: "expand" },
  { label: "Shorten", intent: "shorten" },
]

export function WritingTab({ context, activeTabId }: Props) {
  const [writingText, setWritingText] = useState(context.selectedText ?? "")
  const [tone, setTone] = useState<ToneOption>("professional")
  const [result, setResult] = useState<StructuredResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIntent, setActiveIntent] = useState<Intent | null>(null)

  const run = (intent: Intent) => {
    if (!writingText.trim()) {
      setError("Please enter some text to work with.")
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setActiveIntent(intent)

    chrome.runtime.sendMessage(
      {
        type: "RUN_AGENT",
        payload: {
          intent,
          context: { ...context, selectedText: writingText },
          tone,
        },
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
      {/* Textarea */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
          Your text
        </label>
        <textarea
          className="w-full rounded-lg bg-neutral-900 border border-white/10 text-neutral-100 text-xs p-3 resize-none focus:outline-none focus:border-violet-500/50 placeholder-neutral-600 min-h-[110px]"
          placeholder="Type or paste your text here, or select text on the page before opening..."
          value={writingText}
          onChange={(e) => setWritingText(e.target.value)}
        />
      </div>

      {/* Tone selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
          Tone
        </label>
        <select
          className="w-full rounded-lg bg-neutral-900 border border-white/10 text-neutral-200 text-xs px-3 py-2 focus:outline-none focus:border-violet-500/50"
          value={tone}
          onChange={(e) => setTone(e.target.value as ToneOption)}
        >
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="concise">Concise</option>
          <option value="formal">Formal</option>
          <option value="friendly">Friendly</option>
          <option value="emojify">😄 Emojify</option>
        </select>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ label, intent }) => (
          <button
            key={intent}
            onClick={() => run(intent)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              activeIntent === intent
                ? "bg-violet-600 text-white"
                : "bg-white/10 text-neutral-300 hover:bg-white/20"
            }`}
          >
            {activeIntent === intent ? "..." : label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="w-5 h-5 rounded-full border-2 border-neutral-700 border-t-violet-500 animate-spin" />
          <span className="text-xs text-neutral-500">Thinking...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && !loading && <ResultBox result={result} activeTabId={activeTabId} />}
    </div>
  )
}
