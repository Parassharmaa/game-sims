import type { GameEngine, GameStatus, PlayerSlot } from './types'

/**
 * Hex on a 9x9 rhombus.
 *
 * The board is rendered as a square grid for the LLM, but the connectivity
 * follows the hex neighbourhood: (r,c) neighbours are
 *   (r-1, c), (r-1, c+1), (r, c-1), (r, c+1), (r+1, c-1), (r+1, c).
 *
 * Player A connects TOP (row 0) ↔ BOTTOM (row N-1).
 * Player B connects LEFT (col 0) ↔ RIGHT (col N-1).
 *
 * On each turn the current player places one stone on any empty cell.
 * The first to form an unbroken chain of their stones connecting their two
 * sides wins. Hex never produces a draw.
 */

export type HCell = '.' | 'A' | 'B'
export interface HexState {
  board: HCell[][]
  turn: PlayerSlot
  lastMove: HexMove | null
}
export interface HexMove {
  row: number
  col: number
}

const SIZE = 9
const COLS = 'ABCDEFGHI'

const NEIGHBOURS: [number, number][] = [
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
]

function inBounds(r: number, c: number) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE
}

function opponent(p: PlayerSlot): PlayerSlot {
  return p === 'A' ? 'B' : 'A'
}

function isWinningChain(board: HCell[][], p: PlayerSlot): boolean {
  const visited: boolean[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => false),
  )
  const stack: [number, number][] = []
  if (p === 'A') {
    for (let c = 0; c < SIZE; c++) {
      if (board[0][c] === 'A') {
        stack.push([0, c])
        visited[0][c] = true
      }
    }
  } else {
    for (let r = 0; r < SIZE; r++) {
      if (board[r][0] === 'B') {
        stack.push([r, 0])
        visited[r][0] = true
      }
    }
  }
  while (stack.length > 0) {
    const [r, c] = stack.pop()!
    if (p === 'A' && r === SIZE - 1) return true
    if (p === 'B' && c === SIZE - 1) return true
    for (const [dr, dc] of NEIGHBOURS) {
      const nr = r + dr
      const nc = c + dc
      if (!inBounds(nr, nc)) continue
      if (visited[nr][nc]) continue
      if (board[nr][nc] !== p) continue
      visited[nr][nc] = true
      stack.push([nr, nc])
    }
  }
  return false
}

export const hexEngine: GameEngine<HexState, HexMove> = {
  id: 'hex',
  name: 'Hex',
  emoji: '⬡',
  blurb: 'Connect your two sides through unbroken chains of hexes. No draws.',
  difficulty: 5,

  initial() {
    const board: HCell[][] = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => '.' as HCell),
    )
    return { board, turn: 'A', lastMove: null }
  },

  legalMoves(state) {
    if (hexEngine.status(state).kind !== 'in_progress') return []
    const out: HexMove[] = []
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (state.board[r][c] === '.') out.push({ row: r, col: c })
      }
    }
    return out
  },

  apply(state, move) {
    if (!inBounds(move.row, move.col)) return null
    if (state.board[move.row][move.col] !== '.') return null
    const board = state.board.map((row) => [...row])
    board[move.row][move.col] = state.turn
    return { board, turn: opponent(state.turn), lastMove: move }
  },

  status(state): GameStatus {
    if (isWinningChain(state.board, 'A')) return { kind: 'win', winner: 'A' }
    if (isWinningChain(state.board, 'B')) return { kind: 'win', winner: 'B' }
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

  describeOutcome(_prev, move, next, mover) {
    const status = hexEngine.status(next)
    if (status.kind === 'win' && status.winner === mover) {
      return `placed at ${COLS[move.col]}${move.row + 1} — completed the chain!`
    }
    return `placed at ${COLS[move.col]}${move.row + 1}`
  },

  rules() {
    return [
      'Hex on a 9x9 rhombus. Each cell has up to six neighbours: above, above-right, left, right, below-left, below.',
      'On your turn, place one stone of your colour on any empty cell.',
      'Player A (X) tries to connect the TOP and BOTTOM edges with an unbroken chain of X stones.',
      'Player B (O) tries to connect the LEFT and RIGHT edges with an unbroken chain of O stones.',
      'The first player to complete their chain wins. There are no draws — exactly one player will succeed.',
      'Columns are A-I (left-to-right). Rows are 1-9 (top-to-bottom).',
    ].join(' ')
  },

  renderForLlm(state, you) {
    const me = you
    const header = '    ' + COLS.split('').join(' ') + '\n'
    const rows = state.board
      .map((row, i) =>
        ' '.repeat(i) +
        `${(i + 1).toString().padStart(2, ' ')}  ` +
        row
          .map((c) => (c === '.' ? '.' : c === me ? 'X' : 'O'))
          .join(' '),
      )
      .join('\n')
    const goal =
      me === 'A'
        ? 'You play X. Goal: connect TOP (row 1) and BOTTOM (row 9).'
        : 'You play O. Goal: connect LEFT (col A) and RIGHT (col I).'
    return [
      `Board (X = you, O = opponent, . = empty):`,
      header + rows,
      goal,
      'Hex neighbours: (r-1,c), (r-1,c+1), (r,c-1), (r,c+1), (r+1,c-1), (r+1,c).',
    ].join('\n')
  },

  schemaExample() {
    return '{"move":"E5"}'
  },

  parseMove(value, legal) {
    const raw = (value as { move?: unknown })?.move
    if (typeof raw !== 'string') return null
    const m = raw.trim().toUpperCase().match(/^([A-I])\s*([1-9])$/)
    if (!m) return null
    const col = COLS.indexOf(m[1])
    const row = parseInt(m[2], 10) - 1
    return legal.find((mv) => mv.row === row && mv.col === col) ?? null
  },

  describeMove(move) {
    return `${COLS[move.col]}${move.row + 1}`
  },
}
