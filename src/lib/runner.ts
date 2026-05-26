import { isHuman, streamForMove, type ArenaClient, type BotConfig } from './llm'
import type { ChatMessage, GameEngine, MoveLogEntry, PlayerSlot, GameStatus } from '@/games/types'

export interface HumanTurnContext<State, Move> {
  player: PlayerSlot
  bot: BotConfig
  opponent: BotConfig
  state: State
  legalMoves: Move[]
  chat: ChatMessage[]
  engine: GameEngine<State, Move>
  /** Called when the user sends a chat message before committing the move. */
  sendChat: (text: string) => void
  signal?: AbortSignal
}

export interface HumanTurnResponse<Move> {
  move: Move
}

export interface RunnerOptions<State, Move> {
  client: ArenaClient
  engine: GameEngine<State, Move>
  botA: BotConfig
  botB: BotConfig
  maxTurns?: number
  /** Maximum LLM attempts per move before the player forfeits. */
  maxAttemptsPerMove?: number
  /**
   * Returns the latest chat log so the runner picks up messages the human
   * sent between AI turns. Defaults to an empty log if omitted.
   */
  getChat?: () => ChatMessage[]
  /** Called whenever a human player needs to make a move. */
  onHumanTurn?: (ctx: HumanTurnContext<State, Move>) => Promise<HumanTurnResponse<Move>>
  /** Called whenever something changes. */
  onEvent: (event: RunnerEvent<State>) => void
  signal?: AbortSignal
}

export type RunnerEvent<State> =
  | { type: 'start'; state: State }
  | { type: 'thinking'; player: PlayerSlot }
  | { type: 'thinking_token'; player: PlayerSlot; delta: string; accumulated: string }
  | { type: 'chat'; message: ChatMessage }
  | { type: 'move'; state: State; log: MoveLogEntry }
  | { type: 'invalid'; player: PlayerSlot; raw: string; reason: string }
  | { type: 'forfeit'; loser: PlayerSlot; reason: string }
  | { type: 'end'; status: GameStatus; state: State }

const SYSTEM_PREAMBLE = (
  engine: GameEngine<unknown, unknown>,
  bot: BotConfig,
  opponent: BotConfig,
  you: PlayerSlot,
) =>
  [
    `You are ${bot.name} ${bot.emoji}, a competitive AI agent playing a game of ${engine.name}.`,
    `Your opponent is ${opponent.name} ${opponent.emoji}.`,
    bot.systemPrompt ?? 'Play to win using sound strategy. Be decisive.',
    '',
    'GAME RULES:',
    engine.rules(),
    '',
    `You are playing as Player ${you}; ${opponent.name} is Player ${you === 'A' ? 'B' : 'A'}. Always pick a legal move. Think briefly, then output your move.`,
  ].join('\n')

const USER_PROMPT = <S>(
  engine: GameEngine<S, unknown>,
  state: S,
  you: PlayerSlot,
  scoreboard: { A: number; B: number },
  history: { turn: number; player: PlayerSlot; outcome: string }[],
  meName: string,
  oppName: string,
) => {
  const opp: PlayerSlot = you === 'A' ? 'B' : 'A'
  const recent = history.slice(-6)
  const log =
    recent.length === 0
      ? '(no moves yet)'
      : recent
          .map((h) => {
            const who = h.player === you ? `${meName} (you)` : oppName
            return `  #${h.turn} ${who}: ${h.outcome}`
          })
          .join('\n')
  return [
    `SCORE — ${meName} (you, ${you}): ${scoreboard[you]}   |   ${oppName} (${opp}): ${scoreboard[opp]}`,
    '',
    'RECENT MOVES:',
    log,
    '',
    'CURRENT POSITION:',
    engine.renderForLlm(state, you),
  ].join('\n')
}

export async function runGame<State, Move>(opts: RunnerOptions<State, Move>) {
  const { client, engine, botA, botB, onEvent, onHumanTurn, getChat, signal } = opts
  const maxTurns = opts.maxTurns ?? 200
  const maxAttempts = opts.maxAttemptsPerMove ?? 5
  let state = engine.initial()
  const history: { turn: number; player: PlayerSlot; outcome: string }[] = []
  const readChat = (): ChatMessage[] => getChat?.() ?? []
  const myLastMoveTurn: Record<PlayerSlot, number> = { A: 0, B: 0 }
  onEvent({ type: 'start', state })

  let turn = 0
  while (true) {
    if (signal?.aborted) return
    const status = engine.status(state)
    if (status.kind !== 'in_progress') {
      onEvent({ type: 'end', status, state })
      return
    }
    if (turn >= maxTurns) {
      onEvent({ type: 'end', status: { kind: 'draw' }, state })
      return
    }

    const player = status.turn
    const bot = player === 'A' ? botA : botB
    const opponent = player === 'A' ? botB : botA
    onEvent({ type: 'thinking', player })

    const legal = engine.legalMoves(state)
    if (legal.length === 0) {
      onEvent({ type: 'end', status: engine.status(state), state })
      return
    }

    let move: Move | null = null
    let raw = ''
    let reasoning = ''
    let lastReason = ''
    let attempts = 0

    // Human-player branch — wait for the UI to provide a move.
    if (isHuman(bot)) {
      if (!onHumanTurn) {
        onEvent({
          type: 'forfeit',
          loser: player,
          reason: `Human player has no UI handler attached.`,
        })
        const winner: PlayerSlot = player === 'A' ? 'B' : 'A'
        onEvent({ type: 'end', status: { kind: 'win', winner }, state })
        return
      }
      try {
        const resp = await onHumanTurn({
          player,
          bot,
          opponent,
          state,
          legalMoves: legal,
          chat: readChat(),
          engine,
          signal,
          sendChat: (text) => {
            const trimmed = text.trim()
            if (!trimmed) return
            const message: ChatMessage = {
              turn: turn + 1,
              player,
              text: trimmed.slice(0, 280),
              at: new Date().toISOString(),
            }
            onEvent({ type: 'chat', message })
          },
        })
        move = resp.move
        reasoning = '(human move)'
        raw = engine.describeMove(move)
      } catch (err) {
        if (signal?.aborted) return
        lastReason = err instanceof Error ? err.message : String(err)
        onEvent({ type: 'invalid', player, raw: '', reason: lastReason })
      }
    }

    while (!isHuman(bot) && attempts < maxAttempts && move == null) {
      attempts++
      try {
        const resp = await streamForMove<unknown>(client, {
          bot,
          opponent,
          you: player,
          chatHistory: readChat(),
          myLastMoveTurn: myLastMoveTurn[player],
          systemPrompt: SYSTEM_PREAMBLE(
            engine as GameEngine<unknown, unknown>,
            bot,
            opponent,
            player,
          ),
          userPrompt: USER_PROMPT(
            engine,
            state,
            player,
            engine.score(state),
            history,
            bot.name,
            opponent.name,
          ),
          schemaName: 'move',
          schemaExample: engine.schemaExample(),
          signal,
          onToken: (delta, accumulated) => {
            onEvent({ type: 'thinking_token', player, delta, accumulated })
          },
          onChat: (text) => {
            const message: ChatMessage = {
              turn: turn + 1,
              player,
              text,
              at: new Date().toISOString(),
            }
            onEvent({ type: 'chat', message })
          },
        })
        raw = resp.raw
        reasoning = resp.reasoning
        move = engine.parseMove(resp.move, legal)
        if (!move) {
          lastReason = `Move not in legal set. Legal: ${legal
            .slice(0, 12)
            .map((m) => engine.describeMove(m))
            .join(', ')}`
          onEvent({ type: 'invalid', player, raw, reason: lastReason })
        }
      } catch (err) {
        lastReason = err instanceof Error ? err.message : String(err)
        onEvent({ type: 'invalid', player, raw, reason: lastReason })
      }
    }

    if (!move) {
      // Forfeit instead of forcing a move: the opponent wins.
      const winner: PlayerSlot = player === 'A' ? 'B' : 'A'
      onEvent({
        type: 'forfeit',
        loser: player,
        reason: `${bot.name} failed to return a valid move after ${maxAttempts} attempts. ${lastReason}`,
      })
      onEvent({ type: 'end', status: { kind: 'win', winner }, state })
      return
    }

    const prev = state
    const next = engine.apply(state, move)
    if (!next) {
      onEvent({ type: 'forfeit', loser: player, reason: 'Engine rejected move.' })
      const winner: PlayerSlot = player === 'A' ? 'B' : 'A'
      onEvent({ type: 'end', status: { kind: 'win', winner }, state })
      return
    }
    state = next
    turn++
    myLastMoveTurn[player] = turn

    const outcome = engine.describeOutcome(prev, move, next, player)
    const scoreAfter = engine.score(state)
    history.push({ turn, player, outcome })

    const log: MoveLogEntry = {
      turn,
      player,
      reasoning,
      raw,
      move,
      outcome,
      scoreAfter,
    }
    onEvent({ type: 'move', state, log })
  }
}
