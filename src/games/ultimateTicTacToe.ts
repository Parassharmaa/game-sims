import type { GameEngine, GameStatus, PlayerSlot } from './types'

/**
 * Ultimate Tic-Tac-Toe — nine 3x3 sub-boards arranged in a 3x3 meta board.
 *
 * Cells are addressed by (boardRow, boardCol, cellRow, cellCol).
 * The cell you play in a sub-board determines which sub-board your opponent
 * must play in next: if you played at (br, bc, cr, cc), the opponent must
 * play in sub-board (cr, cc). If that sub-board is already won or full, the
 * opponent may play in any active sub-board.
 *
 * Winning a sub-board claims it for you on the meta board. The first to win
 * a row/col/diagonal of sub-boards on the meta board wins the game.
 */

export type Mark = '.' | 'A' | 'B'
export type SubResult = '.' | 'A' | 'B' | 'T' // T = tied (full, no winner)

export interface UTTTState {
  /** cells[br][bc][cr][cc] */
  cells: Mark[][][][]
  /** sub-board winners */
  subWinners: SubResult[][]
  turn: PlayerSlot
  /** The sub-board the current player MUST play in. `null` = any open sub-board. */
  forced: { br: number; bc: number } | null
}

export interface UTTTMove {
  br: number
  bc: number
  cr: number
  cc: number
}

const LINES: [number, number][][] = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
]

function opponent(p: PlayerSlot): PlayerSlot {
  return p === 'A' ? 'B' : 'A'
}

function checkLines<T>(grid: T[][], who: T): boolean {
  return LINES.some((line) => line.every(([r, c]) => grid[r][c] === who))
}

function subBoardResult(sub: Mark[][]): SubResult {
  if (checkLines(sub, 'A')) return 'A'
  if (checkLines(sub, 'B')) return 'B'
  for (const row of sub) for (const c of row) if (c === '.') return '.'
  return 'T'
}

function emptySub(): Mark[][] {
  return [
    ['.', '.', '.'],
    ['.', '.', '.'],
    ['.', '.', '.'],
  ]
}

export const ultimateTicTacToeEngine: GameEngine<UTTTState, UTTTMove> = {
  id: 'utttt',
  name: 'Ultimate TTT',
  emoji: '⊞',
  blurb: 'Nine tic-tac-toes nested in one. Your move dictates where the opponent plays next.',
  difficulty: 5,

  initial(): UTTTState {
    return {
      cells: Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => emptySub()),
      ),
      subWinners: [
        ['.', '.', '.'],
        ['.', '.', '.'],
        ['.', '.', '.'],
      ],
      turn: 'A',
      forced: null,
    }
  },

  legalMoves(state) {
    const out: UTTTMove[] = []
    const subOpen = (br: number, bc: number) => state.subWinners[br][bc] === '.'
    const tryBoard = (br: number, bc: number) => {
      if (!subOpen(br, bc)) return
      for (let cr = 0; cr < 3; cr++) {
        for (let cc = 0; cc < 3; cc++) {
          if (state.cells[br][bc][cr][cc] === '.') out.push({ br, bc, cr, cc })
        }
      }
    }
    if (state.forced && subOpen(state.forced.br, state.forced.bc)) {
      tryBoard(state.forced.br, state.forced.bc)
    } else {
      for (let br = 0; br < 3; br++)
        for (let bc = 0; bc < 3; bc++) tryBoard(br, bc)
    }
    return out
  },

  apply(state, move) {
    if (state.subWinners[move.br][move.bc] !== '.') return null
    if (state.cells[move.br][move.bc][move.cr][move.cc] !== '.') return null
    if (state.forced && state.subWinners[state.forced.br][state.forced.bc] === '.') {
      if (move.br !== state.forced.br || move.bc !== state.forced.bc) return null
    }
    const cells = state.cells.map((row) =>
      row.map((sub) => sub.map((r) => [...r])),
    )
    cells[move.br][move.bc][move.cr][move.cc] = state.turn
    const subWinners = state.subWinners.map((row) => [...row])
    const result = subBoardResult(cells[move.br][move.bc])
    if (result !== '.') subWinners[move.br][move.bc] = result
    // Forced board for opponent = (cr, cc); free choice if that sub is closed.
    const nextForcedBr = move.cr
    const nextForcedBc = move.cc
    const forced =
      subWinners[nextForcedBr][nextForcedBc] === '.'
        ? { br: nextForcedBr, bc: nextForcedBc }
        : null
    return {
      cells,
      subWinners,
      turn: opponent(state.turn),
      forced,
    }
  },

  status(state): GameStatus {
    if (checkLines(state.subWinners, 'A')) return { kind: 'win', winner: 'A' }
    if (checkLines(state.subWinners, 'B')) return { kind: 'win', winner: 'B' }
    const anyOpen = state.subWinners.some((row) => row.some((s) => s === '.'))
    if (!anyOpen) {
      const a = state.subWinners.flat().filter((s) => s === 'A').length
      const b = state.subWinners.flat().filter((s) => s === 'B').length
      if (a === b) return { kind: 'draw' }
      return { kind: 'win', winner: a > b ? 'A' : 'B' }
    }
    return { kind: 'in_progress', turn: state.turn }
  },

  score(state) {
    let a = 0
    let b = 0
    for (const row of state.subWinners)
      for (const s of row) {
        if (s === 'A') a++
        else if (s === 'B') b++
      }
    return { A: a, B: b }
  },

  describeOutcome(prev, move, next, mover) {
    const wonSub =
      prev.subWinners[move.br][move.bc] === '.' &&
      next.subWinners[move.br][move.bc] === mover
    const tag = `(${move.br},${move.bc})/(${move.cr},${move.cc})`
    const parts = [`played ${tag}`]
    if (wonSub) parts.push(`won sub-board (${move.br},${move.bc})!`)
    if (next.forced) parts.push(`forces opp into sub (${next.forced.br},${next.forced.bc})`)
    else parts.push('opp has FREE choice')
    return parts.join(', ')
  },

  rules() {
    return [
      'Ultimate Tic-Tac-Toe is played on 9 small 3x3 boards laid out in a 3x3 grid.',
      'Each player places X or O. Win a small board by getting 3-in-a-row to claim it on the big board. Win three small boards in a row to win the game.',
      'KEY RULE: the SMALL-BOARD CELL you play in determines which BIG-BOARD CELL (i.e. which small board) your opponent must play in next. If that small board is already won (or completely full), the opponent may play in ANY remaining open small board.',
      'Coordinates are (br, bc) for which small board (0-2 from top-left), and (cr, cc) for the cell within it. Example: (1,1)/(2,0) = bottom-left cell of the centre small board.',
    ].join(' ')
  },

  renderForLlm(state, you) {
    const me = you
    const lines: string[] = []
    if (state.forced) {
      lines.push(`You MUST play in small board (${state.forced.br},${state.forced.bc}).`)
    } else {
      lines.push('You may play in ANY open small board.')
    }
    lines.push('')
    lines.push('Big board (sub-board winners):')
    lines.push(
      state.subWinners
        .map(
          (row) =>
            '  ' +
            row
              .map((s) => (s === '.' ? '.' : s === 'T' ? '#' : s === me ? 'X' : 'O'))
              .join(' '),
        )
        .join('\n'),
    )
    lines.push('')
    lines.push('Small boards (rows of small boards separated by ===):')
    for (let br = 0; br < 3; br++) {
      for (let cr = 0; cr < 3; cr++) {
        const segments: string[] = []
        for (let bc = 0; bc < 3; bc++) {
          const tag = `(${br},${bc})`
          const sub = state.cells[br][bc]
          const won = state.subWinners[br][bc]
          if (won !== '.') {
            // sub-board is closed; show a banner row
            if (cr === 1) {
              segments.push(`[${tag} WON BY ${won === me ? 'X' : won === 'T' ? '#' : 'O'}]`)
            } else {
              segments.push(' '.repeat(`[${tag} WON BY X]`.length))
            }
            continue
          }
          const row = sub[cr]
            .map((c) => (c === '.' ? '.' : c === me ? 'X' : 'O'))
            .join(' ')
          segments.push(`${tag}: ${row}`)
        }
        lines.push('  ' + segments.join('   '))
      }
      lines.push('  ' + '='.repeat(50))
    }
    return lines.join('\n')
  },

  schemaExample() {
    return '{"move":"1,1/2,0"}'
  },

  parseMove(value, legal) {
    const raw = (value as { move?: unknown })?.move
    if (typeof raw !== 'string') return null
    const m = raw.trim().match(/^\(?\s*(\d)\s*,\s*(\d)\s*\)?\s*\/\s*\(?\s*(\d)\s*,\s*(\d)\s*\)?$/)
    if (!m) return null
    const br = +m[1]
    const bc = +m[2]
    const cr = +m[3]
    const cc = +m[4]
    return (
      legal.find(
        (mv) => mv.br === br && mv.bc === bc && mv.cr === cr && mv.cc === cc,
      ) ?? null
    )
  },

  describeMove(move) {
    return `(${move.br},${move.bc})/(${move.cr},${move.cc})`
  },
}
