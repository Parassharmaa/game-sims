import type { MoveLogEntry } from '@/games/types'
import type { BotConfig } from '@/lib/llm'

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
            <li
              key={e.turn}
              className="border-[2.5px] border-black rounded-xl p-2"
              style={{ background: bot.accent, boxShadow: '3px 3px 0 0 #0a0a0a' }}
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-lg">{bot.emoji}</span>
                <span>{bot.name}</span>
                <span className="nb-badge bg-white text-xs">
                  {describeMove(e.move)}
                </span>
                <span className="ml-auto text-xs opacity-70">#{e.turn}</span>
              </div>
              {e.outcome && (
                <div className="text-[11px] mt-1 font-bold uppercase tracking-wide opacity-90">
                  ↳ {e.outcome} · score {e.scoreAfter.A}-{e.scoreAfter.B}
                </div>
              )}
              {e.reasoning && (
                <div className="text-xs mt-1 italic leading-snug">
                  “{e.reasoning}”
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
