import type { BotConfig } from '@/lib/llm'
import { cn } from '@/lib/cn'
import { botIcon } from './icons'

interface Props {
  bot: BotConfig
  slot: 'A' | 'B'
  score: number
  active?: boolean
  thinking?: boolean
}

export function BotCard({ bot, slot, score, active, thinking }: Props) {
  const Icon = botIcon(bot.id)
  return (
    <div
      className={cn(
        'nb-card p-2.5 flex items-center gap-3 transition-transform',
        active && 'translate-y-[-2px]',
      )}
      style={{ background: active ? bot.accent : 'white' }}
      data-testid={`bot-card-${slot.toLowerCase()}`}
    >
      <div
        className={cn(
          'w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[2.5px] border-black bg-white flex items-center justify-center shrink-0',
          thinking && 'thinking-ring',
        )}
      >
        <Icon size={24} weight="duotone" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-extrabold leading-none">{bot.name}</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm border-[1.5px] border-black bg-white/70"
            aria-label={`Player ${slot}`}
          >
            {slot}
          </span>
          {thinking && (
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 wiggle inline-block">
              thinking…
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono opacity-60 mt-0.5 truncate">
          {bot.model}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[9px] uppercase tracking-wider opacity-70 leading-none">
          score
        </div>
        <div className="text-2xl font-extrabold leading-none mt-0.5">{score}</div>
      </div>
    </div>
  )
}
