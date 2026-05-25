import { motion } from 'framer-motion'
import { allEngines } from '@/games'
import { MiniBoardPreview } from '@/components/boards/MiniBoardPreview'
import { cn } from '@/lib/cn'

interface Props {
  selected: string
  onSelect: (id: string) => void
  onNext: () => void
}

const tints: Record<string, string> = {
  reversi: 'var(--color-arena-mint)',
  gomoku: 'var(--color-arena-orange)',
  mancala: 'var(--color-arena-yellow)',
  hex: 'var(--color-arena-violet)',
  breakthrough: 'var(--color-arena-sky)',
  utttt: 'var(--color-arena-pink)',
}

export function PickGamePage({ selected, onSelect, onNext }: Props) {
  return (
    <motion.section
      key="game"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col gap-6"
      data-testid="page-game"
    >
      <Hero
        eyebrow="STEP 1"
        title="Choose the battlefield"
        subtitle="Each game is a different test of strategy. Pick where your bots will fight."
      />

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        data-testid="game-picker"
      >
        {allEngines.map((e, i) => {
          const active = selected === e.id
          return (
            <motion.button
              key={e.id}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.25 }}
              whileHover={{ y: -3 }}
              whileTap={{ y: 1 }}
              onClick={() => onSelect(e.id)}
              data-game={e.id}
              data-active={active || undefined}
              className={cn(
                'nb-card-lg p-5 text-left flex flex-col gap-3',
                active && 'translate-y-[-3px]',
              )}
              style={{
                background: active ? tints[e.id] : 'white',
                boxShadow: active ? '12px 12px 0 0 #0a0a0a' : '8px 8px 0 0 #0a0a0a',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl">{e.emoji}</span>
                <div className="flex-1">
                  <div className="text-2xl sm:text-3xl font-extrabold leading-none">
                    {e.name}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.18em] opacity-70">
                    {'★'.repeat(e.difficulty)}{'☆'.repeat(5 - e.difficulty)} · difficulty
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center py-1">
                <MiniBoardPreview game={e.id as Parameters<typeof MiniBoardPreview>[0]['game']} />
              </div>
              <p className="text-sm leading-relaxed">{e.blurb}</p>
              {active && (
                <div className="text-xs font-bold uppercase tracking-wider">
                  ✓ Selected — click <b>Next</b> below
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          className="nb-btn"
          style={{ background: 'var(--color-arena-pink)', color: '#fff' }}
          onClick={onNext}
          data-testid="next-bots"
        >
          Next: Pick Champions →
        </button>
      </div>
    </motion.section>
  )
}

function Hero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <header className="flex flex-col gap-1">
      <span className="text-[11px] tracking-[0.32em] font-bold opacity-60">
        {eyebrow}
      </span>
      <h2 className="text-3xl sm:text-5xl font-extrabold leading-[1.05]">{title}</h2>
      <p className="opacity-70 max-w-[60ch]">{subtitle}</p>
    </header>
  )
}
