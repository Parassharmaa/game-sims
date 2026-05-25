import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { engineById, reversiEngine } from '@/games'
import type {
  ChatMessage,
  GameEngine,
  GameStatus,
  MoveLogEntry,
  PlayerSlot,
} from '@/games/types'
import { createOllamaClient, listLocalModels, type BotConfig } from '@/lib/llm'
import { DEFAULT_BOTS } from '@/lib/bots'
import { runGame } from '@/lib/runner'
import { StepProgress, type Step } from '@/components/StepProgress'
import { PickGamePage } from '@/pages/PickGamePage'
import { PickBotsPage } from '@/pages/PickBotsPage'
import { ArenaPage } from '@/pages/ArenaPage'

type Engine = GameEngine<unknown, unknown>


export default function App() {
  const client = useMemo(() => createOllamaClient(), [])
  const [step, setStep] = useState<Step>('game')
  const [visited, setVisited] = useState<Set<Step>>(() => new Set(['game']))
  const goto = useCallback((s: Step) => {
    setStep(s)
    setVisited((prev) => {
      if (prev.has(s)) return prev
      const next = new Set(prev)
      next.add(s)
      return next
    })
  }, [])

  const [engineId, setEngineId] = useState<string>(reversiEngine.id)
  const engine = useMemo<Engine>(
    () => (engineById(engineId) ?? (reversiEngine as Engine)) as Engine,
    [engineId],
  )
  const [botA, setBotA] = useState<BotConfig>(DEFAULT_BOTS[0])
  const [botB, setBotB] = useState<BotConfig>(DEFAULT_BOTS[1])
  const [models, setModels] = useState<string[]>([])

  const [session, setSession] = useState<{ engineId: string; state: unknown }>(() => ({
    engineId: reversiEngine.id,
    state: reversiEngine.initial(),
  }))
  const state =
    session.engineId === engineId ? session.state : engine.initial()
  if (session.engineId !== engineId) {
    setSession({ engineId, state })
  }
  const setState = useCallback((next: unknown | ((prev: unknown) => unknown)) => {
    setSession((s) => ({
      engineId: s.engineId,
      state: typeof next === 'function' ? (next as (p: unknown) => unknown)(s.state) : next,
    }))
  }, [])

  const [status, setStatus] = useState<GameStatus | null>(null)
  const [thinking, setThinking] = useState<PlayerSlot | null>(null)
  const [thoughtStream, setThoughtStream] = useState('')
  const [log, setLog] = useState<MoveLogEntry[]>([])
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [running, setRunning] = useState(false)
  const [humanTurn, setHumanTurn] = useState<{
    player: PlayerSlot
    legalMoves: unknown[]
    submitMove: (m: unknown) => void
    sendChat: (text: string) => void
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    listLocalModels(client).then((m) => {
      if (cancelled) return
      setModels(m)
      if (m.length > 0) {
        setBotA((b) => (m.includes(b.model) ? b : { ...b, model: m[0] }))
        setBotB((b) => (m.includes(b.model) ? b : { ...b, model: m[0] }))
      }
    })
    return () => {
      cancelled = true
    }
  }, [client])

  useEffect(() => {
    setLog([])
    setChat([])
    setStatus(null)
    setError(null)
    setThinking(null)
    setThoughtStream('')
  }, [engineId])

  const start = useCallback(async () => {
    setError(null)
    setLog([])
    setChat([])
    setStatus(null)
    setThinking(null)
    setThoughtStream('')
    setState(engine.initial())
    setRunning(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      await runGame({
        client,
        engine,
        botA,
        botB,
        signal: ctrl.signal,
        onHumanTurn: (ctx) =>
          new Promise((resolve, reject) => {
            const onAbort = () => reject(new Error('aborted'))
            ctx.signal?.addEventListener('abort', onAbort)
            setHumanTurn({
              player: ctx.player,
              legalMoves: ctx.legalMoves,
              sendChat: ctx.sendChat,
              submitMove: (move) => {
                ctx.signal?.removeEventListener('abort', onAbort)
                setHumanTurn(null)
                resolve({ move })
              },
            })
          }),
        onEvent: (ev) => {
          if (ev.type === 'start') {
            setState(ev.state)
            setStatus({ kind: 'in_progress', turn: 'A' })
          } else if (ev.type === 'thinking') {
            setThinking(ev.player)
            setThoughtStream('')
          } else if (ev.type === 'thinking_token') {
            setThoughtStream(ev.accumulated)
          } else if (ev.type === 'chat') {
            setChat((prev) => [...prev, ev.message])
          } else if (ev.type === 'move') {
            setState(ev.state)
            setLog((prev) => [...prev, ev.log])
            setThinking(null)
            setThoughtStream('')
            const next = engine.status(ev.state)
            setStatus(next)
          } else if (ev.type === 'invalid') {
            setError(
              `Player ${ev.player} returned an invalid move (${ev.reason.slice(0, 100)}). Retrying…`,
            )
          } else if (ev.type === 'forfeit') {
            setError(`Player ${ev.loser} forfeited: ${ev.reason}`)
          } else if (ev.type === 'end') {
            setState(ev.state)
            setStatus(ev.status)
            setThinking(null)
            setThoughtStream('')
            if (ev.status.kind === 'win') {
              fireConfetti(ev.status.winner === 'A' ? botA.accent : botB.accent)
            }
          }
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }, [client, engine, botA, botB, setState])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setRunning(false)
    setThinking(null)
    setThoughtStream('')
    setHumanTurn(null)
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState(engine.initial())
    setLog([])
    setChat([])
    setStatus(null)
    setError(null)
    setThinking(null)
    setThoughtStream('')
    setHumanTurn(null)
    setRunning(false)
  }, [engine, setState])

  const score = engine.score(state)

  return (
    <div className="min-h-screen w-full px-4 sm:px-6 py-6 max-w-[1280px] mx-auto flex flex-col gap-6">
      <Header />
      <StepProgress current={step} visited={visited} onJump={goto} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {step === 'game' && (
            <PickGamePage
              key="game"
              selected={engineId}
              onSelect={setEngineId}
              onNext={() => goto('bots')}
            />
          )}
          {step === 'bots' && (
            <PickBotsPage
              key="bots"
              engineId={engineId}
              botA={botA}
              botB={botB}
              setBotA={setBotA}
              setBotB={setBotB}
              availableModels={models}
              onBack={() => goto('game')}
              onStart={() => {
                goto('arena')
                // start the battle on the next tick so the arena page mounts first
                setTimeout(start, 0)
              }}
            />
          )}
          {step === 'arena' && (
            <ArenaPage
              key="arena"
              engine={engine}
              engineId={engineId}
              state={state}
              status={status}
              log={log}
              chat={chat}
              thinking={thinking}
              humanTurn={humanTurn}
              thoughtStream={thoughtStream}
              botA={botA}
              botB={botB}
              score={score}
              running={running}
              error={error}
              onStart={start}
              onStop={stop}
              onReset={reset}
              onBack={() => {
                stop()
                goto('bots')
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function Header() {
  return (
    <header className="flex items-center gap-3 flex-wrap" data-testid="header">
      <div
        className="nb-card-lg px-5 py-3 flex items-center gap-3"
        style={{ background: 'var(--color-arena-pink)', color: '#fff' }}
      >
        <span className="text-3xl">🤖</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">GAME SIMS</h1>
        <span className="text-3xl">🤖</span>
      </div>
    </header>
  )
}

function fireConfetti(color: string) {
  confetti({
    particleCount: 140,
    spread: 90,
    origin: { y: 0.3 },
    colors: [color, '#ffffff', '#0a0a0a', '#fbd84a', '#54c8ff'],
  })
}
