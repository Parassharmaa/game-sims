import { reversiEngine } from './reversi'
import { gomokuEngine } from './gomoku'
import { mancalaEngine } from './mancala'
import { breakthroughEngine } from './breakthrough'
import { hexEngine } from './hex'
import { ultimateTicTacToeEngine } from './ultimateTicTacToe'
import type { GameEngine } from './types'

export const allEngines = [
  reversiEngine,
  gomokuEngine,
  mancalaEngine,
  hexEngine,
  breakthroughEngine,
  ultimateTicTacToeEngine,
] as const

export type EngineId = (typeof allEngines)[number]['id']

export function engineById(id: string): GameEngine<unknown, unknown> | null {
  return (
    (allEngines as readonly GameEngine<unknown, unknown>[]).find((e) => e.id === id) ?? null
  )
}

export {
  reversiEngine,
  gomokuEngine,
  mancalaEngine,
  breakthroughEngine,
  hexEngine,
  ultimateTicTacToeEngine,
}
