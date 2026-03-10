export type Intent = "fix_grammar" | "rewrite" | "change_tone" | "expand" | "shorten" | "draft" | "bullet_summary" | "key_insights" | "action_items" | "risk_flags" | "ask_page" | "multi_tab_summary" | "explain" | "debug" | "solve" | "extract"

export type AgentType = "writing" | "summary" | "solver"

export type ToneOption = "professional" | "casual" | "concise" | "formal" | "friendly" | "emojify"

export interface PageContext {
  title: string
  url: string
  domain: string

  bodyText: string
  headings: string[]
  selectedText: string
  metaDescription: string
  isEditableSelection?: boolean
}

export interface AgentRequest {
  intent: Intent
  context: PageContext
  userInput?: string
  tone?: ToneOption
  apiKey: string
}

export interface StructuredResult {
  intent: Intent
  agent: AgentType
  output: string
  structured?: {
    keyPoints?: string[]
    actionItems?: string[]
    risks?: string[]
  }
  latencyMs: number
}

export type MessageRequest =
  | { type: "GET_CONTEXT" }
  | { type: "RUN_AGENT"; payload: Omit<AgentRequest, "apiKey"> }

export type MessageResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }
