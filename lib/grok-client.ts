import type { AgentRequest, StructuredResult, AgentType } from "./types"
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts"

const GROQ_BASE_URL = "https://api.groq.com/openai/v1"
const MODEL = "llama-3.3-70b-versatile"

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
  debug: "solver",
  solve: "solver",
  extract: "solver",
}

export async function runGrokAgent(req: AgentRequest): Promise<StructuredResult> {
  const startTime = Date.now()
  const agent: AgentType = AGENT_MAP[req.intent] ?? "solver"

  const userPrompt = buildUserPrompt(
    req.intent,
    req.context.bodyText,
    req.context.selectedText,
    req.tone,
    req.userInput
  )

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Groq API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const rawContent = data.choices?.[0]?.message?.content ?? "{}"

  let parsed: Record<string, unknown> = {}

  try {
    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    parsed = JSON.parse(cleaned)
  } catch {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    try {
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { output: rawContent }
    } catch {
      parsed = { output: rawContent }
    }
  }

  return {
    intent: req.intent,
    agent,
    output: (parsed.output as string) ?? (parsed.summary as string) ?? rawContent,
    structured: {
      keyPoints: parsed.keyPoints as string[],
      actionItems: parsed.actionItems as string[],
      risks: parsed.risks as string[],
    },
    latencyMs: Date.now() - startTime,
  }
}
