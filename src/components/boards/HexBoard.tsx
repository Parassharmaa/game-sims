import { Fragment, useMemo } from 'react'
import type { HexState, HexMove } from '@/games/hex'
import type { BotConfig } from '@/lib/llm'
import { cn } from '@/lib/cn'

interface Props {
  state: HexState
  botA: BotConfig
  botB: BotConfig
  legalMoves?: HexMove[]
  onSelectMove?: (move: HexMove) => void
}

const COLS = 'ABCDEFGHI'

export function HexBoard({ state, botA, botB, legalMoves, onSelectMove }: Props) {
  const interactive = !!legalMoves && !!onSelectMove
  const legalSet = useMemo(
    () => new Set(legalMoves?.map((m) => `${m.row},${m.col}`) ?? []),
    [legalMoves],
  )
  return (
    <div
      className="nb-card-lg inline-block p-4 sm:p-5"
      style={{ background: '#1f1f24' }}
      data-testid="hex-board"
      data-interactive={interactive || undefined}
    >
      <div
        className="border-y-[6px] mx-auto"
        style={{ borderColor: botA.accent, padding: '6px 0' }}
      >
        <div
          className="flex flex-col gap-[3px] border-x-[6px] mx-auto"
          style={{ borderColor: botB.accent, padding: '0 6px' }}
        >
          {state.board.map((row, r) => (
            <Fragment key={r}>
              <div className="flex gap-[3px]" style={{ marginLeft: `${r * 13}px` }}>
                <div className="text-white font-bold text-xs w-5 text-right mr-1 self-center">
                  {r + 1}
                </div>
                {row.map((cell, c) => {
                  const bg =
                    cell === 'A'
                      ? botA.accent
                      : cell === 'B'
                        ? botB.accent
                        : '#3a3a44'
                  const isLast =
                    state.lastMove?.row === r && state.lastMove?.col === c
                  const isLegal = interactive && legalSet.has(`${r},${c}`)
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={!isLegal}
                      onClick={() => isLegal && onSelectMove?.({ row: r, col: c })}
                      className={cn(
                        'w-9 h-9 sm:w-11 sm:h-11 border-[2px] border-black flex items-center justify-center text-[10px] font-bold text-white/70 transition-transform',
                        isLegal && 'cursor-pointer hover:scale-95',
                      )}
                      style={{
                        background: bg,
                        borderRadius: '50%',
                        boxShadow: isLast ? '0 0 0 3px white' : undefined,
                        cursor: isLegal ? 'pointer' : 'default',
                      }}
                      data-cell={`${COLS[c]}${r + 1}`}
                      data-legal={isLegal || undefined}
                    >
                      {cell === '.' && (
                        <span className={cn('opacity-40', isLegal && 'opacity-90')}>
                          {COLS[c]}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
      <div className="text-center text-[10px] text-white/60 mt-2 uppercase tracking-widest">
        A connects top ↔ bottom · B connects left ↔ right
      </div>
    </div>
  )
}
