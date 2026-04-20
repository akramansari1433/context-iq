import { useState, useEffect } from "react"
import { extractTabContent } from "../lib/extract-content"
import type { PageContext, Intent, StructuredResult } from "../lib/types"
import { ResultBox } from "./ResultBox"

interface Props {
  context: PageContext
  activeTabId: number | null
}

interface TabItem {
  id: number
  title: string
  url: string
  selected: boolean
}

type Mode = "page" | "research"

const QUICK_TOOLS: { label: string; intent: Intent; icon: string }[] = [
  { label: "Bullet Summary", intent: "bullet_summary", icon: "📌" },
  { label: "Key Insights", intent: "key_insights", icon: "💡" },
  { label: "Action Items", intent: "action_items", icon: "✅" },
  { label: "Risk Flags", intent: "risk_flags", icon: "⚠️" },
]

export function SummarizeTab({ context, activeTabId }: Props) {
  const [mode, setMode] = useState<Mode>("page")
  const [question, setQuestion] = useState("")
  const [tabs, setTabs] = useState<TabItem[]>([])
  const [tabsLoading, setTabsLoading] = useState(false)
  const [result, setResult] = useState<StructuredResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIntent, setActiveIntent] = useState<Intent | null>(null)

  useEffect(() => {
    if (mode !== "research") return
    setTabsLoading(true)
    chrome.tabs.query({}, (allTabs) => {
      setTabs(
        allTabs
          .filter((t) => t.id && t.url && !t.url.startsWith("chrome://") && !t.url.startsWith("chrome-extension://"))
          .map((t) => ({
            id: t.id!,
            title: t.title ?? t.url ?? "Untitled",
            url: t.url ?? "",
            selected: true,
          }))
      )
      setTabsLoading(false)
    })
  }, [mode])

  const send = (intent: Intent, bodyText: string, userInput?: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setActiveIntent(intent)

    chrome.runtime.sendMessage(
      {
        type: "RUN_AGENT",
        payload: {
          intent,
          context: { ...context, bodyText },
          userInput,
        },
      },
      (response) => {
        setLoading(false)
        setActiveIntent(null)
        if (response?.success) setResult(response.data as StructuredResult)
        else setError(response?.error ?? "Unknown error occurred")
      }
    )
  }

  const runQuickTool = (intent: Intent) => {
    send(intent, context.bodyText)
  }

  const runAsk = () => {
    if (!question.trim()) { setError("Please enter a question."); return }
    send("ask_page", context.bodyText, question)
  }

  const runMultiTab = async () => {
    const selected = tabs.filter((t) => t.selected)
    if (selected.length === 0) { setError("Select at least one tab."); return }

    setLoading(true)
    setError(null)
    setResult(null)
    setActiveIntent("multi_tab_summary")

    const charsPerTab = Math.min(6000, Math.floor(20000 / selected.length))

    const contents = await Promise.all(
      selected.map((tab) =>
        new Promise<{ title: string; content: string } | null>((resolve) => {
          chrome.scripting.executeScript(
            { target: { tabId: tab.id }, func: extractTabContent, args: [charsPerTab] },
            (results) => {
              if (chrome.runtime.lastError || !results?.[0]?.result) {
                resolve(null)
              } else {
                resolve(results[0].result as { title: string; content: string })
              }
            }
          )
        })
      )
    )

    const combined = contents
      .filter(Boolean)
      .map((c, i) => `--- Source ${i + 1}: "${c!.title}" ---\n${c!.content}`)
      .join("\n\n")

    if (!combined.trim()) {
      setLoading(false)
      setActiveIntent(null)
      setError("Could not extract content from selected tabs.")
      return
    }

    send("multi_tab_summary", combined)
  }

  const toggleTab = (id: number) =>
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)))

  const toggleAll = (val: boolean) =>
    setTabs((prev) => prev.map((t) => ({ ...t, selected: val })))

  const selectedCount = tabs.filter((t) => t.selected).length

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg bg-neutral-100 border border-neutral-200 p-1 gap-1">
        <button
          onClick={() => { setMode("page"); setError(null); setResult(null) }}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "page" ? "bg-violet-600 text-white" : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          📄 This Page
        </button>
        <button
          onClick={() => { setMode("research"); setError(null); setResult(null) }}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "research" ? "bg-violet-600 text-white" : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          🔬 Research
        </button>
      </div>

      {mode === "page" && (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
              Ask anything about this page
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs px-3 py-2 focus:outline-none focus:border-violet-500/50 placeholder-neutral-400"
                placeholder='e.g. "What is the main argument?"'
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runAsk()}
              />
              <button
                onClick={runAsk}
                disabled={loading}
                className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {activeIntent === "ask_page" ? "..." : "Ask"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-[10px] text-neutral-400">or use quick tools</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {QUICK_TOOLS.map(({ label, intent, icon }) => (
              <button
                key={intent}
                onClick={() => runQuickTool(intent)}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeIntent === intent ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <span>{icon}</span>
                <span>{activeIntent === intent ? "Analyzing..." : label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {mode === "research" && (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
                Open tabs ({selectedCount} selected)
              </label>
              <div className="flex gap-2">
                <button onClick={() => toggleAll(true)} className="text-[10px] text-violet-600 hover:text-violet-500">All</button>
                <span className="text-neutral-300">·</span>
                <button onClick={() => toggleAll(false)} className="text-[10px] text-neutral-500 hover:text-neutral-400">None</button>
              </div>
            </div>

            {tabsLoading ? (
              <div className="text-xs text-neutral-500 text-center py-4">Loading tabs...</div>
            ) : (
              <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-1">
                {tabs.map((tab) => (
                  <label
                    key={tab.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      tab.selected ? "bg-violet-50 border border-violet-200" : "bg-neutral-50 border border-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tab.selected}
                      onChange={() => toggleTab(tab.id)}
                      className="accent-violet-500 w-3.5 h-3.5 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-neutral-700 truncate">{tab.title}</span>
                      <span className="text-[10px] text-neutral-400 truncate">{new URL(tab.url).hostname}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={runMultiTab}
            disabled={loading || selectedCount === 0}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeIntent === "multi_tab_summary"
              ? `Summarizing ${selectedCount} tabs...`
              : `Summarize ${selectedCount} tab${selectedCount !== 1 ? "s" : ""}`}
          </button>
        </>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-violet-500 animate-spin" />
          <span className="text-xs text-neutral-500">
            {activeIntent === "multi_tab_summary" ? `Reading ${selectedCount} tabs...` : "Thinking..."}
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</div>
      )}

      {result && !loading && <ResultBox result={result} activeTabId={activeTabId} />}
    </div>
  )
}
