# ContextIQ — Browser AI Agent

A multi-agent Chrome extension that provides AI-powered writing assistance, page summarization, multi-tab research synthesis, and problem solving — all powered by Groq's LLaMA 3.3 70B model.

## Features

- **Writing Agent** — Fix grammar, rewrite, change tone, expand, shorten, or draft new content
- **Summarize Agent** — Bullet summaries, key insights, action items, risk flags, and free-form Q&A on any page
- **Research Mode** — Select multiple open tabs and synthesize a unified research summary with dynamic content budgeting
- **Solve Agent** — Explain problems with hints or generate complete code solutions
- **Replace in Page** — Directly replace selected text in editable fields (inputs, textareas) with AI output

## Architecture

```
popup.tsx                  # Main UI — tab navigation, context extraction
├── components/
│   ├── WritingTab.tsx      # Edit & Draft modes with tone selection
│   ├── SummarizeTab.tsx    # Page & Research modes, multi-tab extraction
│   ├── SolveTab.tsx        # Explain & Solve with optional instructions
│   ├── SettingsTab.tsx     # API key management, log viewer
│   └── ResultBox.tsx       # Shared result display with code detection
├── lib/
│   ├── types.ts            # Shared TypeScript types
│   ├── prompts.ts          # Intent-specific prompt builder
│   ├── grok-client.ts      # Groq API client with JSON parsing
│   ├── logger.ts           # Structured logging (chrome.storage.local)
│   ├── rate-limiter.ts     # Sliding window rate limiter (10 req/min)
│   └── security.ts         # Input validation & prompt injection detection
├── background.ts           # Service worker — message routing, API calls
├── content.ts              # Content script — page context & text replacement
└── tests/                  # Unit tests (vitest)
```

**Data Flow:**
1. User interacts with popup UI
2. Popup sends message to background service worker
3. Background validates input (security), checks rate limit, calls Groq API
4. Structured JSON response is parsed and logged
5. Result displayed in popup; user can copy or replace text in page

## Production Readiness

| Area | Implementation |
|------|---------------|
| **Observability** | Structured logging of every API call (intent, latency, success/failure, I/O sizes). Viewable in Settings > Logs |
| **Rate Limiting** | Sliding window limiter — 10 requests per 60 seconds with user-friendly retry messages |
| **Security** | Input length caps (10K chars), prompt injection detection (7 patterns), control character sanitization |
| **Error Handling** | Graceful fallbacks at every layer — API errors, JSON parse failures, content script failures |
| **Testing** | 26 unit tests covering prompts, rate limiter, and security validation |
| **Storage** | API key in `chrome.storage.sync` (encrypted), logs in `chrome.storage.local` with 100-entry rotation |

## Tech Stack

- **Framework:** Plasmo 0.90.5 (Chrome Extension with React 18)
- **Styling:** Tailwind CSS 3 with JIT mode
- **AI:** Groq API — LLaMA 3.3 70B Versatile
- **Testing:** Vitest
- **Language:** TypeScript 5.3

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Load extension: chrome://extensions → Load unpacked → build/chrome-mv3-dev

# Run tests
pnpm test

# Production build
pnpm build
```

## Configuration

1. Get a free API key from [console.groq.com](https://console.groq.com)
2. Open the extension popup → Settings tab
3. Paste your API key and click Save
