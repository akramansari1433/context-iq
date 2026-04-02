import "./style.css"

import { useEffect, useState } from "react"

import { SettingsTab } from "./components/SettingsTab"
import { SolveTab } from "./components/SolveTab"
import { SummarizeTab } from "./components/SummarizeTab"
import { WritingTab } from "./components/WritingTab"
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "./lib/providers"
import type { ProviderId } from "./lib/providers"
import type { PageContext } from "./lib/types"

type Tab = "writing" | "summarize" | "solve" | "settings"

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "writing", icon: "✍️", label: "Writing" },
  { id: "summarize", icon: "📋", label: "Summarize" },
  { id: "solve", icon: "🔍", label: "Solve" },
  { id: "settings", icon: "⚙️", label: "Settings" }
]

function extractPageContextInPage() {
  const url = window.location.href
  const hostname = new URL(url).hostname

  const clone = document.body.cloneNode(true) as HTMLElement
  clone
    .querySelectorAll(
      "script, style, nav, footer, aside, [role=banner], [role=navigation], " +
        "[role=complementary], .sidebar, .comments, .ad, .advertisement, .social-share"
    )
    .forEach((el) => el.remove())

  const mainContent = clone.querySelector(
    "article, main, [role=main]"
  ) as HTMLElement | null
  const textSource = mainContent ?? clone

  return {
    title: document.title,
    url,
    domain: hostname,
    bodyText: textSource.innerText.slice(0, 60000).trim(),
    headings: Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((el) => el.textContent?.trim() ?? "")
      .filter(Boolean)
      .slice(0, 15),
    selectedText: window.getSelection()?.toString().trim() ?? "",
    metaDescription:
      (document.querySelector('meta[name="description"]') as HTMLMetaElement)
        ?.content ?? ""
  }
}

export default function IndexPopup() {
  const [activeTab, setActiveTab] = useState<Tab>("writing")
  const [context, setContext] = useState<PageContext | null>(null)
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [contextError, setContextError] = useState<string | null>(null)
  const [providerId, setProviderId] = useState<ProviderId>(DEFAULT_PROVIDER)
  const [modelId, setModelId] = useState(DEFAULT_MODEL)
  const [customBaseUrl, setCustomBaseUrl] = useState("")
  const [customModelId, setCustomModelId] = useState("")

  useEffect(() => {
    chrome.storage.sync.get(
      ["contextiq_api_key", "contextiq_provider", "contextiq_model", "contextiq_custom_base_url", "contextiq_custom_model_id"],
      (res) => {
        if (res.contextiq_api_key) setApiKey(res.contextiq_api_key)
        if (res.contextiq_provider) setProviderId(res.contextiq_provider as ProviderId)
        if (res.contextiq_model) setModelId(res.contextiq_model)
        if (res.contextiq_custom_base_url) setCustomBaseUrl(res.contextiq_custom_base_url)
        if (res.contextiq_custom_model_id) setCustomModelId(res.contextiq_custom_model_id)
      }
    )

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
              setContextError(
                "Could not read page context. Make sure you're on a web page."
              )
            }
          }
        )
      })
    })
  }, [])

  const saveSettings = () => {
    const effectiveModelId = providerId === "custom" ? customModelId : modelId
    chrome.storage.sync.set({
      contextiq_api_key: apiKey,
      contextiq_provider: providerId,
      contextiq_model: effectiveModelId,
      contextiq_custom_base_url: customBaseUrl,
      contextiq_custom_model_id: customModelId
    }, () => {
      setApiKeySaved(true)
      setTimeout(() => setApiKeySaved(false), 2000)
    })
  }

  return (
    <div className="w-[400px] min-h-[500px] max-h-[600px] bg-white text-neutral-900 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <span className="text-base font-bold tracking-tight text-neutral-900">
          ⚡ ContextIQ
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex bg-neutral-50 border-b border-neutral-200">
        {TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center py-2 text-[11px] font-medium transition-colors border-b-2 ${
              activeTab === id
                ? "border-violet-500 text-violet-600"
                : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}>
            <span className="text-sm">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {contextError && activeTab !== "settings" && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {contextError}
          </div>
        )}

        {activeTab === "writing" && context && (
          <WritingTab
            key="writing"
            context={context}
            activeTabId={activeTabId}
          />
        )}
        {activeTab === "summarize" && context && (
          <SummarizeTab
            key="summarize"
            context={context}
            activeTabId={activeTabId}
          />
        )}
        {activeTab === "solve" && context && (
          <SolveTab key="solve" context={context} activeTabId={activeTabId} />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            apiKey={apiKey}
            setApiKey={setApiKey}
            apiKeySaved={apiKeySaved}
            onSave={saveSettings}
            providerId={providerId}
            setProviderId={setProviderId}
            modelId={modelId}
            setModelId={setModelId}
            customBaseUrl={customBaseUrl}
            setCustomBaseUrl={setCustomBaseUrl}
            customModelId={customModelId}
            setCustomModelId={setCustomModelId}
          />
        )}
      </div>
    </div>
  )
}
