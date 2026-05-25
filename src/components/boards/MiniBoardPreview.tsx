/**
 * Small static previews of each game's board, used on the game-picker cards.
 * Pure decoration — no interactivity, no game state.
 */
type Game = 'reversi' | 'gomoku' | 'mancala' | 'hex' | 'breakthrough' | 'utttt'
interface Props {
  game: Game
}

export function MiniBoardPreview({ game }: Props) {
  if (game === 'reversi') return <ReversiMini />
  if (game === 'gomoku') return <GomokuMini />
  if (game === 'mancala') return <MancalaMini />
  if (game === 'hex') return <HexMini />
  if (game === 'breakthrough') return <BreakthroughMini />
  return <UltimateTTTMini />
}

function ReversiMini() {
  const cells = Array.from({ length: 25 }, (_, i) => {
    const r = Math.floor(i / 5)
    const c = i % 5
    if (r === 2 && c === 2) return 'A'
    if (r === 2 && c === 3) return 'B'
    if (r === 3 && c === 2) return 'B'
    if (r === 3 && c === 3) return 'A'
    return null
  })
  return (
    <div
      className="rounded-lg border-[2.5px] border-black p-1.5 grid grid-cols-5 gap-[3px]"
      style={{ background: '#2f8f5b', boxShadow: '3px 3px 0 0 #0a0a0a' }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm"
          style={{ background: '#3aaa6e' }}
        >
          {c && (
            <div
              className="w-full h-full rounded-full border border-black"
              style={{
                background: c === 'A' ? 'var(--color-arena-pink)' : 'var(--color-arena-mint)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function GomokuMini() {
  const sample: Record<string, 'A' | 'B'> = {
    '1,1': 'A', '2,2': 'A', '3,3': 'A',
    '1,3': 'B', '2,3': 'B',
  }
  return (
    <div
      className="rounded-lg border-[2.5px] border-black p-1.5 grid grid-cols-6 gap-[2px]"
      style={{ background: '#e5b35a', boxShadow: '3px 3px 0 0 #0a0a0a' }}
    >
      {Array.from({ length: 36 }, (_, i) => {
        const r = Math.floor(i / 6)
        const c = i % 6
        const v = sample[`${r},${c}`]
        return (
          <div
            key={i}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px]"
            style={{ background: '#d49f43' }}
          >
            {v && (
              <div
                className="w-full h-full rounded-full border border-black"
                style={{
                  background:
                    v === 'A' ? 'var(--color-arena-pink)' : 'var(--color-arena-mint)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function HexMini() {
  const rows = [
    ['.', 'A', '.', '.'],
    ['.', 'A', 'B', '.'],
    ['.', '.', 'A', 'B'],
    ['.', 'B', 'A', '.'],
  ]
  return (
    <div
      className="rounded-lg border-[2.5px] border-black p-2 flex flex-col gap-[2px]"
      style={{ background: '#1f1f24', boxShadow: '3px 3px 0 0 #0a0a0a' }}
    >
      {rows.map((row, r) => (
        <div key={r} className="flex gap-[2px]" style={{ marginLeft: `${r * 5}px` }}>
          {row.map((cell, c) => (
            <div
              key={c}
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-black"
              style={{
                background:
                  cell === 'A'
                    ? 'var(--color-arena-pink)'
                    : cell === 'B'
                      ? 'var(--color-arena-mint)'
                      : '#3a3a44',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function BreakthroughMini() {
  const board: ('A' | 'B' | '.')[][] = [
    ['A', 'A', 'A', 'A'],
    ['A', 'A', 'A', 'A'],
    ['.', '.', '.', '.'],
    ['.', '.', '.', '.'],
    ['B', 'B', 'B', 'B'],
    ['B', 'B', 'B', 'B'],
  ]
  return (
    <div
      className="rounded-lg border-[2.5px] border-black p-1.5 grid grid-cols-4 gap-[2px]"
      style={{ background: '#4a3327', boxShadow: '3px 3px 0 0 #0a0a0a' }}
    >
      {board.flat().map((v, i) => {
        const r = Math.floor(i / 4)
        const c = i % 4
        const isDark = (r + c) % 2 === 1
        return (
          <div
            key={i}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[2px] flex items-center justify-center"
            style={{ background: isDark ? '#7a5a47' : '#a07a5a' }}
          >
            {v !== '.' && (
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-black"
                style={{
                  background:
                    v === 'A' ? 'var(--color-arena-pink)' : 'var(--color-arena-mint)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function UltimateTTTMini() {
  const winners: Array<'A' | 'B' | '.'> = ['A', '.', '.', '.', 'B', '.', '.', '.', 'A']
  return (
    <div
      className="rounded-lg border-[2.5px] border-black p-1.5 grid grid-cols-3 gap-[3px]"
      style={{ background: '#3a2a4d', boxShadow: '3px 3px 0 0 #0a0a0a' }}
    >
      {winners.map((w, i) => (
        <div
          key={i}
          className="w-5 h-5 sm:w-6 sm:h-6 border border-black rounded-sm flex items-center justify-center"
          style={{
            background:
              w === 'A'
                ? 'var(--color-arena-pink)'
                : w === 'B'
                  ? 'var(--color-arena-mint)'
                  : '#fdfaf2',
          }}
        >
          {w === '.' && (
            <div className="grid grid-cols-3 gap-[1px]">
              {Array.from({ length: 9 }, (_, j) => (
                <div key={j} className="w-1 h-1 bg-black/30 rounded-[1px]" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MancalaMini() {
  return (
    <div
      className="rounded-xl border-[2.5px] border-black p-2 flex items-center gap-1.5"
      style={{ background: '#c89254', boxShadow: '3px 3px 0 0 #0a0a0a' }}
    >
      <div
        className="border-[2px] border-black rounded-full w-5 h-7 flex items-center justify-center text-[8px] font-bold"
        style={{ background: 'var(--color-arena-mint)' }}
      >
        0
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={`t${i}`}
              className="border border-black rounded-full w-3 h-3"
              style={{ background: 'var(--color-arena-mint)' }}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={`b${i}`}
              className="border border-black rounded-full w-3 h-3"
              style={{ background: 'var(--color-arena-pink)' }}
            />
          ))}
        </div>
      </div>
      <div
        className="border-[2px] border-black rounded-full w-5 h-7 flex items-center justify-center text-[8px] font-bold"
        style={{ background: 'var(--color-arena-pink)' }}
      >
        0
      </div>
    </div>
  )
}
