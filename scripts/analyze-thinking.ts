/**
 * Run a representative turn against the configured models, capture the full
 * reasoning + tool-call sequence, and dump it for analysis.
 *
 *   pnpm dlx tsx scripts/analyze-thinking.ts
 */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText, tool, hasToolCall } from 'ai'
import { z } from 'zod'

const provider = createOpenAICompatible({ name: 'ollama', baseURL: 'http://localhost:11434/v1' })

const SYSTEM = `You are Coral, a competitive AI agent playing a game of Reversi.
Your opponent is Mint. You play as Player A.

GAME RULES:
Reversi (Othello) on an 8x8 board. Place a disc that traps opponent discs in a straight line; trapped discs flip. Win by having the most discs at the end.

TOOLS AVAILABLE:
• send_message(text): optional public chat your opponent will see
• make_move(move): commit your move using notation like "D3". MUST be called once.

Think briefly out loud (1-3 sentences), optionally chat, then call make_move.`

// A mid-game position where strategy actually matters
const USER = `For make_move, use notation like "D3".

═══ TURN STATE BELOW ═══

CHAT LOG (1 message total):
  [turn 3] Mint: I have the centre. Yours to take.

SCORE — Coral (you, A): 3 | Mint (B): 5

RECENT MOVES:
  #1 Coral (you): D3 (flipped 1)
  #2 Mint: C3 (flipped 1)
  #3 Coral (you): E2 (flipped 0)
  #4 Mint: F5 (flipped 2)

CURRENT POSITION:
   A B C D E F G H
1  . . . . . . . .
2  . . . . X . . .
3  . . O X O . . .
4  . . . O X O . .
5  . . . X X O . .
6  . . . . . . . .
7  . . . . . . . .
8  . . . . . . . .

Your legal moves: B4, C5, D6, F2, F3, G4, G5.`

async function runTurn(modelId: string) {
  const t0 = Date.now()
  const chunks: { kind: string; text: string; at: number }[] = []
  let chatMsg: string | null = null
  let movePick: string | null = null

  const result = streamText({
    model: provider.chatModel(modelId),
    temperature: 0.7,
    system: SYSTEM,
    prompt: USER,
    tools: {
      send_message: tool({
        description: 'Send a public chat message your opponent will see.',
        inputSchema: z.object({ text: z.string().min(1).max(280) }),
        execute: async ({ text }) => {
          chatMsg = text
          return { ok: true }
        },
      }),
      make_move: tool({
        description: 'Commit your move. MUST be called exactly once.',
        inputSchema: z.object({ move: z.string() }),
        execute: async ({ move }) => {
          movePick = move
          return { ok: true }
        },
      }),
    },
    stopWhen: hasToolCall('make_move'),
  })

  let reasoning = ''
  let text = ''
  for await (const part of result.fullStream) {
    const dt = Date.now() - t0
    if (part.type === 'reasoning-delta') {
      const d = (part as { text?: string }).text ?? ''
      reasoning += d
      chunks.push({ kind: 'R', text: d, at: dt })
    } else if (part.type === 'text-delta') {
      const d = (part as { text?: string }).text ?? ''
      text += d
      chunks.push({ kind: 'T', text: d, at: dt })
    }
  }
  const total = Date.now() - t0
  return { modelId, reasoning, text, chatMsg, movePick, total, chunkCount: chunks.length }
}

const MODELS = ['gemma4:e2b', 'gemma4:e4b', 'qwen3:1.7b', 'qwen3:4b']
for (const m of MODELS) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`MODEL: ${m}`)
  console.log('═'.repeat(70))
  try {
    const r = await runTurn(m)
    console.log(`\n⏱  ${r.total}ms total · ${r.chunkCount} stream parts`)
    console.log(`\n──── REASONING (${r.reasoning.length} chars) ────`)
    console.log(r.reasoning || '(none)')
    console.log(`\n──── TEXT (${r.text.length} chars) ────`)
    console.log(r.text || '(none)')
    console.log(`\n──── CHAT ────\n${r.chatMsg ?? '(none)'}`)
    console.log(`\n──── MOVE ────\n${r.movePick ?? '(NO MOVE COMMITTED)'}`)
    console.log(
      `\n──── LEGAL? ────\n${['B4', 'C5', 'D6', 'F2', 'F3', 'G4', 'G5'].includes(r.movePick ?? '') ? '✓ legal' : '✗ illegal'}`,
    )
  } catch (e) {
    console.log(`ERROR: ${e instanceof Error ? e.message : e}`)
  }
}
