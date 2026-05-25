import { Fragment, useMemo } from 'react'
import type { ReversiState, ReversiMove } from '@/games/reversi'
import type { BotConfig } from '@/lib/llm'
import { cn } from '@/lib/cn'

interface Props {
  state: ReversiState
  botA: BotConfig
  botB: BotConfig
  highlightMove?: { row: number; col: number } | null
  legalMoves?: ReversiMove[]
  onSelectMove?: (move: ReversiMove) => void
}

const COLS = 'ABCDEFGH'

export function ReversiBoard({
  state,
  botA,
  botB,
  highlightMove,
  legalMoves,
  onSelectMove,
}: Props) {
  const interactive = !!legalMoves && !!onSelectMove
  const legalSet = useMemo(
    () => new Set(legalMoves?.map((m) => `${m.row},${m.col}`) ?? []),
    [legalMoves],
  )

  return (
    <div
      className="nb-card-lg inline-block p-4"
      style={{ background: '#2f8f5b' }}
      data-testid="reversi-board"
      data-interactive={interactive || undefined}
    >
      <div className="grid grid-cols-[auto_repeat(8,1fr)] gap-1 items-center">
        <div />
        {COLS.split('').map((c) => (
          <div key={c} className="text-center text-white font-bold text-sm">
            {c}
          </div>
        ))}
        {state.board.map((row, r) => (
          <Fragment key={r}>
            <div className="text-center text-white font-bold text-sm">{r + 1}</div>
            {row.map((cell, c) => {
              const isLast = highlightMove?.row === r && highlightMove?.col === c
              const isLegal = interactive && legalSet.has(`${r},${c}`)
              const bg =
                cell === 'A'
                  ? botA.accent
                  : cell === 'B'
                    ? botB.accent
                    : 'transparent'
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!isLegal}
                  onClick={() => isLegal && onSelectMove?.({ row: r, col: c })}
                  className={cn(
                    'w-11 h-11 sm:w-14 sm:h-14 border-[2px] border-black flex items-center justify-center rounded-md transition-transform',
                    isLegal && 'cursor-pointer hover:scale-95',
                  )}
                  style={{
                    background: '#3aaa6e',
                    cursor: isLegal ? 'pointer' : 'default',
                  }}
                  data-cell={`${COLS[c]}${r + 1}`}
                  data-legal={isLegal || undefined}
                >
                  {cell !== '.' ? (
                    <div
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-[2px] border-black pop"
                      style={{
                        background: bg,
                        boxShadow: isLast
                          ? '0 0 0 3px white, 0 0 0 5px #0a0a0a'
                          : '2px 2px 0 0 #0a0a0a',
                      }}
                    />
                  ) : isLegal ? (
                    <div className="w-3 h-3 rounded-full border-[2px] border-white opacity-80 animate-pulse" />
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
