/**
 * Spot-check legal-move calculation for each engine.
 *   pnpm dlx tsx scripts/verify-legal.ts
 */
import {
  reversiEngine,
  gomokuEngine,
  mancalaEngine,
  hexEngine,
  breakthroughEngine,
  ultimateTicTacToeEngine,
} from '../src/games'

function header(t: string) {
  console.log(`\n${'='.repeat(60)}\n${t}\n${'='.repeat(60)}`)
}

// ---------- Reversi ----------
header('Reversi — initial position (A to move)')
{
  const s = reversiEngine.initial()
  console.log(reversiEngine.renderForLlm(s, 'A'))
  const moves = reversiEngine
    .legalMoves(s)
    .map((m) => reversiEngine.describeMove(m))
    .sort()
  console.log('Engine reports:', moves.join(', '))
  console.log('Expected (textbook): C4, D3, E6, F5')
  console.log(
    'Match:',
    JSON.stringify(moves) === JSON.stringify(['C4', 'D3', 'E6', 'F5'].sort())
      ? '✓'
      : '✗',
  )
}

header('Reversi — after A plays D3')
{
  let s = reversiEngine.initial()
  s = reversiEngine.apply(s, { row: 2, col: 3 })!
  console.log(reversiEngine.renderForLlm(s, 'B'))
  const moves = reversiEngine
    .legalMoves(s)
    .map((m) => reversiEngine.describeMove(m))
    .sort()
  console.log('Engine reports:', moves.join(', '))
  console.log('Expected (textbook responses to D3): C3, C5, E3')
  console.log(
    'Match:',
    JSON.stringify(moves) === JSON.stringify(['C3', 'C5', 'E3'].sort())
      ? '✓'
      : '✗',
  )
}

// ---------- Gomoku ----------
header('Gomoku — initial position')
{
  const s = gomokuEngine.initial()
  const moves = gomokuEngine.legalMoves(s)
  console.log(`Legal move count: ${moves.length}`)
  console.log('Expected: 81 (every cell of the 9x9 board)')
  console.log('Match:', moves.length === 81 ? '✓' : '✗')
}

// ---------- Mancala ----------
header('Mancala — initial position (A to move)')
{
  const s = mancalaEngine.initial()
  console.log(mancalaEngine.renderForLlm(s, 'A'))
  const moves = mancalaEngine
    .legalMoves(s)
    .map((m) => mancalaEngine.describeMove(m))
    .sort()
  console.log('Engine reports:', moves.join(', '))
  console.log("Expected: pit 0..5 (A's non-empty pits)")
  console.log(
    'Match:',
    JSON.stringify(moves) ===
      JSON.stringify(['pit 0', 'pit 1', 'pit 2', 'pit 3', 'pit 4', 'pit 5'].sort())
      ? '✓'
      : '✗',
  )
}

// ---------- Hex ----------
header('Hex — initial position')
{
  const s = hexEngine.initial()
  const moves = hexEngine.legalMoves(s)
  console.log(`Legal move count: ${moves.length}`)
  console.log('Expected: 81 (every cell of the 9x9 hex)')
  console.log('Match:', moves.length === 81 ? '✓' : '✗')
}

// ---------- Breakthrough ----------
header('Breakthrough — initial position (A to move)')
{
  const s = breakthroughEngine.initial()
  console.log(breakthroughEngine.renderForLlm(s, 'A'))
  const moves = breakthroughEngine.legalMoves(s)
  console.log(`Legal move count: ${moves.length}`)
  // Each of A's 6 pawns on rank 2 (row 1) can go forward (3 dests) except edges (2 dests)
  // 4 inner pawns × 3 destinations + 2 edge pawns × 2 destinations = 12 + 4 = 16
  console.log('Expected: 16 (4 inner pawns × 3 + 2 edge pawns × 2; back-rank pawns blocked)')
  console.log('Match:', moves.length === 16 ? '✓' : '✗')
}

// ---------- Ultimate TTT ----------
header('Ultimate TTT — initial position (A to move)')
{
  const s = ultimateTicTacToeEngine.initial()
  const moves = ultimateTicTacToeEngine.legalMoves(s)
  console.log(`Legal move count: ${moves.length}`)
  console.log('Expected: 81 (any of 9 sub-boards × 9 cells)')
  console.log('Match:', moves.length === 81 ? '✓' : '✗')

  // After playing at (1,1)/(0,2) opponent must play in sub-board (0,2)
  const after = ultimateTicTacToeEngine.apply(s, {
    br: 1,
    bc: 1,
    cr: 0,
    cc: 2,
  })!
  const m2 = ultimateTicTacToeEngine.legalMoves(after)
  console.log(`After A→(1,1)/(0,2): legal count=${m2.length}`)
  console.log('Expected: 9 (B must play in sub (0,2) which has 9 open cells)')
  console.log('Match:', m2.length === 9 && m2.every((m) => m.br === 0 && m.bc === 2) ? '✓' : '✗')
}

console.log('\n')
