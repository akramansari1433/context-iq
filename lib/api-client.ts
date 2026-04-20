import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts"
import { getModel, getProvider } from "./providers"
import type { AgentRequest, AgentType, StructuredResult } from "./types"

const REQUEST_TIMEOUT_MS = 30_000
const MAX_RETRIES = 2
const RETRY_BASE_MS = 1000

async function fetchWithTimeout(
  url: string,
  opts: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500
}

async function fetchWithRetry(
  url: string,
  opts: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, opts, timeoutMs)
      if (response.ok || !isRetryable(response.status) || attempt === MAX_RETRIES) {
        return response
      }
      lastError = new Error(`API error ${response.status}`)
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt === MAX_RETRIES) break
    }
    await new Promise((r) => setTimeout(r, RETRY_BASE_MS * 2 ** attempt))
  }
  throw lastError
}

const AGENT_MAP: Record<string, AgentType> = {
  fix_grammar: "writing",
  rewrite: "writing",
  change_tone: "writing",
  expand: "writing",
  shorten: "writing",
  draft: "writing",
  bullet_summary: "summary",
  key_insights: "summary",
  action_items: "summary",
  risk_flags: "summary",
  ask_page: "summary",
  multi_tab_summary: "summary",
  explain: "solver",
  solve: "solver"
}

function parseJsonResponse(rawContent: string): Record<string, unknown> {
  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim()
    return JSON.parse(cleaned)
  } catch {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    try {
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { output: rawContent }
    } catch {
      return { output: rawContent }
    }
  }
}

async function callOpenAICompatible(
  apiKey: string,
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  useJsonMode: boolean
): Promise<{ text: string; usage?: { prompt: number; completion: number; total: number } }> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: maxTokens
  }
  if (useJsonMode) {
    body.response_format = { type: "json_object" }
  }

  const response = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const usage = data.usage
  return {
    text: data.choices?.[0]?.message?.content ?? "{}",
    usage: usage
      ? {
          prompt: usage.prompt_tokens ?? 0,
          completion: usage.completion_tokens ?? 0,
          total: usage.total_tokens ?? 0
        }
      : undefined
  }
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ text: string; usage?: { prompt: number; completion: number; total: number } }> {
  const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const usage = data.usage
  return {
    text: data.content?.[0]?.text ?? "{}",
    usage: usage
      ? {
          prompt: usage.input_tokens ?? 0,
          completion: usage.output_tokens ?? 0,
          total: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)
        }
      : undefined
  }
}

async function callGoogle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ text: string; usage?: { prompt: number; completion: number; total: number } }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json"
      }
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Google AI API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const usage = data.usageMetadata
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}",
    usage: usage
      ? {
          prompt: usage.promptTokenCount ?? 0,
          completion: usage.candidatesTokenCount ?? 0,
          total: usage.totalTokenCount ?? 0
        }
      : undefined
  }
}

export async function runAgent(req: AgentRequest): Promise<StructuredResult> {
  const startTime = Date.now()
  const agent: AgentType = AGENT_MAP[req.intent] ?? "solver"
  const provider = getProvider(req.providerId)
  const modelConfig = getModel(req.providerId, req.modelId)
  const maxTokens = req.intent === "ask_page"
    ? Math.min((modelConfig?.maxTokens ?? 2000) + 500, 4000)
    : (modelConfig?.maxTokens ?? 1500)

  const userPrompt = buildUserPrompt(
    req.intent,
    req.context.bodyText,
    req.context.selectedText,
    req.tone,
    req.userInput
  )

  const baseUrl = req.providerId === "custom" && req.customBaseUrl
    ? req.customBaseUrl
    : provider.baseUrl

  let result: { text: string; usage?: { prompt: number; completion: number; total: number } }

  switch (provider.apiFormat) {
    case "anthropic":
      result = await callAnthropic(req.apiKey, req.modelId, SYSTEM_PROMPT, userPrompt, maxTokens)
      break
    case "google":
      result = await callGoogle(req.apiKey, req.modelId, SYSTEM_PROMPT, userPrompt, maxTokens)
      break
    case "openai":
    default:
      result = await callOpenAICompatible(
        req.apiKey,
        baseUrl,
        req.modelId,
        SYSTEM_PROMPT,
        userPrompt,
        maxTokens,
        modelConfig?.supportsJsonMode ?? false
      )
      break
  }

  const parsed = parseJsonResponse(result.text)

  return {
    intent: req.intent,
    agent,
    output:
      (parsed.output as string) ?? (parsed.summary as string) ?? result.text,
    structured: {
      keyPoints: parsed.keyPoints as string[],
      actionItems: parsed.actionItems as string[],
      risks: parsed.risks as string[]
    },
    latencyMs: Date.now() - startTime,
    tokenUsage: result.usage
  }
}
