interface Props {
  apiKey: string
  setApiKey: (key: string) => void
  apiKeySaved: boolean
  onSave: () => void
}

export function SettingsTab({ apiKey, setApiKey, apiKeySaved, onSave }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
          Groq API Key
        </label>
        <input
          type="password"
          className="w-full rounded-lg bg-neutral-900 border border-white/10 text-neutral-100 text-sm px-3 py-2 focus:outline-none focus:border-violet-500/50 placeholder-neutral-600"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="gsk_..."
        />
        <p className="text-[11px] text-neutral-600 leading-relaxed">
          Get your free key at{" "}
          <span className="text-violet-400">console.groq.com</span>. Stored locally in
          Chrome's encrypted storage — never sent anywhere else.
        </p>
      </div>

      <button
        onClick={onSave}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
          apiKeySaved
            ? "bg-emerald-600 text-white"
            : "bg-violet-600 hover:bg-violet-500 text-white"
        }`}
      >
        {apiKeySaved ? "✓ Saved!" : "Save API Key"}
      </button>

      <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-600">Rate limit</span>
          <span className="text-[11px] text-neutral-400">10 req / min</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-600">Model</span>
          <span className="text-[11px] text-neutral-400">llama-3.3-70b (Groq)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-600">Prompt version</span>
          <span className="text-[11px] text-neutral-400">v1.3.0</span>
        </div>
      </div>
    </div>
  )
}
