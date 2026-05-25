import { useMemo } from 'react'
import type { UTTTState, UTTTMove } from '@/games/ultimateTicTacToe'
import type { BotConfig } from '@/lib/llm'
import { cn } from '@/lib/cn'

interface Props {
  state: UTTTState
  botA: BotConfig
  botB: BotConfig
  legalMoves?: UTTTMove[]
  onSelectMove?: (move: UTTTMove) => void
}

function MarkDot({
  value,
  botA,
  botB,
}: {
  value: '.' | 'A' | 'B'
  botA: BotConfig
  botB: BotConfig
}) {
  if (value === '.') return null
  const bg = value === 'A' ? botA.accent : botB.accent
  return (
    <div
      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[2px] border-black pop"
      style={{ background: bg, boxShadow: '2px 2px 0 0 #0a0a0a' }}
    />
  )
}

export function UltimateTTTBoard({ state, botA, botB, legalMoves, onSelectMove }: Props) {
  const interactive = !!legalMoves && !!onSelectMove
  const legalSet = useMemo(
    () =>
      new Set(legalMoves?.map((m) => `${m.br},${m.bc},${m.cr},${m.cc}`) ?? []),
    [legalMoves],
  )
  return (
    <div
      className="nb-card-lg inline-block p-4 sm:p-5"
      style={{ background: '#3a2a4d' }}
      data-testid="utttt-board"
      data-interactive={interactive || undefined}
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {state.cells.map((row, br) =>
          row.map((sub, bc) => {
            const winner = state.subWinners[br][bc]
            const isForced =
              state.forced && state.forced.br === br && state.forced.bc === bc
            const bg =
              winner === 'A'
                ? botA.accent
                : winner === 'B'
                  ? botB.accent
                  : winner === 'T'
                    ? '#a39bb1'
                    : isForced
                      ? '#fff2c0'
                      : '#fff'
            return (
              <div
                key={`${br}-${bc}`}
                className="border-[3px] border-black rounded-xl p-2 flex flex-col items-center justify-center relative"
                style={{
                  background: bg,
                  boxShadow: isForced
                    ? '0 0 0 3px #fbd84a, 4px 4px 0 0 #0a0a0a'
                    : '4px 4px 0 0 #0a0a0a',
                  minWidth: '92px',
                }}
                data-sub={`${br},${bc}`}
                data-forced={isForced || undefined}
                data-winner={winner !== '.' ? winner : undefined}
              >
                {winner !== '.' ? (
                  <div className="text-4xl sm:text-5xl font-extrabold">
                    {winner === 'T' ? '═' : winner === 'A' ? '◤' : '◥'}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {sub.map((sr, cr) =>
                      sr.map((c, cc) => {
                        const key = `${br},${bc},${cr},${cc}`
                        const isLegal = interactive && legalSet.has(key)
                        return (
                          <button
                            type="button"
                            key={`${cr}-${cc}`}
                            disabled={!isLegal}
                            onClick={() => isLegal && onSelectMove?.({ br, bc, cr, cc })}
                            className={cn(
                              'w-8 h-8 sm:w-9 sm:h-9 border-[1.5px] border-black/50 rounded-sm flex items-center justify-center transition-transform',
                              isLegal && 'cursor-pointer hover:scale-95',
                            )}
                            style={{
                              background: '#fdfaf2',
                              cursor: isLegal ? 'pointer' : 'default',
                            }}
                            data-cell={key}
                            data-legal={isLegal || undefined}
                          >
                            <MarkDot value={c} botA={botA} botB={botB} />
                          </button>
                        )
                      }),
                    )}
                  </div>
                )}
              </div>
            )
          }),
        )}
      </div>
      {state.forced && (
        <div className="mt-3 text-center text-xs font-bold uppercase tracking-widest text-white/80">
          ↑ next move must land in highlighted board
        </div>
      )}
    </div>
  )
}
