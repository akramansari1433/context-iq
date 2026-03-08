import "./style.css"
import { useState, useEffect } from "react"
import type { PageContext } from "./lib/types"
import { WritingTab } from "./components/WritingTab"
import { SummarizeTab } from "./components/SummarizeTab"
import { SolveTab } from "./components/SolveTab"
import { SettingsTab } from "./components/SettingsTab"

type Tab = "writing" | "summarize" | "solve" | "settings"

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "writing", icon: "✍️", label: "Writing" },
  { id: "summarize", icon: "📋", label: "Summarize" },
  { id: "solve", icon: "🔍", label: "Solve" },
  { id: "settings", icon: "⚙️", label: "Settings" },
]


function extractPageContextInPage() {
  const url = window.location.href
  const hostname = new URL(url).hostname

  const clone = document.body.cloneNode(true) as HTMLElement
  clone.querySelectorAll("script, style, nav, footer, aside, [role=banner]").forEach((el) => el.remove())

  return {
    title: document.title,
    url,
    domain: hostname,
    bodyText: clone.innerText.slice(0, 8000).trim(),
    headings: Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((el) => el.textContent?.trim() ?? "")
      .filter(Boolean)
      .slice(0, 15),
    selectedText: window.getSelection()?.toString().trim() ?? "",
    metaDescription: (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content ?? "",
  }
}

export default function IndexPopup() {
  const [activeTab, setActiveTab] = useState<Tab>("writing")
  const [context, setContext] = useState<PageContext | null>(null)
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [contextError, setContextError] = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.sync.get("contextiq_api_key", (res) => {
      if (res.contextiq_api_key) setApiKey(res.contextiq_api_key)
    })

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id) return
      const tabId = tab.id
      setActiveTabId(tabId)

      chrome.tabs.sendMessage(tabId, { type: "GET_CONTEXT" }, (response) => {
        if (!chrome.runtime.lastError && response?.success) {
          setContext(response.data)
          return
        }
        chrome.scripting.executeScript(
          { target: { tabId }, func: extractPageContextInPage },
          (results) => {
            const ctx = results?.[0]?.result as PageContext | undefined
            if (ctx) {
              setContext(ctx)
            } else {
              setContextError("Could not read page context. Make sure you're on a web page.")
            }
          }
        )
      })
    })
  }, [])

  const saveApiKey = () => {
    chrome.storage.sync.set({ contextiq_api_key: apiKey }, () => {
      setApiKeySaved(true)
      setTimeout(() => setApiKeySaved(false), 2000)
    })
  }

  return (
    <div className="w-[400px] min-h-[500px] max-h-[600px] bg-black text-white flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-neutral-950 border-b border-white/5">
        <span className="text-base font-bold tracking-tight text-white">
          ⚡ ContextIQ
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex bg-neutral-950 border-b border-white/5">
        {TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center py-2 text-[11px] font-medium transition-colors border-b-2 ${
              activeTab === id
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <span className="text-sm">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {contextError && activeTab !== "settings" && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {contextError}
          </div>
        )}

        {activeTab === "writing" && context && (
          <WritingTab key="writing" context={context} activeTabId={activeTabId} />
        )}
        {activeTab === "summarize" && context && (
          <SummarizeTab key="summarize" context={context} activeTabId={activeTabId} />
        )}
        {activeTab === "solve" && context && (
          <SolveTab key="solve" context={context} activeTabId={activeTabId} />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            apiKey={apiKey}
            setApiKey={setApiKey}
            apiKeySaved={apiKeySaved}
            onSave={saveApiKey}
          />
        )}
      </div>
    </div>
  )
}
