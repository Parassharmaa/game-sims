import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText, tool, hasToolCall, type LanguageModel } from 'ai'
import { z } from 'zod'
import type { ChatMessage, PlayerSlot } from '@/games/types'

export interface LlmClientOptions {
  baseURL?: string
  apiKey?: string
}

export interface BotConfig {
  id: string
  name: string
  emoji: string
  accent: string
  model: string
  temperature?: number
  systemPrompt?: string
  /** 'ai' (default) for an LLM agent, 'human' for the local user. */
  kind?: 'ai' | 'human'
}

export function isHuman(b: BotConfig): boolean {
  return b.kind === 'human'
}

export function makeHumanConfig(slot: 'A' | 'B', name = 'You'): BotConfig {
  return {
    id: `human-${slot.toLowerCase()}`,
    kind: 'human',
    name,
    emoji: '🧑',
    accent:
      slot === 'A' ? 'var(--color-arena-pink)' : 'var(--color-arena-mint)',
    model: 'human',
  }
}

export interface MoveRequestArgs {
  bot: BotConfig
  /** The other player's config, so we can name them in the prompt. */
  opponent: BotConfig
  systemPrompt: string
  userPrompt: string
  schemaName: string
  schemaExample: string
  /** Current chat history visible to the bot. */
  chatHistory: ChatMessage[]
  /**
   * Turn number of this bot's previous move (0 if this is its first turn).
   * Used to mark new messages received since then as "(NEW)" in the prompt.
   */
  myLastMoveTurn: number
  /** Which slot this bot is playing. */
  you: PlayerSlot
  signal?: AbortSignal
}

export interface StreamCallbacks {
  /** Called once per streamed text delta (free-form thinking). */
  onToken?: (delta: string, accumulated: string) => void
  /** Called whenever the bot uses the `send_message` tool. */
  onChat?: (text: string) => void
}

export interface MoveResponse<T> {
  raw: string
  reasoning: string
  move: T
}

const DEFAULT_BASE_URL =
  typeof window === 'undefined'
    ? 'http://localhost:11434/v1'
    : `${window.location.origin}/api/ollama/v1`

export interface ArenaClient {
  model(id: string): LanguageModel
  listModels(): Promise<string[]>
  baseURL: string
}

export function createOllamaClient(opts: LlmClientOptions = {}): ArenaClient {
  const baseURL = opts.baseURL ?? DEFAULT_BASE_URL
  const provider = createOpenAICompatible({
    name: 'ollama',
    baseURL,
    headers: opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : undefined,
  })
  return {
    baseURL,
    model: (id: string) => provider.chatModel(id),
    async listModels() {
      try {
        const res = await fetch(`${baseURL}/models`)
        if (!res.ok) return []
        const body = (await res.json()) as { data?: { id: string }[] }
        return (body.data ?? [])
          .map((m) => m.id)
          .filter((id) => !id.includes('embed') && !id.includes('minilm'))
          .sort()
      } catch {
        return []
      }
    },
  }
}

function chatPreamble(
  history: ChatMessage[],
  you: PlayerSlot,
  myLastMoveTurn: number,
  meName: string,
  oppName: string,
): string {
  const newOppMsgs = history.filter(
    (m) => m.player !== you && m.turn > myLastMoveTurn,
  )
  const header =
    newOppMsgs.length > 0
      ? `⚠️ ${oppName} sent ${newOppMsgs.length} NEW message(s) since your last move — read carefully:\n`
      : ''
  if (history.length === 0) {
    return header + '(no chat yet — feel free to start one with send_message)'
  }
  const recent = history.slice(-10)
  const lines = recent.map((m) => {
    const who = m.player === you ? `${meName} (you)` : oppName
    const isNew = m.player !== you && m.turn > myLastMoveTurn
    const tag = isNew ? ' (NEW)' : ''
    return `  [turn ${m.turn}] ${who}${tag}: ${m.text}`
  })
  return header + lines.join('\n')
}

const SYSTEM_TOOL_PREAMBLE = (you: PlayerSlot) =>
  [
    '',
    'TOOLS AVAILABLE THIS TURN:',
    `• send_message(text): post a public chat message your opponent will see before their next move.`,
    `   Use sparingly. Bluff, taunt, negotiate, propose, mislead, befriend — whatever you think helps you win.`,
    `   Both players see all chat. You may call this 0 or more times.`,
    `• make_move(move): commit your move using this game's notation. You MUST call this exactly once to end your turn.`,
    '',
    'The full chat log is always shown in the user prompt — there is no read_chat tool, just look there.',
    '',
    `You are Player ${you}. Think briefly out loud (1–3 sentences) — that text is shown live to a human audience —`,
    'then chat if you wish, then commit your move.',
  ].join('\n')

/**
 * Stream a move from the LLM. Two tools are exposed:
 *   - send_message(text): optional chat the opponent will see
 *   - make_move(move):    required; ends the turn
 * If the model doesn't call make_move, this throws — the runner handles the
 * retry / forfeit logic.
 */
export async function streamForMove<T>(
  client: ArenaClient,
  args: MoveRequestArgs & StreamCallbacks,
): Promise<MoveResponse<T>> {
  const { bot, opponent, systemPrompt, userPrompt, schemaExample, chatHistory, you, myLastMoveTurn } =
    args
  const system = systemPrompt + SYSTEM_TOOL_PREAMBLE(you)
  // Extract just the notation example from the engine's JSON schema sample.
  let notation = schemaExample
  try {
    const parsed = JSON.parse(schemaExample) as { move?: unknown }
    if (parsed && parsed.move != null) notation = String(parsed.move)
  } catch {
    /* not JSON — use as-is */
  }
  // Static / per-game text goes FIRST so the slot's KV cache reuses the prefix
  // across consecutive turns from the same agent. Dynamic state goes LAST.
  const userWithChat =
    `For the make_move tool, the "move" argument must use this exact notation: ${notation}\n` +
    `\n═══ TURN STATE BELOW ═══\n\n` +
    `CHAT LOG (${chatHistory.length} message${chatHistory.length === 1 ? '' : 's'} total):\n` +
    `${chatPreamble(chatHistory, you, myLastMoveTurn, bot.name, opponent.name)}\n\n` +
    userPrompt

  let toolMove: string | null = null

  const result = streamText({
    model: client.model(bot.model),
    temperature: bot.temperature ?? 0.7,
    // Hard cap to prevent reasoning models from monologuing for 5+ minutes.
    // Gives ~1500 tokens of reasoning + room for the tool call.
    maxOutputTokens: 1800,
    system,
    prompt: userWithChat,
    abortSignal: args.signal,
    tools: {
      send_message: tool({
        description:
          'Send a public chat message your opponent will see before their next move. Use it to bluff, taunt, negotiate, befriend, or psyche them out. Both players see all chat. May be called 0+ times per turn.',
        inputSchema: z.object({
          text: z.string().min(1).max(280).describe('Your message (max 280 chars).'),
        }),
        execute: async ({ text }) => {
          args.onChat?.(text)
          return { ok: true }
        },
      }),
      make_move: tool({
        description:
          'Commit your move for this turn. You MUST call this exactly once. The game ends your turn after this tool is called.',
        inputSchema: z.object({
          move: z
            .string()
            .describe(
              "Move in this game's notation. See schema example in the user prompt.",
            ),
        }),
        execute: async ({ move }) => {
          toolMove = move
          return { ok: true }
        },
      }),
    },
    stopWhen: hasToolCall('make_move'),
  })

  let accumulated = ''
  for await (const part of result.fullStream) {
    // Models like Gemma 4 emit a <think> block as `reasoning-delta` parts
    // BEFORE any `text-delta`. Stream both into the same thinking bubble.
    if (part.type === 'text-delta' || part.type === 'reasoning-delta') {
      const delta = (part as unknown as { text?: string }).text ?? ''
      if (delta) {
        accumulated += delta
        args.onToken?.(delta, accumulated)
      }
    }
  }

  if (toolMove == null) {
    throw new Error(
      `${bot.name} did not call make_move. Streamed output: ${accumulated.slice(0, 200)}`,
    )
  }

  return {
    raw: accumulated,
    reasoning: accumulated.trim(),
    move: { move: toolMove } as unknown as T,
  }
}

export async function listLocalModels(client: ArenaClient): Promise<string[]> {
  return client.listModels()
}
