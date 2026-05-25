import type { GameEngine, GameStatus, PlayerSlot } from './types'

export type GCell = '.' | 'A' | 'B'
export interface GomokuState {
  board: GCell[][]
  turn: PlayerSlot
  lastMove: GomokuMove | null
}
export interface GomokuMove {
  row: number
  col: number
}

const SIZE = 9
const COLS = 'ABCDEFGHI'

function opponent(p: PlayerSlot): PlayerSlot {
  return p === 'A' ? 'B' : 'A'
}

function inBounds(r: number, c: number) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE
}

function countLine(
  board: GCell[][],
  r: number,
  c: number,
  dr: number,
  dc: number,
  p: GCell,
): number {
  let count = 0
  let rr = r
  let cc = c
  while (inBounds(rr, cc) && board[rr][cc] === p) {
    count++
    rr += dr
    cc += dc
  }
  return count
}

function longestRunThrough(board: GCell[][], r: number, c: number, p: PlayerSlot): number {
  const dirs: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]]
  let best = 1
  for (const [dr, dc] of dirs) {
    const total =
      countLine(board, r, c, dr, dc, p) +
      countLine(board, r - dr, c - dc, -dr, -dc, p)
    if (total > best) best = total
  }
  return best
}

function findWinner(board: GCell[][], r: number, c: number): PlayerSlot | null {
  const cell = board[r][c]
  if (cell === '.') return null
  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]
  for (const [dr, dc] of dirs) {
    const total =
      countLine(board, r, c, dr, dc, cell) +
      countLine(board, r - dr, c - dc, -dr, -dc, cell)
    if (total >= 5) return cell as PlayerSlot
  }
  return null
}

export const gomokuEngine: GameEngine<GomokuState, GomokuMove> = {
  id: 'gomoku',
  name: 'Gomoku',
  emoji: '◯',
  blurb: 'Five in a row on a 9×9 grid. Pure positional strategy.',
  difficulty: 4,

  initial() {
    const board: GCell[][] = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => '.' as GCell),
    )
    return { board, turn: 'A', lastMove: null }
  },

  legalMoves(state) {
    if (gomokuEngine.status(state).kind !== 'in_progress') return []
    const out: GomokuMove[] = []
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
    if (state.lastMove) {
      const w = findWinner(state.board, state.lastMove.row, state.lastMove.col)
      if (w) return { kind: 'win', winner: w }
    }
    let empty = false
    for (const row of state.board)
      for (const c of row) if (c === '.') empty = true
    if (!empty) return { kind: 'draw' }
    return { kind: 'in_progress', turn: state.turn }
  },

  score(state) {
    const status = gomokuEngine.status(state)
    if (status.kind === 'win') return { A: status.winner === 'A' ? 1 : 0, B: status.winner === 'B' ? 1 : 0 }
    return { A: 0, B: 0 }
  },

  describeOutcome(_prev, move, next, mover) {
    const longest = longestRunThrough(next.board, move.row, move.col, mover)
    if (longest >= 5) return `placed at ${COLS[move.col]}${move.row + 1} — FIVE in a row!`
    if (longest >= 3) return `placed at ${COLS[move.col]}${move.row + 1} (run of ${longest})`
    return `placed at ${COLS[move.col]}${move.row + 1}`
  },

  rules() {
    return [
      'Gomoku on a 9x9 grid.',
      'Players take turns placing one stone on any empty intersection.',
      'The first player to form a continuous line of five stones (horizontal, vertical, or diagonal) wins.',
      'If the board fills with no five-in-a-row, the game is a draw.',
      'Columns are A-I (left to right). Rows are 1-9 (top to bottom).',
    ].join(' ')
  },

  renderForLlm(state, you) {
    const me = you
    const header = '   ' + COLS.split('').join(' ') + '\n'
    const rows = state.board
      .map((row, i) =>
        `${i + 1}  ` +
        row
          .map((c) => (c === '.' ? '.' : c === me ? 'X' : 'O'))
          .join(' '),
      )
      .join('\n')
    return [
      `Board (X = you, O = opponent, . = empty):`,
      header + rows,
      `You place X. Choose any empty cell. Aim for five-in-a-row while blocking your opponent.`,
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
