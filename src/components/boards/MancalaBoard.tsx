import { useMemo } from 'react'
import type { MancalaState, MancalaMove } from '@/games/mancala'
import type { BotConfig } from '@/lib/llm'
import { cn } from '@/lib/cn'

interface Props {
  state: MancalaState
  botA: BotConfig
  botB: BotConfig
  legalMoves?: MancalaMove[]
  onSelectMove?: (move: MancalaMove) => void
}

const A_PITS = [0, 1, 2, 3, 4, 5]
const B_PITS = [7, 8, 9, 10, 11, 12]

function Pit({
  seeds,
  label,
  accent,
  legal,
  onClick,
}: {
  seeds: number
  label: string
  accent: string
  legal: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!legal}
      data-legal={legal || undefined}
      data-pit={label}
      className={cn(
        'border-[3px] border-black rounded-full aspect-square w-14 sm:w-16 flex flex-col items-center justify-center transition-transform',
        legal && 'cursor-pointer hover:scale-95 ring-2 ring-white',
      )}
      style={{
        background: accent,
        boxShadow: '4px 4px 0 0 #0a0a0a',
        cursor: legal ? 'pointer' : 'default',
      }}
    >
      <div className="text-2xl font-bold">{seeds}</div>
      <div className="text-[10px] uppercase font-bold opacity-70">#{label}</div>
    </button>
  )
}

function Store({ seeds, bot, emoji }: { seeds: number; bot: BotConfig; emoji?: string }) {
  return (
    <div
      className="border-[3px] border-black rounded-3xl w-16 sm:w-20 h-32 sm:h-40 flex flex-col items-center justify-center"
      style={{ background: bot.accent, boxShadow: '5px 5px 0 0 #0a0a0a' }}
    >
      <div className="text-xl font-bold uppercase opacity-70">{emoji ?? bot.name[0]}</div>
      <div className="text-3xl font-extrabold">{seeds}</div>
      <div className="text-[10px] uppercase font-bold">store</div>
    </div>
  )
}

export function MancalaBoard({ state, botA, botB, legalMoves, onSelectMove }: Props) {
  const legalSet = useMemo(
    () => new Set(legalMoves?.map((m) => m.pit) ?? []),
    [legalMoves],
  )
  const interactive = !!legalMoves && !!onSelectMove
  return (
    <div
      className="nb-card-lg inline-block p-4 sm:p-6"
      style={{ background: '#d9a96a' }}
      data-testid="mancala-board"
      data-interactive={interactive || undefined}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <Store seeds={state.pits[13]} bot={botB} emoji={botB.name[0]} />
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 sm:gap-3">
            {[...B_PITS].reverse().map((i) => (
              <Pit
                key={i}
                seeds={state.pits[i]}
                label={String(i)}
                accent={botB.accent}
                legal={interactive && legalSet.has(i)}
                onClick={() => onSelectMove?.({ pit: i })}
              />
            ))}
          </div>
          <div className="flex gap-2 sm:gap-3">
            {A_PITS.map((i) => (
              <Pit
                key={i}
                seeds={state.pits[i]}
                label={String(i)}
                accent={botA.accent}
                legal={interactive && legalSet.has(i)}
                onClick={() => onSelectMove?.({ pit: i })}
              />
            ))}
          </div>
        </div>
        <Store seeds={state.pits[6]} bot={botA} emoji={botA.name[0]} />
      </div>
    </div>
  )
}
