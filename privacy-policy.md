# Privacy Policy — ContextIQ Browser AI Agent

**Last updated:** March 17, 2026

## Overview

ContextIQ is a Chrome extension that provides AI-powered writing, summarization, research, and problem-solving assistance. This policy explains what data the extension accesses, how it is used, and how it is stored.

## Data Collection and Usage

### Data accessed by the extension

| Data | Purpose | Stored? |
|------|---------|---------|
| **Page content** (title, body text, selected text) | Sent to the Groq AI API to generate AI responses (summaries, rewrites, solutions) | Not stored permanently; only transmitted during the active request |
| **Tab titles and URLs** | Displayed in the Research Mode tab selector so you can choose which tabs to synthesize | Not stored; read only while the tab selector is open |
| **Groq API key** | Authenticates requests to the Groq API on your behalf | Stored in `chrome.storage.sync` (Chrome's encrypted synced storage) |
| **API call logs** (intent type, latency, success/failure, input/output sizes) | Displayed in the Settings > Logs viewer for your debugging and observability | Stored locally in `chrome.storage.local` with a 100-entry rotation limit |

### Data NOT collected

- No personally identifiable information (name, email, address)
- No browsing history beyond what you explicitly select in Research Mode
- No financial, health, or location data
- No keystroke logging or mouse tracking
- No analytics or telemetry sent to any server

## Third-Party Services

The only external service ContextIQ communicates with is the **Groq API** (`api.groq.com`). Page content you submit for processing is sent to Groq and handled according to [Groq's Privacy Policy](https://groq.com/privacy-policy/). No data is sent to any other third party.

## Data Sharing

- We do **not** sell or transfer user data to third parties.
- We do **not** use user data for advertising, analytics, or any purpose unrelated to the extension's core functionality.
- We do **not** use user data to determine creditworthiness or for lending purposes.

## Data Storage and Security

- Your API key is stored in Chrome's encrypted synced storage (`chrome.storage.sync`).
- API call logs are stored locally on your device (`chrome.storage.local`) and are never transmitted externally.
- All communication with the Groq API is over HTTPS.
- Input validation and prompt injection detection are built into the extension to protect against misuse.

## User Control

- You can delete your stored API key at any time from the Settings tab.
- You can clear API logs from the Settings tab.
- Uninstalling the extension removes all locally stored data.

## Changes to This Policy

If this policy is updated, the changes will be reflected on this page with an updated date.

## Contact

If you have questions about this privacy policy, please open an issue at the extension's GitHub repository.
