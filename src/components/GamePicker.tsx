import { allEngines } from '@/games'
import { cn } from '@/lib/cn'

interface Props {
  selected: string
  onSelect: (id: string) => void
  disabled?: boolean
}

const tints: Record<string, string> = {
  reversi: 'var(--color-arena-mint)',
  gomoku: 'var(--color-arena-orange)',
  mancala: 'var(--color-arena-yellow)',
}

export function GamePicker({ selected, onSelect, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="game-picker">
      {allEngines.map((e) => {
        const active = selected === e.id
        return (
          <button
            key={e.id}
            disabled={disabled}
            onClick={() => onSelect(e.id)}
            className={cn(
              'nb-card p-4 text-left transition-transform',
              active && 'translate-y-[-3px]',
            )}
            style={{
              background: active ? tints[e.id] : 'white',
              boxShadow: active ? '10px 10px 0 0 #0a0a0a' : '6px 6px 0 0 #0a0a0a',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            data-game={e.id}
          >
            <div className="flex items-center gap-2">
              <span className="text-3xl">{e.emoji}</span>
              <span className="text-2xl font-bold">{e.name}</span>
              <span className="ml-auto nb-badge bg-white">
                {'★'.repeat(e.difficulty)}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-80">{e.blurb}</p>
          </button>
        )
      })}
    </div>
  )
}
