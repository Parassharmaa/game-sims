import { describe, it, expect } from 'vitest'
import { mancalaEngine } from '../mancala'

describe('mancala engine', () => {
  it('starts with 4 seeds in each pit and empty stores', () => {
    const s = mancalaEngine.initial()
    expect(s.pits[0]).toBe(4)
    expect(s.pits[6]).toBe(0)
    expect(s.pits[12]).toBe(4)
    expect(s.pits[13]).toBe(0)
    expect(s.turn).toBe('A')
  })

  it('grants an extra turn when the last seed lands in your store', () => {
    // From pit 2, 4 seeds → land in pits 3,4,5, and A's store (6) → extra turn.
    const s = mancalaEngine.initial()
    const next = mancalaEngine.apply(s, { pit: 2 })!
    expect(next.turn).toBe('A')
    expect(next.pits[2]).toBe(0)
    expect(next.pits[6]).toBe(1)
  })

  it('skips the opponent store when sowing', () => {
    // Loaded position: pit 5 has 9 seeds → sows pits 6,7,8,9,10,11,12,13(B store)... wait
    // we want to verify A skips B's store (13). Easiest: give A pit 5 enough seeds to wrap.
    const s = mancalaEngine.initial()
    // Manually load: empty pit 5, give it 9 seeds (enough to reach back to A side).
    s.pits[5] = 9
    const next = mancalaEngine.apply(s, { pit: 5 })!
    // pit 5 emptied, dropped into 6,7,8,9,10,11,12, skip 13, into 0,1 → 9 seeds total.
    expect(next.pits[5]).toBe(0)
    expect(next.pits[13]).toBe(0) // never touched B's store
    expect(next.pits[6]).toBe(1)
    expect(next.pits[0]).toBe(5) // 4 starting + 1 sown
    expect(next.pits[1]).toBe(5)
  })

  it('captures opposite seeds when landing in own empty pit', () => {
    const s = mancalaEngine.initial()
    // Set up: empty pit 2, put 1 seed in pit 1, opposite pit (10) has 4.
    s.pits[1] = 1
    s.pits[2] = 0
    const next = mancalaEngine.apply(s, { pit: 1 })!
    // The 1 seed from pit 1 lands in pit 2 (own, was empty). Opposite is pit 10 (4 seeds).
    // Capture: 1 + 4 = 5 added to A's store. Pit 2 and pit 10 both empty.
    expect(next.pits[2]).toBe(0)
    expect(next.pits[10]).toBe(0)
    expect(next.pits[6]).toBe(5)
  })

  it('ends with a sweep when one side is empty', () => {
    const s = mancalaEngine.initial()
    // Empty A's side except pit 5 = 1 seed. Give B pits some seeds.
    for (let i = 0; i < 6; i++) s.pits[i] = 0
    s.pits[5] = 1
    // After A sows, pit 5 → store, A's side fully empty → sweep B side to B store.
    const sumBefore = s.pits.slice(7, 13).reduce((a, b) => a + b, 0)
    const next = mancalaEngine.apply(s, { pit: 5 })!
    const status = mancalaEngine.status(next)
    expect(status.kind).not.toBe('in_progress')
    expect(next.pits[13]).toBe(sumBefore)
  })
})
