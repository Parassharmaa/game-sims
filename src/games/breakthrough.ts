import type { GameEngine, GameStatus, PlayerSlot } from './types'

/**
 * Breakthrough — pawn race on a 6x6 board (Dan Troyka, 2000).
 *
 * Player A's pawns start on rows 0-1 and march toward row 5.
 * Player B's pawns start on rows 4-5 and march toward row 0.
 * A pawn moves forward 1 step or diagonally forward 1 step.
 * A pawn captures ONLY diagonally forward.
 * First pawn to reach the opposite back rank wins. A player with no pieces
 * (or no legal moves) loses.
 */

export type BCell = '.' | 'A' | 'B'
export interface BreakthroughState {
  board: BCell[][]
  turn: PlayerSlot
}
export interface BreakthroughMove {
  fromRow: number
  fromCol: number
  toRow: number
  toCol: number
}

const SIZE = 6
const COLS = 'ABCDEF'

function inBounds(r: number, c: number) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE
}

function opponent(p: PlayerSlot): PlayerSlot {
  return p === 'A' ? 'B' : 'A'
}

function direction(p: PlayerSlot): number {
  return p === 'A' ? 1 : -1
}

function backRank(p: PlayerSlot): number {
  return p === 'A' ? SIZE - 1 : 0
}

function squareLabel(r: number, c: number) {
  return `${COLS[c]}${r + 1}`
}

export const breakthroughEngine: GameEngine<BreakthroughState, BreakthroughMove> = {
  id: 'breakthrough',
  name: 'Breakthrough',
  emoji: '🏁',
  blurb: 'Pawn race. March a pawn to the opposite back rank. Diagonal captures only.',
  difficulty: 3,

  initial() {
    const board: BCell[][] = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => '.' as BCell),
    )
    for (let c = 0; c < SIZE; c++) {
      board[0][c] = 'A'
      board[1][c] = 'A'
      board[SIZE - 2][c] = 'B'
      board[SIZE - 1][c] = 'B'
    }
    return { board, turn: 'A' }
  },

  legalMoves(state) {
    const moves: BreakthroughMove[] = []
    const me = state.turn
    const dir = direction(me)
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (state.board[r][c] !== me) continue
        for (const dc of [-1, 0, 1]) {
          const nr = r + dir
          const nc = c + dc
          if (!inBounds(nr, nc)) continue
          const target = state.board[nr][nc]
          if (dc === 0) {
            if (target === '.')
              moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc })
          } else {
            // diagonal — move into empty or capture opponent
            if (target === '.' || target === opponent(me))
              moves.push({ fromRow: r, fromCol: c, toRow: nr, toCol: nc })
          }
        }
      }
    }
    return moves
  },

  apply(state, move) {
    const legal = breakthroughEngine.legalMoves(state)
    const found = legal.find(
      (m) =>
        m.fromRow === move.fromRow &&
        m.fromCol === move.fromCol &&
        m.toRow === move.toRow &&
        m.toCol === move.toCol,
    )
    if (!found) return null
    const board = state.board.map((row) => [...row])
    const piece = board[move.fromRow][move.fromCol]
    board[move.fromRow][move.fromCol] = '.'
    board[move.toRow][move.toCol] = piece
    return { board, turn: opponent(state.turn) }
  },

  status(state): GameStatus {
    // Check if either player reached the opposite back rank.
    for (let c = 0; c < SIZE; c++) {
      if (state.board[backRank('A')][c] === 'A') return { kind: 'win', winner: 'A' }
      if (state.board[backRank('B')][c] === 'B') return { kind: 'win', winner: 'B' }
    }
    // Current player loses if they have no legal moves OR no pieces.
    const legal = breakthroughEngine.legalMoves(state)
    if (legal.length === 0) return { kind: 'win', winner: opponent(state.turn) }
    return { kind: 'in_progress', turn: state.turn }
  },

  score(state) {
    let a = 0
    let b = 0
    for (const row of state.board)
      for (const c of row) {
        if (c === 'A') a++
        else if (c === 'B') b++
      }
    return { A: a, B: b }
  },

  describeOutcome(prev, move, _next, mover) {
    const captured = prev.board[move.toRow][move.toCol] === opponent(mover)
    const reachedBack = move.toRow === backRank(mover)
    const parts = [`${squareLabel(move.fromRow, move.fromCol)}→${squareLabel(move.toRow, move.toCol)}`]
    if (captured) parts.push('CAPTURE')
    if (reachedBack) parts.push('REACHED BACK RANK — WIN!')
    return parts.join(' ')
  },

  rules() {
    return [
      'Breakthrough on a 6x6 board. Each player starts with 12 pawns on their two back rows.',
      'On your turn, move ONE of your pawns to an empty square one row forward (straight) or one row diagonally forward.',
      'You may capture an opponent\'s pawn ONLY by moving diagonally forward onto its square. You cannot capture straight ahead, and you cannot move onto a friendly pawn.',
      'First player to land a pawn on the opposite back rank wins. A player with no legal move loses.',
      'Columns are A-F left-to-right. Rows are 1-6 from top to bottom. Player A starts on rows 1-2 moving down; Player B starts on rows 5-6 moving up.',
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
    const legal = breakthroughEngine.legalMoves(state)
    const sampled = legal
      .slice(0, 18)
      .map((m) => `${squareLabel(m.fromRow, m.fromCol)}-${squareLabel(m.toRow, m.toCol)}`)
      .join(', ')
    return [
      'Board (X = you, O = opponent, . = empty):',
      header + rows,
      `You are X (${me}); opponent is O (${opp}).`,
      `Your direction: row ${me === 'A' ? '1 → 6' : '6 → 1'}. Reach the opposite back rank to win.`,
      `Your legal moves (first 18): ${sampled}${legal.length > 18 ? `, … (${legal.length} total)` : ''}.`,
    ].join('\n')
  },

  schemaExample() {
    return '{"move":"A2-A3"}'
  },

  parseMove(value, legal) {
    const raw = (value as { move?: unknown })?.move
    if (typeof raw !== 'string') return null
    const m = raw.trim().toUpperCase().match(/^([A-F])\s*([1-6])\s*[-–>:]\s*([A-F])\s*([1-6])$/)
    if (!m) return null
    const fromCol = COLS.indexOf(m[1])
    const fromRow = parseInt(m[2], 10) - 1
    const toCol = COLS.indexOf(m[3])
    const toRow = parseInt(m[4], 10) - 1
    return (
      legal.find(
        (mv) =>
          mv.fromRow === fromRow &&
          mv.fromCol === fromCol &&
          mv.toRow === toRow &&
          mv.toCol === toCol,
      ) ?? null
    )
  },

  describeMove(move) {
    return `${squareLabel(move.fromRow, move.fromCol)}→${squareLabel(move.toRow, move.toCol)}`
  },
}
