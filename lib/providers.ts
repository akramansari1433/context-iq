export type ProviderId = "groq" | "openai" | "anthropic" | "google" | "custom"

export type ApiFormat = "openai" | "anthropic" | "google"

export interface ModelConfig {
  id: string
  name: string
  description: string
  maxTokens: number
  supportsJsonMode: boolean
}

export interface ProviderConfig {
  id: ProviderId
  name: string
  baseUrl: string
  apiKeyPrefix: string
  apiKeyHelpUrl: string
  apiKeyLabel: string
  apiFormat: ApiFormat
  models: ModelConfig[]
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  groq: {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKeyPrefix: "gsk_",
    apiKeyHelpUrl: "console.groq.com",
    apiKeyLabel: "Groq API Key",
    apiFormat: "openai",
    models: [
      {
        id: "llama-3.3-70b-versatile",
        name: "LLaMA 3.3 70B",
        description: "Best all-around model on Groq. Great for writing, analysis, and complex reasoning.",
        maxTokens: 2000,
        supportsJsonMode: true
      },
      {
        id: "llama-3.1-8b-instant",
        name: "LLaMA 3.1 8B",
        description: "Ultra-fast and lightweight. Best for quick edits, grammar fixes, and simple tasks.",
        maxTokens: 2000,
        supportsJsonMode: true
      },
      {
        id: "mixtral-8x7b-32768",
        name: "Mixtral 8x7B",
        description: "Strong multilingual support with large context window. Good for long documents.",
        maxTokens: 2000,
        supportsJsonMode: true
      },
      {
        id: "gemma2-9b-it",
        name: "Gemma 2 9B",
        description: "Google's efficient open model. Good balance of speed and quality for everyday tasks.",
        maxTokens: 2000,
        supportsJsonMode: true
      }
    ]
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKeyPrefix: "sk-",
    apiKeyHelpUrl: "platform.openai.com/api-keys",
    apiKeyLabel: "OpenAI API Key",
    apiFormat: "openai",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "Most capable OpenAI model. Excellent at writing, reasoning, and nuanced analysis.",
        maxTokens: 2000,
        supportsJsonMode: true
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Fast and affordable. Great for most tasks with near GPT-4o quality at lower cost.",
        maxTokens: 2000,
        supportsJsonMode: true
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Cheapest OpenAI option. Good for simple edits, summaries, and quick tasks.",
        maxTokens: 1500,
        supportsJsonMode: true
      }
    ]
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    apiKeyPrefix: "sk-ant-",
    apiKeyHelpUrl: "console.anthropic.com/settings/keys",
    apiKeyLabel: "Anthropic API Key",
    apiFormat: "anthropic",
    models: [
      {
        id: "claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        description: "Anthropic's best balance of intelligence and speed. Excellent at writing and analysis.",
        maxTokens: 2000,
        supportsJsonMode: false
      },
      {
        id: "claude-haiku-4-5-20251001",
        name: "Claude Haiku 4.5",
        description: "Fast and cost-effective. Great for quick edits, summaries, and simple reasoning.",
        maxTokens: 2000,
        supportsJsonMode: false
      }
    ]
  },
  google: {
    id: "google",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    apiKeyPrefix: "AI",
    apiKeyHelpUrl: "aistudio.google.com/apikey",
    apiKeyLabel: "Google AI API Key",
    apiFormat: "google",
    models: [
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        description: "Google's fastest model. Great for quick tasks with strong multilingual capabilities.",
        maxTokens: 2000,
        supportsJsonMode: true
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "Most capable Gemini model. Excellent for long documents and complex analysis.",
        maxTokens: 2000,
        supportsJsonMode: true
      }
    ]
  },
  custom: {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    baseUrl: "",
    apiKeyPrefix: "",
    apiKeyHelpUrl: "",
    apiKeyLabel: "API Key",
    apiFormat: "openai",
    models: [
      {
        id: "",
        name: "Custom Model",
        description: "Use any OpenAI-compatible API endpoint (OpenRouter, Together, Ollama, etc.)",
        maxTokens: 2000,
        supportsJsonMode: true
      }
    ]
  }
}

export const DEFAULT_PROVIDER: ProviderId = "groq"
export const DEFAULT_MODEL = "llama-3.3-70b-versatile"

export function getProvider(id: ProviderId): ProviderConfig {
  return PROVIDERS[id] ?? PROVIDERS[DEFAULT_PROVIDER]
}

export function getModel(providerId: ProviderId, modelId: string): ModelConfig | undefined {
  const provider = getProvider(providerId)
  return provider.models.find((m) => m.id === modelId)
}
