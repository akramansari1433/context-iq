import { useState } from "react"
import type { Intent, PageContext, StructuredResult, ToneOption } from "../lib/types"
import { ResultBox } from "./ResultBox"

interface Props {
  context: PageContext
  activeTabId: number | null
}

const EDIT_ACTIONS: { label: string; intent: Intent }[] = [
  { label: "Fix Grammar", intent: "fix_grammar" },
  { label: "Rewrite", intent: "rewrite" },
  { label: "Change Tone", intent: "change_tone" },
  { label: "Expand", intent: "expand" },
  { label: "Shorten", intent: "shorten" },
]

type Mode = "edit" | "draft"

export function WritingTab({ context, activeTabId }: Props) {
  const [mode, setMode] = useState<Mode>("edit")
  const [editText, setEditText] = useState(context.selectedText ?? "")
  const [draftPrompt, setDraftPrompt] = useState("")
  const [tone, setTone] = useState<ToneOption>("professional")
  const [result, setResult] = useState<StructuredResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIntent, setActiveIntent] = useState<Intent | null>(null)

  const send = (intent: Intent, selectedText: string, userInput?: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setActiveIntent(intent)

    chrome.runtime.sendMessage(
      {
        type: "RUN_AGENT",
        payload: { intent, context: { ...context, selectedText }, tone, userInput },
      },
      (response) => {
        setLoading(false)
        setActiveIntent(null)
        if (response?.success) setResult(response.data as StructuredResult)
        else setError(response?.error ?? "Unknown error occurred")
      }
    )
  }

  const runEdit = (intent: Intent) => {
    if (!editText.trim()) { setError("Please enter some text."); return }
    send(intent, editText)
  }

  const runDraft = () => {
    if (!draftPrompt.trim()) { setError("Please describe what you want to write."); return }
    send("draft", "", draftPrompt)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg bg-neutral-900 border border-white/10 p-1 gap-1">
        {(["edit", "draft"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); setResult(null) }}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              mode === m ? "bg-violet-600 text-white" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {m === "edit" ? "✏️ Edit" : "✍️ Draft"}
          </button>
        ))}
      </div>

      {/* Tone selector */}
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-medium text-neutral-500 whitespace-nowrap">Tone</label>
        <select
          className="flex-1 rounded-lg bg-neutral-900 border border-white/10 text-neutral-200 text-xs px-3 py-2 focus:outline-none focus:border-violet-500/50"
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

      {/* Edit mode */}
      {mode === "edit" && (
        <>
          <textarea
            className="w-full rounded-lg bg-neutral-900 border border-white/10 text-neutral-100 text-xs p-3 resize-none focus:outline-none focus:border-violet-500/50 placeholder-neutral-600 min-h-[110px]"
            placeholder="Paste or type your text here, or select text on the page before opening..."
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {EDIT_ACTIONS.map(({ label, intent }) => (
              <button
                key={intent}
                onClick={() => runEdit(intent)}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeIntent === intent ? "bg-violet-600 text-white" : "bg-white/10 text-neutral-300 hover:bg-white/20"
                }`}
              >
                {activeIntent === intent ? "..." : label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Draft mode */}
      {mode === "draft" && (
        <>
          <textarea
            className="w-full rounded-lg bg-neutral-900 border border-white/10 text-neutral-100 text-xs p-3 resize-none focus:outline-none focus:border-violet-500/50 placeholder-neutral-600 min-h-[110px]"
            placeholder='Describe what to write, e.g. "a follow-up email to a client about the project deadline"'
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
          />
          <button
            onClick={runDraft}
            disabled={loading}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeIntent === "draft" ? "Drafting..." : "Generate Draft"}
          </button>
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-neutral-700 border-t-violet-500 animate-spin" />
          <span className="text-xs text-neutral-500">Thinking...</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{error}</div>
      )}

      {result && !loading && <ResultBox result={result} activeTabId={activeTabId} />}
    </div>
  )
}
