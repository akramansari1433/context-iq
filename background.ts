import { runGrokAgent } from "./lib/grok-client"
import type { MessageRequest, MessageResponse, AgentRequest } from "./lib/types"

async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.sync.get("contextiq_api_key")
  return result.contextiq_api_key ?? null
}

chrome.runtime.onMessage.addListener((message: MessageRequest, _sender, sendResponse) => {
  handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((err) => sendResponse({ success: false, error: String(err.message ?? err) }))
  return true
})

async function handleMessage(message: MessageRequest): Promise<MessageResponse> {
  if (message.type === "RUN_AGENT") {
    const apiKey = await getApiKey()
    if (!apiKey) {
      return { success: false, error: "API key not configured. Go to Settings to add your Groq API key." }
    }

    const req: AgentRequest = { ...message.payload, apiKey }

    try {
      const result = await runGrokAgent(req)
      return { success: true, data: result }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err)
      return { success: false, error }
    }
  }

  return { success: false, error: "Unknown message type" }
}
