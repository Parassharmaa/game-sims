import { Fragment, useMemo } from 'react'
import type { GomokuState, GomokuMove } from '@/games/gomoku'
import type { BotConfig } from '@/lib/llm'
import { cn } from '@/lib/cn'

interface Props {
  state: GomokuState
  botA: BotConfig
  botB: BotConfig
  legalMoves?: GomokuMove[]
  onSelectMove?: (move: GomokuMove) => void
}

const COLS = 'ABCDEFGHI'

export function GomokuBoard({ state, botA, botB, legalMoves, onSelectMove }: Props) {
  const interactive = !!legalMoves && !!onSelectMove
  const legalSet = useMemo(
    () => new Set(legalMoves?.map((m) => `${m.row},${m.col}`) ?? []),
    [legalMoves],
  )

  return (
    <div
      className="nb-card-lg inline-block p-4"
      style={{ background: '#f3c977' }}
      data-testid="gomoku-board"
      data-interactive={interactive || undefined}
    >
      <div className="grid grid-cols-[auto_repeat(9,1fr)] gap-1 items-center">
        <div />
        {COLS.split('').map((c) => (
          <div key={c} className="text-center font-bold text-sm">
            {c}
          </div>
        ))}
        {state.board.map((row, r) => (
          <Fragment key={r}>
            <div className="text-center font-bold text-sm">{r + 1}</div>
            {row.map((cell, c) => {
              const isLast = state.lastMove?.row === r && state.lastMove?.col === c
              const isLegal = interactive && legalSet.has(`${r},${c}`)
              const bg =
                cell === 'A' ? botA.accent : cell === 'B' ? botB.accent : 'transparent'
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!isLegal}
                  onClick={() => isLegal && onSelectMove?.({ row: r, col: c })}
                  className={cn(
                    'w-10 h-10 sm:w-12 sm:h-12 border-[2px] border-black flex items-center justify-center rounded-sm transition-transform',
                    isLegal && 'cursor-pointer hover:scale-95',
                  )}
                  style={{
                    background: '#e5b35a',
                    cursor: isLegal ? 'pointer' : 'default',
                  }}
                  data-cell={`${COLS[c]}${r + 1}`}
                  data-legal={isLegal || undefined}
                >
                  {cell !== '.' ? (
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-[2px] border-black pop"
                      style={{
                        background: bg,
                        boxShadow: isLast
                          ? '0 0 0 3px white, 0 0 0 5px #0a0a0a'
                          : '2px 2px 0 0 #0a0a0a',
                      }}
                    />
                  ) : isLegal ? (
                    <div className="w-2 h-2 rounded-full bg-black/40" />
                  ) : null}
                </button>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
