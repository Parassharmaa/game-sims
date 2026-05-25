import { cn } from '@/lib/cn'

export type Step = 'game' | 'bots' | 'arena'

interface Props {
  current: Step
  visited: Set<Step>
  onJump: (step: Step) => void
}

const STEPS: { id: Step; label: string; emoji: string }[] = [
  { id: 'game', label: 'Battlefield', emoji: '🗺️' },
  { id: 'bots', label: 'Champions', emoji: '⚔️' },
  { id: 'arena', label: 'Arena', emoji: '🎯' },
]

export function StepProgress({ current, visited, onJump }: Props) {
  const currentIdx = STEPS.findIndex((s) => s.id === current)
  return (
    <nav
      className="flex items-center gap-2 sm:gap-3 flex-wrap"
      data-testid="step-progress"
      aria-label="Wizard progress"
    >
      {STEPS.map((s, i) => {
        const isCurrent = s.id === current
        const isPast = i < currentIdx || visited.has(s.id)
        const clickable = isPast && !isCurrent
        return (
          <div key={s.id} className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump(s.id)}
              className={cn(
                'nb-chip transition-all',
                isCurrent && 'translate-y-[-2px]',
              )}
              style={{
                background: isCurrent
                  ? 'var(--color-arena-pink)'
                  : isPast
                    ? 'var(--color-arena-lime)'
                    : 'white',
                color: isCurrent ? '#fff' : '#0a0a0a',
                cursor: clickable ? 'pointer' : 'default',
                opacity: isCurrent || isPast ? 1 : 0.6,
              }}
              data-step={s.id}
              data-active={isCurrent || undefined}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="text-base">{s.emoji}</span>
              <span className="font-bold">
                {i + 1}. {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="w-4 sm:w-8 h-[3px] bg-black rounded-full opacity-30" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
