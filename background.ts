import { runAgent } from "./lib/api-client"
import { log, getLogs, clearLogs } from "./lib/logger"
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from "./lib/providers"
import type { ProviderId } from "./lib/providers"
import { checkRateLimit } from "./lib/rate-limiter"
import { validateInput, sanitizeInput } from "./lib/security"
import type { MessageRequest, MessageResponse, AgentRequest } from "./lib/types"

interface StoredConfig {
  apiKey: string | null
  providerId: ProviderId
  modelId: string
  customBaseUrl?: string
}

async function getStoredConfig(): Promise<StoredConfig> {
  const result = await chrome.storage.sync.get([
    "contextiq_api_key",
    "contextiq_provider",
    "contextiq_model",
    "contextiq_custom_base_url",
    "contextiq_custom_model_id"
  ])
  return {
    apiKey: result.contextiq_api_key ?? null,
    providerId: (result.contextiq_provider as ProviderId) ?? DEFAULT_PROVIDER,
    modelId: result.contextiq_model ?? result.contextiq_custom_model_id ?? DEFAULT_MODEL,
    customBaseUrl: result.contextiq_custom_base_url
  }
}

chrome.runtime.onMessage.addListener((message: MessageRequest, _sender, sendResponse) => {
  handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((err) => sendResponse({ success: false, error: String(err.message ?? err) }))
  return true
})

async function handleMessage(message: MessageRequest): Promise<MessageResponse> {
  if (message.type === "GET_LOGS") {
    const logs = await getLogs()
    return { success: true, data: logs }
  }

  if (message.type === "CLEAR_LOGS") {
    await clearLogs()
    return { success: true, data: null }
  }

  if (message.type === "RUN_AGENT") {
    const config = await getStoredConfig()
    if (!config.apiKey) {
      return { success: false, error: "API key not configured. Go to Settings to add your API key." }
    }

    // Rate limit check
    const rateCheck = checkRateLimit()
    if (!rateCheck.allowed) {
      const secs = Math.ceil((rateCheck.retryAfterMs ?? 0) / 1000)
      return { success: false, error: `Rate limit reached. Please wait ${secs}s before trying again.` }
    }

    // Security validation
    const textToValidate = message.payload.userInput ?? message.payload.context?.selectedText ?? ""
    if (textToValidate) {
      const validation = validateInput(textToValidate)
      if (!validation.valid) {
        return { success: false, error: validation.reason ?? "Input validation failed." }
      }
    }

    // Sanitize inputs
    const payload = { ...message.payload }
    if (payload.userInput) payload.userInput = sanitizeInput(payload.userInput)
    if (payload.context?.selectedText) {
      payload.context = { ...payload.context, selectedText: sanitizeInput(payload.context.selectedText) }
    }

    const req: AgentRequest = {
      ...payload,
      apiKey: config.apiKey,
      providerId: config.providerId,
      modelId: config.modelId,
      customBaseUrl: config.customBaseUrl
    }
    const inputLength = (req.context.bodyText?.length ?? 0) + (req.context.selectedText?.length ?? 0) + (req.userInput?.length ?? 0)

    try {
      const result = await runAgent(req)

      // Log success
      await log({
        timestamp: Date.now(),
        intent: req.intent,
        agent: result.agent,
        latencyMs: result.latencyMs,
        success: true,
        inputLength,
        outputLength: result.output?.length ?? 0,
        tokens: result.tokenUsage?.total,
      })

      return { success: true, data: result }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err)

      // Log failure
      await log({
        timestamp: Date.now(),
        intent: req.intent,
        agent: "writing",
        latencyMs: 0,
        success: false,
        error,
        inputLength,
        outputLength: 0,
      })

      return { success: false, error }
    }
  }

  return { success: false, error: "Unknown message type" }
}
