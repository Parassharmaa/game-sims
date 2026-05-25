import { describe, it, expect } from 'vitest'
import { gomokuEngine, type GomokuState } from '../gomoku'

function makeState(moves: Array<[number, number]>): GomokuState {
  let s = gomokuEngine.initial()
  for (const [r, c] of moves) {
    s = gomokuEngine.apply(s, { row: r, col: c })!
  }
  return s
}

describe('gomoku engine', () => {
  it('rejects placing on an occupied cell', () => {
    const s = gomokuEngine.apply(gomokuEngine.initial(), { row: 4, col: 4 })!
    expect(gomokuEngine.apply(s, { row: 4, col: 4 })).toBeNull()
  })

  it('detects five-in-a-row horizontally', () => {
    // A plays a row, B plays elsewhere.
    const s = makeState([
      [0, 0], [1, 0],
      [0, 1], [1, 1],
      [0, 2], [1, 2],
      [0, 3], [1, 3],
      [0, 4],
    ])
    const status = gomokuEngine.status(s)
    expect(status.kind).toBe('win')
    if (status.kind === 'win') expect(status.winner).toBe('A')
  })

  it('detects diagonals', () => {
    const s = makeState([
      [0, 0], [0, 5],
      [1, 1], [0, 6],
      [2, 2], [1, 5],
      [3, 3], [1, 6],
      [4, 4],
    ])
    const status = gomokuEngine.status(s)
    expect(status.kind).toBe('win')
  })

  it('parses move strings', () => {
    const s = gomokuEngine.initial()
    const legal = gomokuEngine.legalMoves(s)
    expect(gomokuEngine.parseMove({ move: 'E5' }, legal)).toEqual({ row: 4, col: 4 })
    expect(gomokuEngine.parseMove({ move: 'Z9' }, legal)).toBeNull()
  })
})
