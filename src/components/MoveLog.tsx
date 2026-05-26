import { useState } from 'react'
import type { MoveLogEntry } from '@/games/types'
import type { BotConfig } from '@/lib/llm'
import { botIcon, CaretRight } from './icons'
import { cn } from '@/lib/cn'

interface Props {
  entries: MoveLogEntry[]
  botA: BotConfig
  botB: BotConfig
  describeMove: (move: unknown) => string
}

export function MoveLog({ entries, botA, botB, describeMove }: Props) {
  return (
    <div className="p-3 h-full overflow-y-auto" data-testid="move-log">
      {entries.length === 0 && (
        <div className="text-sm italic opacity-60">No moves yet.</div>
      )}
      <ul className="flex flex-col gap-2">
        {entries.map((e) => {
          const bot = e.player === 'A' ? botA : botB
          return (
            <MoveLogItem
              key={e.turn}
              entry={e}
              bot={bot}
              describeMove={describeMove}
            />
          )
        })}
      </ul>
    </div>
  )
}

function MoveLogItem({
  entry,
  bot,
  describeMove,
}: {
  entry: MoveLogEntry
  bot: BotConfig
  describeMove: (move: unknown) => string
}) {
  const [open, setOpen] = useState(false)
  const Icon = botIcon(bot.id)
  const hasReasoning = !!entry.reasoning?.trim()
  return (
    <li
      className="border-[2.5px] border-black rounded-xl p-2"
      style={{ background: bot.accent, boxShadow: '3px 3px 0 0 #0a0a0a' }}
    >
      <button
        type="button"
        onClick={() => hasReasoning && setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-sm font-bold text-left"
        disabled={!hasReasoning}
        data-testid={`move-log-${entry.turn}`}
        data-open={open || undefined}
      >
        <Icon size={16} weight="duotone" />
        <span>{bot.name}</span>
        <span className="nb-badge bg-white text-xs">{describeMove(entry.move)}</span>
        <span className="ml-auto text-xs opacity-70 flex items-center gap-1">
          #{entry.turn}
          {hasReasoning && (
            <CaretRight
              size={12}
              weight="bold"
              className={cn('transition-transform', open && 'rotate-90')}
            />
          )}
        </span>
      </button>
      {entry.outcome && (
        <div className="text-[11px] mt-1 font-bold uppercase tracking-wide opacity-90">
          ↳ {entry.outcome} · score {entry.scoreAfter.A}-{entry.scoreAfter.B}
        </div>
      )}
      {open && hasReasoning && (
        <div className="text-xs mt-2 italic leading-snug max-h-[200px] overflow-y-auto whitespace-pre-wrap border-t border-black/20 pt-2">
          “{entry.reasoning}”
        </div>
      )}
    </li>
  )
}
