import { motion } from 'framer-motion'
import { BotCard } from '@/components/BotCard'
import { SidePanel } from '@/components/SidePanel'
import { ReversiBoard } from '@/components/boards/ReversiBoard'
import { GomokuBoard } from '@/components/boards/GomokuBoard'
import { MancalaBoard } from '@/components/boards/MancalaBoard'
import { BreakthroughBoard } from '@/components/boards/BreakthroughBoard'
import { HexBoard } from '@/components/boards/HexBoard'
import { UltimateTTTBoard } from '@/components/boards/UltimateTTTBoard'
import { ThinkingBubble } from '@/components/ThinkingBubble'
import type {
  ChatMessage,
  GameEngine,
  GameStatus,
  MoveLogEntry,
  PlayerSlot,
} from '@/games/types'
import type { BotConfig } from '@/lib/llm'
import { Trophy, Handshake, Target, Play, Stop, Reset, ArrowLeft, GameController } from '@/components/icons'

interface Props {
  engine: GameEngine<unknown, unknown>
  engineId: string
  state: unknown
  status: GameStatus | null
  log: MoveLogEntry[]
  chat: ChatMessage[]
  thinking: PlayerSlot | null
  humanTurn: {
    player: PlayerSlot
    legalMoves: unknown[]
    submitMove: (move: unknown) => void
    sendChat: (text: string) => void
  } | null
  thoughtStream: string
  botA: BotConfig
  botB: BotConfig
  score: { A: number; B: number }
  running: boolean
  error: string | null
  onStart: () => void
  onStop: () => void
  onReset: () => void
  onBack: () => void
}

function renderBoard(
  engineId: string,
  state: unknown,
  botA: BotConfig,
  botB: BotConfig,
  legalMoves: unknown[] | undefined,
  onSelectMove: ((m: unknown) => void) | undefined,
) {
  const common = { botA, botB }
  if (engineId === 'reversi') {
    return (
      <ReversiBoard
        {...common}
        state={state as Parameters<typeof ReversiBoard>[0]['state']}
        legalMoves={legalMoves as Parameters<typeof ReversiBoard>[0]['legalMoves']}
        onSelectMove={
          onSelectMove as Parameters<typeof ReversiBoard>[0]['onSelectMove']
        }
      />
    )
  }
  if (engineId === 'gomoku') {
    return (
      <GomokuBoard
        {...common}
        state={state as Parameters<typeof GomokuBoard>[0]['state']}
        legalMoves={legalMoves as Parameters<typeof GomokuBoard>[0]['legalMoves']}
        onSelectMove={
          onSelectMove as Parameters<typeof GomokuBoard>[0]['onSelectMove']
        }
      />
    )
  }
  if (engineId === 'mancala') {
    return (
      <MancalaBoard
        {...common}
        state={state as Parameters<typeof MancalaBoard>[0]['state']}
        legalMoves={legalMoves as Parameters<typeof MancalaBoard>[0]['legalMoves']}
        onSelectMove={
          onSelectMove as Parameters<typeof MancalaBoard>[0]['onSelectMove']
        }
      />
    )
  }
  if (engineId === 'breakthrough') {
    return (
      <BreakthroughBoard
        {...common}
        state={state as Parameters<typeof BreakthroughBoard>[0]['state']}
        legalMoves={legalMoves as Parameters<typeof BreakthroughBoard>[0]['legalMoves']}
        onSelectMove={
          onSelectMove as Parameters<typeof BreakthroughBoard>[0]['onSelectMove']
        }
      />
    )
  }
  if (engineId === 'hex') {
    return (
      <HexBoard
        {...common}
        state={state as Parameters<typeof HexBoard>[0]['state']}
        legalMoves={legalMoves as Parameters<typeof HexBoard>[0]['legalMoves']}
        onSelectMove={
          onSelectMove as Parameters<typeof HexBoard>[0]['onSelectMove']
        }
      />
    )
  }
  if (engineId === 'utttt') {
    return (
      <UltimateTTTBoard
        {...common}
        state={state as Parameters<typeof UltimateTTTBoard>[0]['state']}
        legalMoves={legalMoves as Parameters<typeof UltimateTTTBoard>[0]['legalMoves']}
        onSelectMove={
          onSelectMove as Parameters<typeof UltimateTTTBoard>[0]['onSelectMove']
        }
      />
    )
  }
  return null
}

export function ArenaPage(props: Props) {
  const {
    engine,
    engineId,
    state,
    status,
    log,
    chat,
    thinking,
    humanTurn,
    thoughtStream,
    botA,
    botB,
    score,
    running,
    error,
    onStart,
    onStop,
    onReset,
    onBack,
  } = props

  const humanBot = humanTurn ? (humanTurn.player === 'A' ? botA : botB) : null

  return (
    <motion.section
      key="arena"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col gap-5"
      data-testid="page-arena"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] tracking-[0.32em] font-bold opacity-60">
            STEP 3
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-none">
            {engine.name}
          </h2>
          <span className="nb-chip" style={{ background: 'white' }}>
            {botA.name} <b className="mx-1">vs</b> {botB.name}
          </span>
        </div>
        <button className="nb-btn inline-flex items-center gap-2" onClick={onBack} disabled={running}>
          <ArrowLeft size={16} weight="bold" /> Change matchup
        </button>
      </header>

      <StatusBar status={status} botA={botA} botB={botB} />

      <div className="flex flex-wrap items-center gap-3">
        {!running ? (
          <button
            className="nb-btn inline-flex items-center gap-2"
            style={{ background: 'var(--color-arena-pink)', color: '#fff' }}
            onClick={onStart}
            data-testid="start-battle"
          >
            <Play size={16} weight="fill" /> Start Battle
          </button>
        ) : (
          <button
            className="nb-btn inline-flex items-center gap-2"
            style={{ background: 'var(--color-arena-red)', color: '#fff' }}
            onClick={onStop}
          >
            <Stop size={16} weight="fill" /> Stop
          </button>
        )}
        <button className="nb-btn inline-flex items-center gap-2" onClick={onReset} disabled={running}>
          <Reset size={16} weight="bold" /> Reset board
        </button>
      </div>

      {error && (
        <div
          className="nb-card p-3 text-sm"
          style={{ background: 'var(--color-arena-yellow)' }}
          data-testid="error"
        >
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        <style>{`@media (min-width: 1024px) { [data-testid="side-panel"]:not([data-collapsed]) { width: 360px; } }`}</style>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BotCard
              slot="A"
              bot={botA}
              score={score.A}
              active={status?.kind === 'in_progress' && status.turn === 'A'}
              thinking={thinking === 'A'}
            />
            <BotCard
              slot="B"
              bot={botB}
              score={score.B}
              active={status?.kind === 'in_progress' && status.turn === 'B'}
              thinking={thinking === 'B'}
            />
          </div>

          {humanBot ? (
            <div
              className="nb-card p-3 flex items-center gap-3"
              style={{ background: humanBot.accent }}
              data-testid="human-input"
            >
              <GameController size={28} weight="duotone" />
              <div className="flex-1">
                <div className="text-sm font-bold uppercase tracking-wider">
                  {humanBot.name} — your turn
                </div>
                <div className="text-xs opacity-80">
                  Click a highlighted cell on the board to move. Type chat in the Chat tab.
                </div>
              </div>
            </div>
          ) : (
            <ThinkingBubble
              bot={thinking === 'A' ? botA : botB}
              text={thoughtStream}
              visible={thinking != null}
              side={thinking === 'B' ? 'right' : 'left'}
            />
          )}

          <div className="flex justify-center">
            {renderBoard(
              engineId,
              state,
              botA,
              botB,
              humanTurn?.legalMoves,
              humanTurn?.submitMove,
            )}
          </div>
        </div>
        <SidePanel
          log={log}
          chat={chat}
          botA={botA}
          botB={botB}
          describeMove={(m) =>
            (engine as unknown as { describeMove: (m: unknown) => string }).describeMove(m)
          }
          onSendChat={humanTurn?.sendChat}
          chatSenderHint={humanBot ? `as ${humanBot.name}` : undefined}
        />
      </div>
    </motion.section>
  )
}

function StatusBar({
  status,
  botA,
  botB,
}: {
  status: GameStatus | null
  botA: BotConfig
  botB: BotConfig
}) {
  if (!status) {
    return (
      <div className="nb-chip inline-flex items-center gap-2" style={{ background: 'white' }}>
        <Play size={14} weight="fill" /> Press <b className="mx-1">Start Battle</b> to begin
      </div>
    )
  }
  if (status.kind === 'in_progress') {
    const bot = status.turn === 'A' ? botA : botB
    return (
      <div
        className="nb-chip inline-flex items-center gap-2"
        style={{ background: bot.accent }}
        data-testid="status"
      >
        <Target size={14} weight="bold" /> {bot.name} is moving…
      </div>
    )
  }
  if (status.kind === 'draw') {
    return (
      <div
        className="nb-chip inline-flex items-center gap-2"
        style={{ background: 'var(--color-arena-yellow)' }}
        data-testid="status"
      >
        <Handshake size={14} weight="bold" /> Draw — honour split, brains tied.
      </div>
    )
  }
  const winner = status.winner === 'A' ? botA : botB
  return (
    <div
      className="nb-chip text-base inline-flex items-center gap-2"
      style={{ background: winner.accent }}
      data-testid="status"
    >
      <Trophy size={16} weight="fill" /> {winner.name} wins!
    </div>
  )
}
