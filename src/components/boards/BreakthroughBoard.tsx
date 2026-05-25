import { Fragment, useMemo, useState } from 'react'
import type { BreakthroughState, BreakthroughMove } from '@/games/breakthrough'
import type { BotConfig } from '@/lib/llm'
import { cn } from '@/lib/cn'

interface Props {
  state: BreakthroughState
  botA: BotConfig
  botB: BotConfig
  legalMoves?: BreakthroughMove[]
  onSelectMove?: (move: BreakthroughMove) => void
}

const COLS = 'ABCDEF'

export function BreakthroughBoard({
  state,
  botA,
  botB,
  legalMoves,
  onSelectMove,
}: Props) {
  const interactive = !!legalMoves && !!onSelectMove
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null)

  // Map from "fromRow,fromCol" -> list of legal destinations
  const fromIndex = useMemo(() => {
    const map = new Map<string, BreakthroughMove[]>()
    for (const m of legalMoves ?? []) {
      const key = `${m.fromRow},${m.fromCol}`
      const arr = map.get(key) ?? []
      arr.push(m)
      map.set(key, arr)
    }
    return map
  }, [legalMoves])

  const selectedDests =
    interactive && selected
      ? fromIndex.get(`${selected.row},${selected.col}`) ?? []
      : []
  const destSet = useMemo(
    () => new Set(selectedDests.map((m) => `${m.toRow},${m.toCol}`)),
    [selectedDests],
  )

  const onCellClick = (r: number, c: number) => {
    if (!interactive) return
    // If clicking a friendly pawn that has legal moves, select it.
    const movesFromHere = fromIndex.get(`${r},${c}`) ?? []
    if (movesFromHere.length > 0) {
      setSelected({ row: r, col: c })
      return
    }
    // If clicking a legal destination of the selected pawn, commit the move.
    if (selected && destSet.has(`${r},${c}`)) {
      const found = selectedDests.find((m) => m.toRow === r && m.toCol === c)!
      setSelected(null)
      onSelectMove?.(found)
      return
    }
    // Otherwise deselect.
    setSelected(null)
  }

  return (
    <div
      className="nb-card-lg inline-block p-4"
      style={{ background: '#4a3327' }}
      data-testid="breakthrough-board"
      data-interactive={interactive || undefined}
    >
      <div className="grid grid-cols-[auto_repeat(6,1fr)] gap-1 items-center">
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
              const isDark = (r + c) % 2 === 1
              const bg =
                cell === 'A' ? botA.accent : cell === 'B' ? botB.accent : 'transparent'
              const movable = interactive && fromIndex.has(`${r},${c}`)
              const isSelected = selected?.row === r && selected?.col === c
              const isDest = interactive && destSet.has(`${r},${c}`)
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!movable && !isDest}
                  onClick={() => onCellClick(r, c)}
                  className={cn(
                    'w-12 h-12 sm:w-16 sm:h-16 border-[2px] border-black flex items-center justify-center rounded-sm transition-transform',
                    (movable || isDest) && 'cursor-pointer hover:scale-95',
                    isSelected && 'ring-2 ring-yellow-300',
                  )}
                  style={{
                    background: isDark ? '#7a5a47' : '#a07a5a',
                    cursor: movable || isDest ? 'pointer' : 'default',
                  }}
                  data-cell={`${COLS[c]}${r + 1}`}
                  data-movable={movable || undefined}
                  data-dest={isDest || undefined}
                  data-selected={isSelected || undefined}
                >
                  {cell !== '.' ? (
                    <div
                      className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-[2px] border-black pop flex items-center justify-center text-lg"
                      style={{ background: bg, boxShadow: '2px 2px 0 0 #0a0a0a' }}
                    >
                      ●
                    </div>
                  ) : isDest ? (
                    <div className="w-4 h-4 rounded-full bg-yellow-300/80 border-[2px] border-black animate-pulse" />
                  ) : null}
                </button>
              )
            })}
          </Fragment>
        ))}
      </div>
      {interactive && (
        <div className="mt-2 text-center text-[11px] text-white/70 uppercase tracking-widest">
          {selected ? 'click a yellow square to move' : 'click one of your pawns'}
        </div>
      )}
    </div>
  )
}
