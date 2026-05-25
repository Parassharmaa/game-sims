import { describe, it, expect } from 'vitest'
import { breakthroughEngine } from '../breakthrough'
import { hexEngine } from '../hex'
import { ultimateTicTacToeEngine } from '../ultimateTicTacToe'

describe('breakthrough engine', () => {
  it('starts with 24 pawns and Player A to move', () => {
    const s = breakthroughEngine.initial()
    expect(s.turn).toBe('A')
    const { A, B } = breakthroughEngine.score(s)
    expect(A).toBe(12)
    expect(B).toBe(12)
    // Pawns on row 1 can advance straight (row 2 is empty) and diagonally
    const moves = breakthroughEngine.legalMoves(s)
    expect(moves.length).toBeGreaterThan(0)
    expect(moves.every((m) => m.fromRow === 1)).toBe(true)
  })

  it('rejects straight captures but allows diagonal captures', () => {
    const s = breakthroughEngine.initial()
    // Put an opponent right in front of A's pawn at (1,3) -> (2,3) blocked.
    s.board[2][3] = 'B'
    const legal = breakthroughEngine.legalMoves(s)
    // (1,3) cannot move straight to (2,3) (occupied by B) but can capture diagonally
    expect(
      legal.find((m) => m.fromRow === 1 && m.fromCol === 3 && m.toRow === 2 && m.toCol === 3),
    ).toBeUndefined()
    expect(
      legal.find((m) => m.fromRow === 1 && m.fromCol === 2 && m.toRow === 2 && m.toCol === 3),
    ).toBeDefined()
  })

  it('detects winning push to opposite back rank', () => {
    const s = breakthroughEngine.initial()
    // Clear the way and place an A pawn at row 4, col 2; one more step wins.
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) s.board[r][c] = '.'
    s.board[4][2] = 'A'
    s.turn = 'A'
    const next = breakthroughEngine.apply(s, {
      fromRow: 4,
      fromCol: 2,
      toRow: 5,
      toCol: 2,
    })!
    expect(next).not.toBeNull()
    const status = breakthroughEngine.status(next)
    expect(status.kind).toBe('win')
    if (status.kind === 'win') expect(status.winner).toBe('A')
  })
})

describe('hex engine', () => {
  it('starts empty with no winner', () => {
    const s = hexEngine.initial()
    expect(hexEngine.status(s).kind).toBe('in_progress')
    expect(hexEngine.score(s)).toEqual({ A: 0, B: 0 })
  })

  it('detects a connection win for A from top to bottom', () => {
    let s = hexEngine.initial()
    // Build an A chain straight down column 0: (0,0)→(1,0)→...→(8,0).
    // We alternate A/B turns by manually setting the board for simplicity.
    for (let r = 0; r < 9; r++) s.board[r][0] = 'A'
    s.lastMove = { row: 8, col: 0 }
    const status = hexEngine.status(s)
    expect(status.kind).toBe('win')
    if (status.kind === 'win') expect(status.winner).toBe('A')
  })

  it('detects a connection win for B from left to right', () => {
    const s = hexEngine.initial()
    for (let c = 0; c < 9; c++) s.board[4][c] = 'B'
    const status = hexEngine.status(s)
    expect(status.kind).toBe('win')
    if (status.kind === 'win') expect(status.winner).toBe('B')
  })

  it('parses move strings', () => {
    const s = hexEngine.initial()
    const legal = hexEngine.legalMoves(s)
    expect(hexEngine.parseMove({ move: 'E5' }, legal)).toEqual({ row: 4, col: 4 })
  })
})

describe('ultimate tic-tac-toe engine', () => {
  it('starts with player A free to play anywhere', () => {
    const s = ultimateTicTacToeEngine.initial()
    expect(s.turn).toBe('A')
    expect(s.forced).toBeNull()
    expect(ultimateTicTacToeEngine.legalMoves(s).length).toBe(81)
  })

  it('forces the opponent into the sub-board matching the cell played', () => {
    const s = ultimateTicTacToeEngine.initial()
    // A plays in sub-board (1,1), cell (0,2) — opponent must play sub (0,2).
    const next = ultimateTicTacToeEngine.apply(s, { br: 1, bc: 1, cr: 0, cc: 2 })!
    expect(next).not.toBeNull()
    expect(next.forced).toEqual({ br: 0, bc: 2 })
    // All legal moves should be inside sub-board (0,2).
    const legal = ultimateTicTacToeEngine.legalMoves(next)
    expect(legal.every((m) => m.br === 0 && m.bc === 0)).toBe(false)
    expect(legal.every((m) => m.br === 0 && m.bc === 2)).toBe(true)
  })

  it('marks a sub-board as won when 3-in-a-row is formed', () => {
    let s = ultimateTicTacToeEngine.initial()
    s.cells[0][0][0][0] = 'A'
    s.cells[0][0][0][1] = 'A'
    // Apply A playing the third cell in row 0 of sub (0,0).
    s.turn = 'A'
    s.forced = { br: 0, bc: 0 }
    const next = ultimateTicTacToeEngine.apply(s, { br: 0, bc: 0, cr: 0, cc: 2 })!
    expect(next).not.toBeNull()
    expect(next.subWinners[0][0]).toBe('A')
  })
})
