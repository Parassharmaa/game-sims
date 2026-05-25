import type { GameEngine, GameStatus, PlayerSlot } from './types'

export type Cell = '.' | 'A' | 'B'
export interface ReversiState {
  board: Cell[][]
  turn: PlayerSlot
  passes: number
}
export interface ReversiMove {
  row: number
  col: number
}

const SIZE = 8
const DIRS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
]

const COLS = 'ABCDEFGH'

function inBounds(r: number, c: number) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE
}

function opponent(p: PlayerSlot): PlayerSlot {
  return p === 'A' ? 'B' : 'A'
}

function countOf(board: Cell[][], p: PlayerSlot): number {
  let n = 0
  for (const row of board) for (const c of row) if (c === p) n++
  return n
}

function flipsFor(board: Cell[][], r: number, c: number, p: PlayerSlot): [number, number][] {
  if (board[r][c] !== '.') return []
  const opp = opponent(p)
  const flips: [number, number][] = []
  for (const [dr, dc] of DIRS) {
    const line: [number, number][] = []
    let rr = r + dr
    let cc = c + dc
    while (inBounds(rr, cc) && board[rr][cc] === opp) {
      line.push([rr, cc])
      rr += dr
      cc += dc
    }
    if (line.length > 0 && inBounds(rr, cc) && board[rr][cc] === p) {
      flips.push(...line)
    }
  }
  return flips
}

export const reversiEngine: GameEngine<ReversiState, ReversiMove> = {
  id: 'reversi',
  name: 'Reversi',
  emoji: '◑',
  blurb: 'Flip the most discs. Classic Othello on 8×8.',
  difficulty: 4,

  initial() {
    const board: Cell[][] = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => '.' as Cell),
    )
    board[3][3] = 'B'
    board[3][4] = 'A'
    board[4][3] = 'A'
    board[4][4] = 'B'
    return { board, turn: 'A', passes: 0 }
  },

  legalMoves(state) {
    const moves: ReversiMove[] = []
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (flipsFor(state.board, r, c, state.turn).length > 0) {
          moves.push({ row: r, col: c })
        }
      }
    }
    return moves
  },

  apply(state, move) {
    const flips = flipsFor(state.board, move.row, move.col, state.turn)
    if (flips.length === 0) return null
    const board = state.board.map((row) => [...row])
    board[move.row][move.col] = state.turn
    for (const [r, c] of flips) board[r][c] = state.turn
    const next = opponent(state.turn)
    const nextState: ReversiState = { board, turn: next, passes: 0 }
    if (reversiEngine.legalMoves(nextState).length === 0) {
      const skipState: ReversiState = { board, turn: state.turn, passes: state.passes + 1 }
      if (reversiEngine.legalMoves(skipState).length === 0) {
        return { board, turn: next, passes: 2 }
      }
      return skipState
    }
    return nextState
  },

  status(state): GameStatus {
    if (state.passes >= 2 || reversiEngine.legalMoves(state).length === 0) {
      const { A, B } = reversiScore(state)
      if (A === B) return { kind: 'draw' }
      return { kind: 'win', winner: A > B ? 'A' : 'B' }
    }
    return { kind: 'in_progress', turn: state.turn }
  },

  score(state) {
    return reversiScore(state)
  },

  describeOutcome(prev, move, next, mover) {
    // The placed disc plus all flips become this player's discs.
    const before = countOf(prev.board, mover)
    const after = countOf(next.board, mover)
    const flipped = Math.max(0, after - before - 1)
    if (flipped === 0) return `placed at ${COLS[move.col]}${move.row + 1} (no flips)`
    return `placed at ${COLS[move.col]}${move.row + 1} (flipped ${flipped})`
  },

  rules() {
    return [
      'Reversi (Othello) on an 8x8 board.',
      'You place a disc of your colour on an empty square such that it traps at least one opponent disc in a straight line (horizontal, vertical, or diagonal).',
      'All trapped opponent discs flip to your colour.',
      'If you have no legal move, your turn is skipped automatically.',
      'When neither player can move, the player with the most discs wins.',
      'Columns are labelled A-H from left to right. Rows are 1-8 from top to bottom.',
    ].join(' ')
  },

  renderForLlm(state, you) {
    const me = you
    const opp = opponent(you)
    const header = '   ' + COLS.split('').join(' ') + '\n'
    const rows = state.board
      .map((row, i) =>
        `${i + 1}  ` +
        row.map((c) => (c === '.' ? '.' : c === me ? 'X' : 'O')).join(' '),
      )
      .join('\n')
    const legal = reversiEngine
      .legalMoves(state)
      .map((m) => `${COLS[m.col]}${m.row + 1}`)
      .join(', ')
    return [
      `Board (X = you, O = opponent, . = empty):`,
      header + rows,
      `You play X (${me}); opponent plays O (${opp}).`,
      `Your legal moves: ${legal || '(none — turn will be skipped)'}.`,
    ].join('\n')
  },

  schemaExample() {
    return '{"move":"D3"}'
  },

  parseMove(value, legal) {
    const raw = (value as { move?: unknown })?.move
    if (typeof raw !== 'string') return null
    const m = raw.trim().toUpperCase().match(/^([A-H])\s*([1-8])$/)
    if (!m) return null
    const col = COLS.indexOf(m[1])
    const row = parseInt(m[2], 10) - 1
    return legal.find((mv) => mv.row === row && mv.col === col) ?? null
  },

  describeMove(move) {
    return `${COLS[move.col]}${move.row + 1}`
  },
}

export function reversiScore(state: ReversiState): { A: number; B: number } {
  let A = 0, B = 0
  for (const row of state.board) for (const c of row) {
    if (c === 'A') A++
    else if (c === 'B') B++
  }
  return { A, B }
}
