import { describe, it, expect } from 'vitest'
import { reversiEngine, reversiScore } from '../reversi'

describe('reversi engine', () => {
  it('starts with the four center discs and A to move', () => {
    const s = reversiEngine.initial()
    expect(s.turn).toBe('A')
    expect(s.board[3][3]).toBe('B')
    expect(s.board[3][4]).toBe('A')
    expect(s.board[4][3]).toBe('A')
    expect(s.board[4][4]).toBe('B')
    expect(reversiEngine.legalMoves(s)).toHaveLength(4)
  })

  it('flips opponent discs along a captured line', () => {
    const s = reversiEngine.initial()
    const next = reversiEngine.apply(s, { row: 2, col: 3 })!
    expect(next).not.toBeNull()
    expect(next.board[2][3]).toBe('A')
    expect(next.board[3][3]).toBe('A') // flipped
    expect(next.turn).toBe('B')
  })

  it('rejects an illegal placement', () => {
    const s = reversiEngine.initial()
    expect(reversiEngine.apply(s, { row: 0, col: 0 })).toBeNull()
  })

  it('parses move strings', () => {
    const s = reversiEngine.initial()
    const legal = reversiEngine.legalMoves(s)
    const parsed = reversiEngine.parseMove({ move: 'D3' }, legal)
    expect(parsed).toEqual({ row: 2, col: 3 })
    expect(reversiEngine.parseMove({ move: 'A1' }, legal)).toBeNull()
  })

  it('scores correctly', () => {
    const s = reversiEngine.initial()
    expect(reversiScore(s)).toEqual({ A: 2, B: 2 })
  })
})
