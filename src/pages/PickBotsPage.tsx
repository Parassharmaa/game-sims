import { motion } from 'framer-motion'
import { DEFAULT_BOTS } from '@/lib/bots'
import { isHuman, makeHumanConfig, type BotConfig } from '@/lib/llm'
import { engineById } from '@/games'
import { cn } from '@/lib/cn'

interface Props {
  engineId: string
  botA: BotConfig
  botB: BotConfig
  setBotA: (b: BotConfig) => void
  setBotB: (b: BotConfig) => void
  availableModels: string[]
  onBack: () => void
  onStart: () => void
}

export function PickBotsPage({
  engineId,
  botA,
  botB,
  setBotA,
  setBotB,
  availableModels,
  onBack,
  onStart,
}: Props) {
  const engine = engineById(engineId)
  return (
    <motion.section
      key="bots"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col gap-6"
      data-testid="page-bots"
    >
      <header className="flex flex-col gap-1">
        <span className="text-[11px] tracking-[0.32em] font-bold opacity-60">STEP 2</span>
        <h2 className="text-3xl sm:text-5xl font-extrabold leading-[1.05]">
          Pick your champions
        </h2>
        <p className="opacity-70 max-w-[60ch]">
          Two agents will play <b>{engine?.name}</b> head-to-head. Each has a personality
          that shapes how it plays. Mix-and-match.
        </p>
      </header>

      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-5 lg:gap-6"
        data-testid="matchup"
      >
        <ChampionCard
          slot="A"
          bot={botA}
          onChange={setBotA}
          availableModels={availableModels}
        />
        <div className="flex items-center justify-center lg:flex-col">
          <motion.div
            initial={{ scale: 0.9, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="nb-card-lg w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-3xl sm:text-4xl font-extrabold"
            style={{
              background: 'var(--color-arena-yellow)',
              boxShadow: '8px 8px 0 0 #0a0a0a',
            }}
          >
            VS
          </motion.div>
        </div>
        <ChampionCard
          slot="B"
          bot={botB}
          onChange={setBotB}
          availableModels={availableModels}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <button className="nb-btn" onClick={onBack}>
          ← Back
        </button>
        <button
          className="nb-btn"
          style={{ background: 'var(--color-arena-pink)', color: '#fff' }}
          onClick={onStart}
          data-testid="start-battle"
        >
          ▶ Start Battle
        </button>
      </div>
    </motion.section>
  )
}

interface ChampionProps {
  slot: 'A' | 'B'
  bot: BotConfig
  onChange: (b: BotConfig) => void
  availableModels: string[]
}

function ChampionCard({ slot, bot, onChange, availableModels }: ChampionProps) {
  const human = isHuman(bot)
  const setKind = (kind: 'ai' | 'human') => {
    if (kind === 'human' && !human) {
      onChange(makeHumanConfig(slot, 'You'))
    } else if (kind === 'ai' && human) {
      const fallback = DEFAULT_BOTS[slot === 'A' ? 0 : 1]
      onChange({ ...fallback, model: availableModels[0] ?? fallback.model })
    }
  }
  return (
    <div
      className="nb-card-lg p-5 flex flex-col gap-4"
      style={{ background: bot.accent, boxShadow: '8px 8px 0 0 #0a0a0a' }}
      data-testid={`champion-${slot.toLowerCase()}`}
      data-kind={human ? 'human' : 'ai'}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="nb-badge bg-white">PLAYER {slot}</span>
        <div className="flex gap-1" data-testid={`kind-toggle-${slot.toLowerCase()}`}>
          <KindButton
            label="🤖 AI"
            active={!human}
            onClick={() => setKind('ai')}
            testId={`kind-ai-${slot.toLowerCase()}`}
          />
          <KindButton
            label="🧑 Human"
            active={human}
            onClick={() => setKind('human')}
            testId={`kind-human-${slot.toLowerCase()}`}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-6xl border-[3px] border-black rounded-full bg-white w-20 h-20 flex items-center justify-center">
          {bot.emoji}
        </div>
        <div className="flex-1">
          {human ? (
            <input
              type="text"
              value={bot.name}
              onChange={(e) => onChange({ ...bot, name: e.target.value })}
              className="text-3xl font-extrabold leading-none bg-transparent border-b-[3px] border-black w-full focus:outline-none px-1"
              maxLength={20}
              data-testid={`human-name-${slot.toLowerCase()}`}
            />
          ) : (
            <div className="text-3xl font-extrabold leading-none">{bot.name}</div>
          )}
          {human && (
            <div className="text-xs mt-1 italic opacity-85 leading-snug">
              Human player. You will click moves on the board and chat in the arena.
            </div>
          )}
        </div>
      </div>
      {!human && (
        <>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_BOTS.map((b) => {
              const selected = b.id === bot.id
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onChange({ ...b, model: bot.model })}
                  className={cn(
                    'nb-chip transition-transform',
                    selected && 'translate-y-[-2px]',
                  )}
                  style={{
                    background: selected ? '#0a0a0a' : 'white',
                    color: selected ? '#fff' : '#0a0a0a',
                  }}
                  data-bot={b.id}
                  data-selected={selected || undefined}
                >
                  <span>{b.emoji}</span>
                  <span>{b.name}</span>
                </button>
              )
            })}
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
              Model
            </span>
            <select
              value={bot.model}
              onChange={(e) => onChange({ ...bot, model: e.target.value })}
              className="nb-chip bg-white font-mono text-sm cursor-pointer"
              data-testid={`bot-model-${slot.toLowerCase()}`}
            >
              {availableModels.length === 0 && (
                <option value={bot.model}>{bot.model}</option>
              )}
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  )
}

function KindButton({
  label,
  active,
  onClick,
  testId,
}: {
  label: string
  active: boolean
  onClick: () => void
  testId: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      data-active={active || undefined}
      className="nb-chip text-xs cursor-pointer"
      style={{
        background: active ? '#0a0a0a' : 'white',
        color: active ? '#fff' : '#0a0a0a',
      }}
    >
      {label}
    </button>
  )
}
