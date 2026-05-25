import type { GameEngine, GameStatus, PlayerSlot } from './types'

/**
 * Kalah variant of Mancala.
 *
 * Board layout (numbers in []) — A is bottom row, B is top row:
 *
 *           [12][11][10][9][8][7]      <- B's pits (B sows counter-clockwise)
 *     [13]                         [6] <- stores: [13] = B store, [6] = A store
 *           [0] [1] [2][3][4][5]       <- A's pits (A sows counter-clockwise)
 *
 * Indices 0-5 are A's pits; 6 is A's store.
 * Indices 7-12 are B's pits; 13 is B's store.
 *
 * Sowing goes 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 (A store) -> 7 -> 8 -> ... -> 12 -> 13 (B store) -> 0 ...
 * A player skips the OPPONENT's store while sowing.
 */

export interface MancalaState {
  pits: number[] // length 14
  turn: PlayerSlot
}

export interface MancalaMove {
  pit: number // 0-5 for A, 7-12 for B
}

const STORE_A = 6
const STORE_B = 13
const A_PITS = [0, 1, 2, 3, 4, 5]
const B_PITS = [7, 8, 9, 10, 11, 12]
const OPPOSITE: Record<number, number> = {
  0: 12, 1: 11, 2: 10, 3: 9, 4: 8, 5: 7,
  7: 5, 8: 4, 9: 3, 10: 2, 11: 1, 12: 0,
}

function opponent(p: PlayerSlot): PlayerSlot {
  return p === 'A' ? 'B' : 'A'
}

function ownStore(p: PlayerSlot) {
  return p === 'A' ? STORE_A : STORE_B
}

function opponentStore(p: PlayerSlot) {
  return p === 'A' ? STORE_B : STORE_A
}

function ownPits(p: PlayerSlot) {
  return p === 'A' ? A_PITS : B_PITS
}

export const mancalaEngine: GameEngine<MancalaState, MancalaMove> = {
  id: 'mancala',
  name: 'Mancala',
  emoji: '◔',
  blurb: 'Sow seeds across pits. Capture, chain extra turns, win the count.',
  difficulty: 3,

  initial(): MancalaState {
    const pits = new Array(14).fill(0)
    for (const i of A_PITS) pits[i] = 4
    for (const i of B_PITS) pits[i] = 4
    return { pits, turn: 'A' }
  },

  legalMoves(state) {
    if (mancalaEngine.status(state).kind !== 'in_progress') return []
    return ownPits(state.turn)
      .filter((i) => state.pits[i] > 0)
      .map((pit) => ({ pit }))
  },

  apply(state, move) {
    if (!ownPits(state.turn).includes(move.pit)) return null
    if (state.pits[move.pit] === 0) return null

    const pits = [...state.pits]
    let seeds = pits[move.pit]
    pits[move.pit] = 0
    let idx = move.pit
    const skip = opponentStore(state.turn)
    while (seeds > 0) {
      idx = (idx + 1) % 14
      if (idx === skip) continue
      pits[idx]++
      seeds--
    }

    // Capture rule: if last seed landed in own empty pit, capture opposite.
    const landedInOwnPit = ownPits(state.turn).includes(idx)
    if (landedInOwnPit && pits[idx] === 1 && pits[OPPOSITE[idx]] > 0) {
      pits[ownStore(state.turn)] += pits[idx] + pits[OPPOSITE[idx]]
      pits[idx] = 0
      pits[OPPOSITE[idx]] = 0
    }

    // Extra turn if last seed lands in own store.
    const landedInOwnStore = idx === ownStore(state.turn)
    const nextTurn: PlayerSlot = landedInOwnStore ? state.turn : opponent(state.turn)

    let next: MancalaState = { pits, turn: nextTurn }

    // End-of-game cleanup: if a side has no seeds in its pits, the other side
    // sweeps remaining seeds into its store.
    const aEmpty = A_PITS.every((i) => pits[i] === 0)
    const bEmpty = B_PITS.every((i) => pits[i] === 0)
    if (aEmpty || bEmpty) {
      const finalPits = [...pits]
      let rem = 0
      if (aEmpty) {
        for (const i of B_PITS) {
          rem += finalPits[i]
          finalPits[i] = 0
        }
        finalPits[STORE_B] += rem
      } else {
        for (const i of A_PITS) {
          rem += finalPits[i]
          finalPits[i] = 0
        }
        finalPits[STORE_A] += rem
      }
      next = { pits: finalPits, turn: nextTurn }
    }

    return next
  },

  status(state): GameStatus {
    const aEmpty = A_PITS.every((i) => state.pits[i] === 0)
    const bEmpty = B_PITS.every((i) => state.pits[i] === 0)
    if (aEmpty || bEmpty) {
      const aScore = state.pits[STORE_A]
      const bScore = state.pits[STORE_B]
      if (aScore === bScore) return { kind: 'draw' }
      return { kind: 'win', winner: aScore > bScore ? 'A' : 'B' }
    }
    return { kind: 'in_progress', turn: state.turn }
  },

  score(state) {
    return { A: state.pits[STORE_A], B: state.pits[STORE_B] }
  },

  describeOutcome(prev, move, next, mover) {
    const myStore = mover === 'A' ? STORE_A : STORE_B
    const gained = next.pits[myStore] - prev.pits[myStore]
    const extraTurn = next.turn === mover
    const parts = [`sowed from pit ${move.pit}`, `+${gained} to your store`]
    if (extraTurn) parts.push('extra turn!')
    if (gained >= 5) parts.push('big capture')
    return parts.join(', ')
  },

  rules() {
    return [
      'Mancala (Kalah variant).',
      'Each player has 6 pits and 1 store on their right side. All pits start with 4 seeds.',
      'On your turn, pick one of your own non-empty pits. Lift all its seeds, then drop one seed into each pit moving counter-clockwise.',
      'Skip the opponent\'s store while sowing. Always drop into your own store when you pass it.',
      'If your LAST seed lands in your own store, you take another turn.',
      'If your last seed lands in one of your OWN previously-empty pits and the pit directly across the board has seeds, you capture that pit AND those across-the-board seeds into your store.',
      'When a side has no seeds left, the other side sweeps the remaining seeds into its own store and the game ends. Highest store wins.',
    ].join(' ')
  },

  renderForLlm(state, you) {
    const me = you
    const myPits = ownPits(me)
    const oppPits = me === 'A' ? B_PITS : A_PITS
    const myStore = ownStore(me)
    const oppStore = opponentStore(me)

    const myLabels = me === 'A' ? ['0', '1', '2', '3', '4', '5'] : ['7', '8', '9', '10', '11', '12']
    const oppRowSeeds = [...oppPits].reverse().map((i) => state.pits[i])
    const oppRowLabels = me === 'A' ? ['12', '11', '10', '9', '8', '7'] : ['5', '4', '3', '2', '1', '0']

    const fmt = (n: number) => String(n).padStart(2, ' ')

    const top =
      `opp pits:    ${oppRowLabels.map((l) => l.padStart(2, ' ')).join(' | ')}\n` +
      `             ${oppRowSeeds.map(fmt).join(' | ')}\n`
    const middle =
      `opp store=${state.pits[oppStore]}                                you store=${state.pits[myStore]}\n`
    const bottom =
      `your pits:   ${myLabels.map((l) => l.padStart(2, ' ')).join(' | ')}\n` +
      `             ${myPits.map((i) => fmt(state.pits[i])).join(' | ')}\n`

    const legal = mancalaEngine
      .legalMoves(state)
      .map((m) => `pit ${m.pit} (=${state.pits[m.pit]} seeds)`)
      .join(', ')

    return [
      'Board:',
      top + middle + bottom,
      `Your legal pits to play: ${legal}.`,
      `Your store has ${state.pits[myStore]} seeds; opponent's store has ${state.pits[oppStore]}.`,
    ].join('\n')
  },

  schemaExample() {
    return '{"move":3}'
  },

  parseMove(value, legal) {
    const raw = (value as { move?: unknown })?.move
    let num: number | null = null
    if (typeof raw === 'number') num = raw
    else if (typeof raw === 'string') {
      const m = raw.match(/-?\d+/)
      if (m) num = parseInt(m[0], 10)
    }
    if (num == null) return null
    return legal.find((mv) => mv.pit === num) ?? null
  },

  describeMove(move) {
    return `pit ${move.pit}`
  },
}
