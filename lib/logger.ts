import type { Intent, AgentType } from "./types"

export interface LogEntry {
  timestamp: number
  intent: Intent
  agent: AgentType
  latencyMs: number
  success: boolean
  error?: string
  inputLength: number
  outputLength: number
  tokens?: number
}

const STORAGE_KEY = "contextiq_logs"
const MAX_ENTRIES = 100

export async function log(entry: LogEntry): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  const logs: LogEntry[] = result[STORAGE_KEY] ?? []

  logs.push(entry)

  // Rotate: keep only the latest MAX_ENTRIES
  if (logs.length > MAX_ENTRIES) {
    logs.splice(0, logs.length - MAX_ENTRIES)
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: logs })
}

export async function getLogs(): Promise<LogEntry[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return result[STORAGE_KEY] ?? []
}

export async function clearLogs(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY)
}
