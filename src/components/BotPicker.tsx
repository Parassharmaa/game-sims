import { DEFAULT_BOTS } from '@/lib/bots'
import type { BotConfig } from '@/lib/llm'

interface Props {
  label: string
  bot: BotConfig
  onChange: (bot: BotConfig) => void
  availableModels: string[]
  disabled?: boolean
}

export function BotPicker({ label, bot, onChange, availableModels, disabled }: Props) {
  return (
    <div
      className="nb-card p-3 flex items-center gap-3"
      style={{ background: bot.accent }}
      data-testid={`bot-picker-${label.toLowerCase()}`}
    >
      <span className="text-3xl border-[2px] border-black rounded-full bg-white w-12 h-12 flex items-center justify-center">
        {bot.emoji}
      </span>
      <div className="flex-1 flex flex-col gap-1">
        <label className="text-[10px] uppercase font-bold tracking-wider opacity-70">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <select
            value={bot.id}
            disabled={disabled}
            onChange={(e) => {
              const next = DEFAULT_BOTS.find((b) => b.id === e.target.value)
              if (next) onChange({ ...next, model: bot.model })
            }}
            className="nb-chip bg-white text-sm cursor-pointer"
            data-testid={`bot-name-${label.toLowerCase()}`}
          >
            {DEFAULT_BOTS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.emoji} {b.name}
              </option>
            ))}
          </select>
          <select
            value={bot.model}
            disabled={disabled}
            onChange={(e) => onChange({ ...bot, model: e.target.value })}
            className="nb-chip bg-white text-sm font-mono cursor-pointer flex-1"
            data-testid={`bot-model-${label.toLowerCase()}`}
          >
            {availableModels.length === 0 && (
              <option value={bot.model}>{bot.model}</option>
            )}
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
