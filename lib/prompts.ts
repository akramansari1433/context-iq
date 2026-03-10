import type { Intent, ToneOption } from "./types"


const WRITING_INTENTS = new Set(["fix_grammar", "rewrite", "change_tone", "expand", "shorten", "draft"])

export const SYSTEM_PROMPT = `You are ContextIQ, a helpful browser AI assistant.
You provide concise, accurate responses.
Always respond in valid JSON matching the requested schema.`

export function buildUserPrompt(intent: Intent, context: string, selectedText: string, tone?: ToneOption, userInput?: string): string {
  const toneStr = tone ? `Tone: ${tone}.` : ""
  const isWriting = WRITING_INTENTS.has(intent)

  const selectedStr = selectedText ? `\n\nText to process:\n"""${selectedText}"""` : ""
  const pageStr = !isWriting && context ? `\n\nPage context:\n"""${context.slice(0, 3000)}"""` : ""
  const customStr = userInput ? `\n\nUser instruction: ${userInput}` : ""

  const schemas: Record<Intent, string> = {
    fix_grammar: `Fix grammar and spelling errors in the provided text. Output ONLY the corrected version of that exact text. Return: {"output": "corrected text only"}`,
    rewrite: `Rewrite the provided text to improve clarity and flow. ${toneStr} Output ONLY the rewritten version of that exact text. Return: {"output": "rewritten text only"}`,
    change_tone: tone === "emojify"
      ? `Add relevant emojis throughout the provided text to make it more expressive and fun. Keep all the original words — only add emojis. Output ONLY the emojified version. Return: {"output": "emojified text only"}`
      : `Change the tone of the provided text to ${tone ?? "professional"}. Output ONLY the tone-adjusted version of that exact text. Return: {"output": "tone-adjusted text only"}`,
    expand: `Expand the provided text with more relevant detail. Output ONLY the expanded version of that exact text. Return: {"output": "expanded text only"}`,
    shorten: `Shorten the provided text while keeping all key information. Output ONLY the shortened version of that exact text. Return: {"output": "shortened text only"}`,
    draft: `Draft a message based on the user's description. ${toneStr} Write it in a ${tone ?? "professional"} tone. Return: {"output": "drafted message"}`,
    bullet_summary: `Summarize the page content as bullet points. Return: {"summary": "one sentence overview", "keyPoints": ["point 1", "point 2", ...]}`,
    key_insights: `Extract key insights and important information. Return: {"summary": "brief overview", "keyPoints": ["insight 1", ...]}`,
    action_items: `Extract all action items and next steps from the content. Return: {"actionItems": ["action 1", ...]}`,
    risk_flags: `Identify risks, concerns, and warnings in the content. Return: {"risks": ["risk 1", ...], "summary": "overall risk assessment"}`,
    explain: `Explain the selected content clearly, as if teaching someone. Return: {"output": "explanation"}`,
    debug: `Analyze this code or error and suggest fixes. Return: {"output": "diagnosis and fix", "keyPoints": ["fix 1", ...]}`,
    solve: `Solve the problem or answer the question. Return: {"output": "solution", "keyPoints": ["step 1", ...]}`,
    extract: `Extract the key information from the content. Return: {"output": "what was extracted", "keyPoints": ["item 1", ...]}`,
  }

  return `${schemas[intent]}${selectedStr}${pageStr}${customStr}

Respond ONLY with valid JSON. No markdown, no code blocks, no extra text.`
}
