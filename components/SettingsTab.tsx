import { useState, useEffect } from "react"

import type { LogEntry } from "../lib/logger"
import { PROVIDERS, getModel } from "../lib/providers"
import type { ProviderId } from "../lib/providers"

interface Props {
  apiKey: string
  setApiKey: (key: string) => void
  apiKeySaved: boolean
  onSave: () => void
  providerId: ProviderId
  setProviderId: (id: ProviderId) => void
  modelId: string
  setModelId: (id: string) => void
  customBaseUrl: string
  setCustomBaseUrl: (url: string) => void
  customModelId: string
  setCustomModelId: (id: string) => void
}

const inputClasses =
  "w-full rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 text-sm px-3 py-2 focus:outline-none focus:border-violet-500/50 placeholder-neutral-400"

export function SettingsTab({
  apiKey,
  setApiKey,
  apiKeySaved,
  onSave,
  providerId,
  setProviderId,
  modelId,
  setModelId,
  customBaseUrl,
  setCustomBaseUrl,
  customModelId,
  setCustomModelId
}: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLogs, setShowLogs] = useState(false)

  const provider = PROVIDERS[providerId]
  const selectedModel = getModel(providerId, modelId)

  const loadLogs = () => {
    chrome.runtime.sendMessage({ type: "GET_LOGS" }, (res) => {
      if (res?.success) setLogs((res.data as LogEntry[]).reverse())
    })
  }

  const handleClearLogs = () => {
    chrome.runtime.sendMessage({ type: "CLEAR_LOGS" }, () => {
      setLogs([])
    })
  }

  useEffect(() => {
    if (showLogs) loadLogs()
  }, [showLogs])

  const handleProviderChange = (newId: ProviderId) => {
    setProviderId(newId)
    const newProvider = PROVIDERS[newId]
    if (newProvider.models.length > 0) {
      setModelId(newProvider.models[0].id)
    }
  }

  const displayModelName =
    providerId === "custom"
      ? customModelId || "Custom Model"
      : selectedModel?.name ?? modelId

  return (
    <div className="flex flex-col gap-4">
      {/* Provider selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
          AI Provider
        </label>
        <select
          className={inputClasses}
          value={providerId}
          onChange={(e) => handleProviderChange(e.target.value as ProviderId)}
        >
          {Object.values(PROVIDERS).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Model selector (hidden for custom) */}
      {providerId !== "custom" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
            Model
          </label>
          <select
            className={inputClasses}
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {provider.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {selectedModel && (
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              {selectedModel.description}
            </p>
          )}
        </div>
      )}

      {/* Custom provider fields */}
      {providerId === "custom" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
              Base URL
            </label>
            <input
              type="text"
              className={inputClasses}
              value={customBaseUrl}
              onChange={(e) => setCustomBaseUrl(e.target.value)}
              placeholder="https://api.openrouter.ai/v1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
              Model ID
            </label>
            <input
              type="text"
              className={inputClasses}
              value={customModelId}
              onChange={(e) => setCustomModelId(e.target.value)}
              placeholder="meta-llama/llama-3.3-70b"
            />
          </div>
        </>
      )}

      {/* API Key */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
          {provider.apiKeyLabel}
        </label>
        <input
          type="password"
          className={inputClasses}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={provider.apiKeyPrefix ? `${provider.apiKeyPrefix}...` : "Enter API key"}
        />
        {provider.apiKeyHelpUrl && (
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Get your key at{" "}
            <span className="text-violet-600">{provider.apiKeyHelpUrl}</span>. Stored locally in
            Chrome's encrypted storage — never sent anywhere else.
          </p>
        )}
      </div>

      <button
        onClick={onSave}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
          apiKeySaved
            ? "bg-emerald-600 text-white"
            : "bg-violet-600 hover:bg-violet-500 text-white"
        }`}
      >
        {apiKeySaved ? "✓ Saved!" : "Save Settings"}
      </button>

      <div className="border-t border-neutral-200 pt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">Rate limit</span>
          <span className="text-[11px] text-neutral-600">10 req / min</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">Model</span>
          <span className="text-[11px] text-neutral-600">
            {displayModelName} ({provider.name})
          </span>
        </div>
      </div>

      {/* Logs section */}
      <div className="border-t border-neutral-200 pt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide hover:text-neutral-700 transition-colors"
          >
            {showLogs ? "▾ Logs" : "▸ Logs"}
          </button>
          {showLogs && logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="text-[10px] text-red-500 hover:text-red-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {showLogs && (
          <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-[11px] text-neutral-400 text-center py-2">No logs yet</p>
            ) : (
              logs.slice(0, 20).map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-2 py-1.5 rounded text-[10px] ${
                    entry.success ? "bg-neutral-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={entry.success ? "text-emerald-600" : "text-red-500"}>
                      {entry.success ? "✓" : "✗"}
                    </span>
                    <span className="text-neutral-700 truncate">{entry.intent}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {entry.tokens != null && (
                      <span className="text-violet-500">{entry.tokens}tk</span>
                    )}
                    <span className="text-neutral-500">{entry.latencyMs}ms</span>
                    <span className="text-neutral-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
