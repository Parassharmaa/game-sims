import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runGame, type RunnerEvent } from '../runner'
import { gomokuEngine } from '@/games/gomoku'
import type { ArenaClient, BotConfig } from '../llm'

const botA: BotConfig = { id: 'a', name: 'A', emoji: '🅰️', accent: '#f00', model: 'test' }
const botB: BotConfig = { id: 'b', name: 'B', emoji: '🅱️', accent: '#00f', model: 'test' }

const fakeClient: ArenaClient = {
  baseURL: 'http://test',
  model: (id) => ({ id }) as unknown as ReturnType<ArenaClient['model']>,
  listModels: async () => [],
}

interface Scripted {
  text?: string
  chat?: string[]
  move?: string | null
}

let scripted: Scripted[] = []
let cursor = 0

vi.mock('ai', () => ({
  // No-op helpers — the runner just passes these through to streamText.
  tool: (def: unknown) => def,
  hasToolCall: () => () => true,
  // Our fake streamText returns a result whose `fullStream` emits text-deltas
  // and (synchronously) invokes the registered tools to mimic the model
  // calling send_message / make_move.
  streamText: vi.fn((opts: { tools: Record<string, { execute: (input: unknown) => unknown }> }) => {
    const step = scripted[cursor++] ?? { text: 'forced', move: null }
    const { tools } = opts
    return {
      fullStream: (async function* () {
        if (step.text) {
          for (const part of step.text.split(' ')) {
            yield { type: 'text-delta', text: part + ' ' }
          }
        }
        for (const msg of step.chat ?? []) {
          await tools.send_message.execute({ text: msg })
        }
        if (step.move != null) {
          await tools.make_move.execute({ move: step.move })
        }
      })(),
    }
  }),
}))

beforeEach(() => {
  scripted = []
  cursor = 0
})

describe('runGame', () => {
  it('plays moves alternately until end-of-game', async () => {
    scripted = [
      { text: 'going A1', move: 'A1' },
      { text: 'safe A9', move: 'A9' },
      { text: 'going B1', move: 'B1' },
      { text: 'safe B9', move: 'B9' },
      { text: 'going C1', move: 'C1' },
      { text: 'safe C9', move: 'C9' },
      { text: 'going D1', move: 'D1' },
      { text: 'safe D9', move: 'D9' },
      { text: 'win E1', move: 'E1' },
    ]
    const events: RunnerEvent<unknown>[] = []
    await runGame({
      client: fakeClient,
      engine: gomokuEngine,
      botA,
      botB,
      onEvent: (ev) => events.push(ev),
    })
    const end = events.find((e) => e.type === 'end')
    expect(end).toBeDefined()
    if (end && end.type === 'end') {
      expect(end.status.kind).toBe('win')
      if (end.status.kind === 'win') expect(end.status.winner).toBe('A')
    }
    expect(events.some((e) => e.type === 'thinking_token')).toBe(true)
  })

  it('forwards send_message tool calls as chat events', async () => {
    scripted = [
      { text: 'opening', chat: ['Trash talk: nice try'], move: 'A1' },
      { text: 'reply', chat: ['You wish.'], move: 'B5' },
      { text: 'next', move: 'A2' },
    ]
    const events: RunnerEvent<unknown>[] = []
    let moves = 0
    await runGame({
      client: fakeClient,
      engine: gomokuEngine,
      botA,
      botB,
      onEvent: (ev) => {
        events.push(ev)
        if (ev.type === 'move') moves++
        if (moves >= 3) {
          // abort the loop after a few turns
          throw new Error('abort')
        }
      },
    }).catch(() => undefined)
    const chatEvents = events.filter((e) => e.type === 'chat')
    expect(chatEvents.length).toBe(2)
    if (chatEvents[0].type === 'chat') {
      expect(chatEvents[0].message.text).toBe('Trash talk: nice try')
      expect(chatEvents[0].message.player).toBe('A')
    }
    if (chatEvents[1].type === 'chat') {
      expect(chatEvents[1].message.text).toBe('You wish.')
      expect(chatEvents[1].message.player).toBe('B')
    }
  })

  it('forfeits when the model never calls make_move', async () => {
    scripted = [
      { text: 'mumble', move: null },
      { text: 'mumble', move: null },
      { text: 'mumble', move: null },
      { text: 'mumble', move: null },
      { text: 'mumble', move: null },
    ]
    const events: RunnerEvent<unknown>[] = []
    await runGame({
      client: fakeClient,
      engine: gomokuEngine,
      botA,
      botB,
      onEvent: (ev) => events.push(ev),
    })
    const forfeit = events.find((e) => e.type === 'forfeit')
    expect(forfeit).toBeDefined()
    if (forfeit && forfeit.type === 'forfeit') expect(forfeit.loser).toBe('A')
  })
})
